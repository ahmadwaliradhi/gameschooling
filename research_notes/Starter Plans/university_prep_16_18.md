# Starter Plans for ages 15/16 to 18: university entrance and life readiness

Scope: no Starter Plan in `src/content/starter-plans.ts` or in `starter_plans_catalog.md` fits a Child older than 14. The product owner asked for plans for the 16 to 18 band centred on preparing for university enrollment, naming "SAT" and "SNBPT". This file catalogs the main entrance routes a homeschooler of that age can prepare for, drafts 11 Starter Plans in the repo format (two in Indonesian), and recommends one new tag and the age bands. Research date: 2026-11-05.

How to read this file:
- Same rules as `starter_plans_catalog.md`: facts are cited to the exam owner's own site, the ministry or agency that runs it, or its official PDF, one `[S#]` per claim. Anything not confirmed from such a source is marked **UNVERIFIED**.
- `minAge`/`maxAge` on each draft is our product choice, not a claim about the exam.
- Draft texts are in our own words. No test questions, prompts, essay titles, specimen papers or course content are copied in. Where a plan says "do a timed section", the Child uses the owner's own free practice; the plan never reproduces it.
- Dates below are for the 2026 cycle (the one whose pages are live) or the 2026-27 / 2027 cycle where the owner has published it. Plans never hard-code a date; the Parent checks the owner's calendar.

**On the owner's spelling "SNBPT".** The official name is **SNBT, Seleksi Nasional Berdasarkan Tes** [S30, S33], one of the two national routes under **SNPMB, Seleksi Nasional Penerimaan Mahasiswa Baru** [S29]; the other is **SNBP, Seleksi Nasional Berdasarkan Prestasi** [S30]. SNBT is decided by the **UTBK, Ujian Tulis Berbasis Komputer** [S29]. (The 2026 presentation PDF spells it "Ujian Tertulis Berbasis Komputer" once [S31]; the site, the press release and the helpdesk use "Ujian Tulis".) The Panitia SNPMB is formed by the Minister of Higher Education, Science and Technology (Mendiktisaintek) with the Majelis Rektor PTN Indonesia (MRPTNI) [S34]; the site is snpmb.id, the portal portal.snpmb.id. "SNBPT" is most likely SNBP and SNBT run together. Both are covered.

---

## 1. Summary and recommendations

### What the research found

- **Every route in scope admits a homeschooler, with one exception.** SAT and ACT have a dedicated homeschool code (970000 and 969-999) and no school is needed [S1, S8]. AP exams need a host school's AP coordinator by mid-November [S12]. Cambridge International A Levels (and IGCSE) accept private candidates through a Cambridge school or approved exam provider such as the British Council [S17, S19]. UK A-levels accept private candidates at an approved centre [S20]. Singapore's A-Level accepts private candidates from age 17 [S27]. India's open-schooling board NIOS is the Class 12 route, and CUET, JEE Main and JEE Advanced list NIOS as a qualifying exam [S40, S42, S44]. Malaysia's STPM and MUET have a "calon persendirian individu" type and MUET has no entry condition at all [S36, S37]. Indonesia's SNBT is open to Paket C learners and graduates up to age 25 [S31, S33]. **The exception is the IB Diploma**, which the IB says is open to students "at schools that have been authorized to implement the programme" [S14]; no independent-candidate route was found.
- **Indonesia has two layers a homeschooler must plan for.** First, equivalency: under UU 20/2003 Art. 27 the results of informal (family) education are recognised as equal to formal and nonformal education "setelah peserta didik lulus ujian sesuai dengan standar nasional pendidikan" [S48], and Permendikbud 129/2014 says a sekolahrumah learner may sit the national or equivalency exam "pada satuan pendidikan formal atau nonformal yang disetujui atau ditunjuk oleh Dinas Pendidikan" (Art. 12) and must register with the district education office (Art. 6) [S47]. In practice this means Paket C at a PKBM or SKB and, since 2025, the **TKA (Tes Kemampuan Akademik)** run by Pusmendik, Kemendikdasmen, which its FAQ says is voluntary, but which Paket A/B/C learners "yang ingin mendapatkan pengakuan kesetaraan hasil belajar perlu mengikuti", and which "murid sekolahrumah yang terdaftar dalam basis data kementerian atau memiliki NISN Valid" may take [S49]. Second, admission: **SNBP is school-rapor based and needs a TKA score**; SNPMB's helpdesk says Paket C graduates can join 2026 "hanya pada seleksi nasional berdasarkan tes (SNBT)" [S33]. So the Indonesian plans are built around UTBK-SNBT, with TKA and Paket C as the equivalency layer.
- **The UK application changed in 2026.** UCAS replaced the free-text personal statement with three set questions (still 4,000 characters) [S23], and an applicant with no school can apply independently [S24]. Common App keeps seven essay prompts and tells homeschoolers to invite the home-school supervisor (a parent) as counselor [S52, S53].
- **Official free prep exists for almost every route** (Bluebook and Khan Academy for the SAT [S5, S6]; ACT's five practice tests [S10]; AP Daily videos without a teacher [S13]; Cambridge specimen and past papers [S18]; SEAB specimen papers [S28]; NTA's mock test portal [S45]; MPM's MUET sample questions [S38]; Pusmendik's "Ayo Coba TKA" simulation [S49]). For UTBK-SNBT the only official material found is the **Kerangka Acuan UTBK** (the framework with subtests, question counts and minutes) at snpmb.id/fr [S32]; `snpmb.id/simulasi/` returned 404 on 2026-11-05, so an official UTBK simulation is **UNVERIFIED**.

### Tag recommendation: add one tag, `university`

Add **`university`** to `StarterPlanTag`: "prepares a Child for university entrance: an admissions test, a qualifying exam or diploma, or the application itself." Chip label: **University**.

Why `university` rather than `exam-prep`:
- The Parent's search word is the goal ("get into university"), not the activity. A Parent whose Child is doing the UCAS questions or a portfolio should find that plan with the same chip as the SAT plan; `exam-prep` would split them.
- `exam-prep` would also pull in future non-university exams (music grades, swimming badges, Quran hifz certificates) and dilute the chip.
- One tag keeps the chip row short (nine chips today).

No new category. Test-prep plans are `subject` (one skill area, like Singapore Math), diploma routes (A Level, IB-inspired, Paket C, NIOS) are `curriculum`, and application and life-readiness plans are `subject`. `focus` stays meaningful: SAT, ACT, UTBK and the diploma routes test both maths and language, so they are `mixed`; application skills and life readiness are `non-stem`. The `language` tag keeps its existing rule (plan text not in English, or the plan teaches a language), so the two Indonesian plans carry it as Kurikulum Merdeka does.

Optional, not recommended now: a `teens` tag mirroring `early-years`. The age switch already does this job and the dialog knows the Child's age.

### Age recommendation: 15-18 for exam routes, 16-18 for application and life readiness

- **Exam-route plans: `minAge: 15, maxAge: 18`.** The owners themselves put the first sitting at 15-16: College Board says take the SAT "in the spring of their junior year" (US grade 11, usually 16-17) [S4]; ACT says "junior year is the most common time" [S9]; Cambridge says IGCSE is for 14 to 16 and AS & A Level for 16 to 19 [S16, S15]; NIOS admits to Senior Secondary from 15 [S41]. Starting at 15 also closes the hole at 15 that the catalog would otherwise have (today's plans top out at 11-14). A 15-year-old's week on these plans is "build vocabulary, one untimed section", not "sit the exam".
- **Application and life-readiness plans: `minAge: 16, maxAge: 18`.** Personal statements, references and scholarship deadlines belong to the final two years; Indonesian ID (KTP-el) and driving licences start at 17 [S56, S57]; a UK provisional licence at 15 years 9 months [S58].
- **`maxAge: 18` on all**, matching the band the owner named. Flag: SNBT accepts graduates up to three years out (age cap 25 for Paket C) [S33] and Cambridge says 16 to 19, so a 19-year-old gap-year Child would see these plans as "not fitting" with the age switch on. Acceptable for now; see open questions.
- **Do not extend existing plans.** Their activity lines are written for primary ages (coins, stickers, "ask a grandparent"). The Classical (6-14), Quran and Arabic (4-14), Mastery maths (5-14), Everyday life skills (5-14) and New language (4-14) plans end at 14 and the new 15-18 plans take over from there. If the owner wants one bridge, the cleanest is a `maxAge: 15` bump on Mastery maths (its text is age-neutral), nothing else.

### Changes implied for the catalog file

```ts
export type StarterPlanTag =
  | "religion" | "early-years" | "language" | "outdoors" | "arts" | "life-skills" | "whole-week"
  | "university"; // new: prepares for university entrance (a test, a qualifying diploma, or the application)
```

The test in issue #18 ("only known tags") needs `university` added to its list. The coverage test gains "SAT", "UTBK" and "Paket C". Counts after adding the 11 drafts: 47 plans; `university` on 9 of them.

---

## 2. Route table

Age/grade and dates are the owner's own words where quoted. "Homeschooler?" gives the owner's statement on sitting the exam without a school.

| Route | Who runs it | What it tests | Typical age / grade | Registration window (latest published) | Official free prep | Homeschooler? (official statement) |
|---|---|---|---|---|---|---|
| **SAT** (US, international) | College Board [S1] | Digital, adaptive. Reading and Writing: 2 modules, 64 min, 54 q. Math: 2 modules, 70 min, 44 q. 134 min, 98 q. Score 400-1600 [S2, S3] | "spring of their junior year and the fall of their senior year" [S4] | 2026-27 Saturdays: 3 Oct, 7 Nov, 5 Dec 2026; 6 Mar, 1 May, 5 Jun 2027; regular deadline about 2 weeks before. Register at My SAT; the student registers, not the parent. US$68 [S4a, S1, S4b] | Bluebook app full-length adaptive practice; Official SAT Prep on Khan Academy, free [S5, S6] | Yes. "If I'm homeschooled, what do I enter for the high school code? Enter 970000" [S1] |
| **ACT** (US) | ACT [S7] | Enhanced ACT (from Sept 2025): English 35 min/50 q, Math 50 min/45 q, Reading 40 min/36 q; Science (40 min/40 q) and Writing optional. Composite 1-36 [S7a, S7b] | "Most students take the ACT during their junior or senior year" [S9] | 2026-27: 19 Sep, 17 Oct, 12 Dec 2026; 27 Feb, 10 Apr, 12 Jun, 10 Jul 2027; regular deadline about 5 weeks before. US$70 base [S9a, S9b] | Official Practice Tests 1-5, Practice by Section, Question of the Day, free [S10] | Yes. "Homeschool students can sign up directly by creating their own MyACT account" [S8]; code 969-999 so scores go to the student [S8a] |
| **AP** (US, international) | College Board [S11] | College-level courses with a May exam per subject; 42 subjects; score 1-5; all exams digital or hybrid from 2026 [S11, S11a, S11b, S11c] | High school; exams in May [S11] | Order through a school's AP coordinator; 2027 exams 3-7 and 10-14 May; ordering deadline 13 Nov 2026; US$99 per exam, US$129 international [S11d, S12a, S12b] | AP Daily videos in AP Classroom "without a teacher" [S13] | Yes, via a host school: find a school on the AP Course Ledger and call its coordinator "as early in the school year as possible"; orders close mid-November [S12] |
| **Cambridge IGCSE then AS & A Level** (international) | Cambridge International Education, Cambridge University Press & Assessment [S15a] | IGCSE: 14-16, 70+ subjects. A Level: 55 subjects, AS (one year) or full A Level (two years); graded A*-E; series June and November, March in India [S16, S15, S15b, S15c] | "students aged 16 to 19 in the final two years of high school" [S15] | Through the centre. British Council (as provider): Nov series entries early Aug to mid-Sept; June series late Nov to late Feb [S19] | Past papers, mark schemes, examiner reports and specimen papers per syllabus [S18] | Yes. "You can register for our exams as a private candidate even if you don't attend a Cambridge school" via a centre that accepts private candidates; some syllabuses are not open to private candidates [S17, S17a] |
| **UK A-levels** (domestic boards) | AQA, Pearson Edexcel, OCR; regulated by Ofqual [S20a] | Subject A-levels; private candidates sit "at an approved school or college" [S20] | 16-18 (UK Years 12-13). UNVERIFIED from a board page | Via the centre; JCQ has a centre search [S20] | Each board's past papers (not re-verified) | Yes. JCQ lists "Home-schooled" as a private-candidate case; Pearson: "A centre is not obliged to accept private candidates" [S20, S20b] |
| **IB Diploma Programme** | International Baccalaureate [S14] | Six subject groups plus TOK, CAS and the extended essay; 3-4 subjects at HL; max 45 points, diploma from 24; sessions May and November [S14, S14a, S14b, S14c] | "for students aged 16-19" [S14] | Through the school; not published publicly. UNVERIFIED | Sample and some past exam papers for a few subjects [S14d] | **No independent route found.** "open to any student aged 16 to 19, at schools that have been authorized to implement the programme" [S14]. Only an online pilot with selected partners exists [S14e]. Treat "homeschoolers cannot sit the DP" as UNVERIFIED as an explicit statement |
| **UCAS** (UK applications) | UCAS [S21] | Not a test. One application, up to five choices; personal statement is three set questions from 2026 entry, 4,000 characters total, min 350 per answer; one reference [S23, S25] | Final school year | 2027 entry: opens 12 May 2026; submissions from 1 Sep 2026; 15 Oct 2026 18:00 for Oxford, Cambridge, most medicine/dentistry/vet; 13 Jan 2027 18:00 equal-consideration [S21] | UCAS personal statement guides and builder [S22] | Yes. "If you are applying independently, you can click 'No'" (to the school question); referee may be a former teacher or employer, never family [S24, S25] |
| **Singapore-Cambridge GCE A-Level** | SEAB with MOE and Cambridge [S26] | H1/H2 subjects (H3 school candidates only); main written papers Sept-Nov; results Feb [S26, S28a, S28b] | Private candidates: "17 as at 1 January" [S27] | 2026 private window 7-20 April 2026; 2027 details "in March 2027"; fees per subject by citizenship, e.g. H2 Mathematics S$180 citizen [S27, S28c] | Syllabus PDFs and specimen papers for revised syllabuses [S28] | Yes, private candidates via Singpass, max 5 H1 + 3 H2 or 3 H1 + 4 H2; home-schooled children in Singapore must also pass the PSLE benchmark [S27, S26a] |
| **Australia ATAR** | State TACs calculate it (UAC, VTAC, QTAC, TISC, SATAC); state authorities run the Year 12 certificate (NESA, VCAA...) [S60, S60a] | Rank 0-99.95, "a rank, not a mark", from Year 12 results [S60] | Year 12, about 17-18 | Via the state authority and TAC; windows not captured. UNVERIFIED | NESA HSC past papers (link only) | Partly. NSW: a home-schooled child "may sit HSC examinations by self-tuition" and get a Results Notice usable for an ATAR "but they are not eligible for an HSC" [S61]; UAC requires "proof of completion of an accredited Year 12 program" and lists no-ATAR pathways (TAFE Cert IV tertiary prep, STAT, foundation programs) [S62, S63] |
| **SNBP** (Indonesia, rapor route) | Panitia SNPMB (Mendiktisaintek with MRPTNI) [S34] | No test. School enters rapor in PDSS; rapor for all subjects weighs at least 50%, up to two supporting subjects, portfolio and achievements up to 50%; needs a TKA score; school quota by accreditation (A 40%, B 25%, C 5%) [S30, S31] | "siswa SMA/SMK/MA kelas terakhir pada tahun 2026" [S30] | 2026: school accounts 5-26 Jan; student accounts 12 Jan-18 Feb; SNBP registration 3-18 Feb; results 31 Mar 2026. Free [S35, S31] | None needed | **No** for Paket C/homeschool: "lulusan Paket C ... hanya pada seleksi nasional berdasarkan tes (SNBT)" [S33]; SNBP schools must have an NPSN and use the national curriculum [S30] |
| **UTBK-SNBT** (Indonesia, test route) | Panitia SNPMB [S34] | 195 min, 160 q, no break. TPS: Penalaran Umum 30 q/30 min (induktif, deduktif, kuantitatif 10 each), Pengetahuan dan Pemahaman Umum 20 q/15 min, Pemahaman Bacaan dan Menulis 20 q/25 min, Pengetahuan Kuantitatif 20 q/20 min. Tes Literasi: Literasi dalam Bahasa Indonesia 30 q/42.5 min, Literasi dalam Bahasa Inggris 20 q/20 min, Penalaran Matematika 20 q/42.5 min [S32] | Final-year students and graduates of the last three years; Paket C up to age 25 on 1 July [S33a, S31] | 2026: student account 12 Jan-7 Apr; registration 25 Mar-7 Apr; UTBK 21-30 Apr (one wave, two sessions a day); results 25 May 2026. Rp200.000; one sitting per person [S35, S31, S31a]. 2027 schedule not yet published on 2026-11-05 | Kerangka Acuan UTBK (framework) [S32]. Official simulation: UNVERIFIED (snpmb.id/simulasi 404) | **Yes.** "Peserta didik Paket C tahun 2026 ... atau Lulusan Paket C tahun 2024 dan 2025 dengan umur maksimal 25 tahun (per 1 Juli 2026)" [S31, S33] |
| **Paket C + TKA** (Indonesia equivalency) | Paket C: nonformal units (PKBM, SKB) under Kemendikdasmen; UU 20/2003 defines "pendidikan kesetaraan ... paket A, paket B, dan paket C" [S48]. TKA: Pusmendik, Kemendikdasmen [S49] | TKA for SMA/sederajat: Bahasa Indonesia, Matematika, Bahasa Inggris plus two chosen subjects; once per level [S49] | Last year of the level [S49] | TKA SMA/sederajat and Paket C 2026: registration via the PKBM/SKB operator, main test late Oct to early Nov 2026, results Dec 2026. **UNVERIFIED** (news reports only; the Pusmendik page fetched had no dates) | "Ayo Coba TKA" simulation and the SMA assessment framework on pusmendik [S49] | Yes. Sekolahrumah learners must register with the district education office (Art. 6), follow the national or equivalency curriculum (Art. 7) and may sit the national/equivalency exam at a formal or nonformal unit approved by the Dinas (Art. 12) [S47]; "murid sekolahrumah yang terdaftar dalam basis data kementerian atau memiliki NISN Valid dapat mengikuti TKA" [S49] |
| **Malaysia SPM** | Lembaga Peperiksaan, KPM | Core: BM, English, Sejarah, Mathematics, Science, Pendidikan Islam/Moral. BM and Sejarah passes stay compulsory for public universities "including for students from outside the national education system" [S39a] | Form 5, about 17 | SPM 2026: 26 Oct-17 Dec 2026 [S39]. Private-candidate window (reported 1 Mar-30 Apr) and fees: **UNVERIFIED** (lp.moe.gov.my unreachable) | LP format pages: UNVERIFIED | Private candidates ("calon persendirian") register via SPPAT: **UNVERIFIED** from LP. Homeschooling itself is by ministerial exemption, "satu keistimewaan dan bukannya hak" (2019 parliamentary reply) [S39b] |
| **Malaysia STPM + MUET** | Majlis Peperiksaan Malaysia (MPM) [S36] | STPM: three semesters, max 5 subjects incl. Pengajian Am, graded to a 4.00 PNGK. MUET: Listening 50 min, Speaking 30, Reading 75, Writing 75; bands 1.0-5+ aligned to CEFR [S36, S37, S37a] | 18-19 (UNVERIFIED on MPM pages) | STPM 2027 registration 19 Jun-3 Jul 2026, fee RM120 + RM90/subject. MUET 2026: three sessions (Apr, Jun, Oct) plus MUET on Demand; RM150 [S36a, S37b, S37c] | MUET sample questions and test specs; STPM syllabi [S38, S36b] | Yes. STPM candidate type "calon persendirian individu" [S36]; MUET: "Tiada sebarang syarat yang dikenakan untuk menduduki MUET" [S37d] |
| **India CUET-UG** (plus JEE, NEET) | National Testing Agency [S40] | CUET: up to five papers from 13 languages, 23 domain subjects and a General Aptitude Test, 50 q each; no age limit. JEE Main: Physics, Chemistry, Maths, two sessions (Jan, Apr). JEE Advanced: two 3-hour papers, two attempts, age cap. NEET-UG: PCB, 180 q in 180 min, min age 17 [S40, S42, S43, S44] | Class 12 passed or appearing | CUET 2026 application 3-30 Jan, exam 11-31 May; JEE Main S1 app 31 Oct-27 Nov 2025; NEET 2026 app 8 Feb-8 Mar, exam 3 May [S40, S42, S44] | NTA Test Practice Centre mock tests; JEE Advanced practice tests [S45, S43a] | Yes via NIOS: CUET and JEE Main list "Senior Secondary School Examination conducted by the National Institute of Open Schooling with a minimum of five subjects" [S40, S42]; JEE Advanced accepts NIOS but requires one earlier public exam if Class XII was not one [S43]. NEET 2026 bulletin names no open school; accepts "duly recognized boards": UNVERIFIED for NIOS |
| **NIOS Senior Secondary** (India, the homeschool route) | National Institute of Open Schooling [S41] | Five or more subjects; public exams Mar-Apr and Sep-Oct; On Demand exams after the first attempt [S41, S41a] | Min 15 for Senior Secondary, no upper limit [S41] | Stream 1 Block 1: 16 Mar-31 Jul 2026 (late to 15 Sep); Block 2: 16 Sep 2026-31 Jan 2027; fee Rs 2,340 (5 subjects) [S41] | Not captured | Yes by design: "There is no upper age limit for admission"; needs a Secondary certificate first [S41] |
| **University application skills** | Common App (US) [S52]; UCAS (UK) [S23]; universities' own interview pages [S54, S55] | Common App: seven essay prompts, same for 2026-27 [S52]; UCAS: three questions [S23]; Oxford: interviews are "academic conversations about your chosen subject", online in December [S54]; Cambridge: expect to "apply your knowledge to new situations" [S55]; UAL portfolio: 3-5 projects, show process [S51] | Final two years | Common App opens 1 Aug each year (not re-verified); UCAS dates above; FAFSA for 2027-28 "no earlier than October 1, 2026" [S59]; MEXT undergraduate: apply to the embassy April-May the year before [S59a] | Common App and UCAS guides; university interview pages | Yes. Common App: "invite their home school supervisor (ex. a parent) as their school counselors" [S53]; UCAS independent route [S24] |
| **Life readiness** | n/a | Study strategies (spaced and retrieval practice, elaboration, interleaving, concrete examples, dual coding) [S64]; teen money topics (earning, saving, planning, borrowing) [S65]; sleep 8-10 h for 13-17 [S68] | 16-18 | Indonesia: KTP-el at 17 [S56]; SIM A/C at 17 [S57]; UK provisional licence at 15 y 9 m, drive at 17 [S58]; US varies by state (California permit at 15 and a half) [S58a]. Work: Indonesia bans employing children under 18 except light work at 13-15, max 3 h/day [S66]; US 14-15 limited hours, 16-17 any non-hazardous job [S67]; UK part-time from 14 (13 by byelaw) [S67a] | CFPB Money as You Grow; OJK Sikapi Uangmu [S65, S65a] | n/a |

---

## 3. Draft entries (repo format)

All drafts use the proposed type from `starter_plans_catalog.md` plus the new `university` tag. Rewards are suggestions the Parent edits. Points are sized for `expectedWeeklyPoints` of 60 a week at 11+ (`src/domain/family-rules.ts`): a 60-point reward is about a week, 150 about a fortnight and a half. Proof kinds: a photo of a marked practice section works as a `worksheet` Proof (one Verdict per answer), a short `text` Proof suits reflections (8+), and `voice` suits read-alouds and mock interviews.

### Exam routes (`subject` or `curriculum`, ages 15-18)

```ts
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
Practice comes from College Board and Khan Academy only. No question banks copied into Quests. A Parent reads the score report with the Child, not instead of them.
Rewards: choose the weekend outing = 60, new book or album = 80, friends over for pizza = 150`,
},
```

```ts
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
```

```ts
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
The exam is ordered through a school, never by a parent. Keep the deadline on the fridge.
Rewards: choose the weekend outing = 60, new book or album = 80, day trip = 150`,
},
```

```ts
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
```

```ts
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
```

```ts
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
```

```ts
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
```

```ts
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
Five subjects: (write the NIOS subjects here). Do one lesson from one subject each day and keep a page of notes per lesson.
Practice: take one mock paper on the NTA Test Practice Centre for one CUET subject and photograph the result.
Language paper: read one editorial and write its argument in five sentences.
Aptitude: do 20 reasoning and numeracy questions under time and redo the misses.
Language: English and the home language.
Swap CUET for JEE Main (engineering) or NEET-UG (medicine) if that is the goal; both also accept NIOS with five subjects.
Rewards: choose the weekend outing = 60, new book = 80, day trip = 150`,
},
```

```ts
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
```

### Application and life readiness (`subject`, ages 16-18)

```ts
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
UCAS asks three set questions; Common App asks one essay from a set of prompts. Homeschoolers apply independently (UCAS) or with a parent as counselor (Common App).
Rewards: choose the weekend outing = 60, new book = 80, meal out with friends = 150`,
},
```

```ts
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
```

### Counts

11 drafts: `subject` 7, `curriculum` 4. `focus`: mixed 9, non-stem 2. Tags: `university` 10, `whole-week` 5, `language` 2, `life-skills` 2. `lang`: en 9, id 2.

---

## 4. Per-plan notes (what the sources say, and what is not verified)

- **SAT prep.** Structure, timing and score range from College Board's structure and scores pages [S2, S3]; the "junior spring, senior fall" advice [S4]; dates and the US$68 fee [S4a, S4b]; the student must register themselves [S1]; homeschool code 970000 [S1]. Bluebook and Khan Academy's Official SAT Prep are both College Board-endorsed free prep [S5, S6]. The number of Bluebook practice tests is **UNVERIFIED** on a College Board page (third parties say ten). Khan Academy's course page was confirmed live via a browser (WebFetch only returned the JS shell).
- **ACT prep.** The enhanced ACT (Science and Writing optional, composite from English, Math, Reading) [S7a, S7b]; "junior year is the most common time" [S9]; dates and fees [S9a, S9b]; free practice tests 1-5 [S10]; homeschoolers register via their own MyACT account [S8]. The 969-999 code appears in ACT's student blog [S8a] and in the search snippet for the homeschool page, not in the fetched page body.
- **AP self-study.** 42 subjects, 1-5 scale, May exams [S11, S11a]; all exams digital or hybrid from May 2026 [S11c]; 2027 dates and fees [S11d, S12b]; the homeschool process (AP Course Ledger, coordinator, mid-November) [S12]; the exact ordering deadline 13 Nov 2026 for 2027 exams [S12a]; AP Daily without a teacher [S13]. The plan says "mid-November" rather than a date so it does not go stale.
- **Cambridge A Level.** Ages 16-19, AS one year, A Level two [S15]; 55 subjects on the site, 61 in the factsheet (the plan names neither); June and November series, March in India [S15b]; grades A*-E [S15c]; IGCSE 14-16 [S16]; private candidates via a centre, some syllabuses excluded [S17, S17a]; British Council entry windows [S19]; past papers and specimen papers [S18]. Fees vary by centre and are not stated.
- **IB Diploma inspired.** Six groups, core, 45 points, May and November sessions [S14-S14c]. The DP is "at schools that have been authorized" [S14]; no page says "no" to independent candidates, so the plan's constraint line says the diploma is "only sat through an authorised IB school", which is what the IB states, and the plan is explicitly "inspired", not a route to the diploma. Whether the online pilot [S14e] could ever admit a homeschooler is **UNVERIFIED**.
- **Persiapan UTBK-SNBT.** Subtests, question counts and minutes from the Kerangka Acuan UTBK 2026 [S32] and the 2026 presentation [S31]; the plan's "30 soal / 30 menit" and "20 soal / 40 menit" mirror Penalaran Umum and roughly Penalaran Matematika (42.5 min) without copying any question. Eligibility (last-year students, graduates of the last three years, Paket C up to 25 on 1 July) [S31, S33a]; Paket C only via SNBT [S33]; fee Rp200.000, one UTBK per person, up to four programme choices [S31, S31a]; 2026 dates [S35]. An official SNPMB simulation is **UNVERIFIED** (news sites point to snpmb.id/simulasi, which returned 404 on 2026-11-05). The 2027 schedule had not been published on 2026-11-05 (2026's was launched 16 Sept 2025 [S30]).
- **Paket C untuk sekolahrumah.** Legal basis: UU 20/2003 Art. 26-27 (pendidikan kesetaraan; informal education recognised after passing an exam to national standards) [S48]; Permendikbud 129/2014 Art. 4 (recognition), Art. 6 (register with the Dinas; a 13-year-old signs a consent letter), Art. 7 (national or equivalency curriculum; religion, Pancasila and Indonesian compulsory), Art. 12 (sit the exam at an approved unit) [S47]. Note the regulation still names the UN/UNPK, which no longer exist; the TKA has taken the "standardised test for equivalency" role: Pusmendik's FAQ says TKA is "asesmen sukarela", that Paket A/B/C learners who want "pengakuan kesetaraan hasil belajar perlu mengikuti TKA", that sekolahrumah learners with a valid NISN may take it, that SMA/sederajat sit Bahasa Indonesia, Matematika, Bahasa Inggris and two chosen subjects, and that there is one chance per level [S49]. Whether a Permendikbud newer than 129/2014 governs sekolahrumah today is **UNVERIFIED**. TKA 2026 dates and "registration via the PKBM/SKB operator" are **UNVERIFIED** (news only). The plan avoids dates and says "cek jadwal".
- **India: NIOS and CUET.** NIOS minimum age 15, no upper limit, admission blocks and fees [S41]; On Demand exams [S41a]; CUET structure, no age limit, NIOS listed as qualifying [S40]; JEE Main sessions and NIOS [S42]; JEE Advanced age and attempt rules and the "one earlier public exam" clause [S43]; NEET 180 questions, min age 17 [S44]; NTA mock portal [S45]. NEET's acceptance of NIOS is **UNVERIFIED** for 2026 (the bulletin names only "duly recognized boards").
- **Malaysia: SPM and MUET.** lp.moe.gov.my, sppat.moe.gov.my and moe.gov.my were unreachable (connection refused or 403) on every route, so SPM private-candidate windows and fees are **UNVERIFIED**; the SPM 2026 dates and the BM/Sejarah rule come from KPM statements carried by RTM [S39, S39a]. MUET components, bands, "no conditions", fee and 2026 sessions are from MPM [S37-S37d]; STPM private candidates and fees from MPM's regulations PDF [S36]. The homeschooling exemption comes from a 2019 KPM written reply hosted on a parliamentary-document mirror [S39b], so it is marked **UNVERIFIED** as to current practice.
- **University application skills.** UCAS's three questions and 4,000 characters [S23]; independent applicants and referee rules [S24, S25]; Common App prompts unchanged for 2026-27 [S52] and the homeschool-supervisor-as-counselor rule [S53]; Oxford and Cambridge interview pages [S54, S55]; UAL portfolio advice [S51]; FAFSA 2027-28 opening [S59]; MEXT undergraduate timeline [S59a]; NUS ASEAN Undergraduate Scholarship (automatic consideration) [S59b]. The plan's three statement questions paraphrase UCAS's; it does not reproduce Common App's prompts. Indonesian S1 scholarships: LPDP's current intake lists no school-leaver S1 scheme [S50]; Beasiswa Indonesia Maju sits under "Beasiswa S1/D4" on the Kemendikdasmen BPI page but its portal did not resolve, so eligibility is **UNVERIFIED** [S50a]; Beasiswa Talenta Indonesia (Feb 2026) funds S1/D4 for students with national or international achievements [S50b]. The Common App 650-word limit is **UNVERIFIED** on the fetched prompts page.
- **Life readiness.** Study strategies from the Learning Scientists [S64]; CFPB teen money topics [S65]; OJK Sikapi Uangmu [S65a]; KTP-el at 17 (UU 24/2013 Art. 63) [S56]; SIM A/C at 17 (Perpol 5/2021 Art. 8) [S57]; UK provisional licence and driving age [S58]; California permit at 15 and a half [S58a]; Indonesian child-labour rules (UU 13/2003 Art. 68-69) [S66]; US FLSA hours for 14-17 [S67]; UK child employment [S67a]; CDC sleep 8-10 h for 13-17 [S68]. The plan is written so each line sends the Child to "the official page" for their country rather than stating a rule that differs by country.

### Age-related implications (task item 3)

- Existing plans top out at 11-14; the new drafts start at 15 (exam routes) or 16 (application, life readiness) and end at 18, so a Child of any age from 3 to 18 now has at least one fitting plan. The only age with few fits is 15 (exam-route plans only).
- The app's age-dependent rules already suit teens: `text` Proofs from 8, `worksheet` Proofs from 6 (`WORKSHEET_AGE`), Stakes on by default from 8, and `expectedWeeklyPoints` flat at 60 from 11. Nothing in `src/domain` needs changing for 15-18. The Quest writer reads Quests aloud and draws covers; that is harmless for teens but the "read aloud" framing may feel young (see open questions).
- No existing plan should be extended; their lines are written for primary ages. A `maxAge: 15` bump on Mastery maths is the only defensible one.
- Recommend `maxAge: 18` on all new plans. If the owner wants gap-year Children covered (SNBT allows three years after graduation, Cambridge says 16-19), raise the two Indonesian plans and the Cambridge plan to 19.

---

## 5. Open questions for the product owner

1. **Name of the chip.** `university` (recommended) or `exam-prep`? If both are wanted, `exam-prep` would apply to the SAT, ACT, AP, UTBK and Malaysia plans only.
2. **How many of these plans ship?** Eleven is a lot of "University" plans for a catalog of 36. A minimum set that covers both markets is: SAT prep, UTBK-SNBT, Paket C, University application skills, Life readiness (5). ACT, AP, Cambridge, IB-inspired, India and Malaysia are additions for families on those routes.
3. **Second Indonesian plan or translations.** Both Indonesian drafts are new text. Should "University application skills" and "Life readiness" also get Indonesian versions (beasiswa, KTP, SIM, UU Ketenagakerjaan lines)? Issue #18 left translations out of scope.
4. **Dates in plan text.** The drafts say "find the next date on the owner's site" instead of naming dates, so they never go stale. Is that acceptable, or should each plan carry the current cycle's dates and be revised yearly?
5. **Read-aloud and covers for teens.** Quests are "read aloud, with a cover" (GLOSSARY). A 17-year-old doing SAT modules may find the illustrated, read-aloud Quest childish. Should the planner or writer tone this down above a certain age? Out of scope for a Starter Plan change, but these plans will surface it.
6. **IB plan at all?** Since a homeschooler cannot sit the DP, is an "inspired" plan useful, or does it mislead? It is the only draft whose route is closed to the target user.
7. **Stake and Points for timed sections.** A timed practice section is a natural Stake. Should the plans mention Stakes, or stay silent as all existing plans do?
8. **Max age 18 or 19.** See the age note above.
9. **Malaysia.** With Lembaga Peperiksaan unreachable, the SPM lines are the least verified in this file. Ship the Malaysia plan only after someone checks lp.moe.gov.my by hand, or drop it.
10. **TKA for sekolahrumah.** Pusmendik says registered sekolahrumah learners with a NISN may sit TKA, and SNBP needs a TKA score, yet SNPMB says Paket C is SNBT-only. Whether a homeschooler registered through a PKBM could ever enter SNBP is **UNVERIFIED** and probably "no" (SNBP needs a school with an NPSN using the national curriculum). The Paket C plan says SNBT only.

---

## 6. Sources

US (College Board, ACT, Khan Academy)
- [S1] College Board, SAT registration (homeschool code 970000; register yourself): https://satsuite.collegeboard.org/sat/registration/online-registration/registering ; also https://bigfuture.collegeboard.org/help-center/whats-high-school-code-homeschooled-students
- [S2] College Board, SAT structure: https://satsuite.collegeboard.org/sat/whats-on-the-test/structure
- [S3] College Board, Understanding scores: https://satsuite.collegeboard.org/sat/scores/understanding-scores
- [S4] College Board, when to take the SAT: https://satsuite.collegeboard.org/help-center/how-many-times-can-student-take-sat-and-when-should-they-take-it
- [S4a] College Board, SAT dates and deadlines 2026-27: https://satsuite.collegeboard.org/sat/dates-deadlines
- [S4b] College Board, SAT test fees: https://satsuite.collegeboard.org/sat/registration/fees-refunds/test-fees
- [S5] College Board, SAT practice and preparation (Bluebook, Khan Academy): https://satsuite.collegeboard.org/sat/practice-preparation ; Bluebook: https://bluebook.collegeboard.org/students/practice
- [S6] Khan Academy, Official SAT Prep: https://www.khanacademy.org/sat ; College Board on the Khan course: https://satsuite.collegeboard.org/digital/help-center/whats-included-new-digital-sat-practice-course-khan-academy
- [S7] ACT, The ACT: https://www.act.org/content/act/en/products-and-services/the-act.html
- [S7a] ACT, Enhancements (sections, optional Science and Writing): https://www.act.org/content/act/en/products-and-services/the-act/test-changes/enhancements.html
- [S7b] ACT, Understanding your scores: https://www.act.org/content/act/en/products-and-services/the-act/scores/understanding-your-scores.html
- [S8] ACT, Homeschool resources: https://www.act.org/content/act/en/students-and-parents/high-school-success/high-school-resources/homeschool-resources.html
- [S8a] ACT student blog, planning for college as a homeschooled student (code 969-999): https://studentblog.act.org/how-to-plan-for-college-as-a-homeschooled-student
- [S9] ACT, When to take the ACT: https://www.act.org/content/act/en/products-and-services/the-act/scores/when-to-take-the-act.html
- [S9a] ACT, Test dates 2026-27: https://www.act.org/content/act/en/products-and-services/the-act/registration/test-dates.html
- [S9b] ACT, Fees: https://www.act.org/content/act/en/products-and-services/the-act/registration/fees.html
- [S10] ACT, Free ACT test prep: https://www.act.org/content/act/en/products-and-services/the-act/test-preparation/free-act-test-prep.html
- [S11] College Board, What is AP: https://apstudents.collegeboard.org/what-is-ap
- [S11a] College Board, AP course index (42 subjects): https://apstudents.collegeboard.org/course-index-page ; scores 1-5: https://apstudents.collegeboard.org/about-ap-scores
- [S11b] College Board, 2026 exam dates: https://apstudents.collegeboard.org/ap-exams-what-to-know/past-exam-dates/2026
- [S11c] College Board, Digital AP Exams: https://apcentral.collegeboard.org/exam-administration-ordering-scores/digital-ap-exams
- [S11d] College Board, 2027 exam calendar: https://apstudents.collegeboard.org/exam-calendar
- [S12] College Board, I'm homeschooled, how can I take an AP exam: https://apstudents.collegeboard.org/help-center/im-homeschooled-how-can-i-take-ap-exam ; https://apstudents.collegeboard.org/dates/homeschooled-exam-takers-contact-ap-coordinators
- [S12a] College Board (AP coordinators), home-schooled students, ordering deadline 13 Nov 2026: https://apcentral.collegeboard.org/ap-coordinators/exam-ordering-fees/ordering-materials/home-schooled-student
- [S12b] College Board, AP exam fees: https://apstudents.collegeboard.org/exam-policies-guidelines/exam-fees
- [S13] College Board, AP Daily videos for self-study students: https://international.collegeboard.org/help-center/can-i-access-free-ap-daily-videos-self-study-student ; AP Classroom: https://apcentral.collegeboard.org/instructional-resources/ap-classroom/overview

UK and international (Cambridge, IB, UCAS, Singapore, Australia)
- [S14] IB, Diploma Programme (ages 16-19; at authorised schools): https://www.ibo.org/programmes/diploma-programme/ (403 to the fetcher; read in a browser)
- [S14a] IB, DP curriculum: https://www.ibo.org/programmes/diploma-programme/curriculum/
- [S14b] IB, DP passing criteria (45 points, 24 to pass): https://www.ibo.org/about-the-ib/what-it-means-to-be-an-ib-student/recognizing-student-achievement/about-assessment/dp-passing-criteria/
- [S14c] IB, Getting results (May and November sessions): https://www.ibo.org/programmes/diploma-programme/assessment-and-exams/getting-results/
- [S14d] IB, Sample exam papers: https://ibo.org/programmes/diploma-programme/assessment-and-exams/sample-exam-papers/
- [S14e] IB, Pamoja online DP FAQ: https://ibo.org/programmes/diploma-programme/dp-online/pamoja-dp-online-courses/faq/ ; who can offer the DP: https://ibo.org/programmes/diploma-programme/what-is-the-dp/who-can-offer-the-dp/
- [S15] Cambridge International, AS & A Level factsheet (ages 16-19; AS one year, A Level two; series): https://www.cambridgeinternational.org/Images/502996-as-a-level-factsheet-english.pdf
- [S15a] Cambridge International, About us: https://www.cambridgeinternational.org/about-us/
- [S15b] Cambridge International, When can the examination be taken: https://help.cambridgeinternational.org/hc/en-gb/articles/20757119566354-When-can-the-examination-be-taken ; AS & A Level overview (55 subjects): https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-advanced/cambridge-international-as-and-a-levels/
- [S15c] Cambridge International, grades at AS/A Level: https://help.cambridgeinternational.org/hc/en-gb/articles/203476752-Which-grades-are-available-at-AS-A-Level
- [S16] Cambridge International, Cambridge IGCSE (14-16): https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-upper-secondary/cambridge-igcse/
- [S17] Cambridge International, registering as a private candidate: https://help.cambridgeinternational.org/hc/en-gb/articles/203475992-How-do-I-register-for-Cambridge-exams-as-a-private-candidate
- [S17a] Cambridge International, Private candidates: https://cambridgeinternational.org/exam-administration/private-candidates
- [S18] Cambridge International, past papers example (Mathematics 9709): https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-international-as-and-a-level-mathematics-9709/past-papers/
- [S19] British Council, private candidate registration windows: https://internationalschools.britishcouncil.org/students/private-candidates/registration
- [S20] JCQ, Private candidates: https://www.jcq.org.uk/examination-system/private-candidates/
- [S20a] GOV.UK, Ofqual: https://www.gov.uk/government/organisations/ofqual
- [S20b] Pearson Edexcel, Private candidates: https://qualifications.pearson.com/en/support/support-topics/registrations-and-entries/academic-registrations-and-entries/private-candidates.html
- [S21] UCAS, When to apply (2027 entry dates): https://www.ucas.com/undergraduate/applying-university/ucas-undergraduate-when-apply ; 2026 cycle dates: https://www.ucas.com/advisers/guides-and-resources/adviser-news/news/ucas-dates-and-deadlines-2026-cycle
- [S22] UCAS, Writing your personal statement: https://www.ucas.com/applying/applying-university/writing-your-personal-statement
- [S23] UCAS, personal statement for 2026 entry onwards (three questions, 4,000 characters, min 350): https://www.ucas.com/applying/applying-to-university/writing-your-personal-statement/how-to-write-your-personal-statement-for-2026-entry-onwards ; https://www.ucas.com/about-us/news-and-insights/reforming-admissions
- [S24] UCAS, applying as an independent applicant: https://www.ucas.com/connect/blogs/how-to-apply-independent-applicant
- [S25] UCAS, how to get a reference: https://www.ucas.com/applying/applying-university/how-get-ucas-reference ; reference processes: https://www.ucas.com/advisers/writing-references/reference-processes-and-terminology
- [S26] SEAB, About GCE A-Level: https://www.seab.gov.sg/gce-a-level/about-gce-a-level/
- [S26a] MOE Singapore, home-schooled children must meet the PSLE benchmark: https://www.moe.gov.sg/news/parliamentary-replies/20230918-psle ; CE exemptions: https://moe.gov.sg/primary/compulsory-education/exemptions
- [S27] SEAB, Private candidates start here (age 17, subject caps, 2027 details in March 2027): https://www.seab.gov.sg/private-candidate-start-here/
- [S28] SEAB, A-Level syllabuses for private candidates 2026 (specimen papers): https://www.seab.gov.sg/gce-a-level/a-level-syllabuses-examined-for-private-candidates-2026/
- [S28a] SEAB, 2026 A-Level exam calendar: https://file.go.gov.sg/2026-a-level-exam-cal.pdf
- [S28b] SEAB, important dates (results Feb 2027): https://www.seab.gov.sg/important-dates-for-candidates/
- [S28c] SEAB, 2026 private candidate registration e-booklet (window and fees): https://file.go.gov.sg/registration-information-for-private-candidates.pdf
- [S60] UAC, ATAR ("a rank, not a mark", 0.00-99.95): https://www.uac.edu.au/future-applicants/atar
- [S60a] VTAC: https://vtac.edu.au/results-offers/atar-explained.html ; QTAC: https://www.qtac.edu.au/atar/ ; TISC: https://www.tisc.edu.au/static/guide/atar-about.tisc ; SATAC: https://www.satac.edu.au/atar ; NESA: https://www.nsw.gov.au/education-and-training/nesa
- [S61] NSW Government, Guidelines for home schooling in NSW (HSC by self-tuition; Results Notice for ATAR; not eligible for an HSC): https://www.nsw.gov.au/sites/default/files/2022-09/guidelines-for-home-schooling-in-nsw.pdf
- [S62] UAC, Year 12 qualifications (home schooling as non-standard; proof of completion): https://uac.edu.au/future-applicants/admission-criteria/year-12-qualifications
- [S63] UAC, how to get into uni without an ATAR: https://uac.edu.au/media-centre/news/how-to-get-into-uni-without-an-atar ; pathways: https://uac.edu.au/future-applicants/admission-criteria/pathways-to-university

Indonesia (SNPMB, Kemendikdasmen, laws)
- [S29] SNPMB home (Seleksi Nasional Penerimaan Mahasiswa Baru; UTBK = Ujian Tulis Berbasis Komputer; Kemdiktisaintek address; menus): https://snpmb.id/
- [S30] SNPMB, Siaran Pers 08/sipers/snpmb/IX/2025, Peluncuran SNPMB 2026 (SNBP = Seleksi Nasional Berdasarkan Prestasi; SNBT = Seleksi Nasional Berdasarkan Tes; TKA new for SNBP): https://files.snpmb.id/web2026/08_Sipers%20Peluncuran%20SNPMB%20Tahun%202026.pdf ; SNBP general information: https://snpmb.id/snbp/informasi-umum
- [S31] SNPMB, Paparan Informasi SNPMB 2026 untuk Peluncuran (quotas, SNBP rules, SNBT eligibility incl. Paket C and age 25, UTBK components, dates): https://files.snpmb.id/web2026/Paparan%20Informasi%20SNPMB%202026%20untuk%20Peluncuran.pdf (text extracted locally with pdftotext)
- [S31a] SNPMB, UTBK-SNBT general information (eligibility, Rp200.000, programme choices, one sitting): https://snpmb.id/utbk-snbt/informasi-umum
- [S32] SNPMB, Kerangka Acuan UTBK-SNBT 2026 (subtests, questions, minutes; 160 soal, 195 menit): http://snpmb.id/fr
- [S33] SNPMB helpdesk, Paket C graduates in 2026 (SNBT only; 2024-2026; max 25 on 1 July 2026): https://halo.snpmb.id/helpdesk/en/blog/apakah-lulusan-paket-c-masih-bisa-mengikuti-seleksi-masuk-perguruan-tinggi-negeri-tahun-2026
- [S33a] SNPMB helpdesk, SNBT participant requirements (full name; last three years' graduates; Paket C age cap): https://halo.snpmb.id/helpdesk/en/blog/apa-saja-persyaratan-peserta-seleksi-nasional-berdasarkan-tes ; who may join: https://halo.snpmb.id/helpdesk/en/blog/siapa-saja-yang-diperbolehkan-mengikuti-seleksi-nasional-perguruan-tinggi-negeri ; FAQ: https://snpmb.id/faq
- [S34] SNPMB, about SNPMB (panitia formed by Mendiktisaintek with MRPTNI): https://snpmb.id/snpmb
- [S35] SNPMB, Jadwal penting 2026: https://snpmb.id/jadwal-penting
- [S47] Permendikbud Nomor 129 Tahun 2014 tentang Sekolahrumah (Berita Negara 1660/2014): https://peraturan.go.id/files/bn1660-2014.pdf (text extracted locally; Pasal 1, 4, 6, 7, 8, 10-12 read)
- [S48] UU Nomor 20 Tahun 2003 tentang Sistem Pendidikan Nasional, Pasal 26-27 and the Penjelasan of Pasal 26(3): https://peraturan.go.id/files/uu20-2003.pdf (text extracted locally)
- [S49] Pusmendik, Kemendikdasmen, Tes Kemampuan Akademik (FAQ: "asesmen sukarela"; Paket A/B/C and sekolahrumah learners; subjects; once per level; "Ayo Coba TKA" at /tka/simulasi_tka; SMA framework at /tka/kerangka/sma/): https://pusmendik.kemendikdasmen.go.id/tka (TLS certificate failed in WebFetch; fetched with curl -k) ; TKA portal: https://tka.kemendikdasmen.go.id/
- [S50] LPDP, pendaftaran beasiswa (current intake): https://lpdp.kemenkeu.go.id/beasiswa/pendaftaran-beasiswa/
- [S50a] Kemendikdasmen, Beasiswa Pendidikan Indonesia programmes (BIM under S1/D4): https://beasiswa.kemendikdasmen.go.id/program/
- [S50b] Kemendikdasmen, press release on Beasiswa Talenta Indonesia: https://www.kemendikdasmen.go.id/siaran-pers/14770-kemendikdasmen-luncurkan-beasiswa-talenta-indonesia-wujud-ap
- [S56] UU 24/2013 (Adminduk) Pasal 63(1), KTP-el at 17: https://peraturan.go.id/files/uu24-2013bt.pdf
- [S57] Perpol 5/2021 Pasal 8, SIM A/C at 17: https://korlantas.polri.go.id/wp-content/uploads/2021/03/PERPOL-NO-5-TH-2021-TTG-PENERBITAN-DAN-PENANDAAN-SIM.pdf (TLS error; fetched with curl -k)
- [S66] UU 13/2003 (Ketenagakerjaan) Pasal 1(26), 68, 69: https://peraturan.go.id/files/UU+13-2003.pdf
- [S65a] OJK, Sikapi Uangmu: https://sikapiuangmu.ojk.go.id/

Malaysia (MPM, KPM)
- [S36] MPM, Peraturan dan Skema Peperiksaan STPM 2026 (candidate types incl. calon persendirian individu; fees; grading): https://www.mpm.edu.my/images/dokumen/calon-peperiksaan/stpm/Peraturan_dan_skema/Peraturan_dan_Skema_STPM_2026_KEMASKINI_2182026.pdf
- [S36a] MPM, STPM 2027 registration circular: https://www.mpm.edu.my/images/dokumen/calon-peperiksaan/stpm/STPM_D1_STPM_2026_EDISI_5_JUN_2026.pdf
- [S36b] MPM, STPM syllabi: https://www.mpm.edu.my/stpm/sukatan-peperiksaan
- [S37] MPM, MUET components: https://www.mpm.edu.my/muet/komponen-ujian-muet
- [S37a] MPM, MUET band descriptions (CEFR-aligned): https://www.mpm.edu.my/images/dokumen/calon-peperiksaan/muet/BAND_DESCRIPTION.pdf
- [S37b] MPM, MUET 2026 calendar: https://www.mpm.edu.my/images/dokumen/kalendar/2026/Kalendar_MUET_Tahun_2026_-_Edisi__BM_kemaskini_25_Feb_2026.pdf
- [S37c] MPM, MUET fees: https://www.mpm.edu.my/muet/kadar-bayaran-ujian
- [S37d] MPM, MUET eligibility ("Tiada sebarang syarat"): https://www.mpm.edu.my/muet/syarat-kelayakan-dan-tempoh-sah-laku
- [S38] MPM, MUET regulations, test specifications and sample questions: https://www.mpm.edu.my/muet/regulations-test-specifications-test-format-and-sample-questions
- [S39] RTM (KPM statement), SPM 2026 dates: https://berita.rtm.gov.my/nasional/senarai-berita-nasional/senarai-artikel/spm-2026-bermula-26-oktober-ini/
- [S39a] RTM (Higher Education Minister), BM and Sejarah compulsory for IPTA: https://berita.rtm.gov.my/nasional/senarai-berita-nasional/senarai-artikel/bahasa-melayu-sejarah-kekal-syarat-wajib-masuk-ipta/
- [S39b] KPM written reply to Dewan Rakyat, 2019, on home schooling (mirror): https://pardocs.sinarproject.org/documents/2019-march-april-parliamentary-session/written-replies-soalan-bertulis/p14p2m1-soalan-bukanlisan-134.pdf
- Not reachable: https://lp.moe.gov.my (connection refused), https://sppat.moe.gov.my (403), https://www.moe.gov.my (403)

India (NTA, NIOS, IIT)
- [S40] NTA, CUET (UG) 2026 Information Bulletin: https://cdnbbsr.s3waas.gov.in/s3d1a21da7bca4abff8b0b61b87597de73/uploads/2026/01/202601031633478370.pdf ; portal: https://cuet.nta.nic.in/
- [S41] NIOS, Academic Prospectus 2026-27 (ages, blocks, fees): https://dq4kzxd7fbbni.cloudfront.net/static/dist/images/pdf/academic_prospectus/Academic_Prospectus_2026-27.pdf ; admission portal: https://sdmis.nios.ac.in/
- [S41a] NIOS regional centre, On Demand Examination: https://rcjaipur.nios.ac.in/registration-for-on-demand-examination-ode-and-procedure.html
- [S42] NTA, JEE (Main) 2026 Information Bulletin: https://cdnbbsr.s3waas.gov.in/s3f8e59f4b2fe7c5705bf878bbd494ccdf/uploads/2025/11/202511021649722475.pdf
- [S43] JEE Advanced 2026, eligibility: https://jeeadv.ac.in/eligibility.html ; Information Brochure: https://jeeadv.ac.in/documents/IBEnglish_2026.pdf
- [S43a] JEE Advanced practice tests (linked from jeeadv.ac.in): https://cdn3.digialm.com//OnlineAssessment/index.html?32044@@M217
- [S44] NTA, NEET (UG) 2026 Information Bulletin: https://cdnbbsr.s3waas.gov.in/s37bc1ec1d9c3426357e69acd5bf320061/uploads/2026/02/202602231394640855.pdf
- [S45] NTA, Test Practice Centre (mock tests): https://www.nta.ac.in/Quiz

Application skills, scholarships and life readiness
- [S51] University of the Arts London, portfolio advice: https://www.arts.ac.uk/study-at-ual/apply/portfolio-advice
- [S52] Common App, essay prompts 2026-27: https://www.commonapp.org/apply/essay-prompts ; what's new 2026-27: https://www.commonapp.org/files/webinar_decks/Whats-New-with-Common-App-First-Year-2026-2027.pdf
- [S53] Common App support, home school supervisor as counselor: https://appsupport.commonapp.org/applicantsupport/s/article/How-does-a-home-school-supervisor-complete-information-about-a-home-schooled-applicant
- [S54] University of Oxford, Interviews: https://www.ox.ac.uk/admissions/undergraduate/applying/guide-for-applicants/interviews
- [S55] University of Cambridge, Interviews: https://www.undergraduate.study.cam.ac.uk/applying/interviews
- [S58] GOV.UK, Learning to drive: https://www.gov.uk/driving-lessons-learning-to-drive
- [S58a] California DMV, Teen drivers: https://www.dmv.ca.gov/portal/teen-drivers/
- [S59] Federal Student Aid, FAFSA: https://studentaid.gov/h/apply-for-aid/fafsa ; 2027-28 form: https://studentaid.gov/sites/default/files/2027-28-fafsa-form.pdf ; GOV.UK Student finance: https://www.gov.uk/student-finance
- [S59a] Study in Japan, MEXT undergraduate scholarship: https://www.studyinjapan.go.jp/en/smap-stopj-applications-undergraduate.html ; 2027 guidelines: https://www.studyinjapan.go.jp/en/_mt/2026/04/2027_Guidelines_Undergraduate_E.pdf
- [S59b] NUS, ASEAN Undergraduate Scholarship: https://nus.edu.sg/oam/scholarships/scholarships-for-freshmen-singapore-permanent-residents/asean-undergraduate-scholarship
- [S64] The Learning Scientists, six strategies: https://www.learningscientists.org/downloadable-materials ; UNC Learning Center, Studying 101: https://learningcenter.unc.edu/tips-and-tools/studying-101-study-smarter-not-harder/
- [S65] CFPB, Money as You Grow, teens to young adults: https://www.consumerfinance.gov/consumer-tools/money-as-you-grow/teen-young-adult/
- [S67] US Department of Labor, Fact Sheet 43, child labor (non-agriculture): https://www.dol.gov/agencies/whd/fact-sheets/43-child-labor-non-agriculture
- [S67a] GOV.UK, Child employment: https://www.gov.uk/child-employment
- [S68] CDC, About sleep (8-10 h for 13-17): https://www.cdc.gov/sleep/about/index.html
