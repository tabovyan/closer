-- Closer: initial schema.
-- Privacy model: every table is protected by row-level security. A user can only
-- ever see data belonging to the one couple they are a member of, and can only
-- see their partner's daily answer after they have answered the same day.


-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.couples (
  id          uuid primary key default gen_random_uuid(),
  invite_code text not null unique,
  created_by  uuid not null references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now()
);

create table public.couple_members (
  couple_id    uuid not null references public.couples (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 30),
  joined_at    timestamptz not null default now(),
  primary key (couple_id, user_id),
  unique (user_id) -- one couple per person
);

create table public.answers (
  couple_id   uuid not null references public.couples (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  day         date not null,
  question_id text not null,
  body        text not null check (char_length(body) between 1 and 4000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (couple_id, user_id, day)
);

create table public.checkins (
  couple_id     uuid not null references public.couples (id) on delete cascade,
  user_id       uuid not null references auth.users (id) on delete cascade,
  week          text not null check (week ~ '^\d{4}-W\d{2}$'),
  closeness     smallint not null check (closeness between 1 and 10),
  communication smallint not null check (communication between 1 and 10),
  intimacy      smallint not null check (intimacy between 1 and 10),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  primary key (couple_id, user_id, week)
);

create table public.reflections (
  couple_id  uuid not null references public.couples (id) on delete cascade,
  day        date not null,
  body       text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  primary key (couple_id, day)
);

create index answers_couple_day on public.answers (couple_id, day);
create index checkins_couple_week on public.checkins (couple_id, week);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- True when the signed-in user belongs to the given couple.
create or replace function public.is_member(p_couple uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.couple_members
    where couple_id = p_couple and user_id = auth.uid()
  );
$$;

-- True when the signed-in user has answered for this couple on this day.
create or replace function public.has_answered(p_couple uuid, p_day date)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.answers
    where couple_id = p_couple and day = p_day and user_id = auth.uid()
  );
$$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger answers_touch before update on public.answers
  for each row execute function public.touch_updated_at();
create trigger checkins_touch before update on public.checkins
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Couple management (the only way to create or join a couple)
-- ---------------------------------------------------------------------------

create or replace function public.create_couple(p_name text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid  uuid := auth.uid();
  v_code text;
  v_id   uuid;
  v_alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
begin
  if v_uid is null then raise exception 'not signed in'; end if;
  if exists (select 1 from couple_members where user_id = v_uid) then
    raise exception 'You are already in a couple space.';
  end if;
  if char_length(coalesce(trim(p_name), '')) = 0 then
    raise exception 'Please enter your name.';
  end if;

  loop
    v_code := '';
    for i in 1..8 loop
      v_code := v_code || substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from couples where invite_code = v_code);
  end loop;

  insert into couples (invite_code, created_by) values (v_code, v_uid) returning id into v_id;
  insert into couple_members (couple_id, user_id, display_name) values (v_id, v_uid, trim(p_name));
  return v_code;
end $$;

create or replace function public.join_couple(p_code text, p_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_id  uuid;
begin
  if v_uid is null then raise exception 'not signed in'; end if;
  if char_length(coalesce(trim(p_name), '')) = 0 then
    raise exception 'Please enter your name.';
  end if;

  select id into v_id from couples where invite_code = upper(trim(p_code));
  if v_id is null then
    raise exception 'That code was not found. Check it with your partner.';
  end if;

  if exists (select 1 from couple_members where user_id = v_uid and couple_id = v_id) then
    return v_id;
  end if;
  if exists (select 1 from couple_members where user_id = v_uid) then
    raise exception 'You are already in a couple space.';
  end if;

  -- Lock the couple row so two people cannot join at the same moment.
  perform 1 from couples where id = v_id for update;
  if (select count(*) from couple_members where couple_id = v_id) >= 2 then
    raise exception 'This space already has two people.';
  end if;

  insert into couple_members (couple_id, user_id, display_name) values (v_id, v_uid, trim(p_name));
  return v_id;
end $$;

create or replace function public.leave_couple()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  delete from couple_members where user_id = auth.uid() returning couple_id into v_id;
  if v_id is not null and not exists (select 1 from couple_members where couple_id = v_id) then
    delete from couples where id = v_id;
  end if;
end $$;

revoke all on function public.create_couple(text) from public, anon;
revoke all on function public.join_couple(text, text) from public, anon;
revoke all on function public.leave_couple() from public, anon;
grant execute on function public.create_couple(text) to authenticated;
grant execute on function public.join_couple(text, text) to authenticated;
grant execute on function public.leave_couple() to authenticated;

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

alter table public.couples        enable row level security;
alter table public.couple_members enable row level security;
alter table public.answers        enable row level security;
alter table public.checkins       enable row level security;
alter table public.reflections    enable row level security;

-- couples: members read; changes only through the functions above.
create policy couples_select on public.couples
  for select to authenticated using (public.is_member(id));

-- couple_members: members read their couple; each person may rename themselves.
create policy members_select on public.couple_members
  for select to authenticated using (public.is_member(couple_id));
create policy members_update_self on public.couple_members
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- answers: you always see your own; you see your partner's only after you
-- have answered the same day (the "reveal" is enforced by the database).
create policy answers_select on public.answers
  for select to authenticated using (
    user_id = auth.uid()
    or (public.is_member(couple_id) and public.has_answered(couple_id, day))
  );
create policy answers_insert on public.answers
  for insert to authenticated with check (
    user_id = auth.uid()
    and public.is_member(couple_id)
    and day between current_date - 1 and current_date + 1
  );
create policy answers_update on public.answers
  for update to authenticated
  using (user_id = auth.uid() and day between current_date - 1 and current_date + 1)
  with check (user_id = auth.uid() and public.is_member(couple_id));

-- checkins: members read; each person writes only their own.
create policy checkins_select on public.checkins
  for select to authenticated using (public.is_member(couple_id));
create policy checkins_insert on public.checkins
  for insert to authenticated with check (user_id = auth.uid() and public.is_member(couple_id));
create policy checkins_update on public.checkins
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and public.is_member(couple_id));

-- reflections: written by the coach function on behalf of a member; members read.
create policy reflections_select on public.reflections
  for select to authenticated using (public.is_member(couple_id));
create policy reflections_insert on public.reflections
  for insert to authenticated with check (public.is_member(couple_id));

-- ---------------------------------------------------------------------------
-- Realtime (respects the policies above)
-- ---------------------------------------------------------------------------

alter publication supabase_realtime add table public.couple_members;
alter publication supabase_realtime add table public.answers;
alter publication supabase_realtime add table public.checkins;
alter publication supabase_realtime add table public.reflections;
