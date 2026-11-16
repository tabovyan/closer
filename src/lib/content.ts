// Content library for Closer: daily questions and connection exercises.

export type Category = "heart" | "desire" | "dreams" | "gratitude" | "repair" | "soul";
export type Dimension = "closeness" | "communication" | "intimacy";

export interface Question { id: string; category: Category; text: string }
export interface Exercise { title: string; minutes: number; steps: string[] }

export const CATEGORY_LABELS: Record<Category, string> = {
  heart: "Heart", desire: "Desire", dreams: "Dreams", gratitude: "Gratitude", repair: "Repair", soul: "Soul",
};

export const DIMENSIONS: { key: Dimension; name: string; prompt: string }[] = [
  { key: "closeness", name: "Closeness", prompt: "How emotionally close do you feel this week?" },
  { key: "communication", name: "Communication", prompt: "How well are you hearing and understanding each other?" },
  { key: "intimacy", name: "Intimacy", prompt: "How satisfied are you with your physical and sexual connection?" },
];

export const QUESTIONS: Question[] = [
  {
    "id": "heart-1",
    "category": "heart",
    "text": "When did you feel most loved by me recently — and what exactly did I do?"
  },
  {
    "id": "heart-2",
    "category": "heart",
    "text": "What is something you've been carrying lately that you haven't fully told me?"
  },
  {
    "id": "heart-3",
    "category": "heart",
    "text": "What part of yourself do you wish I understood better?"
  },
  {
    "id": "heart-4",
    "category": "heart",
    "text": "When do you feel safest with me?"
  },
  {
    "id": "heart-5",
    "category": "heart",
    "text": "What is one fear about us that you rarely say out loud?"
  },
  {
    "id": "heart-6",
    "category": "heart",
    "text": "How has loving me changed you?"
  },
  {
    "id": "heart-7",
    "category": "heart",
    "text": "What does a perfect ordinary day with me look like?"
  },
  {
    "id": "desire-1",
    "category": "desire",
    "text": "What makes you feel truly desired by me?"
  },
  {
    "id": "desire-2",
    "category": "desire",
    "text": "What kind of touch makes you feel most connected — and when?"
  },
  {
    "id": "desire-3",
    "category": "desire",
    "text": "What is something about our intimacy you'd love more of?"
  },
  {
    "id": "desire-4",
    "category": "desire",
    "text": "When do you feel most attractive around me?"
  },
  {
    "id": "desire-5",
    "category": "desire",
    "text": "What helps you let go and be fully present with me?"
  },
  {
    "id": "desire-6",
    "category": "desire",
    "text": "Describe a moment between us you still think about."
  },
  {
    "id": "desire-7",
    "category": "desire",
    "text": "Is there something new you'd like us to explore together?"
  },
  {
    "id": "dreams-1",
    "category": "dreams",
    "text": "Where do you see us in five years — what does home feel like?"
  },
  {
    "id": "dreams-2",
    "category": "dreams",
    "text": "What is a dream you've quietly given up on that I could help revive?"
  },
  {
    "id": "dreams-3",
    "category": "dreams",
    "text": "What adventure do you want us to have before we're old?"
  },
  {
    "id": "dreams-4",
    "category": "dreams",
    "text": "What legacy do you want our relationship to leave?"
  },
  {
    "id": "dreams-5",
    "category": "dreams",
    "text": "What would you do if you knew I'd support you no matter what?"
  },
  {
    "id": "gratitude-1",
    "category": "gratitude",
    "text": "What is one small thing I do that you never want me to stop?"
  },
  {
    "id": "gratitude-2",
    "category": "gratitude",
    "text": "What quality of mine are you most grateful for this week?"
  },
  {
    "id": "gratitude-3",
    "category": "gratitude",
    "text": "What hard moment did we get through that made us stronger?"
  },
  {
    "id": "gratitude-4",
    "category": "gratitude",
    "text": "What did I do this week that you didn't thank me for yet?"
  },
  {
    "id": "repair-1",
    "category": "repair",
    "text": "Is there a moment this week when you felt unheard? What did you need?"
  },
  {
    "id": "repair-2",
    "category": "repair",
    "text": "What do you need from me when you're upset?"
  },
  {
    "id": "repair-3",
    "category": "repair",
    "text": "What is an old argument we keep repeating — what's really underneath it?"
  },
  {
    "id": "repair-4",
    "category": "repair",
    "text": "How can I make it easier for you to tell me hard things?"
  },
  {
    "id": "repair-5",
    "category": "repair",
    "text": "What is one thing you'd like to forgive — in me or in yourself?"
  },
  {
    "id": "soul-1",
    "category": "soul",
    "text": "What do you believe happens to love after we die?"
  },
  {
    "id": "soul-2",
    "category": "soul",
    "text": "When do you feel most connected to something bigger than yourself?"
  },
  {
    "id": "soul-3",
    "category": "soul",
    "text": "What has life been trying to teach you lately?"
  },
  {
    "id": "soul-4",
    "category": "soul",
    "text": "If our souls chose each other, why do you think they did?"
  }
];

export const EXERCISES: Record<Dimension, Exercise[]> = {
  "closeness": [
    {
      "title": "The 20-second hug",
      "minutes": 2,
      "steps": [
        "Hug for a full 20 seconds, twice a day, without talking.",
        "Breathe slowly together until you feel your partner relax.",
        "Notice what changes in your body afterward."
      ]
    },
    {
      "title": "Phones-down dinner",
      "minutes": 30,
      "steps": [
        "Put both phones in another room.",
        "Each share the best and hardest moment of your day.",
        "Ask one follow-up question before responding with your own story."
      ]
    },
    {
      "title": "Memory lane",
      "minutes": 15,
      "steps": [
        "Each pick one photo from your early days together.",
        "Tell the story behind it from your point of view.",
        "Share what you felt then that you never said."
      ]
    },
    {
      "title": "Appreciation trio",
      "minutes": 5,
      "steps": [
        "Tell your partner three specific things you appreciated today.",
        "Be concrete: what they did and how it made you feel.",
        "Receiver only says 'thank you' — no deflecting."
      ]
    }
  ],
  "communication": [
    {
      "title": "Mirror listening",
      "minutes": 15,
      "steps": [
        "One speaks for 3 minutes about something on their mind.",
        "The listener repeats back what they heard: 'What I'm hearing is…'",
        "Speaker corrects or confirms. Then switch."
      ]
    },
    {
      "title": "Weekly state of us",
      "minutes": 20,
      "steps": [
        "Each answer: What went well for us this week?",
        "What felt off, said gently with 'I felt…' not 'You did…'",
        "Agree on one small thing to do differently next week."
      ]
    },
    {
      "title": "The soft start-up",
      "minutes": 10,
      "steps": [
        "Pick one small recurring frustration.",
        "Raise it starting with: 'I feel… about… and I need…'",
        "Partner responds only with understanding first, solutions later."
      ]
    },
    {
      "title": "Dreams within conflict",
      "minutes": 20,
      "steps": [
        "Choose a disagreement you keep having.",
        "Each explain the dream or value underneath your position.",
        "Find one way to honor both dreams."
      ]
    }
  ],
  "intimacy": [
    {
      "title": "Slow touch",
      "minutes": 20,
      "steps": [
        "Take turns giving a slow, non-goal-oriented massage.",
        "The receiver guides: softer, slower, there.",
        "No expectations of where it leads — presence is the point."
      ]
    },
    {
      "title": "Desire conversation",
      "minutes": 15,
      "steps": [
        "Each finish the sentence: 'I feel most desired when…'",
        "Then: 'Something I'd love us to try is…'",
        "Listen without judgment. Say yes, maybe, or not now — all are welcome."
      ]
    },
    {
      "title": "Eye-gazing",
      "minutes": 5,
      "steps": [
        "Sit facing each other, close enough to touch knees.",
        "Hold eye contact silently for 4 minutes.",
        "Afterward, share one word for what you felt."
      ]
    },
    {
      "title": "Date night redesign",
      "minutes": 60,
      "steps": [
        "Plan a date that is new to both of you.",
        "Dress up for each other as if it were an early date.",
        "End the evening with ten minutes of undistracted closeness."
      ]
    }
  ]
};
