// Tests the Supabase migration and its privacy rules in an in-process Postgres. Run with: npm run test:db
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
const db = new PGlite();
const q = (s, p) => db.query(s, p);
// Minimal Supabase environment
await db.exec(`
create schema auth;
create table auth.users (id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
create role anon; create role authenticated;
grant usage on schema public, auth to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
create publication supabase_realtime;
`);
try { await db.exec(readFileSync(new URL("../supabase/migrations/20261115000000_init.sql", import.meta.url), "utf8")); } catch (e) { console.log("MIGRATION ERROR:", e.message); process.exit(1); }
await db.exec(`grant select, insert, update, delete on all tables in schema public to authenticated;`);
const A = "00000000-0000-0000-0000-00000000000a", B = "00000000-0000-0000-0000-00000000000b", C = "00000000-0000-0000-0000-00000000000c";
await q(`insert into auth.users values ($1),($2),($3)`, [A, B, C]);
const as = async (uid, sql, params) => {
  await db.exec(`reset role; select set_config('test.uid', '${uid}', false); set role authenticated;`);
  try { return await q(sql, params); } finally { await db.exec("reset role"); }
};
const fails = async (label, p) => { try { await p; throw new Error("expected failure: " + label); } catch (e) { if (String(e.message).startsWith("expected failure")) throw e; console.log("  ✓ blocked:", label, "->", e.message.slice(0, 70)); } };
const ok = (c, m) => { if (!c) throw new Error("FAILED: " + m); console.log("  ✓", m); };

const code = (await as(A, `select public.create_couple('Tigran') as c`)).rows[0].c;
ok(/^[A-Z2-9]{8}$/.test(code), "create_couple returns an 8-char code " + code);
await fails("joining with a wrong code", as(B, `select public.join_couple('ZZZZZZZZ','Ani')`));
const cid = (await as(B, `select public.join_couple($1,'Ani') as id`, [code.toLowerCase()])).rows[0].id;
ok(!!cid, "partner joins with the code (case-insensitive)");
await fails("third person joining a full couple", as(C, `select public.join_couple($1,'Eve')`, [code]));
ok((await as(C, `select * from couples`)).rows.length === 0, "outsider sees no couples");
ok((await as(C, `select * from couple_members`)).rows.length === 0, "outsider sees no members");
ok((await as(A, `select * from couple_members`)).rows.length === 2, "member sees both members");

await as(B, `insert into answers (couple_id,user_id,day,question_id,body) values ($1,$2,current_date,'heart-1','B answer')`, [cid, B]);
ok((await as(A, `select * from answers where user_id=$1`, [B])).rows.length === 0, "A can't see B's answer before answering (reveal enforced)");
await as(A, `insert into answers (couple_id,user_id,day,question_id,body) values ($1,$2,current_date,'heart-1','A answer')`, [cid, A]);
ok((await as(A, `select * from answers`)).rows.length === 2, "after answering, A sees both answers");
ok((await as(C, `select * from answers`)).rows.length === 0, "outsider sees no answers");
await fails("writing an answer as someone else", as(A, `insert into answers (couple_id,user_id,day,question_id,body) values ($1,$2,current_date - 1,'x','fake')`, [cid, B]));
await fails("outsider writing into the couple", as(C, `insert into answers (couple_id,user_id,day,question_id,body) values ($1,$2,current_date,'x','spy')`, [cid, C]));
await fails("answering for a date long ago", as(A, `insert into answers (couple_id,user_id,day,question_id,body) values ($1,$2,current_date - 10,'x','old')`, [cid, A]));

await as(A, `insert into checkins (couple_id,user_id,week,closeness,communication,intimacy) values ($1,$2,'2026-W46',8,7,9)`, [cid, A]);
ok((await as(B, `select * from checkins`)).rows.length === 1, "partner sees check-ins");
await fails("check-in score out of range", as(A, `insert into checkins (couple_id,user_id,week,closeness,communication,intimacy) values ($1,$2,'2026-W45',11,7,9)`, [cid, A]));
await fails("creating a second couple", as(A, `select public.create_couple('Again')`));
await fails("anon calling create_couple", (async()=>{ await db.exec(`set role anon`); try { await q(`select public.create_couple('x')`) } finally { await db.exec("reset role") } })());

await as(B, `select public.leave_couple()`);
ok((await as(A, `select * from couple_members`)).rows.length === 1, "leaving removes only that member");
await as(A, `select public.leave_couple()`);
ok((await q(`select count(*)::int n from couples`)).rows[0].n === 0, "empty couple is deleted");
console.log("\nAll database checks passed");
