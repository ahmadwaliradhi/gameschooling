# Starter Plans: expanded catalog and filter labels

Scope: about 29 more Starter Plans to add to the 7 in `src/content/starter-plans.ts`, a label taxonomy so a Parent can filter the "Use a Starter Plan" dialog instead of scrolling, a proposed `StarterPlan` type change, and draft entries in the repo's format. Research date: 2026-11-04.

How to read this file:
- Facts about a method, curriculum or faith (age ranges, core principles, what a text says) are cited to the source's own site or document. Anything I could not confirm from a primary source is marked **UNVERIFIED**.
- `minAge`/`maxAge` on each draft is **our product choice**: the age band where the activity lines make sense. It is not a claim about the framework. Where the framework itself states ages, the citation is in the classification table.
- Draft texts describe each approach in our own words. No course content, book text, worksheets or scripture quotations are copied in, which follows the header rule in `src/content/starter-plans.ts`. Scripture is only *referred to* (for example "a short surah the family is memorising").

---

## 1. Summary

**What exists today.** 7 plans in one flat array, type `{ id, name, minAge, maxAge, text }`. `starterPlansFor(age)` in `src/services/starter-plans.ts` marks each plan `fits` and sorts fitting plans first. `StarterPlans` in `src/routes/parent.$childId.tsx` renders them as one scrolling `<ul>` inside a dialog (`max-h-[80dvh] overflow-y-auto`), with a 3-line preview and a "Use" button. There is no filter or search. With 36 plans that list becomes about 36 x ~120px, so filtering is needed.

**What this adds.** 29 new drafts (36 in total):
- 7 methods or philosophies: Montessori, Waldorf/Steiner, Reggio Emilia, unschooling, unit study, Forest School, tinkering/maker.
- 6 national or international curriculum frameworks: IB PYP, England's National Curriculum, the Australian Curriculum, Finland, Japan, India (NCF Foundational Stage).
- 7 single subjects or skills: mastery maths, computational thinking, money skills, feelings and friendship (SEL), everyday life skills, arts and music, a second language (CEFR A1).
- 9 faith plans: Catholic, Bible-based Christian (Protestant/general), Jewish, Hindu, Buddhist (Plum Village mindfulness), Sikh, and three more Islamic plans (Seerah, Akhlaq and adab, Wudu and salah basics).

Considered but **not drafted**: South Korea's 2022 revised national curriculum (I could not reach an official English source; only secondary reports), Kodály/Orff music methods (folded into "Arts and music" through the National Core Arts Standards), and Latter-day Saint and Orthodox Christian plans (left as open questions for the product owner).

### Recommended label taxonomy

Use **one primary `category`** (drives tabs, every plan has exactly one) plus **multi-value `tags`** (drives chips, zero or more). Why both: tabs answer "what kind of thing do I want?" (a philosophy, a school-style curriculum, one subject, or a faith plan). Chips narrow within or across tabs ("STEM", "Early years"). Parents scan tabs first, then refine.

**Category (exactly one):**

| `category` | Tab label | Meaning |
|---|---|---|
| `method` | Methods | A teaching philosophy or homeschool style that applies across subjects (Montessori, Charlotte Mason, Classical, unschooling...). |
| `curriculum` | Curricula | A national or international curriculum framework (Common Core, Cambridge, Kurikulum Merdeka, IB PYP, England, Australia, Finland, Japan, India). |
| `subject` | Subjects & skills | One subject or skill area (Singapore Math, coding, money, SEL, arts, second language). |
| `faith` | Faith | Religious learning led by the family. |

**Tags (zero or more).** The three required labels are covered by a `focus` field plus a `religion` tag:

| Tag / field | Rule for applying it | Why a parent wants it |
|---|---|---|
| `focus: "stem"` | At least most activity lines are maths, science, technology or engineering. | Required. "I want a maths/science week." |
| `focus: "non-stem"` | Most activity lines are language, humanities, arts, character, faith or life skills. | Required. The opposite filter. |
| `focus: "mixed"` | A broad week that clearly does both (most curriculum plans). | Without this, "STEM" and "Non-STEM" would both match every broad plan and stop being useful filters. In the UI, a "STEM" chip matches `stem` + `mixed`, and a "Non-STEM" chip matches `non-stem` + `mixed`. |
| `religion` | Plan is faith-based (always true when `category === "faith"`). | Required. Kept as a tag as well as a category so a future plan that mixes faith with another category (for example an Islamic Montessori plan) can still be found. |
| `early-years` | `minAge <= 4`, or the method is specifically early childhood (Reggio, India Foundational Stage). | Parents of 3-5 year olds have the fewest options and want them fast. |
| `language` | A large part of the plan is learning a language or script (Arabic, Hebrew, Gurmukhi, a second language), **or** the plan text is not in English. | Bilingual and heritage-language families search for this. |
| `outdoors` | Most activities happen outside (Forest School, Charlotte Mason nature study). | A common reason families homeschool. |
| `arts` | Art, music, drama or handwork is a main strand. | Some families want it; some faith families avoid music (see open questions). |
| `life-skills` | Practical, money, character or social-emotional skills are the main strand. | "Not academics this week." |
| `whole-week` | Covers 3+ subjects, so a Parent can use it as the whole Plan. | Separates "use this as my whole week" from "add this to my week". |

Separate field, not a tag: **`lang`** (the language the plan text is written in, BCP-47 code such as `"en"`, `"id"`). Kurikulum Merdeka is already written in Indonesian. When more non-English plans arrive, the dialog can default to the Parent's UI language. (`lang` is not the same as the `language` tag: the Quran and Arabic plan is written in English but teaches Arabic.)

**Age band filter.** `minAge`/`maxAge` already exist. Recommend a single toggle in the dialog, "Fits {Child}'s age", **on by default**, which hides non-fitting plans (today they are only sorted last). Show a count, for example "12 of 36". Fixed age chips (3-5, 6-8, 9-11, 12-14) are not needed because the dialog already knows the Child's age.

### Proposed TypeScript shape

```ts
// src/content/starter-plans.ts
export type StarterPlanCategory = "method" | "curriculum" | "subject" | "faith";
export type StarterPlanFocus = "stem" | "non-stem" | "mixed";
export type StarterPlanTag = "religion" | "early-years" | "language" | "outdoors" | "arts" | "life-skills" | "whole-week";

export type StarterPlan = {
  id: string;
  name: string;
  minAge: number;
  maxAge: number;
  category: StarterPlanCategory;
  focus: StarterPlanFocus;
  tags: StarterPlanTag[];
  lang: string; // language the text is written in, e.g. "en", "id"
  text: string;
};
```

```ts
// src/services/starter-plans.ts (sketch)
export type StarterPlanFilter = { category?: StarterPlanCategory; focus?: "stem" | "non-stem"; tags?: StarterPlanTag[]; fitsOnly?: boolean };

export function starterPlansFor(age: number, f: StarterPlanFilter = {}) {
  const marked = STARTER_PLANS.map((p) => ({ ...p, fits: p.minAge <= age && age <= p.maxAge }));
  const kept = marked.filter(
    (p) =>
      (!f.category || p.category === f.category) &&
      (!f.focus || p.focus === f.focus || p.focus === "mixed") &&
      (f.tags ?? []).every((t) => p.tags.includes(t)) &&
      (!f.fitsOnly || p.fits),
  );
  return [...kept.filter((p) => p.fits), ...kept.filter((p) => !p.fits)];
}
```

Filtering can also happen entirely on the client, since the whole catalog is small static data already sent in `view.starterPlans`. Keeping the filter function in the service keeps it testable. Add a test that every plan has a category, a focus, and `religion` in its tags if and only if `category === "faith"`.

### UI suggestion for the "Use a Starter Plan" dialog

1. **Tabs** (shadcn `Tabs`) across the top: All · Methods · Curricula · Subjects & skills · Faith. Each tab shows a count.
2. **Chips** (shadcn `Toggle`/`ToggleGroup type="multiple"`, small, wrapping): STEM · Non-STEM · Early years · Language · Outdoors · Arts · Life skills · Whole week. Chips combine with AND. STEM and Non-STEM are mutually exclusive (selecting one deselects the other).
3. **Age switch** (shadcn `Switch`): "Fits {name}'s age" on by default, with "12 of 36" beside it.
4. Keep the current list item (name, ages, 3-line preview, Use). Put the category/tags as tiny muted text under the name so the Parent sees why a plan matched.
5. Empty state: "No Starter Plans match. Clear filters." with one button.
6. Optional later: a search box matching `name` and `text`. Not needed at 36 plans if tabs + chips exist.
7. Do not persist filter state (the dialog is opened rarely). This matches the existing "nothing is saved until Make quests" approach.

---

## 2. Classification table (all 36 plans)

E = existing, N = new draft. Ages = our `minAge`-`maxAge`. "Framework basis" cites the source's own statement where one exists.

| # | id | Name | E/N | Ages | category | focus | tags | Framework basis (primary source) |
|---|---|---|---|---|---|---|---|---|
| 1 | singapore-math | Singapore Math style | E | 5-11 | subject | stem | - | Not re-verified in this pass (existing plan) |
| 2 | cambridge-primary | Cambridge Primary style | E | 5-11 | curriculum | mixed | whole-week | Not re-verified in this pass (existing plan) |
| 3 | common-core | Common Core style | E | 5-12 | curriculum | mixed | whole-week | Not re-verified in this pass (existing plan) |
| 4 | charlotte-mason | Charlotte Mason style | E | 4-12 | method | non-stem | outdoors, arts, early-years, whole-week | Not re-verified in this pass (existing plan) |
| 5 | classical | Classical style | E | 6-14 | method | non-stem | whole-week | Not re-verified in this pass (existing plan) |
| 6 | quran-arabic | Islamic: Quran and Arabic | E | 4-14 | faith | non-stem | religion, language, early-years | Not re-verified in this pass (existing plan) |
| 7 | kurikulum-merdeka | Kurikulum Merdeka | E | 5-12 | curriculum | mixed | whole-week, language (`lang: "id"`) | Not re-verified in this pass (existing plan) |
| 8 | montessori | Montessori style | N | 3-12 | method | mixed | early-years, life-skills, whole-week | AMI: planes of development 0-6 (often split 0-3, 3-6), 6-12, 12-18 [S1] |
| 9 | waldorf | Waldorf / Steiner style | N | 4-12 | method | non-stem | arts, early-years, whole-week | Waldorf Education (AWSNA): stages early childhood, grades, high school; "think clearly, feel deeply... act with intention" [S2]. Ages per stage: UNVERIFIED |
| 10 | reggio-emilia | Reggio Emilia inspired | N | 3-6 | method | mixed | early-years, arts | Reggio Children: "hundred languages", environment as teacher, documentation [S3]. Applied in infant-toddler centres and preschools; exact ages not stated on page |
| 11 | unschooling | Unschooling (child-led) | N | 5-14 | method | mixed | - | John Holt GWS: freedom to learn "as much as parents can comfortably bear"; "not unparenting" [S4] |
| 12 | unit-study | Unit study (one theme) | N | 5-12 | method | mixed | whole-week | Generic homeschool method, no owning body. UNVERIFIED (no primary source exists) |
| 13 | forest-school | Forest School style | N | 3-12 | method | mixed | outdoors, early-years, life-skills | Forest School Association: six principles (long-term, natural setting, supported risk, holistic, qualified leader, community) [S5]. No ages stated |
| 14 | tinkering | Tinkering and making | N | 5-14 | method | stem | arts | Exploratorium Tinkering Studio: hands-on, curiosity-driven work with real materials; learner's idea drives the project [S6] |
| 15 | mastery-maths | Mastery maths (step by step) | N | 5-14 | subject | stem | - | Khan Academy: move at own pace; levels Familiar, Proficient, Mastered [S7] |
| 16 | ib-pyp | IB PYP inspired | N | 3-12 | curriculum | mixed | early-years, whole-week | IB: PYP for ages 3-12, six transdisciplinary themes, programme of inquiry [S8] (ibo.org returned 403 to the fetcher; confirmed via IB PDFs in search results) |
| 17 | uk-national-curriculum | England National Curriculum style | N | 5-11 | curriculum | mixed | whole-week | GOV.UK: KS1 ages 5-7, KS2 7-11; subjects listed [S9] |
| 18 | australian-curriculum | Australian Curriculum style | N | 5-12 | curriculum | mixed | whole-week | ACARA: F-10, 8 learning areas, 7 general capabilities incl. Critical and Creative Thinking [S10] |
| 19 | finland | Finnish style (themed project) | N | 7-12 | curriculum | mixed | life-skills, whole-week | Finnish National Agency for Education: grades 1-9, 7 transversal competences, at least one multidisciplinary module a year [S11]. "Phenomenon-based" is NOT the agency's term on this page |
| 20 | japan | Japanese style (zest for living) | N | 6-12 | curriculum | mixed | life-skills, whole-week | MEXT: "zest for living"; 2017 three pillars; Period for Integrated Studies [S12] |
| 21 | india-foundational | India Foundational Stage style | N | 3-8 | curriculum | mixed | early-years, whole-week | NCERT NCF-FS 2022: Foundational Stage is ages 3-8; play-based; Panchakosha [S13] |
| 22 | computational-thinking | Coding and computational thinking | N | 5-12 | subject | stem | - | CSTA standards: PK-12 bands; concepts Algorithms & Design, Programming, Data & Analysis, Systems & Security, Computing & Society [S14] |
| 23 | money-skills | Money skills | N | 4-12 | subject | mixed | life-skills, early-years | Jump$tart national standards (spending, saving, earning income; kindergarten benchmarks since 2015) [S15]; CFPB building blocks begin ages 3-5 [S16] |
| 24 | feelings-friendship | Feelings and friendship (SEL) | N | 4-12 | subject | non-stem | life-skills, early-years | CASEL: five competencies; families named as a setting [S17] |
| 25 | life-skills | Everyday life skills | N | 5-14 | subject | non-stem | life-skills | WHO (1994) life skills education guidelines [S18]. The exact list of 10 core skills: UNVERIFIED (full text not retrieved) |
| 26 | arts-music | Arts and music | N | 4-12 | subject | non-stem | arts, early-years | National Core Arts Standards: Pre-K to high school; Creating, Performing/Presenting/Producing, Responding, Connecting [S19] |
| 27 | second-language | New language (first steps) | N | 4-14 | subject | non-stem | language, early-years | Council of Europe CEFR global scale, A1 [S20] |
| 28 | catholic | Christian: Catholic | N | 4-12 | faith | non-stem | religion, early-years | Catechism 2223, 2225, 2226 (parents first responsible; first heralds; teach to pray from earliest years) [S21] |
| 29 | christian-bible | Christian: Bible and prayer | N | 4-12 | faith | non-stem | religion, early-years | Deut 6:6-7, Eph 6:4, Mark 10:14 (WEB) [S22]. No single Protestant body; see open questions |
| 30 | jewish | Jewish: Torah, Hebrew and Shabbat | N | 5-13 | faith | non-stem | religion, language | Deut 6:7; Pirkei Avot 5:21 "at five years of age the study of Scripture" [S23] |
| 31 | hindu | Hindu: stories, shlokas and festivals | N | 5-12 | faith | non-stem | religion, arts | Chinmaya Mission Bala Vihar: chanting, bhajans, value stories, games; ages vary by centre (5-12/15/17) [S24] |
| 32 | buddhist | Buddhist: mindfulness (Plum Village) | N | 4-12 | faith | non-stem | religion, life-skills, early-years | Plum Village: pebble meditation, snack meditation, inviting the bell, Five Mindfulness Trainings [S25] |
| 33 | sikh | Sikh: Gurmukhi and Gurbani | N | 5-14 | faith | non-stem | religion, language | SGPC Sikh Rehat Maryada: every Sikh child should learn Gurmukhi; duty to educate children in Sikhism; daily banis [S26] |
| 34 | islamic-seerah | Islamic: Seerah (life of the Prophet) | N | 6-14 | faith | non-stem | religion | Quran 33:21, 68:4 (Sahih Intl.) [S27] |
| 35 | islamic-akhlaq | Islamic: Akhlaq and adab | N | 4-12 | faith | non-stem | religion, life-skills, early-years | Quran 17:23-24, 31:17-19, 49:11 [S27] |
| 36 | islamic-wudu-salah | Islamic: Wudu and salah basics | N | 6-12 | faith | non-stem | religion | Quran 5:6 (wudu); Sunan Abi Dawud 495 (children commanded to pray at seven; Hasan Sahih per al-Albani on sunnah.com) [S27, S28] |

Counts: method 9, curriculum 9, subject 8, faith 10. Focus: stem 4, non-stem 17, mixed 15.

---

## 3. Draft entries (repo format)

Each block is ready to paste into `STARTER_PLANS` once the type gains `category`, `focus`, `tags` and `lang`. All `lang: "en"`. Rewards are suggestions the Parent edits. Faith plans use rewards that fit the tradition (no food that commonly conflicts, see open questions).

### Methods (mastery maths, category `subject`, is listed here because it is a way of teaching)

```ts
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
```

```ts
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
```

```ts
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
```

```ts
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
```

```ts
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
```

```ts
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
```

```ts
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
```

```ts
{
  id: "mastery-maths",
  name: "Mastery maths (step by step)",
  minAge: 5,
  maxAge: 14,
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
```

### Curricula

```ts
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
```

```ts
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
```

```ts
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
```

```ts
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
```

```ts
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
```

```ts
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
```

### Subjects and skills

```ts
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
```

```ts
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
```

```ts
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
```

```ts
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
```

```ts
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
```

```ts
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
```

### Faith

Faith plans are written as family-led and make no doctrinal claims. Each points at what the family already practises ("the prayer the family says", "the passage your family is reading") rather than prescribing content. The Parent chooses texts and checks recitation.

```ts
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
```

```ts
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
```

```ts
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
```

```ts
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
```

```ts
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
```

```ts
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
```

```ts
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
```

```ts
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
```

```ts
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
```

---

## 4. Supporting notes per plan (what the sources say, and what is not verified)

- **Montessori.** AMI's glossary gives the planes of development as birth-6 (split 0-3 and 3-6), 6-12, 12-18 and 18 to adulthood. It describes 3-6 as becoming independent and acquiring language, and 6-12 as imaginative and interested in justice [S1]. "Practical life" and "sensorial" as named areas, "follow the child", and that Montessori discourages extrinsic rewards: **UNVERIFIED** (well known, but I did not reach an AMI page stating them).
- **Waldorf.** Waldorf Education (waldorfeducation.org) names three stages: early childhood ("I am the world"), grades ("I love the world"), and high school ("I know the world"). It stresses experiential learning [S2]. Handwork, form drawing, main lesson blocks and limiting screens for young children: **UNVERIFIED** (the grades page returned 404).
- **Reggio Emilia.** Reggio Children: children as holders of rights with "a hundred languages", the environment as teacher, documentation, and family participation [S3]. Age range: not stated on the page. 0-6 is **UNVERIFIED**, but the page says "infant-toddler centres and preschools".
- **Unschooling.** John Holt GWS (Patrick Farenga) defines it as letting children have as much freedom to learn as parents can comfortably bear, and says unschooling "is not unparenting" [S4].
- **Unit study.** No owning organisation or primary document. Treated as a generic homeschool format. **UNVERIFIED**.
- **Forest School.** The FSA's six principles [S5].
- **Tinkering.** Exploratorium Tinkering Studio: hands-on, curiosity-driven, real materials, the learner's idea leads, rooted in constructionism; it also has early-childhood tinkering [S6].
- **Mastery maths.** Khan Academy: own pace, mastery levels [S7]. Positioned as a method that any family can apply. It does not require Khan Academy.
- **IB PYP.** Ages 3-12, six transdisciplinary themes, programme of inquiry [S8]. ibo.org blocked the fetcher (403). The facts come from IB-hosted PDFs and pages shown in search results. The theme names ("How the world works" etc.) are confirmed only partly ("Who we are", "Sharing the planet" seen in an IB guide). The rest are **UNVERIFIED** from a fetched IB page.
- **England.** Key stages, ages and statutory subjects from GOV.UK [S9].
- **Australia.** F-10, 8 learning areas, 7 general capabilities (v9) from ACARA pages shown in search results [S10].
- **Finland.** 7 transversal competences and at least one multidisciplinary learning module per year, which pupils help plan [S11]. Pupil ages are not given on the page. Grade 1 normally starts at 7: **UNVERIFIED** on this page.
- **Japan.** "Zest for living" (2008 revision) and the 2017 three pillars of competencies; Period for Integrated Studies [S12]. Daily school cleaning by pupils (inspired the "Helping" line): **UNVERIFIED**.
- **India.** NCF-FS (NCERT, 2022): Foundational Stage = ages 3-8; Panchakosha. Downloaded and checked the official PDF [S13]. Rangoli and the "no worksheets for under-sixes" constraint are our own choices. The "no worksheets" line reflects the play-based emphasis, but the exact rule is **UNVERIFIED**.
- **Computational thinking.** CSTA standards concepts and PK-12 grade bands [S14].
- **Money.** Jump$tart (kindergarten benchmarks since 2015; spending, saving, earning income) [S15]. CFPB building blocks start at ages 3-5 [S16].
- **SEL.** CASEL five competencies; families named as a key setting [S17].
- **Life skills.** WHO 1994 guidelines exist [S18]. The ten-skill list is **UNVERIFIED** from the fetched text.
- **Arts.** National Core Arts Standards, Pre-K to high school, four processes [S19]. The draft's lines map to Create, Perform, Respond.
- **Second language.** CEFR A1 global scale: everyday expressions, introducing oneself, simple interaction [S20].
- **Catholic.** CCC 2223 (parents have first responsibility), 2225 (parents as "first heralds" of the faith), 2226 (faith education from earliest years; teach to pray) [S21]. Hearing the Sunday Gospel and learning saints' stories are common family practices but are **UNVERIFIED** against a Church source in this pass.
- **Christian (Bible).** Deut 6:6-7 (teach children at home, on the way, lying down, rising), Eph 6:4, Mark 10:14, Matt 22:37-39 (World English Bible, public domain) [S22]. There is no single Protestant teaching body, so the plan relies only on the Bible text.
- **Jewish.** Deut 6:7 and Pirkei Avot 5:21 ("At five years of age the study of Scripture...") from Sefaria [S23]. Not working on Shabbat is a well-known halachic norm, but I have not cited a specific source here: **UNVERIFIED**. The constraint line is a product safeguard.
- **Hindu.** Chinmaya Mission Bala Vihar pages: Sanskrit chanting, bhajans, value stories (Ramayana, Bhagavatam, Gita), games, festivals; ages vary by centre [S24]. Hinduism has no central body. Chinmaya is one large mission, not the whole tradition.
- **Buddhist.** Plum Village: Five Mindfulness Trainings; children's practices (pebble meditation, snack meditation, inviting the bell); children's groups 6-8 and 9-12 mentioned in a podcast [S25]. Plum Village is one Zen lineage (Thich Nhat Hanh), not all Buddhism.
- **Sikh.** SGPC Sikh Rehat Maryada: "Every Sikh man, woman, boy or girl, should learn Gurmukhi"; duty to educate children in Sikhism; daily banis starting with Japji Sahib [S26]. The full Nitnem list was not confirmed from the PDF (**UNVERIFIED**), so the plan names only Japji Sahib.
- **Islamic Seerah.** Quran 33:21 (the Messenger as an excellent pattern), 68:4 (great moral character) [S27]. "No pictures of the Prophet or Companions" is a widely held Muslim norm and a product safeguard. A primary fiqh citation is **UNVERIFIED**.
- **Islamic Akhlaq.** Quran 17:23-24 (kindness to parents), 31:17-19 (Luqman: be patient, not arrogant, lower your voice), 49:11 (no mocking, no offensive nicknames) [S27]. Bismillah/alhamdulillah at meals: Sunnah practice. A specific hadith was not retrieved: **UNVERIFIED**.
- **Islamic Wudu and salah.** Quran 5:6 (the steps of wudu); Sunan Abi Dawud 495 (command children to pray at seven) [S27, S28]. The same hadith continues with a clause about disciplining at ten. The draft deliberately leaves it out (see open questions). sunnah.com blocked direct fetching (403), so the wording and grading come from the sunnah.com result snippet.

---

## 5. Open questions for the product owner

**Product owner decisions (2026-11-04)**, which supersede the open questions below:
- Faith plans ship without a review from each tradition. Islamic plans are Sunni only; no Shia plans are added. No more faiths or branches are added.
- Rules about pictures on Quest covers (the Prophet and Companions, the Sikh Gurus, Hindu deities) are written in the Starter Plan text only. The Guardian check is not changed.
- Clashes over food, music, Shabbat, and Rewards are written in the Starter Plan text only. The Montessori, unschooling and Buddhist plans have no Rewards line (the planner already returns no Rewards when a Plan lists none).
- Brand names stay in plan names with the "... style" / "... inspired" wording.


1. **Which faiths, and who reviews them?** A reviewer from inside each tradition should read the faith drafts before shipping. They are written cautiously, but word choice matters (for example "Torah portion" vs "parashah", Sikh honorifics). Do we also want Latter-day Saint, Orthodox Christian, Bahá'í, or others? Leaving some out can feel exclusionary.
2. **One plan per faith, or sub-traditions?** The Buddhist plan is Plum Village specifically, and the Hindu plan follows Chinmaya-style practice. Sunni/Shia, Catholic/Protestant/Orthodox and Orthodox/Reform Jewish families may want different defaults. Proposal: keep them generic and editable, and name the lineage only where the content depends on it.
3. **Rewards that conflict with a faith or method:**
   - Food rewards: ice cream, fish and chips and "favourite sweet" can conflict with kosher, halal or vegetarian diets. The drafts for faith plans avoid meat and use neutral treats. Should faith plans avoid food rewards entirely?
   - Music: Arts and music, Waldorf and Hindu (bhajan) plans include music. The existing Islamic plan says "No music in Quests". Should the Quest generator respect a family-level "no music" setting rather than relying on the plan text?
   - Shabbat and festival days: the Jewish plan says "No Quests on Shabbat". The app has no day-of-week concept for Quests. Is a text line enough?
   - Points and rewards versus method: Montessori, unschooling and Plum Village practice lean away from external rewards (**UNVERIFIED** for Montessori). Should these plans ship with a lighter "Rewards" line, or with none, and does the Plan parser require one?
4. **Imagery.** Quest covers are AI-drawn. Islamic Seerah needs a hard rule: no depictions of the Prophet or Companions, and possibly no faces in faith Quests. That rule should live in the Guardian check, not only in plan text. The same question applies to depictions of Sikh Gurus and Hindu deities.
5. **The hadith clause.** Abi Dawud 495 includes a clause about disciplining children at ten. The draft cites only the "pray at seven" part. Confirm we never generate Quests about physical discipline. The Guardian check should already block this.
6. **Language tagging.** Should `lang` drive a default filter (an Indonesian-UI Parent sees Indonesian plans first)? Should some new plans also get an Indonesian version, given the existing Kurikulum Merdeka plan?
7. **Ages.** All `minAge`/`maxAge` values are product guesses. Should the dialog hide non-fitting plans by default (recommended), or keep today's "sort last"?
8. **Trademarks and naming.** "Montessori" is not a registered trademark in the US, but "IB", "PYP", "Cambridge" and "Khan Academy" are owned names. Keep the "... style" / "... inspired" suffix, as the existing plans do, and avoid implying endorsement. Legal review is advised before marketing use.

---

## 6. Sources

- [S1] AMI glossary, Four Planes of Development: https://archives.montessori-ami.org/help/glossary/four-planes-development ; AMI page on six-year planes: https://montessori-ami.org/node/6956
- [S2] Waldorf Education (AWSNA), Waldorf Education: https://www.waldorfeducation.org/waldorf-education
- [S3] Reggio Children, Reggio Emilia Approach: https://www.reggiochildren.it/en/reggio-emilia-approach/
- [S4] John Holt GWS, What Is Unschooling?: https://www.johnholtgws.com/resources/what-is-unschooling ; The Foundations of Unschooling: https://www.johnholtgws.com/writing-by-patrick/the-foundations-of-unschooling
- [S5] Forest School Association, Full Principles and Criteria for Good Practice: https://forestschoolassociation.org/full-principles-and-criteria-for-good-practice/
- [S6] Exploratorium Tinkering Studio: https://www.exploratorium.edu/tinkering ; Research and Development: https://www.exploratorium.edu/tinkering/our-work/research-and-development ; Early Childhood Tinkering: https://www.exploratorium.edu/tinkering/our-work/early-childhood-tinkering
- [S7] Khan Academy, What is self-paced Mastery?: https://support.khanacademy.org/hc/en-us/articles/360007253831-What-is-self-paced-Mastery ; Mastery levels: https://support.khanacademy.org/hc/en-us/articles/5548760867853--How-do-Khan-Academy-s-Mastery-levels-work
- [S8] IB, How the PYP works: https://ibo.org/programmes/primary-years-programme/how-the-pyp-works/ ; PYP brochure: https://ibo.org/globalassets/new-structure/programmes/pyp/pdfs/pyp-brochure-en.pdf (fetch blocked, 403; facts from IB-hosted results)
- [S9] GOV.UK, The national curriculum in England: framework for key stages 1 to 4: https://www.gov.uk/government/publications/national-curriculum-in-england-framework-for-key-stages-1-to-4/the-national-curriculum-in-england-framework-for-key-stages-1-to-4
- [S10] ACARA, Australian Curriculum: https://www.australiancurriculum.edu.au/ ; Learning areas: https://www.australiancurriculum.edu.au/help/learning-areas ; General capabilities (v9): https://v9.australiancurriculum.edu.au/f-10-curriculum/f-10-curriculum-overview/general-capabilities
- [S11] Finnish National Agency for Education, National core curriculum for basic education: https://www.oph.fi/en/education-and-qualifications/national-core-curriculum-basic-education
- [S12] MEXT, Improvement of Academic Abilities (Courses of Study): https://www.mext.go.jp/en/policy/education/elsec/title02/detail02/1373859.htm ; 2017 three pillars: https://www.mext.go.jp/component/a_menu/other/detail/__icsFiles/afieldfile/2017/08/01/1388524_06.pdf ; Zest for living: https://www.mext.go.jp/component/english/__icsFiles/afieldfile/2011/02/21/1302288_009.pdf
- [S13] NCERT, National Curriculum Framework for Foundational Stage (2022): https://ncert.nic.in/pdf/NCF_for_Foundational_Stage_20_October_2022.pdf (downloaded; "The Foundational Stage refers to children in the age group of 3 to 8 years")
- [S14] CSTA K-12 Computer Science Standards: https://csteachers.org/k12standards/
- [S15] Jump$tart Coalition, National Standards (2015 edition PDF): https://www.jumpstart.org/wp-content/uploads/2026/02/2015-National-Standards-Book.pdf ; Education: https://www.jumpstart.org/education/
- [S16] CFPB, Building blocks of financial capability: https://www.consumerfinance.gov/consumer-tools/educator-tools/youth-financial-education/learn/
- [S17] CASEL, What is the CASEL framework?: https://casel.org/fundamentals-of-sel/what-is-the-casel-framework/
- [S18] WHO, Life skills education for children and adolescents in schools (1994): https://iris.who.int/handle/10665/63552
- [S19] National Core Arts Standards: https://www.nationalartsstandards.org/
- [S20] Council of Europe, CEFR global scale (Table 1): https://www.coe.int/en/web/common-european-framework-reference-languages/table-1-cefr-3.3-common-reference-levels-global-scale
- [S21] Catechism of the Catholic Church, paras 2221-2226 (Holy See): https://www.vatican.va/archive/ENG0015/__P7U.HTM
- [S22] World English Bible via bible-api.com: Deut 6:6-7 https://bible-api.com/deuteronomy+6:6-7?translation=web ; Eph 6:4 https://bible-api.com/ephesians+6:4?translation=web ; Mark 10:14 https://bible-api.com/mark+10:14?translation=web ; Matt 22:37-39 https://bible-api.com/matthew+22:37-39?translation=web
- [S23] Sefaria: Pirkei Avot 5:21 https://www.sefaria.org/Pirkei_Avot.5.21 ; Deuteronomy 6:7 https://www.sefaria.org/Deuteronomy.6.7
- [S24] Chinmaya Mission, Children's Spiritual Education: https://www.chinmayamission.com/global/for-children ; Bala Vihar curriculum (a centre): https://metrowest-ma.chinmayamission.com/bala-vihar-curriculum/
- [S25] Plum Village, The Five Mindfulness Trainings: https://plumvillage.org/mindfulness/the-5-mindfulness-trainings ; Mindfulness practices for children: https://plumvillage.org/articles/mindfulness-practices-for-children ; Podcast ep. 56: https://plumvillage.org/podcast/caring-for-children-caring-for-the-child-inside-episode-56
- [S26] SGPC, Sikh Rehat Maryada (English): https://sgpc.net/sikh-rehat-maryada-in-english/ ; PDF: http://old.sgpc.net/CDN/Sikh_Rehat_Maryada_English.pdf
- [S27] The Quran, Sahih International translation via api.alquran.cloud (5:6, 17:23-24, 31:13-19, 33:21, 49:11, 68:4), readable at https://quran.com/5/6 , https://quran.com/17/23-24 , https://quran.com/31/13-19 , https://quran.com/33/21 , https://quran.com/49/11 , https://quran.com/68/4
- [S28] Sunan Abi Dawud 495, sunnah.com: https://sunnah.com/abudawud:495 (direct fetch blocked, 403; text and grading from the sunnah.com search snippet)
- Not drafted (insufficient primary source reached): Korea 2022 revised national curriculum. Only secondary sources and a KICE PDF on the 2015 curriculum: https://www.kice.re.kr/boardCnts/fileDown.do?fileSeq=8f54f214e1c95482943d8de4745da207
