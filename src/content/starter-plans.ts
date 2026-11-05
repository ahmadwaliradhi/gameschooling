// Ready-made Plan texts a Parent copies into a Child's Plan and edits freely. Each one describes an
// approach in our own words: no course content, books or worksheets are copied in.

// What kind of thing a Starter Plan is: a teaching philosophy, a national curriculum, one
// subject or skill, or faith learning. Exactly one per plan; the dialog shows them as tabs.
export const STARTER_PLAN_CATEGORIES = {
  method: "Methods",
  curriculum: "Curricula",
  subject: "Subjects & skills",
  faith: "Faith",
} as const;
export type StarterPlanCategory = keyof typeof STARTER_PLAN_CATEGORIES;

// "mixed" is a broad week that does both; a STEM filter matches stem + mixed, Non-STEM matches
// non-stem + mixed, so that whole-week plans do not swamp either filter.
export const STARTER_PLAN_FOCUSES = {
  stem: ["STEM"],
  "non-stem": ["Non-STEM"],
  mixed: ["STEM", "Non-STEM"],
} as const;
export type StarterPlanFocus = keyof typeof STARTER_PLAN_FOCUSES;

// Zero or more per plan; the dialog shows them as chips. "religion" is always on faith plans,
// kept as a tag so a cross-category plan can carry it. "language" means the plan teaches a
// language or script, or its text is not in English. "university" means the plan prepares for
// university entrance: a test, a qualifying route, or the application itself.
export const STARTER_PLAN_TAGS = {
  religion: "Religion",
  "early-years": "Early years",
  language: "Language",
  outdoors: "Outdoors",
  arts: "Arts",
  "life-skills": "Life skills",
  "whole-week": "Whole week",
  university: "University",
} as const;
export type StarterPlanTag = keyof typeof STARTER_PLAN_TAGS;

export type StarterPlan = {
  id: string;
  name: string;
  minAge: number;
  maxAge: number;
  category: StarterPlanCategory;
  focus: StarterPlanFocus;
  tags: StarterPlanTag[];
  lang: string; // the language the text is written in, BCP-47 ("en", "id")
  text: string;
};

export const STARTER_PLANS: StarterPlan[] = [
  {
    id: "singapore-math",
    name: "Singapore Math style",
    minAge: 5,
    maxAge: 11,
    category: "subject",
    focus: "stem",
    tags: [],
    lang: "en",
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
    category: "curriculum",
    focus: "mixed",
    tags: ["whole-week"],
    lang: "en",
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
    category: "curriculum",
    focus: "mixed",
    tags: ["whole-week"],
    lang: "en",
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
    category: "method",
    focus: "non-stem",
    tags: ["outdoors", "arts", "early-years", "whole-week"],
    lang: "en",
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
    category: "method",
    focus: "non-stem",
    tags: ["whole-week"],
    lang: "en",
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
    category: "faith",
    focus: "non-stem",
    tags: ["religion", "language", "early-years"],
    lang: "en",
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
    category: "curriculum",
    focus: "mixed",
    tags: ["whole-week", "language"],
    lang: "id",
    text: `Belajar dengan semangat Kurikulum Merdeka: projek, bermain, dan profil pelajar Pancasila.
Matematika: berhitung sampai 100 dan mengenal bangun datar di rumah.
Bahasa Indonesia: membaca cerita pendek lalu menceritakan kembali.
Projek: merawat tanaman selama seminggu dan memotretnya setiap hari.
Bahasa: Indonesia.
Hadiah: es krim = 100, ke taman = 40, stiker = 15`,
  },
  {
    id: "montessori",
    name: "Montessori style",
    minAge: 3,
    maxAge: 12,
    category: "method",
    focus: "mixed",
    tags: ["early-years", "life-skills", "whole-week"],
    lang: "en",
    text: `Montessori style: real work, the child chooses, hands before words.
Practical life: pour water between two jugs, then wipe up any spill without help.
Senses: sort ten things at home from lightest to heaviest, then smallest to biggest.
Maths: build numbers 1 to 10 with beads or pasta, then match each to its written number.
Language: English.
Let the child repeat a Quest as often as they like. Real tools, child-sized.
No Rewards: the work is its own reward.`,
  },
  {
    id: "waldorf",
    name: "Waldorf / Steiner style",
    minAge: 4,
    maxAge: 12,
    category: "method",
    focus: "non-stem",
    tags: ["arts", "early-years", "whole-week"],
    lang: "en",
    text: `A Waldorf-style week: rhythm, stories and making things by hand.
Story: hear a fairy tale or legend, then draw the scene you remember best.
Handwork: finger-knit a short cord, or sew three stitches on felt.
Movement: clap and step a counting rhyme up to 12.
Nature table: bring in one thing from outside each day and say what season it shows.
Language: English.
No screens as part of a Quest.
Rewards: candle-lit story night = 60, new crayons = 40`,
  },
  {
    id: "reggio-emilia",
    name: "Reggio Emilia inspired",
    minAge: 3,
    maxAge: 6,
    category: "method",
    focus: "mixed",
    tags: ["early-years", "arts"],
    lang: "en",
    text: `Reggio Emilia inspired: one question the child cares about, explored in many ways.
This week's question: where do shadows come from?
Look: find three shadows at different times of day and photograph them.
Make: show a shadow with clay, with a drawing, and with your own body.
Tell: say what you think makes a shadow bigger, then test it with a torch.
Language: English.
A Parent photographs the work so the child can look back at it.
Rewards: build a blanket fort = 60, sticker = 15`,
  },
  {
    id: "unschooling",
    name: "Unschooling (child-led)",
    minAge: 5,
    maxAge: 14,
    category: "method",
    focus: "mixed",
    tags: [],
    lang: "en",
    text: `Child-led learning: start from what the child is curious about this week.
Interest: (write the child's current interest here, e.g. dinosaurs, trains, baking).
Explore: find out three new facts about it, from a book, a person or a visit.
Make: create something about it: a model, a drawing, a short video or a recipe.
Share: teach a Parent or sibling one thing you learned.
Language: English.
Quests are offers, not orders. The child may swap one for their own idea.
No Rewards: learning follows interest, not prizes.`,
  },
  {
    id: "unit-study",
    name: "Unit study (one theme)",
    minAge: 5,
    maxAge: 12,
    category: "method",
    focus: "mixed",
    tags: ["whole-week"],
    lang: "en",
    text: `One theme for every subject this week. Theme: the ocean (change it freely).
Science: find out why the sea is salty, then taste fresh and salty water.
Maths: compare the lengths of three sea animals using steps in the garden.
Reading: read a short story set by the sea and retell it.
Art: paint the sea at day and at night.
Language: English.
Rewards: beach or pool trip = 100, fish and chips dinner = 60`,
  },
  {
    id: "forest-school",
    name: "Forest School style",
    minAge: 3,
    maxAge: 12,
    category: "method",
    focus: "mixed",
    tags: ["outdoors", "early-years", "life-skills"],
    lang: "en",
    text: `Forest School style: the same wild place, again and again, with safe risks.
Visit the same patch of park or woods three times this week.
Shelter: build a den big enough for a toy using only sticks and leaves.
Tools: whittle a stick with a peeler, with a Parent beside you.
Notice: find something that changed since your last visit and photograph it.
Language: English.
Quests happen outdoors in all weather. A Parent sets the safety rules first.
Rewards: hot chocolate after = 30, campfire night = 100`,
  },
  {
    id: "tinkering",
    name: "Tinkering and making",
    minAge: 5,
    maxAge: 14,
    category: "method",
    focus: "stem",
    tags: ["arts"],
    lang: "en",
    text: `Tinkering: build, test, change, test again. The child's idea leads.
Marble run: make a run from card tubes and tape that takes 5 seconds or more.
Balance: build a sculpture that balances on one point.
Take apart: open an old broken gadget (with a Parent) and name three parts inside.
Explain: show what you changed after your first try and why.
Language: English.
No kits needed: use boxes, tape, string and things from the recycling.
Rewards: hardware store trip = 60, glue gun time = 40`,
  },
  {
    id: "mastery-maths",
    name: "Mastery maths (step by step)",
    minAge: 5,
    maxAge: 15,
    category: "subject",
    focus: "stem",
    tags: [],
    lang: "en",
    text: `Mastery maths: one skill at a time, and only move on when it is solid.
Skill this week: (write one skill, e.g. adding two-digit numbers).
Warm up: show the skill once with objects or drawings.
Practise: do five problems with no mistakes before moving on.
Check: a week later, do three more to show you still remember.
Language: English.
Go at the child's own pace. Mistakes mean practise more, not lose points.
Rewards: sticker = 15, choose a board game = 40`,
  },
  {
    id: "ib-pyp",
    name: "IB PYP inspired",
    minAge: 3,
    maxAge: 12,
    category: "curriculum",
    focus: "mixed",
    tags: ["early-years", "whole-week"],
    lang: "en",
    text: `An inquiry week in the spirit of the IB Primary Years Programme.
Theme: how the world works. Big question: why do things float or sink?
Wonder: write or say three questions before you test anything.
Test: try ten things in a bowl of water and sort them into float and sink.
Act: use what you learned to build a boat that carries five coins.
Reflect: say one thing you would do differently next time.
Language: English.
Rewards: science museum trip = 100, sticker = 15`,
  },
  {
    id: "uk-national-curriculum",
    name: "England National Curriculum style",
    minAge: 5,
    maxAge: 11,
    category: "curriculum",
    focus: "mixed",
    tags: ["whole-week"],
    lang: "en",
    text: `A broad primary week in the style of England's National Curriculum (Key Stages 1 and 2).
English: read a short poem aloud with expression, then write two lines of your own.
Maths: count in 2s, 5s and 10s, then use it to count coins.
Science: find out which materials at home are waterproof.
History: ask a grandparent what toys they had and compare with yours.
Language: English.
Rewards: park trip = 40, film night = 100`,
  },
  {
    id: "australian-curriculum",
    name: "Australian Curriculum style",
    minAge: 5,
    maxAge: 12,
    category: "curriculum",
    focus: "mixed",
    tags: ["whole-week"],
    lang: "en",
    text: `A week in the style of the Australian Curriculum, with critical and creative thinking in every Quest.
Maths: measure things at home in hand spans, then in centimetres, and compare.
Science: track the weather for five days and draw a chart.
Humanities: draw a map of your street and mark three places people use.
Health: plan a lunchbox with something from each food group.
Language: English.
Rewards: beach day = 100, sticker = 15`,
  },
  {
    id: "finland",
    name: "Finnish style (themed project)",
    minAge: 7,
    maxAge: 12,
    category: "curriculum",
    focus: "mixed",
    tags: ["life-skills", "whole-week"],
    lang: "en",
    text: `A Finnish-style week: one real-life topic seen through several subjects, and the child helps plan it.
Topic: our food (the child picks one food to follow).
Maths: work out the cost of the ingredients for one family meal.
Science: find where one ingredient grows and how it travels to the shop.
Self-care: cook one simple dish together and tidy up after.
Language: English.
Plenty of play and outdoor breaks between Quests.
Rewards: choose dinner = 60, sauna or swim trip = 80`,
  },
  {
    id: "japan",
    name: "Japanese style (zest for living)",
    minAge: 6,
    maxAge: 12,
    category: "curriculum",
    focus: "mixed",
    tags: ["life-skills", "whole-week"],
    lang: "en",
    text: `A week in the spirit of Japan's "zest for living": knowledge, thinking, and caring for others.
Maths: practise times tables with a clapping rhythm.
Integrated study: pick one question about your town and find the answer by asking people.
Helping: clean one room or space at home without being asked, every day.
Character: write a thank-you note to someone who helps your family.
Language: English.
Rewards: origami paper = 30, ramen dinner = 80`,
  },
  {
    id: "india-foundational",
    name: "India Foundational Stage style",
    minAge: 3,
    maxAge: 8,
    category: "curriculum",
    focus: "mixed",
    tags: ["early-years", "whole-week"],
    lang: "en",
    text: `Play first, in the spirit of India's National Curriculum Framework for the Foundational Stage.
Body: hop, skip and balance on one leg for a count of ten.
Numbers: play shop with real coins up to 20.
Language: tell a story with puppets, then sing a rhyme in your home language.
Art: make a rangoli pattern with rice, flowers or chalk.
Language: English and the family's home language.
Keep Quests playful and short. No worksheets for under-sixes.
Rewards: swing at the park = 30, favourite sweet = 40`,
  },
  {
    id: "computational-thinking",
    name: "Coding and computational thinking",
    minAge: 5,
    maxAge: 12,
    category: "subject",
    focus: "stem",
    tags: [],
    lang: "en",
    text: `Thinking like a programmer, mostly without a screen.
Algorithm: write step-by-step instructions to make a sandwich, and a Parent follows them exactly.
Patterns: find the repeating pattern in three things at home and continue it.
Debug: spot and fix the mistake in a set of directions to the kitchen.
Data: count the colours of cars passing for ten minutes and make a tally.
Language: English.
Rewards: 30 minutes of a coding game = 40, robot-building kit time = 100`,
  },
  {
    id: "money-skills",
    name: "Money skills",
    minAge: 4,
    maxAge: 12,
    category: "subject",
    focus: "mixed",
    tags: ["life-skills", "early-years"],
    lang: "en",
    text: `Money basics: earning, saving, spending and sharing.
Coins: sort a pile of coins and add them up.
Shop: plan a small shopping list within a set amount, then help pay at the shop.
Save: pick something you want, find its price, and work out how many weeks of saving it takes.
Share: choose one way to give or help someone this week.
Language: English.
Rewards: put coins in a savings jar = 20, choose a family treat within budget = 80`,
  },
  {
    id: "feelings-friendship",
    name: "Feelings and friendship (SEL)",
    minAge: 4,
    maxAge: 12,
    category: "subject",
    focus: "non-stem",
    tags: ["life-skills", "early-years"],
    lang: "en",
    text: `Understanding feelings, getting along, and making good choices.
Feelings: draw faces for happy, sad, angry and scared, and say when you felt each.
Calm down: practise three slow breaths when upset and show a Parent.
Kindness: do one kind thing for a sibling or friend every day.
Choices: talk through one tricky situation and pick the best thing to do.
Language: English.
Never use a Quest to punish. Praise the trying.
Rewards: hug and a story = 15, playdate = 100`,
  },
  {
    id: "life-skills",
    name: "Everyday life skills",
    minAge: 5,
    maxAge: 14,
    category: "subject",
    focus: "non-stem",
    tags: ["life-skills"],
    lang: "en",
    text: `Skills for everyday life at home.
Kitchen: make a simple breakfast for the family, with a Parent nearby.
Laundry: sort clothes by colour and fold your own.
Plan: plan tomorrow on paper: what to do, in what order, how long each takes.
Fix: sew on a button or change a light bulb with a Parent.
Language: English.
Rewards: stay up 30 minutes later = 40, choose the weekend meal = 60`,
  },
  {
    id: "arts-music",
    name: "Arts and music",
    minAge: 4,
    maxAge: 12,
    category: "subject",
    focus: "non-stem",
    tags: ["arts", "early-years"],
    lang: "en",
    text: `A creative week: make art, share it, and talk about art you see.
Create: draw or paint something from your imagination, then give it a title.
Music: clap a rhythm, then play it on pots and spoons.
Perform: put on a two-minute show for the family: a song, dance or puppet play.
Respond: look at a piece of art or listen to a song and say how it makes you feel.
Language: English.
Rewards: new art supplies = 60, concert or gallery trip = 100`,
  },
  {
    id: "second-language",
    name: "New language (first steps)",
    minAge: 4,
    maxAge: 14,
    category: "subject",
    focus: "non-stem",
    tags: ["language", "early-years"],
    lang: "en",
    text: `First steps in a new language, at a beginner level. Language to learn: (write it here).
Greetings: say hello, goodbye, please and thank you to a Parent all week.
About me: say your name, age and where you live.
Words: label ten things in your room with sticky notes in the new language.
Listen: watch a short children's song in the new language and copy one line.
Language: English and the new language.
Rewards: cook a dish from a country that speaks it = 80, sticker = 15`,
  },
  {
    id: "catholic",
    name: "Christian: Catholic",
    minAge: 4,
    maxAge: 12,
    category: "faith",
    focus: "non-stem",
    tags: ["religion", "early-years"],
    lang: "en",
    text: `Growing in faith at home, with the family as the first teachers.
Prayer: learn by heart a prayer the family prays together, and say it at bedtime.
Gospel: hear this Sunday's Gospel reading and draw one moment from it.
Saints: hear the story of one saint and say one way to be like them this week.
Kindness: do one act of service for someone at home or nearby.
Language: English.
A Parent chooses the prayers and readings.
Rewards: family walk = 40, special Sunday breakfast = 80`,
  },
  {
    id: "christian-bible",
    name: "Christian: Bible and prayer",
    minAge: 4,
    maxAge: 12,
    category: "faith",
    focus: "non-stem",
    tags: ["religion", "early-years"],
    lang: "en",
    text: `Bible stories, prayer and loving others, led by the family.
Story: hear a Bible story the family chooses and act it out with toys.
Memory: learn one short verse by heart and say it at dinner.
Prayer: say a thank-you prayer before one meal each day.
Love your neighbour: help someone without being asked, then tell a Parent about it.
Language: English.
A Parent chooses the Bible translation and passages.
Rewards: picnic = 80, new Bible storybook = 60`,
  },
  {
    id: "jewish",
    name: "Jewish: Torah, Hebrew and Shabbat",
    minAge: 5,
    maxAge: 13,
    category: "faith",
    focus: "non-stem",
    tags: ["religion", "language"],
    lang: "en",
    text: `Torah, Hebrew and Jewish life at home, led by the family.
Aleph-bet: recognise and say five Hebrew letters, then write them.
Parashah: hear this week's Torah portion as a story and retell it.
Shabbat: help get ready for Shabbat: set the table, bake or make a card.
Mitzvah: do one act of kindness and tell the family about it.
Language: Hebrew and English.
No Quests on Shabbat (Friday sunset to Saturday nightfall) or festivals. A Parent checks pronunciation.
All food is kosher.
Rewards: choose the Shabbat dessert = 60, sticker = 15`,
  },
  {
    id: "hindu",
    name: "Hindu: stories, shlokas and festivals",
    minAge: 5,
    maxAge: 12,
    category: "faith",
    focus: "non-stem",
    tags: ["religion", "arts"],
    lang: "en",
    text: `Hindu values through stories, chanting and festivals, led by the family.
Shloka: learn one short shloka the family chants and say what it means.
Story: hear a story from the Ramayana or another the family loves, and name the value in it.
Bhajan: sing one bhajan with the family.
Festival: help prepare for the next festival: decorate, cook or make a card.
Language: Sanskrit and English (or the family's language).
A Parent checks pronunciation. No pictures of deities on Quest covers.
All food is vegetarian.
Rewards: temple visit = 60, favourite sweet = 40`,
  },
  {
    id: "buddhist",
    name: "Buddhist: mindfulness (Plum Village)",
    minAge: 4,
    maxAge: 12,
    category: "faith",
    focus: "non-stem",
    tags: ["religion", "life-skills", "early-years"],
    lang: "en",
    text: `Mindful living in the Plum Village tradition, gently and at home.
Breathing: sit for three minutes and count ten slow breaths.
Pebbles: do a pebble meditation with four pebbles from the garden.
Eating: eat one snack slowly and say where each part of it came from.
Loving speech: listen to a sibling or Parent without interrupting, then say back what you heard.
Language: English.
Quests are calm and short. No winners or losers.
No Rewards: practise for its own sake.`,
  },
  {
    id: "sikh",
    name: "Sikh: Gurmukhi and Gurbani",
    minAge: 5,
    maxAge: 14,
    category: "faith",
    focus: "non-stem",
    tags: ["religion", "language"],
    lang: "en",
    text: `Gurmukhi, Gurbani and Sikh values, led by the family.
Gurmukhi: recognise and say five letters, then write them.
Gurbani: listen to Japji Sahib with the family and join in one line.
Sakhi: hear a story from the life of a Guru and say what it teaches.
Seva: help at home or at the gurdwara langar this week.
Language: Punjabi (Gurmukhi) and English.
A Parent checks pronunciation. No pictures of the Gurus on Quest covers.
All food is vegetarian.
Rewards: gurdwara visit = 60, favourite meal = 80`,
  },
  {
    id: "islamic-seerah",
    name: "Islamic: Seerah (life of the Prophet)",
    minAge: 6,
    maxAge: 14,
    category: "faith",
    focus: "non-stem",
    tags: ["religion"],
    lang: "en",
    text: `The life of the Prophet Muhammad (peace be upon him), as an example to follow.
Story: hear one event from the Seerah the family is reading and retell it.
Map: find Makkah and Madinah on a map and trace the Hijrah.
Character: name one quality of the Prophet from the story and practise it all week.
Language: English and Arabic.
Sunni sources. A Parent chooses the Seerah book.
No pictures of the Prophet or the Companions in Quests or on Quest covers. No music in Quests. All food is halal.
Rewards: visit grandparents = 80, dates and milk treat = 20`,
  },
  {
    id: "islamic-akhlaq",
    name: "Islamic: Akhlaq and adab",
    minAge: 4,
    maxAge: 12,
    category: "faith",
    focus: "non-stem",
    tags: ["religion", "life-skills", "early-years"],
    lang: "en",
    text: `Good character and manners, as the Quran and Sunnah teach (Sunni).
Parents: do one thing each day to make a Parent's day easier, without being asked.
Speech: speak gently and use no unkind nicknames all week.
Salam: greet everyone at home with salam in the morning.
Manners: say bismillah before eating and alhamdulillah after.
Language: English and Arabic.
No music in Quests. All food is halal.
Rewards: visit grandparents = 80, dates and milk treat = 20`,
  },
  {
    id: "islamic-wudu-salah",
    name: "Islamic: Wudu and salah basics",
    minAge: 6,
    maxAge: 12,
    category: "faith",
    focus: "non-stem",
    tags: ["religion"],
    lang: "en",
    text: `Wudu and salah step by step, gently and with love.
Wudu: show the steps of wudu in order, with a Parent watching.
Salah: pray one salah with the family each day and name its parts.
Times: draw a clock for each of the five prayers today.
Language: English and Arabic.
Follow the family's Sunni madhhab. A Parent checks each step.
No music in Quests. All food is halal.
Rewards: masjid trip = 60, dates and milk treat = 20`,
  },
  {
    id: "sat-prep",
    name: "SAT prep (College Board and Khan Academy)",
    minAge: 15,
    maxAge: 18,
    category: "subject",
    focus: "mixed",
    tags: ["university"],
    lang: "en",
    text: `Getting ready for the digital SAT, a little every week, using only the official free practice.
Diagnose: take one full practice test in the Bluebook app and photograph the score summary.
Reading and Writing: do one timed module on Khan Academy's Official SAT Prep, then write two lines on the question type you missed most.
Math: redo every missed question from the last module without a calculator first, then check with one.
Words: collect ten unfamiliar words from this week's passages and use each in a sentence.
Calendar: find the next test date and its registration deadline on the College Board site and tell a Parent both.
Language: English.
Homeschoolers register themselves at My SAT and enter the homeschool code 970000; no school is needed.
Practice comes from College Board and Khan Academy only. No question banks copied into Quests. A Parent reads the score report with the Child, not instead of them.
Rewards: choose the weekend outing = 60, new book or album = 80, friends over for pizza = 150`,
  },
  {
    id: "act-prep",
    name: "ACT prep (official practice)",
    minAge: 15,
    maxAge: 18,
    category: "subject",
    focus: "mixed",
    tags: ["university"],
    lang: "en",
    text: `Getting ready for the ACT with ACT's own free practice tests, one section at a time.
Diagnose: take Official Practice Test 1 (English, Math, Reading) under time and photograph the score sheet.
English: do one timed English section, then list the three grammar rules you broke most.
Math: redo every missed Math question from the last section, showing each step on paper.
Reading: do one timed Reading passage and say aloud, in one minute, what the passage argued.
Decide: with a Parent, decide whether to add the optional Science or Writing section for your target colleges.
Language: English.
Practice comes from act.org only. Register with your own MyACT account.
Rewards: choose the weekend outing = 60, new book or album = 80, friends over for pizza = 150`,
  },
  {
    id: "ap-self-study",
    name: "AP self-study (one subject)",
    minAge: 15,
    maxAge: 18,
    category: "subject",
    focus: "mixed",
    tags: ["university"],
    lang: "en",
    text: `One AP subject, studied at home, with the exam sat at a host school in May.
Subject this year: (write it here, e.g. AP Calculus AB, AP World History).
Host school: find a nearby school on the AP Course Ledger, call its AP coordinator, and tell a Parent the exam-order deadline (it falls in mid-November).
Learn: watch one AP Daily video for this week's topic and write a half-page summary in your own words.
Practise: do one set of practice questions for the topic and mark them yourself; redo any you got wrong.
Review: once a week, explain last week's topic to a Parent in five minutes without notes.
Language: English.
The exam is ordered through a school, never by a Parent. Keep the deadline on the fridge.
Rewards: choose the weekend outing = 60, new book or album = 80, day trip = 150`,
  },
  {
    id: "cambridge-a-level",
    name: "Cambridge International A Level (private candidate)",
    minAge: 15,
    maxAge: 18,
    category: "curriculum",
    focus: "mixed",
    tags: ["university", "whole-week"],
    lang: "en",
    text: `Working towards Cambridge International AS and A Levels as a private candidate, two or three subjects at a time.
Subjects: (write them here, e.g. Mathematics, Physics, English Literature). IGCSE first if the Child is under 16.
Centre: find a Cambridge school or exam provider that takes private candidates and note the entry window for the June or November series.
Syllabus: read this week's section of the syllabus for one subject and list the learning objectives in your own words.
Past paper: do one question from a past paper under time, then mark it with the mark scheme and the examiner report.
Notes: turn this week's topic into one page of notes or a mind map.
Language: English.
Practice comes from the Cambridge syllabus pages. Some syllabuses are not open to private candidates; check before choosing.
Rewards: choose the weekend outing = 60, new book or album = 80, day trip = 150`,
  },
  {
    id: "ib-diploma-inspired",
    name: "IB Diploma inspired",
    minAge: 16,
    maxAge: 18,
    category: "curriculum",
    focus: "mixed",
    tags: ["university", "whole-week"],
    lang: "en",
    text: `A week in the spirit of the IB Diploma: six subject areas plus thinking, service and a long essay.
Six areas: do one hour each in a language, a second language, a humanity, a science, maths and an art.
Theory of knowledge: pick one claim you heard this week and write a paragraph on how you would know if it is true.
Creativity, activity, service: log one creative thing, one physical thing and one act of service.
Extended essay: write 300 words of a long essay on a question you chose, and keep a source list.
Language: English and the second language.
The IB Diploma itself is only sat through an authorised IB school. This plan borrows its shape; it does not lead to the diploma.
Rewards: choose the weekend outing = 60, new book or album = 80, day trip = 150`,
  },
  {
    id: "utbk-snbt",
    name: "Persiapan UTBK-SNBT",
    minAge: 15,
    maxAge: 18,
    category: "subject",
    focus: "mixed",
    tags: ["university", "language"],
    lang: "id",
    text: `Persiapan UTBK-SNBT sedikit demi sedikit setiap minggu, mengikuti Kerangka Acuan UTBK dari SNPMB.
Penalaran Umum: kerjakan 30 soal penalaran dengan waktu 30 menit, lalu tulis jenis soal yang paling sering salah.
Literasi Bahasa Indonesia: baca satu artikel panjang dan tulis gagasan utama tiap paragraf dalam satu kalimat.
Literasi Bahasa Inggris: baca satu teks berbahasa Inggris dan ceritakan isinya dalam bahasa Indonesia selama satu menit.
Penalaran Matematika: kerjakan 20 soal cerita dengan waktu 40 menit, lalu kerjakan ulang yang salah tanpa melihat kunci.
Jadwal: cek jadwal SNPMB tahun ini di snpmb.id, catat tanggal registrasi akun, pendaftaran, dan pelaksanaan UTBK, lalu laporkan ke orang tua.
Bahasa: Indonesia dan Inggris.
Lulusan Paket C ikut jalur SNBT (bukan SNBP) dengan batas umur 25 tahun. Soal latihan tidak disalin ke dalam Quest.
Hadiah: pilih acara akhir pekan = 60, buku atau album baru = 80, makan bersama teman = 150`,
  },
  {
    id: "paket-c-sekolahrumah",
    name: "Paket C untuk sekolahrumah",
    minAge: 15,
    maxAge: 18,
    category: "curriculum",
    focus: "mixed",
    tags: ["university", "language", "whole-week"],
    lang: "id",
    text: `Menuju ijazah Paket C (setara SMA) dari sekolahrumah, lalu TKA dan UTBK.
Administrasi: pastikan sekolahrumah terdaftar di dinas pendidikan kabupaten/kota dan anak terdaftar di PKBM atau SKB dengan NISN aktif; tunjukkan buktinya.
Bahasa Indonesia: tulis satu esai 300 kata tentang topik pilihan sendiri, lalu perbaiki ejaan dan tanda baca.
Matematika: kerjakan 15 soal dari materi minggu ini di buku Paket C, lalu kerjakan ulang yang salah.
Bahasa Inggris: baca satu teks pendek dan jawab lima pertanyaan pemahaman dalam bahasa Inggris.
Mapel pilihan: pelajari satu bab dari dua mata pelajaran pilihan TKA dan buat ringkasan satu halaman per bab.
Bahasa: Indonesia dan Inggris.
Kurikulum mengacu ke kurikulum nasional atau kurikulum kesetaraan. Pendaftaran TKA lewat operator PKBM/SKB, bukan mandiri. Jadwal dicek di laman Pusmendik dan snpmb.id.
Hadiah: pilih acara akhir pekan = 60, buku baru = 80, jalan-jalan sehari = 150`,
  },
  {
    id: "india-nios-cuet",
    name: "India: NIOS Class 12 and CUET",
    minAge: 15,
    maxAge: 18,
    category: "curriculum",
    focus: "mixed",
    tags: ["university", "whole-week"],
    lang: "en",
    text: `Finishing Class 12 through NIOS (open schooling) and preparing for CUET-UG, the central universities' entrance test.
Admission: check the NIOS admission block that is open now and the age cut-off, and tell a Parent the last date.
Five subjects: (write the NIOS subjects here). Do one chapter from one subject each day and keep a page of notes per chapter.
Practice: take one mock paper on the NTA Test Practice Centre for one CUET subject and photograph the result.
Language paper: read one editorial and write its argument in five sentences.
Aptitude: do 20 reasoning and numeracy questions under time and redo the misses.
Language: English and the home language.
Swap CUET for JEE Main (engineering) or NEET-UG (medicine) if that is the goal; both also accept NIOS with five subjects.
Rewards: choose the weekend outing = 60, new book = 80, day trip = 150`,
  },
  {
    id: "malaysia-spm-muet",
    name: "Malaysia: SPM private candidate and MUET",
    minAge: 15,
    maxAge: 18,
    category: "curriculum",
    focus: "mixed",
    tags: ["university", "whole-week"],
    lang: "en",
    text: `Working towards SPM as a private candidate, with MUET for English, towards STPM or university.
Core subjects: Bahasa Melayu, English, Sejarah, Mathematics, Science, and Pendidikan Islam or Moral.
Bahasa Melayu: write one karangan of 250 words and mark it with a Parent.
Sejarah: summarise one chapter into ten dated facts and say them from memory.
Mathematics: do 15 questions from this week's topic and redo the misses.
MUET: do one official MUET sample reading task and one 2-minute spoken answer; record the speaking.
Calendar: find the private-candidate registration window for SPM and the next MUET session and tell a Parent both.
Language: Bahasa Melayu and English.
Practice comes from the Lembaga Peperiksaan and MPM sites. Bahasa Melayu and Sejarah passes are required for public universities.
Rewards: choose the weekend outing = 60, new book = 80, day trip = 150`,
  },
  {
    id: "university-application",
    name: "University application skills",
    minAge: 16,
    maxAge: 18,
    category: "subject",
    focus: "non-stem",
    tags: ["university", "life-skills"],
    lang: "en",
    text: `The application itself: statement, reference, portfolio or interview, and money.
Shortlist: pick three courses at three universities and write one line each on why.
Statement: answer in your own words why you want this subject, how your studies prepared you, and what you did outside study; keep each answer to a paragraph.
Reference: list two adults who could write a reference (a tutor, a coach, an employer; not family) and ask one.
Interview: answer three subject questions aloud for a Parent, thinking out loud as you go; record it.
Money: find one scholarship or student-finance scheme you qualify for and write down its deadline and what it asks for.
Language: English.
UCAS asks three set questions; Common App asks one essay from a set of prompts. Homeschoolers apply independently (UCAS) or with a Parent as counselor (Common App).
Rewards: choose the weekend outing = 60, new book = 80, meal out with friends = 150`,
  },
  {
    id: "life-readiness",
    name: "Life readiness (16 to 18)",
    minAge: 16,
    maxAge: 18,
    category: "subject",
    focus: "non-stem",
    tags: ["life-skills"],
    lang: "en",
    text: `Skills for living on your own: studying, money, documents, work and health.
Study: plan the week on a calendar with spaced study sessions, and test yourself from memory before re-reading.
Budget: track every rupiah or dollar spent for seven days, then write a budget for next month.
Documents: list the ID, licence or bank account you can get at your age, find the official page, and start one application with a Parent.
Work: write a one-page CV and find one part-time job you are legally old enough for.
Health: sleep 8 to 10 hours for five nights and cook two meals for the family.
Language: English.
Official sources only for rules on ID, driving and work. A Parent signs anything that needs it.
Rewards: choose the weekend outing = 60, new book = 80, meal out with friends = 150`,
  },
];
