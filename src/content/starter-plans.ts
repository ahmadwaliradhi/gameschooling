// Ready-made Plan texts a Parent copies into a Child's Plan and edits freely. Each one describes an
// approach in our own words: no course content, books or worksheets are copied in.

export type StarterPlan = { id: string; name: string; minAge: number; maxAge: number; text: string };

export const STARTER_PLANS: StarterPlan[] = [
  {
    id: "singapore-math",
    name: "Singapore Math style",
    minAge: 5,
    maxAge: 11,
    text: `Maths the Singapore way: concrete, then pictures, then numbers.
This week: number bonds to 10, using real objects first (buttons, spoons, leaves), then drawing them.
Bar models for simple "part and whole" word problems.
Language: English.
Keep each Quest short and hands-on. No timed drills.
Rewards: sticker = 15, extra story at bedtime = 40, ice cream = 100`,
  },
  {
    id: "cambridge-primary",
    name: "Cambridge Primary style",
    minAge: 5,
    maxAge: 11,
    text: `A broad primary week in the spirit of the Cambridge Primary stages: English, maths and science.
English: read a short story aloud and retell it in three sentences.
Maths: place value up to 100, measuring with a ruler.
Science: sort things at home into living and not living.
Language: English.
Rewards: choose dinner = 60, park trip = 40`,
  },
  {
    id: "common-core",
    name: "Common Core style",
    minAge: 5,
    maxAge: 12,
    text: `Grade-level skills in the style of the Common Core standards.
Maths: add and subtract within 20, explain how you solved it out loud.
Reading: find the main idea of a short paragraph and one detail that supports it.
Writing: write or say an opinion with one reason.
Language: English.
Rewards: movie night = 100, sticker = 15`,
  },
  {
    id: "charlotte-mason",
    name: "Charlotte Mason style",
    minAge: 4,
    maxAge: 12,
    text: `Short lessons, living books and time outdoors, in the Charlotte Mason tradition.
Nature study: find and photograph three different leaves, then say how they differ.
Narration: after a story, tell it back in your own words.
Picture study: look at one painting for a few minutes and describe it from memory.
Language: English.
Keep Quests short (10 to 15 minutes). No screens as part of a Quest.
Rewards: picnic = 80, new library book = 30`,
  },
  {
    id: "classical",
    name: "Classical style",
    minAge: 6,
    maxAge: 14,
    text: `A classical week: memory work, then reasoning, then expression.
Memory: recite a short poem the child chooses.
Grammar: name the nouns and verbs in three sentences.
History: tell what you know about one ancient civilisation, then find it on a map.
Language: English.
Rewards: board game night = 60, ice cream = 100`,
  },
  {
    id: "quran-arabic",
    name: "Islamic: Quran and Arabic",
    minAge: 4,
    maxAge: 14,
    text: `Quran and Arabic, gently and with love for the Book.
Hijaiyah letters: recognise and say alif to kha, then write them.
Recitation: recite a short surah the family is memorising (a Parent checks pronunciation).
Arabic words: name ten things in the kitchen in Arabic.
Duas: say the dua before eating and after waking up.
Language: Arabic and English. No music in Quests.
Rewards: visit grandparents = 80, dates and milk treat = 20`,
  },
  {
    id: "kurikulum-merdeka",
    name: "Kurikulum Merdeka",
    minAge: 5,
    maxAge: 12,
    text: `Belajar dengan semangat Kurikulum Merdeka: projek, bermain, dan profil pelajar Pancasila.
Matematika: berhitung sampai 100 dan mengenal bangun datar di rumah.
Bahasa Indonesia: membaca cerita pendek lalu menceritakan kembali.
Projek: merawat tanaman selama seminggu dan memotretnya setiap hari.
Bahasa: Indonesia.
Hadiah: es krim = 100, ke taman = 40, stiker = 15`,
  },
];
