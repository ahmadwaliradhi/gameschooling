# Pedagogical and Game-Design Foundations for GameSchooling

Scope: curriculum/worldview taxonomy and how to encode it as LLM-targetable competency profiles; evidence on gamification for children (what works, what backfires); safe design of points/rewards/penalties/leaderboards inside families; age-band interaction guidance; verifiable LLM grading; child-safety constraints; family-bond mechanics. Ends with an explicit "seed now vs. later" split for a ~36-hour MVP.

Evidence-quality legend used throughout: [strong] = peer-reviewed meta-analysis or primary regulation; [moderate] = single peer-reviewed study or official body guidance; [weak] = vendor, blog, secondary summary, or my own design inference.

---

## Key Question 1: Curriculum / approach / worldview taxonomy, and how to encode each as a structured "competency profile"

### Takeaway
Every approach parents might choose can be reduced to the same six-field profile (philosophy, subjects/strands, progression unit, assessment style, lesson "grammar", and worldview constraints), which is what an LLM needs to generate on-target lessons. Only a few sources (Cambridge, Common Core via CASE, CEFR, Kurikulum Merdeka phases) have machine-readable or coded objectives; most pedagogies (Montessori, Charlotte Mason, Classical, Waldorf, Reggio, unschooling, religious tracks) must be hand-encoded as principles + lesson templates.

### Cited Findings

**Open / machine-readable standards**
- 1EdTech CASE is an open, machine-readable format for competency frameworks, defining data models for frameworks, documents, definitions, associations, rubrics, rubric criteria and criterion levels; REST/JSON with OpenAPI, optional JSON-LD — [1EdTech CASE spec](https://standards.1edtech.org/case/specifications/standards/v1p1/im); [CASE REST binding](https://standards.1edtech.org/case/specifications/standards/v1p1/rest)
- CASE Network 2 is a single open repository of K-12 state and national standards, browseable without sign-in; API and bulk download require registration (free for educational institutions and non-commercial entities; nominal fee for edtech suppliers) — [1EdTech CASE Network 2](https://1edtech.org/program/casenetwork2) [strong: primary]
- A community dataset of Common Core math standards (descriptions + metadata from Achieve the Core) exists as JSONL on Hugging Face (allenai/achieve-the-core); math only, not CASE format — [Hugging Face dataset README](https://huggingface.co/datasets/allenai/achieve-the-core/blob/06a0a3980e618f21ade4ab31a11a6d0579af6a52/README.md) [moderate]
- Cambridge Primary Mathematics 0096 (first taught Sept 2021) organises Stages 1–6 around strands (Number, Geometry and Measure, Statistics and Probability) and uses learning-objective codes of the form stage + strand letters + two-digit number, e.g. 2Ni.01 (read/write whole numbers 0–100), 2Nc.05 (even/odd), 6Np.01 (place value of decimals) — [Cambridge 0096 framework PDF mirror](https://josefs-international.squarespace.com/s/Cambridge-Primary-Mathematics-Curriculum-Framework-0096_tcm142-592530.pdf); code examples from publisher materials [moderate; official PDF is on cambridgeinternational.org]
- Cambridge Pathway: Primary (~5–11), Lower Secondary (~11–14, optional Checkpoint tests in English, maths, science and from 2024 Global Perspectives), Upper Secondary (~14–16, IGCSE or O Level), Advanced (~16–19, AS & A Level); stages can be offered independently — [International School Search](https://internationalschoolsearch.com/cambridge-primary-secondary-and-advanced-the-cambridge-pathway); [Cambridge Lower Secondary brochure](https://WWW.CAMBRIDGEINTERNATIONAL.ORG/Images/607719-cambridge-lower-secondary-brochure.pdf) [moderate]
- OpenStax books are CC BY-NC-SA; commercial reuse requires permission via a content reuse form — [OpenStax licensing](https://help.openstax.org/s/article/Licensing-information-of-OpenStax-textbooks); [OpenStax commercial use](https://help.openstax.org/s/article/Commercial-use-under-the-Creative-Commons-License) [strong: primary]
- Khan Academy terms: copying/distributing allowed only for non-commercial research/teaching/learning purposes; some courses under CC non-commercial — [Khan Academy support thread](https://support.khanacademy.org/hc/vi/community/posts/360043686052/comments/360005644171) [moderate]
- CK-12 sources conflict: its help center says content is "entirely copyright-free", while an older announcement says it moved to a non-commercial share-alike license — [CK-12 help](https://help.ck12.org/hc/en-us/articles/200344445-Will-Materials-from-Major-Publishers-Be-Available-on-CK-12); contradicted by [Tech & Learning](https://www.techlearning.com/news/open-source-provider-updates-license) [weak; verify current CK-12 terms]
- CEFR: Council of Europe young-learner ELP guidance splits the first three levels into A1.1/A1.2, A2.1/A2.2, B1.1/B1.2 with age-appropriate "I can" statements; says generic checklists for young learners are not possible due to context variability — [Council of Europe ELP young learners](https://rm.coe.int/16804932bd) [strong: primary]
- Council of Europe 2022 collation of validated young-learner descriptors checked against the 2017 CEFR Companion Volume for age bands 7–10 and 11–15 — [Council of Europe collation](https://rm.coe.int/the-collation-of-validated-portfolio-descriptors-for-young-learners-go/1680788b28) [strong]
- Pearson GSE Learning Objectives for Young Learners cover ages 6–14 from below A1 to high B1; authors argue the CEFR was written for adults and is less appropriate for the youngest learners — [Springer chapter](https://springerlink.bibliotecabuap.elogim.com/chapter/10.1007/978-3-319-22422-0_3) [moderate]

**Indonesian Kurikulum Merdeka**
- Phases (fase) map to grades: Fondasi (PAUD), A (SD 1–2), B (SD 3–4), C (SD 5–6), D (SMP 7–9), E (SMA 10), F (SMA 11–12); Capaian Pembelajaran (CP, learning outcomes) are written per phase, not per grade — [Quipper guide](https://www.quipper.com/id/blog/info-guru/fase-kurikulum-merdeka/) [moderate; official source is BSKAP/Kemendikbudristek decrees]
- For special schools (SLB) phases are tied to mental age rather than grade — [Google Docs teacher aid](https://docs.google.com/document/d/1udelIlt-7fAOfE0Hn3rXNW7JS3E1RwtE/export?format=pdf) [weak]
- A 2025 BSKAP document states Informatika is not set for Fase A–C; computational thinking/digital literacy are integrated into other subjects — [search summary of BSKAP Informatika doc](https://www.quipper.com/id/blog/info-guru/fase-kurikulum-merdeka/) [weak; not fetched directly]

**Singapore Math**
- CPA (Concrete–Pictorial–Abstract) sequence traced to Bruner (1966); not every lesson uses all three stages; bar models extend the pictorial stage and stretch from Grade 1 part-whole addition to fractions, ratios and percentages; spiral curriculum — [Singapore Math Inc.](https://singaporemath.com/pages/what-is-singapore-math); [Structural Learning guide](https://www.structural-learning.com/post/singapore-math); [Bhanzu](https://bhanzu.com/parents/what-is-singapore-math) [weak–moderate; secondary/commercial]
- Ng & Lee (2009) describe bar-model use as moving through 3 phases (phases not stated in snippet) — [OISE document](https://www.oise.utoronto.ca/site/document/2085) [moderate; unverified detail]

**Cambridge / IB / Common Core**
- IB PYP (ages 3–12) is organised around six transdisciplinary themes explored through units of inquiry; schools pick local topics; subject areas: language, mathematics, science, social studies, arts, PSPE — [IBO: how the PYP works](https://ibo.org/programmes/primary-years-programme/how-the-pyp-works/); [PYP brochure](https://ibo.org/globalassets/new-structure/brochures-and-infographics/pdfs/pyp-programme-brochure-en.pdf) [strong]
- IB MYP (ages 11–16): eight subject groups (language & literature, language acquisition, individuals & societies, sciences, mathematics, arts, PHE, design), at least 50 hours/yr each; global contexts run through subjects rather than as separate courses — [Wikipedia MYP](https://EN.wikipedia.com/wiki/MYP); [IB overview PDF](https://www.scoe.net/media/u5op1jvx/ib_programmes.pdf) [moderate]
- Common Core covers ELA/literacy and mathematics K-12 and can be represented in CASE — [1EdTech CASE](https://www.imsglobal.org/CASE) [strong]

**Montessori**
- Four planes of development: 0–6, 6–12, 12–18, 18–24, each split into two sub-planes (0–3/3–6, etc.), which is the basis of multi-age classrooms; Primary = 3–6, Elementary = 6–12 — [AMI glossary](https://archives.montessori-ami.org/help/glossary/four-planes-development); [AMI blog 2024](https://montessori-ami.org/node/6956); [Cornerstone Montessori](https://cornerstonemontessori.schoolinsites.com/planesofdevelopment) [strong for planes]

**Charlotte Mason**
- Core practices: living books instead of textbooks, narration as the main demonstration of understanding (oral early, written ~age 10+), copywork, nature study, short lessons (~15–20 min in early grades, lengthening with age), "quality over quantity" — [AmblesideOnline FAQ](https://amblesideOnline.org/files/AmblesideOnlineFAQ.pdf); [Chudson intro](https://chudson9.substack.com/p/an-introduction-to-charlotte-mason); [Homeschool Fox](https://homeschoolfox.com/charlotte-mason-homeschooling) [moderate for AO; weak for blogs]
- AmblesideOnline is a free K-12 Charlotte Mason curriculum with schedules and book lists; explicitly Christian; Mason's six volumes are free on the AO site — [AmblesideOnline](https://amblesideonline.org/faq) [strong: primary]

**Classical (Trivium)**
- The Well-Trained Mind (Bauer & Wise) structures K-12 as Grammar stage (K–4: facts, memorisation), Logic stage (5–8: analysis, argument), Rhetoric stage (9–12: expression in speech and writing); stages cumulative; 5th edition 2024 — [Cathy Duffy review](https://www.cathyduffyreviews.com/homeschool-extras/parent-helps-and-how-to-books/general-parent-helps/the-welltrained-mind-fourth-edition-2016); [Penguin Random House](https://penguinrandomhouse.ca/books/400294/the-well-trained-mind-by-susanwise-bauer) [moderate]

**Waldorf / Reggio / Finnish**
- Waldorf: ~2-hour morning "main lesson" blocks on one subject for several weeks, no textbooks, student-made main lesson books, ~8–10 subjects/yr in grades 1–8, spiral revisiting — [Wikipedia: Curriculum of the Waldorf schools](https://en.wikipedia.org/wiki/Curriculum_of_the_Waldorf_schools); [Washington Waldorf](https://www.washingtonwaldorf.org/inspiring-and-challenging-students-with-single-subject-lesson-blocks/) [moderate]
- Reggio Emilia: no predetermined curriculum; teachers observe children's interests and build projects; hands-on, play-based, co-learning — [HEI Schools comparison](https://www.heischools.com/operate/finnish_vs_traditionaleducation?hsLang=en) [weak; need Reggio Children primary]
- Finnish: phenomenon-based (topic-based, interdisciplinary) learning in the 2016 National Core Curriculum; seven transversal competences — [eTwinning NCF slides](https://twinspace.etwinning.net/files/collabspace/9/59/359/91359/files/cf129614c.pdf); [Educational Reference 2024](https://search.napstic.cn/literature/periodical/010jyck202408010) [moderate/weak]

**Kumon**
- Math program runs sequentially from Level 7A (counting to 10) through Level O (advanced high-school); international version described as 20 levels from 6A to O plus five electives, 4,420 double-sided worksheets; advancement by mastery, not age — [Kumon levels blog](https://latoyahill.blogspot.com/2021/10/what-are-levels-of-kumon.html); [Kumon Kanata North](https://kumonkanatanorth.blogspot.com/2013/03) [weak; verify on kumon.com]

**Islamic education**
- Safar curriculum has four syllabuses: Quran reading (Qa'idah), Islamic knowledge ("Learn about Islam" textbooks Levels 1–8 with workbooks and teacher guides), spiritual development, Arabic; marketed for classroom and home — [Noorart Safar collection](https://noorart.com/collections/safar-islamic-studies); [Furqaan Bookstore L1](https://furqaanbookstore.com/safar-publications-textbook-1-islamic-studies-series) [weak–moderate; vendor]
- Hifz programs commonly stage memorisation by juz starting with Juz 30 (Juz 'Amma) then 29, 28; checkpoints at 5/10/15 juz; full Quran ~3–7 years; tahsin (recitation correction per tajwid) as a prerequisite for tahfizh; exams per juz plus mid/final; at least 3 revision cycles — [Al Muhammadi Academy](https://almuhammadiacademy.com/?p=5139); [Quran Sheikh](https://www.quransheikh.com/courses/hifz-classes-for-kids/); [Salam Foundation](https://www.salamfoundation.us/academics/quran-hifz); [UIN Antasari thesis (Indonesian)](https://idr.uin-antasari.ac.id/16922/7/BAB%20IV.pdf) [weak except the academic paper]

### Inferences

**Universal competency-profile schema (design proposal, LLM-targetable).** Every approach above fits this shape; the LLM prompt is built by serialising it:

```json
{
  "profile_id": "singapore_math_p3",
  "approach": "Singapore Math",
  "worldview": {"religion": null, "values_emphasis": [], "forbidden_topics": [], "language": "en"},
  "age_band": "upper_primary", "stage_label": "Primary 3",
  "subjects": [{"name": "Mathematics", "strands": ["Number", "Measurement", "Geometry", "Statistics"]}],
  "progression_unit": "topic -> CPA cycle -> mastery check",
  "pedagogy_rules": ["Always start concrete (objects/manipulatives photo), then pictorial (bar model), then abstract (equation)",
                     "One new idea per lesson", "Word problems use bar models"],
  "assessment_style": {"type": "mastery", "threshold": 0.8, "formats": ["worked_problem_photo", "multiple_choice", "voice_explain"]},
  "lesson_grammar": {"duration_min": 15, "segments": ["warmup_retrieval", "concrete", "pictorial", "abstract", "exit_ticket"]},
  "competency_codes": [{"code": "3Nc.02", "source": "cambridge_0096", "text": "..."}],
  "sources": ["..."]
}
```

**Per-approach encoding (principles / progression unit / assessment style / 2–3 lesson exemplars).** Exemplars are my design proposals consistent with the cited principles, not sourced lesson plans.

| Approach | Core principles to put in prompt | Progression unit | Assessment style | Lesson exemplars (for prompt testing) |
|---|---|---|---|---|
| Singapore Math | CPA; bar models; one concept at a time; spiral | Topic -> CPA cycle | Mastery on word problems w/ shown model | (a) "Photograph 12 blocks split into 3 equal groups, then draw the bar model, then write 12÷3"; (b) "Fraction of a set with bar model"; (c) "Two-step ratio word problem; upload drawn bar model" |
| Cambridge Primary/Lower Sec | Strand-coded objectives; checkpoint-style questions | Stage -> strand -> objective code | Checkpoint-like mixed test, % score | (a) 2Ni.01 read/write numbers to 100 (voice reading); (b) 6Np.01 decimal place value quiz; (c) Science: fair-test design via photo of home experiment |
| Common Core | Domain -> cluster -> standard IDs; practice standards | Grade -> domain -> standard | Standards-aligned items, mastery per standard | (a) 3.OA.A.1 equal-groups photo mission; (b) RL.4.2 summarise a story via voice narration; (c) 6.RP.A.3 real-world ratio mission (recipe) |
| IB PYP/MYP | Inquiry; transdisciplinary themes; learner profile; concept-driven | Unit of inquiry (6–8 weeks) | Rubric/criterion-based, reflection | (a) "Who we are": family interview mission; (b) "How the world works": weather log photo; (c) MYP Design cycle mini-project |
| Montessori | Child-led choice from prepared environment; concrete materials; planes of development; no extrinsic rewards (see Q2) | Work cycle; presentation -> practice -> mastery | Observation, self-correction; no grades | (a) Practical life: pour water photo mission; (b) Sandpaper-letter sound hunt (voice); (c) Elementary: "Great Lesson" story + follow-up research |
| Charlotte Mason | Living books; narration; short lessons; nature study; habit training | Term (12 wks) of books; daily short lessons | Narration (oral -> written); no tests early | (a) Read passage aloud, child narrates back by voice; (b) Nature journal photo + 3-sentence narration; (c) Copywork photo graded for accuracy |
| Classical (Trivium) | Grammar (memorise) -> Logic (argue) -> Rhetoric (express) | Stage -> 4-year history cycle | Recitation, logic exercises, essays/debate | (a) Grammar: timeline chant recitation (voice); (b) Logic: spot the fallacy; (c) Rhetoric: 3-minute persuasive speech upload |
| Waldorf | Main-lesson blocks; arts-integrated; no screens early (tension with this product) | 3–4 week block | Main-lesson book review, no tests | (a) Form drawing photo; (b) Block story retell; (c) Handwork progress photo |
| Reggio Emilia | Emergent, project-based; documentation; "100 languages" | Project | Documentation/portfolio | (a) Child-chosen question -> investigation plan; (b) Build-and-photograph; (c) Group project with sibling |
| Unschooling | Interest-led; no imposed curriculum | Interest thread | Reflection only | Lessons must be opt-in "quests" generated from child's stated interest |
| Finnish | Phenomenon-based; transversal competences; low testing | Phenomenon module | Self/peer assessment | (a) "Water" cross-subject module; (b) Transversal competence reflection |
| Kumon | Small-step worksheets; daily repetition; mastery before advancing | Level (7A–O) -> worksheet set | Timed accuracy (speed + accuracy) | (a) 10 timed addition facts via photo of worksheet; (b) Level test gating |
| Kurikulum Merdeka | CP per fase; Profil Pelajar Pancasila; project-based P5 | Fase -> CP -> TP (tujuan pembelajaran) | Formative + summative; projects | (a) Fase A Bahasa Indonesia reading aloud (voice); (b) Fase B numeracy; (c) P5 project (e.g., local food) |
| Islamic (hifz/tajwid/aqidah/fiqh/sirah) | Juz-staged memorisation; tahsin before tahfizh; revision cycles; aqidah/fiqh/sirah as graded knowledge (Safar L1–8) | Juz / surah; textbook level | Recitation check (voice), oral Q&A, per-juz exam | (a) Recite Al-Fatiha, voice graded for tajwid by parent/teacher override; (b) Sirah event sequencing quiz; (c) Fiqh: wudu steps photo/video |
| Christian (Bible curricula) | Scripture memory; catechism; character | Book/unit | Memory verse recitation, discussion | (a) Verse recitation (voice); (b) Parable retell |
| Jewish / Hindu / Buddhist | Not researched in this pass (see Gaps) | | | |
| Language (CEFR) | Can-do descriptors; sub-levels A1.1 etc. for kids | CEFR sub-level -> can-do | Can-do checklist, voice tasks | (a) A1.1 "I can greet" voice roleplay; (b) A2 picture description |
| University prep (SAT/ACT/A-Level/IB/Olympiad) | Spec-coded syllabus; timed practice; past papers | Topic -> past-paper set | Timed, scored, percentile | (a) SAT reading timed set; (b) Olympiad problem with written proof photo |
| Life skills / financial literacy | Real-world missions; parent-verified | Skill badge | Parent verification photo/video | (a) Budget a family shop; (b) Cook a meal; (c) Compare two savings options |

- The LLM should receive, per lesson request: profile JSON + age-band interaction rules (Q4) + assessment contract (Q5) + safety constraints (Q6). Keep worldview constraints as explicit allow/deny lists so one model can serve a Montessori-secular and an Islamic-classical family without cross-contamination.
- Machine-readable seeding order (fastest first): Cambridge 0096 code lists (PDF, scrapable) -> allenai Common Core math JSONL -> CEFR young-learner descriptors (Council of Europe PDFs) -> CASE Network registration (free for non-commercial) for everything else. OpenStax/Khan/CK-12 are non-commercial-only or ambiguous; do not embed their content in a commercial product without permission.

### Gaps
- No official Common Core CASE JSON located on GitHub; CASE Network download requires registration.
- Could not fetch the official Cambridge 0096 PDF; code pattern inferred from publisher materials.
- Jewish, Hindu, Buddhist curricula and the UK National Curriculum attainment structure were not searched in this pass.
- Reggio Emilia primary sources (Reggio Children) not retrieved; Finnish National Core Curriculum text not retrieved.
- No published age chart per Safar level; hifz staging varies by provider with no standard scholarly curriculum found.
- Montessori AMI curriculum-area list (practical life, sensorial, language, maths, culture) is general knowledge, not confirmed by the retrieved sources.

---

## Key Question 2: Gamification science — what works, what backfires, with ages

### Takeaway
Gamification yields small-to-medium learning gains on average (g ≈ 0.25–0.5) but heterogeneity is high; the mechanisms with real evidence are competence feedback, autonomy, relatedness, retrieval practice, spacing and mastery learning. Expected tangible rewards reliably undermine intrinsic motivation for already-interesting tasks (strong evidence, including preschoolers), so points should be tied to effort/mastery on tasks the child would not otherwise do, paired with praise, and faded.

### Cited Findings

**Meta-analyses**
- Sailer & Homner (2020), Educational Psychology Review 32:77–112: gamification had significant small effects; one outcome reported as g = .25 [0.04, 0.46], k = 9, N = 951 (outcome type not identified in snippet); secondary summary reports g = .49 for cognitive outcomes (k = 19, N = 1,686); inclusion of game fiction and social interaction were significant moderators for behavioural outcomes; authors flag poor methodological rigour of primary studies — [Augsburg repository](https://opus.bibliothek.uni-augsburg.de/opus4/frontdoor/index/index/docId/109056); [eLearning Industry summary](https://elearningindustry.com/gamification-works-just-not-the-way-most-courses-use-it) [strong, but I could not open full text; exact per-outcome figures unverified]
- Huang et al. (2020), ETR&D 68:1875–1901: 30 studies, 3,083 participants; pooled g = .464 [.244, .684] favouring gamification — [search summary citing ETR&D](https://springerlink.bibliotecabuap.elogim.com/content/pdf/10.1007/s11423-020-09807-z.pdf) [strong]
- Bai, Hew & Huang (2020): 30 interventions, 3,202 participants; learners enjoyed gamification for feedback and recognition, disliked it when it added no utility or caused anxiety or jealousy — [ECNU record](https://pure.ecnu.edu.cn/en/publications/the-impact-of-gamification-in-educational-settings-on-student-lea/) [strong]
- Dehghanzadeh et al. (2023) K-12 systematic review (2008–2021): gamification can enhance K-12 learning but some studies show neutral or negative effects — [University of Twente](https://research.utwente.nl/en/publications/using-gamification-to-support-learning-in-k-12-education-a-system/) [strong]

**Self-Determination Theory in games**
- Ryan, Rigby & Przybylski (2006), Motivation and Emotion 30:347–363: across four studies, in-game autonomy and competence predicted enjoyment, preference and well-being changes; autonomy, competence and relatedness independently predicted enjoyment and future play — [Rochester PDF](https://www.rochester.edu/warner/lida/wp-content/uploads/2022/11/02bfe513dd59366750000000.pdf) [strong]
- PENS questionnaire is proprietary (Immersyve); validation partially supported, competence and intuitive controls loaded together (Johnson, Gardner & Perry 2018) — [game-evaluation PENS page](https://game-evaluation.github.io/questionnaires/repository/pens.html) [moderate]

**Overjustification / rewards**
- Deci, Koestner & Ryan (1999), Psychological Bulletin 125:627–668: meta-analysis of 128 experiments; tangible rewards have a substantial undermining effect on intrinsic motivation; verbal rewards (praise) tested as a separate hypothesis; rebuts Cameron & Pierce (1994) — [UW PDF](https://depts.washington.edu/techdocs/papers/deciExtrinsicRewardsAndIntrinsicMotivation99.pdf); [2001 follow-up](https://www.selfdeterminationtheory.org/SDT/documents/2001_DeciKoestnerRyan.pdf) [strong; note the debate with Cameron & Pierce is unresolved in some quarters — [ScholarHub summary](https://scholarhub.vn/publication/:slug/9460423c-1ed9-4760-995d-5dd57e6628aa)]
- Lepper, Greene & Nisbett (1973), JPSP 28:129–137: preschoolers who already liked drawing and were promised a reward drew less in later free play; unexpected rewards did not cause the decrement — [Structural Learning summary](https://www.structural-learning.com/post/overjustification-effect); [SFU review](https://journals.lib.sfu.ca/index.php/sfuer/article/download/371/242/1037) [strong for the original; sample sizes differ across secondary sources (51 vs 69)]
- Octalysis (Chou): 8 core drives; "Black Hat" drives (Scarcity, Unpredictability, Loss & Avoidance) create urgency and can leave users anxious or drained; "Left Brain" drives (Accomplishment, Ownership, Scarcity) are extrinsic; Chou himself notes extrinsic rewards can reduce motivation once removed — [Yu-kai Chou](https://yukaichou.com/gamification-examples/octalysis-complete-gamification-framework/) [weak: practitioner framework, no independent validation]
- Bartle types (Achiever/Explorer/Socializer/Killer) came from adult MUD players; no peer-reviewed evidence found for children; Hexad typology noted as not reflecting learners' motivations — [Chou on Bartle](https://yukaichou.com/gamification-analysis/bartles-player-types-gamification/); [Springer 2020](https://link.springer.com/10.1186/s41239-020-00231-0) [weak for children]

**Learning science**
- Dunlosky et al. (2013): only practice testing and distributed practice rated high utility; rereading/highlighting low — [Frontiers meta-analysis of ten techniques](https://www.frontiersin.org/articles/10.3389/feduc.2021.581216/full) [strong]
- Donoghue & Hattie (2021) report distributed practice d = 0.85 and practice testing d = 0.74 — [Structural Learning](https://www.structural-learning.com/blogcategories/revision) [weak relay; verify]
- Latimier, Peyre & Ramus (2021): spaced retrieval beats massed retrieval g = 0.74 across 29 studies — [Springer](https://link.springer.com/10.1007/s10648-021-09595-9) [strong]
- Classroom retrieval-practice review: 57% of classroom experiments showed medium or large benefits across education levels — [NSF PAR](https://par.nsf.gov/servlets/purl/10518320) [strong]
- Mastery learning: Kulik, Kulik & Bangert-Drowns (1990) meta-analysis of 108 controlled evaluations, mean ES 0.52 SD in upper elementary through college; large heterogeneity — [Academia.edu record](https://www.academia.edu/81783373/Effectiveness_of_Mastery_Learning_Programs_A_Meta_Analysis); [Slavin 1987 critique](https://Www.Gwern.net/doc/psychology/1987-slavin.pdf) [strong]

**Product evidence**
- Duolingo: learners reaching a 7-day streak are 3.6× more likely to complete their course; post-streak milestone animation raised D7 retention of new learners by +1.7%; allowing two equipped Streak Freezes raised DAU by +0.38%; Duolingo frames streak pull as loss aversion and cites habit research; Freeze refill shown at 400 gems — [Duolingo blog](https://blog.duolingo.com/how-duolingo-streak-builds-habit/) [moderate: vendor-reported, but first-party A/B figures]
- Critics note streak evidence concerns engagement/retention, not lasting behaviour change, and that loss aversion motivates protecting what you have rather than pursuing what you want — [Duolingo case study](https://prasanna1377.github.io/Duolingo-case-study/) [weak]
- Prodigy: company-published retrospective efficacy reports (PA 3,600+ students, FL 3,700+, TX 16,989 grade-3 students) show users outpacing state averages; Council Bluffs partner study: each extra hour of question-answering associated with +0.73 scale-score points; ESSA Tier 3; no independent RCT found — [Prodigy research](https://www.prodigygame.com/research); [Council Bluffs](https://prodigygame.com/es/blog/council-bluffs) [weak: vendor, correlational]
- ClassDojo: systematic review of classroom-behaviour apps found mixed effectiveness evidence; 2021 conference paper found no demonstrated learning-outcome benefit; critics (Manolev) argue public point displays shame students and reduce behaviour to a number — [Springer review](https://link.springer.com/content/pdf/10.1007/s43494-024-00122-3.pdf); [IFIP 2021](https://dl.ifip.org/hal-04144386v1); [EducationHQ](https://educationhq.com/news/classdojo-harms-teachers-behaviour-management-approach-researcher-188825/) [moderate]
- Classcraft: Montana State thesis (2019) found increased time-on-task and perceived engagement but motivation unchanged and no summative learning difference; Italian 2025 multi-case study ties engagement to extrinsic motivation — [Montana State](https://scholarworks.montana.edu/handle/1/15692); [FORM@RE 2025](https://oaj.fupress.net/index.php/formare/article/download/17543/14171/84632) [moderate; small]

**Leaderboards & competition**
- 2021 IEEE study: most students preferred relative over absolute leaderboards; relative boards imposed less peer pressure; 2025 online-course study: relative-leaderboard group had higher engagement and performance, while middle/bottom-ranked students under absolute boards reported increasing peer pressure — [HKU 2021](https://hub.hku.hk/handle/10722/307985); [HKU 2025](https://hub.hku.hk/bitstream/10722/368255/1/content.pdf) [moderate]
- Even on relative boards, top-third learners outperformed middle/bottom — [EdUHK](https://repository.eduhk.hk/en/publications/examining-effects-of-different-leaderboards-on-students-learning-/) [moderate]
- Competitive context produced lower learning gains than individualistic context in an e-learning game (Zaphiris 2007); 7- and 9-year-old girls benefited most from solo play, least from competitive; cooperative best for older/more able — [Zaphiris 2007](https://ktisis.cut.ac.cy/bitstream/20.500.14279/1781/6/Zaphiris2007-Individualistic_versus_competitive_game-based_e-learning.pdf); [USC Minerva](https://minerva.usc.gal/bitstreams/3b44904c-f2bf-4e18-8c84-86314d9558a4/download) [moderate; single studies]
- PE study (5th–6th grade): cooperative games raised intrinsic motivation; competitive games lowered it — [Murdoch](https://researchportal.murdoch.edu.au/esploro/outputs/conferencePaper/The-myth-of-cooperative-learning-and/991005542704007891) [moderate]
- Small meta-analysis (4 studies): collaborative GBL > individual, corrected ES 0.133; inconclusive vs competitive — [Georgia Tech](https://repository.gatech.edu/entities/publication/ac1d6cd1-d06b-441a-ad97-2bceb2bde83c) [weak]

**Token economies (behavioural parenting)**
- Vanderbilt TRIAD tip sheets: deliver tokens immediately; fade by shortening the time the system is in effect, raising token cost of rewards, phasing out tokens toward praise/natural reinforcers — [Vanderbilt tip sheet](https://vkc.vumc.org/assets/files/triad/ffp/Challenging_Behaviors/Token_Economy_Tip_Sheet.pdf); [Families First](https://familiesfirst.vkcsites.org/?p=158) [moderate: clinical guidance]
- Systematic review (1965–2020, Regnier et al. 2022 as relayed): schedule thinning + self-monitoring + explicit fading to natural reinforcers gave best durability; combinations beat single techniques — [Behaviorist Book Club topic](https://behavioristbookclub.com/aba-research/topic/token-economy/) [weak relay]
- Evidence for effectiveness while active is strong; evidence on fading/maintenance is thinner — same source [weak]

### Inferences
- Evidence-aligned mechanic set for children: (1) competence feedback that is immediate and specific; (2) autonomy via meaningful choice (which quest, which modality); (3) relatedness via parent/sibling co-play rather than rivalry; (4) retrieval + spacing baked into quest scheduling; (5) mastery gates (~80%) before unlocking next node; (6) game fiction/narrative and social interaction (the two moderators Sailer & Homner found significant).
- Mechanics with backfire risk for children: expected tangible rewards for already-liked activities (reading, drawing, play); absolute leaderboards for bottom/middle-ranked kids; public point deductions (ClassDojo critique); competitive framing for younger children (the 7-year-old data); Black Hat drives (scarcity timers, loss mechanics) used as the primary engine.
- Reconciling Deci/Ryan with token-economy evidence: tangible rewards are defensible when (a) the task is low-interest and necessary (drill, chores, memorisation reps), (b) contingent on mastery/effort rather than mere participation, (c) paired with informational praise, and (d) scheduled to fade. Avoid rewarding activities the child already does for fun.
- Ages: under ~7, avoid competition and loss mechanics entirely; collection/sticker-style accomplishment plus parent praise. 7–10: personal-best and co-op; relative leaderboard only if opt-in. 11+: relative leaderboards and streaks acceptable with freezes and clear opt-out.

### Gaps
- Could not open full text of Sailer & Homner; exact per-outcome effect sizes and the competition/leaderboard moderator results are unverified.
- No search results for Hamari et al. or Dicheva et al. reviews in this pass.
- No child-specific validation of Octalysis or Bartle types found.
- No primary Duolingo data on hearts; no independent Prodigy RCT results (NCT03706144 has no posted results found).
- Mastery threshold "80%" is practitioner convention; the 1990 meta-analysis snippets do not state a threshold.

---

## Key Question 3: Safe, ethical design for points, rewards, penalties and leaderboards inside families

### Takeaway
Use a token economy that is immediate, small, praise-paired and fade-able; never deduct points punitively or display sibling rankings by default; make "risk" a stake the child opts into (wager a bonus) rather than a loss of earned rewards; make parental differential treatment visible and explained, because unexplained favouritism measurably damages sibling bonds.

### Cited Findings
- Parental differential treatment (PDT) is linked to higher youth risky behaviour and poorer sibling relationships, especially for the less-favoured child — [PMC: PDT and sibling comparison](https://pmc.ncbi.nlm.nih.gov/articles/PMC5685545) [strong]
- Stronger sibling social-comparison orientation (n = 338) was linked with more depressive symptoms and amplified PDT effects — [BYU: Why Can't I Be More Like My Brother](https://scholarsarchive.byu.edu/facpub/2664) [moderate]
- Differential parental affection, whichever sibling is favoured, associated with negative self/other models and later relationship distress (n = 200) — [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC3552291) [moderate]
- KU research: parents should treat children equally or explain why not; PDT affects sibling and family bonds — [KU News 2023](https://news.ku.edu/news/article/2023/07/25/parents-treat-your-children-equally-or-explain-why-not) [moderate]
- Family cohesion buffers PDT effects except at extreme levels — [Springer](https://link.springer.com/10.1007/s10964-018-0892-8) [moderate]
- Relative leaderboards preferred and less pressuring than absolute; absolute boards increase pressure on middle/bottom ranks — [HKU 2025](https://hub.hku.hk/bitstream/10722/368255/1/content.pdf) [moderate]
- ICO Children's code (draft language): do not use reward loops that exploit reward-seeking to keep children engaged; do nudge toward wellbeing behaviours such as taking breaks; privacy settings high by default — [SCL summary](https://www.scl.org/10795-ico-publishes-final-version-of-age-appropriate-design-code/); [TIGA](https://tiga.org/?p=8283) [strong for the code; unclear whether "reward loops" wording survived to final]
- 5Rights "Disrupted Childhood" (2018, updated 2023) names reward loops, streaks (Snapstreaks), autoplay and notifications as persuasive design harming sleep, relationships and autonomy — [5Rights 2023 PDF](https://5rightsfoundation.com/uploads/Disrupted-Childhood-2023-v2.pdf) [moderate: advocacy report]
- Token-economy fading guidance (immediate delivery, raise price, shorten window, move to praise) — [Vanderbilt](https://vkc.vumc.org/assets/files/triad/ffp/Challenging_Behaviors/Token_Economy_Tip_Sheet.pdf) [moderate]
- Duolingo Streak Freeze: slack helps persistence (citing Penn/UCLA study); two freezes raised DAU +0.38% — [Duolingo blog](https://blog.duolingo.com/how-duolingo-streak-builds-habit/) [moderate]
- Loss aversion asymmetry (~2×) is the mechanism commonly invoked for streaks — [DEV Community](https://dev.to/pocket_linguist/why-duolingos-gamification-works-and-when-it-doesnt-1d4) [weak relay of Kahneman & Tversky]

### Inferences (design rules)
1. **Points = evidence of effort/mastery, not compliance.** Award for completed mastery checks, retrieval sessions, missions verified by parent. Never for mere login/time.
2. **Immediate, small, praise-paired.** Toddler/early-primary: tokens within seconds and a parent-facing prompt to say the specific praise aloud. Parent reward catalogue priced in points; "price inflation" schedule as the fading mechanism.
3. **No deductions from earned balance.** "Risk" is implemented as *opt-in stakes*: child wagers a bonus multiplier on a harder quest (lose the bonus, not the base). Parent-defined "penalties" map to *loss of a privilege the parent already controls* (screen time, dessert) and are logged, explained, and never shown to siblings. Rationale: ClassDojo public-deduction critique + loss-aversion harms + ICO reward-loop language.
4. **Streaks with grace.** If streaks exist: weekly (not daily) for under-10s; automatic freezes (not purchased); streak break never destroys progress and is framed as "paused".
5. **Leaderboard defaults:** personal-best board on by default; sibling board opt-in per child and shown as *relative* (neighbours only) with age-normalised metrics (effort minutes, mastery deltas) rather than raw points; add a **family co-op bar** (shared goal) as the primary social surface.
6. **PDT transparency:** when a parent sets different reward prices/thresholds per child, the system asks for a one-line reason stored in the transparency log and suggests age-normalisation; prompt parents to explain differences to kids (per KU finding).
7. **Reflection ritual:** weekly family review where points are converted and the child narrates what they learned (Charlotte Mason narration doubles as intrinsic-motivation support).
8. **Hard caps:** per-day earnable points cap; no scarcity timers; no "you'll lose X in 2 hours" notifications to children.

### Gaps
- No study directly measuring anxiety under absolute vs relative leaderboards.
- No study found on gamified point systems *within families* specifically; all leaderboard evidence is classroom/online-course.
- Whether the ICO's "reward loops" language is in the final code is unconfirmed (ICO pages returned 403).

---

## Key Question 4: Age-band content and interaction guidance (incl. multimodal)

### Takeaway
Under-2: no screens (WHO); 2–4: ≤1 hour/day co-viewed (WHO), so the toddler tier must be parent-operated and voice/photo-first; attention windows scale roughly 2–3 minutes per year of age; written input is viable from upper primary; "missions" photographed by the parent make the real world the main interface for young children.

### Cited Findings
- WHO (2019): no screen time under 1; no more than 1 hour/day for ages 2–4; guidance stops at 5 — [NBC NY on WHO](https://www.nbcnewyork.com/news/health/Screen-Time-Guidelines-Babies-Kids-Under-Five-508999771.html); [News-Medical](https://www.news-medical.net/news/20190425/How-much-screen-time-is-OK-for-a-5-year-old.aspx) [strong for WHO, secondary reporting]
- AAP: under 18 months avoid screens except video chat; 2–5 limit non-educational screen time to ~1 hr/weekday; quality/co-viewing matter more than minutes; AAP recommends a Family Media Plan per child (healthychildren.org/MediaUsePlan); AAP page notes children average seven hours/day on entertainment media — [AAP media and children](https://www.aap.org/en/patient-care/media-and-children/); [Curio summary](https://heycurio.com/blog/screen-time-guidelines-by-age-what-who-and-the-aap-actually-recommend) [moderate; AAP numeric limits are inconsistently reported in secondary sources]
- Attention span rule of thumb: ~2–3 minutes per year of age for adult-directed tasks (2 yr: 4–6 min; 4 yr: 8–12; 5–6: 12–18; 7–8: 16–24; 9–10: 20–30; 11–12: 25–35; 13–15: 30–40; 16+: 32–50+); longer for self-chosen activities — [Self Sufficient Kids](https://selfsufficientkids.com/average-attention-span-by-age-for-children/); [Early Years TV](https://www.earlyyears.tv/attention-span-development/) [weak: parenting sites, no primary study located]
- Charlotte Mason short lessons ~15–20 min early grades — [Homeschool Fox](https://homeschoolfox.com/charlotte-mason-homeschooling) [weak]
- Montessori planes: 0–6 absorbent/concrete, 6–12 reasoning/social, 12–18 identity — [AMI](https://archives.montessori-ami.org/help/glossary/four-planes-development) [strong]
- Trivium: K–4 memorisation, 5–8 analysis, 9–12 expression — [Cathy Duffy](https://www.cathyduffyreviews.com/homeschool-extras/parent-helps-and-how-to-books/general-parent-helps/the-welltrained-mind-fourth-edition-2016) [moderate]
- CEFR young-learner descriptors validated for bands 7–10 and 11–15 — [Council of Europe](https://rm.coe.int/the-collation-of-validated-portfolio-descriptors-for-young-learners-go/1680788b28) [strong]
- Parent co-play: parents asking questions during co-play leads to prosocial exchanges — [Joan Ganz Cooney Center](https://joanganzcooneycenter.org/?p=25906) [moderate]
- COPPA 2025: narrow exception allows collecting a child's voice recording without consent only if used solely to respond to the request and no other PII collected — [Jones Day](https://jonesday.com/en/insights/2025/05/ftc-finalizes-amendments-to-coppa--rule) [strong: regulation via law-firm summary]

### Inferences (age-band spec)

| Band | Ages | Session length | Primary modality | Who holds the device | Content shape | Reward shape |
|---|---|---|---|---|---|---|
| Toddler | 2–4 | 3–8 min, ≤1 total hr/day screen incl. everything | Parent reads prompt aloud; child answers by voice/pointing/doing; parent photographs result | Parent | Real-world "missions" (sort socks by colour, find 3 round things); songs; picture naming | Immediate sticker/sound + parent praise script; no streaks, no leaderboard |
| Early primary | 5–7 | 8–15 min | Voice answers, tap/drag, photo of drawing/worksheet; emerging reading with audio | Parent nearby (co-play) | One concept per quest; CPA sequence; narration | Tokens -> parent reward board; personal-best only; weekly family co-op goal |
| Upper primary | 8–10 | 15–25 min | Typing short answers, photo of worked problems, voice explain-your-thinking | Child, parent reviews | Mastery nodes with retrieval warm-ups; missions with parent verification | Tokens + badges; opt-in relative sibling board; opt-in stakes |
| Middle | 11–13 | 20–35 min | Text, photo, voice; longer written narration | Child | Projects/units; spaced reviews; debates | Streaks (weekly) with auto-freeze; relative leaderboard; co-op quests |
| High school | 14–18 | 30–50 min | Full text, uploads, timed sets | Child | Exam-spec aligned practice; past papers; portfolios | Progress/percentile toward goal; self-set goals; reduced token economy (fade) |

- Voice-first for pre-readers is both pedagogically necessary and legally delicate: transcribe on-device or delete audio after transcription to stay inside the COPPA audio exception.
- "Missions" (real-world tasks with photo evidence) let the toddler tier exist with near-zero child screen time; the parent is the player.

### Gaps
- No primary developmental study for attention-span-by-age numbers; treat them as heuristics.
- AAP's current numeric limits could not be read from a primary AAP page (fetch returned only the general page, last updated 2021).

---

## Key Question 5: Assessment design — verifiable LLM grading and mastery thresholds

### Takeaway
LLM graders match human reliability on clear-cut, rubric-conditioned, binary/coarse items and degrade on granular rubrics and ambiguous answers; the dependable architecture is answer-key-first, rubric-conditioned grading with a confidence score, deferral of low-confidence items to the parent, and mastery gates around ~80%.

### Cited Findings
- Henkel, Vanacore & Roberts (AIME-Con 2025), story-retell grading: LLMs match human reliability with a well-designed rubric; do well on clear-cut responses, struggle on ambiguous ones; explanations unreliable for complex cases; models differ in harshness; recommend hybrid systems with teachers handling nuanced cases — [ACL Anthology](https://preview.aclanthology.org/setup/2025.aimecon-sessions.8) [strong]
- Deng et al. (arXiv 2601.08843, Dec 2025), rubric-conditioned short-answer grading with Qwen 2.5-72B on SciEntsBank: strong agreement for binary grading, weaker as rubric granularity increases; filtering low-confidence predictions raised accuracy on the remainder; robust to prompt injection, sensitive to synonym substitution; proposes consensus-based deferral to reduce hallucination — [arXiv](https://arxiv.org/html/2601.08843) [strong]
- Yamauchi et al. (Kyoto, ICLEA): rubric + algorithmic output checks + self-consistency sampling reached inter-rater reliability 0.63 vs 0.67 among experts, on only 12 responses — [APSCE](https://library.apsce.net/index.php/ICLEA/article/download/5504/5436/6676) [weak: tiny n]
- Mastery learning mean ES 0.52 (Kulik et al. 1990) — [Academia.edu](https://www.academia.edu/81783373/Effectiveness_of_Mastery_Learning_Programs_A_Meta_Analysis) [strong]
- Kumon advances by mastery (speed + accuracy), not age — [Kumon blog](https://latoyahill.blogspot.com/2021/10/what-are-levels-of-kumon.html) [weak]
- Hifz programs test per juz with promotional tests between levels — [Quran Sheikh](https://www.quransheikh.com/courses/hifz-classes-for-kids/) [weak]

### Inferences (assessment contract for the generator agent)
- Every generated item must carry: `answer_key` (or a `rubric` with 2–4 levels, not more), `grading_mode` ∈ {exact, numeric_tolerance, mcq, rubric, parent_verify}, `expected_evidence` (text / photo / voice / parent attestation), and `max_points`.
- Grading pipeline: (1) deterministic check when possible (numeric/MCQ/string normalisation); (2) LLM grader conditioned on rubric + answer key + child's age band, returning `score`, `confidence`, `evidence_quote`; (3) self-consistency: sample 3, require agreement; (4) if confidence < threshold or disagreement, mark "needs parent review" and award provisional points; (5) parent override always available and logged.
- For photo of worksheet/drawing: ask the grader to first *transcribe* what it sees, then grade the transcription against the key; show transcription to parent for a one-tap confirm (catches vision errors cheaply).
- For voice: transcribe, then grade transcript; for recitation (Quran, memory verses, poems) do *not* let the LLM claim tajwid correctness; grade word accuracy only and route pronunciation to parent/teacher.
- Mastery threshold: 80% correct on a mixed retrieval set, re-tested after a spacing interval (e.g., 3 days) before the node is marked mastered. Keep rubrics coarse (binary or 3-level) for reliability.
- Never let the grader see or need the child's name/PII; pass only age band and profile.

### Gaps
- No study measures hallucinated grading *rationales* directly; the consensus-deferral evidence is the closest proxy.
- No evidence on LLM grading of children's handwriting/drawings via vision models specifically.

---

## Key Question 6: Child-safety and well-being constraints

### Takeaway
Design to the UK Children's code (high-privacy defaults, no manipulative nudges, wellbeing nudges) and COPPA 2025 (separate consent for third-party sharing, retention disclosure, audio exception), avoid the dark patterns the FTC has fined (Epic, $520M), keep child PII out of model calls, and give parents a full transparency log.

### Cited Findings
- ICO Age Appropriate Design Code (final Jan 2020, 12-month transition): privacy high by default; do not use nudges to get children to provide unnecessary data or weaken privacy; draft also barred reward loops exploiting reward-seeking; encourage wellbeing nudges (breaks) — [SCL](https://www.scl.org/10795-ico-publishes-final-version-of-age-appropriate-design-code/); [TIGA](https://tiga.org/?p=8283); [TechCrunch](https://techcrunch.com/2020/01/22/uk-watchdog-sets-out-age-appropriate-design-code-for-online-services-to-keep-kids-privacy-safe) [strong]
- COPPA amendments: published 22 Apr 2025, effective 23 Jun 2025, compliance deadline 22 Apr 2026 (now passed); separate verifiable parental consent required for third-party disclosure unless integral to the service; new VPC methods (knowledge-based auth, facial recognition, government ID, "text plus"); direct notice must say how data is used; privacy policy must state retention period; audio exception for voice used only to respond and immediately not retained; proposals on avatars-as-PII and push-notification restrictions were not adopted — [Jones Day](https://jonesday.com/en/insights/2025/05/ftc-finalizes-amendments-to-coppa--rule); [White & Case](https://www.whitecase.com/insight-alert/unpacking-ftcs-coppa-amendments-what-you-need-know); [Hunton](https://www.hunton.com/privacy-and-cybersecurity-law-blog/ftc-publishes-final-coppa-rule-amendments) [strong]
- FTC "Bringing Dark Patterns to Light" (Sept 2022) staff report; Epic Games $520M settlement over dark patterns and children's privacy — [MediaPost](https://www.mediapost.com/publications/article/380803/epic-fined-520-million-over-dark-patterns-chil.html); [Fenwick](https://fenwick.com/insights/publications/ftcs-aggressive-enforcement-of-childrens-privacy-and-dark-patterns-a-cautionary-tale-and-simple-steps-companies-can-take-to-reduce-risk) [strong]
- Fairplay asked the FTC to prohibit dark patterns aimed at children and filed complaints against apps forcing ad interaction, including the first complaint against an *educational* app — [Fairplay filing](https://fairplayforkids.org/wp-content/uploads/2021/05/darkpatterns.pdf); [Fairplay](https://fairplayforkids.org/?p=27097) [moderate: advocacy]
- Manipulative design is common in apps used by 3–5-year-olds and more prevalent for lower-SES households (2022 cross-sectional); 2025 analysis of 20 free kids' apps found deceptive patterns in every app, median 5.5 per app — [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC9206186/); [arXiv 2512.17819](https://arxiv.org/pdf/2512.17819v1) [strong]
- 5Rights: persuasive design (reward loops, autoplay, notifications, streaks) harms sleep, relationships, education, autonomy; responsibility should not fall mainly on children/parents — [5Rights 2023](https://5rightsfoundation.com/uploads/Disrupted-Childhood-2023-v2.pdf) [moderate]
- AAP Family Media Plan as the parent-side control model — [AAP](https://www.aap.org/en/patient-care/media-and-children/) [moderate]

### Inferences (constraint list for the MVP)
- **Data minimisation to AI APIs:** send only {age_band, profile JSON, lesson content, child's answer, photo/transcript}; strip names, faces (blur or crop before upload, or instruct parent to photograph work not child), location, school. Child display names are parent-chosen nicknames.
- **Audio:** transcribe immediately, discard the recording by default; parent can opt in to keep for review (then it is stored under the parent's account with consent logged).
- **Consent model:** parent is the account holder; children have no independent accounts; separate toggle (default off) for any third-party sharing; retention period stated in the parent dashboard.
- **No dark patterns:** no countdown timers, no "last chance" loss notifications to children, no paid streak repair, no ad interstitials, no purchase prompts in the child surface, no infinite feeds; wellbeing nudge ("time to stop") after the age-band session length.
- **Generated content moderation:** every generated story/image passes a child-safety classifier plus the family's worldview deny-list (Q1); images generated without real children's likeness; parent preview-and-approve queue for anything the agent generates for under-8s (cheap at MVP: parent approves the day's quests in one tap).
- **Transparency log:** immutable parent-visible log of every prompt category sent to the model, every grade (with confidence and whether overridden), every reward/penalty applied and by whom, and every differential-treatment setting with the parent's stated reason.
- **Jurisdiction:** COPPA (US, under 13), UK Children's code (under 18), Indonesia's PDP law (not researched here) — build to the strictest (UK code's under-18 scope, high-privacy default).

### Gaps
- Could not fetch the ICO code pages (403); the 15 standards list and the final "reward loops" wording are unverified from primary.
- No FTC guidance specific to children's dark patterns located beyond the 2022 staff report and Epic enforcement.
- Indonesia PDP law and Singapore PDPA child provisions not researched.
- No source found on content-moderation tooling for LLM-generated children's stories specifically.

---

## Key Question 7: Mechanics that strengthen parent–child bonds (parent as game master)

### Takeaway
The evidence base is small but consistent: co-play where the parent asks questions produces prosocial exchanges, cooperative games are seen as the most relationship-valuable, and parents already view gaming as a way to connect; design the parent as the game master who verifies missions, awards praise, and co-plays, rather than an admin who sets penalties.

### Cited Findings
- Parents asking questions while co-playing often leads to prosocial encounters and children opening up — [Joan Ganz Cooney Center](https://joanganzcooneycenter.org/?p=25906) [moderate]
- Mixed-methods 2025 study (178 parents, 12 dyads): children play for fun, parents play to connect; cooperative and competitive games rated most pedagogically valuable for emotional insight, communication, behavioural regulation — [Hrčak](https://hrcak.srce.hr/en/334800) [moderate]
- Animal Crossing family study (27 families) describes joint media engagement practices during COVID — [UW CSCW 2022](https://homes.cs.washington.edu/~jessejm/data/MartinezCSCWAnimalCrossing2022.pdf) [moderate, qualitative]
- Co-play "nudge" app for 4-year-olds had no effect on interaction quality (n = 77); author suggests less frequent, harder-to-ignore parent features — [Vanderbilt](https://ir.vanderbilt.edu/handle/1803/17365) [moderate: null result]
- Google research: joint engagement should be a design goal for children's technology — [Google Research](https://research.google/pubs/playing-together-the-importance-of-joint-engagement-in-the-design-of-technology-for-children/) [moderate]
- Relatedness is one of the three needs predicting game enjoyment — [Ryan, Rigby & Przybylski 2006](https://www.rochester.edu/warner/lida/wp-content/uploads/2022/11/02bfe513dd59366750000000.pdf) [strong]
- Cooperative games raised intrinsic motivation; competitive lowered it (5th–6th grade PE) — [Murdoch](https://researchportal.murdoch.edu.au/esploro/outputs/conferencePaper/The-myth-of-cooperative-learning-and/991005542704007891) [moderate]
- Family cohesion buffers PDT harms — [Springer](https://link.springer.com/10.1007/s10964-018-0892-8) [moderate]

### Inferences
- **Parent as Game Master (GM):** the agent drafts; the parent approves, narrates, verifies and praises. Give the GM a daily "3 things to say" card (specific praise, a question to ask, a mission to verify) — this operationalises the "ask questions during co-play" finding and the token-economy "pair with praise" rule.
- **Family quest bar:** one shared weekly goal (e.g., 300 family points) whose reward is a shared activity (parent-provided). This converts sibling competition into co-op and raises family cohesion, the buffer against PDT harms.
- **Co-op quests across ages:** older sibling teaches younger (narration/teaching as retrieval practice); both earn.
- **Reflection ritual:** weekly 10-minute family review: child narrates one thing learned; parent logs one observation; points convert to rewards here, not automatically (keeps reward delivery human and praise-paired).
- **Sparse, salient parent features** beat constant nudges (Vanderbilt null result): one daily GM card, not push spam.

### Gaps
- No causal study of family-level gamified learning systems; all co-play evidence is qualitative or small.

---

## Key Question 8: Hackathon MVP split — seed now vs. full taxonomy later

### Takeaway
Seed 6 profiles that cover the widest set of mechanics and worldviews with the least hand-encoding, hard-code the age-band and safety rules, and defer the long tail.

### Cited Findings
- Machine-readable sources available quickly: Cambridge 0096 strand codes [PDF](https://josefs-international.squarespace.com/s/Cambridge-Primary-Mathematics-Curriculum-Framework-0096_tcm142-592530.pdf); Common Core math JSONL [Hugging Face](https://huggingface.co/datasets/allenai/achieve-the-core/blob/06a0a3980e618f21ade4ab31a11a6d0579af6a52/README.md); CEFR young-learner descriptors [Council of Europe](https://rm.coe.int/16804932bd); Kurikulum Merdeka phase map [Quipper](https://www.quipper.com/id/blog/info-guru/fase-kurikulum-merdeka/); AmblesideOnline free schedules [AO](https://amblesideonline.org/faq)
- CASE Network free registration for non-commercial use — [1EdTech](https://1edtech.org/program/casenetwork2)

### Inferences

**Seed now (36h):**
1. Singapore Math (Primary 1–4) — richest multimodal story (photo of manipulatives -> bar model).
2. Cambridge Primary Maths/Science (Stages 1–6) — coded objectives, exam-style grading; demo "international school" parent.
3. Common Core ELA + Math (K–5) — JSONL available; US demo.
4. Charlotte Mason (Years 1–3 via AO) — voice narration + nature-photo missions; demo intrinsic-motivation-friendly profile.
5. Classical Trivium (Grammar stage) — memorisation/recitation via voice; maps to hifz/verse memorisation mechanics.
6. Islamic track (Quran hifz Juz 30 + Safar-style Islamic studies L1–3) — worldview constraints demo; parent/teacher override for recitation.
7. (Optional 7th) Kurikulum Merdeka Fase A/B Bahasa Indonesia + Matematika — local market demo.
8. (Optional 8th) Life skills / financial literacy — pure parent-verified real-world missions, zero screen; demo toddler tier.

Each seeded profile needs: profile JSON (Q1 schema), 10–20 competency nodes, 3 lesson templates, assessment contract, one worldview deny-list.

**Hard-code now:** age-band table (Q4), reward rules 1–8 (Q3), assessment pipeline with confidence deferral and parent override (Q5), PII stripping + audio discard + transparency log (Q6), family co-op bar + daily GM card (Q7).

**Later (roadmap):** CASE Network import for all state/national standards; IB PYP/MYP units; Montessori, Waldorf, Reggio, Finnish, unschooling (require richer "emergent" generation modes); full religious tracks (Christian, Jewish, Hindu, Buddhist) with reviewed deny/allow lists; Kumon-style timed drill engine; SAT/ACT/A-Level/IB/Olympiad past-paper banks (licensing); CEFR Arabic/Mandarin speaking assessment (needs pronunciation models beyond LLM grading); jurisdiction-specific consent flows (COPPA VPC methods, UK code, Indonesia PDP).

### Gaps
- Licensing for exam past papers (Cambridge, College Board) and for OpenStax/Khan/CK-12 content in a commercial product not resolved; assume "no" until confirmed.
