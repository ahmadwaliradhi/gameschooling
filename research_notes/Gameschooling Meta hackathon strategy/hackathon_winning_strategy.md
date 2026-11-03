# Winning the Indie Developer track: evidence-based playbook for GameSchooling (Meta Global AI Developer Hackathon, Cerebral Valley, Oct 26–Nov 4 2026)

Scope note: These notes do not restate or contradict `00_event_facts_verbatim.md` (rubric, rules, anti-projects, submission fields). They add external evidence on what Cerebral Valley / Meta / Anthropic-style hackathon judges have historically rewarded, how winners demoed and documented, and draft guidance for each written field. Everything in "Inferences" is my synthesis for a solo builder with ~36 hours left; everything in "Cited Findings" is sourced.

Research approach: ~25 web searches/fetches across ai.meta.com, about.fb.com, claude.com, cerebralvalley.ai, X posts, Devpost, participant GitHub repos for this exact hackathon, and Meta Model API docs. Several primary pages (JetBrains judge write-up, X posts, Reddit mirrors) returned 403/402; where I only have a search-engine snippet I say so.

---

## KQ1. What do winners of previous Cerebral Valley / Meta / Anthropic hackathons have in common?

### Takeaway
Across ~10 recent CV-run or Meta-run hackathons, winners are overwhelmingly (a) built by someone with firsthand domain pain ("the people closest to a problem"), (b) narrow in scope but fully working end-to-end, (c) demoed with real inputs (a real document, real video, real child, a real $20 pair of glasses), and (d) use the sponsor model in a way that is structurally load-bearing (vision, agents, multi-model pipelines), not as a chat wrapper. Education projects have won or placed repeatedly, but always as a *tool with a mechanism* (block IDE, Socratic gate before coding, homework-photo-to-parent-report, grading with teacher-set rubric), never as a tutor chatbot.

### Cited Findings

**Meta-run hackathons (Llama era, mostly co-produced with Cerebral Valley)**
- Meta Llama 3 Hackathon (SF, May 2024, hosted by Cerebral Valley at SHACK15): 1,200+ applications, 354 attendees, 51 projects in 24 hours. 1st OpenGlass: ~$20 DIY smart glasses that describe what the wearer sees (demo: identified fruit in a bowl and gave calorie counts). 2nd Deb8: an AI-agent debate arena where two models hold a Lincoln-Douglas debate and a third agent scores them. 3rd Team AAA: activation-ablation jailbreak research on Llama 3. Other notables: Feycher (custom chatbots), Hound (RAG for trafficking routes), Joe CRM (autonomous outreach), SixthSense (Ray-Ban Meta app). No judges named; no explicit criteria stated. — [Meta AI blog](https://ai.meta.com/blog/llama-3-hackathon-recap-cerebral-valley/)
- LlamaCon Hackathon (SF, May 2025): 238 developers, 44 projects, two judging rounds down to six finalists; judges from Meta and sponsors (unnamed). 1st OrgLens: expert-matching knowledge graph from Jira/GitHub/docs with queryable "digital twin" of each person (React/Tailwind/Django/Llama API). 2nd Compliance Wizards: fraud transaction analyzer with email confirmation, AI voice reporting, and multimodal news search. 3rd Llama CCTV Operator: natural-language event definitions over CCTV using Llama 4 image understanding every ~5 frames. Best Llama API Usage: Geo-ML, a geologist converting 400-page geology reports into a DSL to generate 3D subsurface models. Finalist Concierge "stood out" by fine-tuning Llama 4 Maverick on synthetic data built with Meta's synthetic-data tool. — [Meta AI blog](https://ai.meta.com/blog/llamacon-hackathon/)
- Llama 4 NYC Hackathon (2025): "Best Use of Llama API" went to Parent Bridge, built in 36 hours: scans children's handwritten homework (Llama 4 Scout/Maverick vision), identifies conceptual gaps, and generates multilingual progress reports for non-English-speaking parents; the author credits a narrow scope ("rejected dozens of feature ideas to test one core hypothesis") and warns that image preprocessing (plain white paper vs lined) made or broke the multimodal demo, with Meta reps advising on it. — [Yakubov blog](https://yakubov.pages.dev/blogs/2025-06-01-llama4-hackathon-nyc-win.html)
- Llama 4 Seattle Hackathon (June 21–22, 2025): Meta for Developers' X post names 1st place "Sussi - A student monitor…" (post truncated; full description not retrievable, x.com returned 402). — [Meta for Developers on X](https://x.com/MetaforDevs/status/1937233386453762423)
- Llama Hackathon India (2024): 1st CurePharma AI (WhatsApp medication info in regional languages via prescription scan), 2nd CivicFix (WhatsApp civic-issue bot with voice/photo/text classification and routing), 3rd Evalssment: "uses Llama models to grade assignments and give individualized feedback. Teachers can set grading criteria and generate assignments with one click." Six jury members, unnamed; no criteria stated. — [Meta AI blog](https://ai.meta.com/blog/llama-hackathon-india/)
- Llama Impact Hackathon London (Nov 2024, with Cerebral Valley): top three shared $50K plus six weeks of Meta mentorship. 1st Guardian (A&E triage on Llama 3.2 with a clinical support agent and multilingual symptom capture), 2nd Gripmind (Llama 3.2 Vision controlling a robotic arm from brain signals/voice/images), 3rd Pharmallama (on-device medication conflict checker). Cerebral Valley founder Ivan Porollo: "The talent at this London Llama Hackathon was some of the best we've ever seen." — [Meta Newsroom](https://about.fb.com/news/2024/11/metas-llama-impact-hackathon-pioneering-ai-solutions-for-public-good/)
- Llama Impact Hackathon SF (lablab, 2024): 1st Llama Navigator AI (Chrome extension that guides users through any website), 2nd Compllama (construction code compliance), 3rd Farmipole (Indian farmer scheme discovery, multilingual); online 1st was a benefits-alert platform. No criteria or judge quotes on the page. — [lablab.ai](https://lablab.ai/ai-articles/llama-impact-hackathon-sf-summary)

**Cerebral Valley x Anthropic virtual hackathons (closest format analogue: global, virtual, 3-min video, finalists judged live)**
- Built with Opus 4.6 (Feb 2026): 13,000+ applicants, 500 selected, 227 projects, 6 finalists, 3 winners; finals presented live at SHACK15 in front of Boris Cherny and Catherine Wu. — [Cerebral Valley on X](https://x.com/cerebral_valley/status/2026066211482857844); [SHACK15 journal](https://www.shack15.com/journal/inside-claude-codes-first-global-hackathon-at-shack15)
- Opus 4.6 winners: 1st CrossBeam (personal-injury lawyer Mike Brown; fixes California permit submissions and lets municipalities batch-process permits; a city is considering adopting it; he "didn't even read a line of code"). 2nd Elisa (software engineer Jon McBee; a block-based visual IDE where kids design software while AI writes the code, with a built-in teaching engine; 30 hours, 76 commits, 39K+ LOC, 1,500+ tests). 3rd PostVisit.ai (cardiologist; explains diagnoses to patients with physician oversight; got 3.5M+ views within days). "Keep Thinking" prize TARA (dashcam footage to road-investment appraisal via vision). Creative Exploration prize Conductr (browser virtual bandmate). Four of five winners were not professional developers. — [Claude blog](https://claude.com/blog/meet-the-winners-of-our-built-with-opus-4-6-claude-code-hackathon); [SHACK15](https://www.shack15.com/journal/inside-claude-codes-first-global-hackathon-at-shack15)
- Built with Opus 4.7 (Apr 2026): 500 builders from 20,000+ applicants, ~250 projects in five days. Gold MedKit (doctor-turned-engineer; voice-based clinical simulator that scores medical students' reasoning against published guidelines). Silver Wrench Board (ex-microsoldering tech; reads a schematic and draws a step-by-step diagnosis onto the board). Bronze Maieutic (CS teacher Paula Vasquez-Henriquez; a coding platform that requires students to explain what they're building and why before they can write code, with Claude evaluating the explanations). Also: Virtual Puppet Theater (webcam+voice to live puppet show), MaestrIA (photo damage, diagnose, price parts locally, draft message to tradesperson), ARIA (five specialized agents sharing 17 tools). Anthropic Head of Community Jason Bigman: "This is what it looks like when the people closest to a problem can finally build the solution themselves." — [EdTech Innovation Hub](https://www.edtechinnovationhub.com/news/a-doctor-a-carpenter-and-a-teacher-win-anthropics-global-opus-47-hackathon)

**Other recent Cerebral Valley hackathons**
- 3rd Annual Natsec Hackathon (May 2026): 1,000+ applicants, 102 projects, $80K; 1st Gallatin Radio Agent, 2nd CANOPY, 3rd AWW. — [Cerebral Valley on X](https://x.com/cerebral_valley/status/2054234632137093380)
- AI Engineer Code Summit Hackathon NYC (Nov 2025, Gemini 3): 1st CodeRalph (real-time collaborative tool), 3rd Bugpoint (LLM-native debugging layer). — [Cerebral Valley on X](https://x.com/cerebral_valley/status/1995266797139107986)
- Cerebral Valley finalist example (Dec 2025): RauserHack, "express your music ideas with only your voice; while learning about digital music creation." — [Cerebral Valley on X](https://x.com/cerebral_valley/status/2001431497564393918)

### Inferences
- The "Build for Your World" theme is literally the pattern of the last three CV-virtual-hackathon gold medals (lawyer, doctor, teacher). A solo parent building the tool they use with their own kids is the archetype; the video and description should lead with that identity in the first sentence.
- Education placed in every Anthropic-CV virtual event (Elisa 2nd, Maieutic 3rd) and in Meta's India event (Evalssment 3rd) and NYC (Parent Bridge). Each had a single memorable *mechanism*: "kids design, AI codes", "explain before you code", "teacher sets criteria, model grades", "photo of homework → parent report". GameSchooling needs one sentence-long mechanism of that kind (e.g., "parents author the curriculum; agents compile it into a game; a verifier agent grades the kid's real-world evidence").
- Scale of competition: this event is capped at 20,000 participants vs 500 in the Anthropic events, so first-round judges will be triaging thousands of 3-minute videos. Clarity in the first 15 seconds matters more than in any prior CV event.
- Winning Meta-event projects used the model's *distinctive* capability (vision on CCTV frames, vision on handwriting, synthetic-data fine-tuning, 128K context on whole assignments). The analogue here is Muse Spark's video/image/PDF input, SAM 3.1 segmentation, Muse Image generation, Muse Voice Transcribe with diarization, and Muse Wonder's sub-agent delegation (see KQ2/KQ5).

### Gaps
- No Meta or Cerebral Valley page publishes judge names, scoring notes, or "why this won" quotes for any past Llama/Meta hackathon; all winner write-ups are descriptive only.
- The Gemini London winners (reported by a search aggregator as Hachly, treeminspls, and "Spontaneous — helps kids bring ideas to life through vibe coding") could not be verified against a primary URL; treat as unconfirmed.
- Full description of Seattle winner "Sussi" (student monitor) not retrievable.

---

## KQ2. What do Meta's own judging write-ups / grant criteria say they look for? Any "surprised us" quotes?

### Takeaway
Meta never publishes judge quotes for hackathons; the "surfaced capabilities that surprised even us" language exists only in this event's rubric. The closest documented Meta criteria (Llama Impact Grants/Awards) are: Llama must be a core, demonstrated part of the project; clear path to impact and a large potential user base; technical feasibility. Meta's own Muse Spark launch materials signal what they consider showcase-worthy: multi-agent orchestration, multimodal agentic workflows (video → structured action), tool use, and long-context management.

### Cited Findings
- Llama Impact Grants 2023 judged proposals on "technical feasibility, data privacy responsibility, Llama 2 applicability, and impact"; the education track asked for "more equitable education outcomes in their own communities." — [Opportunity Desk](https://opportunitydesk.org/2023/10/26/meta-llama-impact-grants-program-2023/)
- Llama Impact Innovation Awards (2024) education category: "improving learning outcomes, increasing access to quality education, and enhancing the teaching experience"; proposals judged on "demonstrated utility of Llama, meaning Llama should be a core part of the project." — [IT Edge News](https://www.itedgenews.africa/meta-launches-llama-impact-innovation-awards-to-bbost-ai-driven-organizations-in-africa-middle-east-and-turkey/)
- Llama Impact Grant (Africa 2025) judging: "clear description of an application with a compelling use case that makes use of Llama and a clear path to impact and large potential user base." — [Bizcommunity](https://www.bizcommunity.com/article/sa-ai-startups-win-meta-data-science-africas-llama-impact-grant-732832a)
- LlamaCon Hackathon: a finalist "stood out" by bringing its own GPUs to fine-tune Llama 4 Maverick on QA datasets built with the Llama API and Meta's synthetic-data tool; a sidepot "Best Llama API Usage" was awarded separately. — [Meta AI blog](https://ai.meta.com/blog/llamacon-hackathon/)
- Muse Spark 1.1 launch (Meta Model API public preview, July 2026): the model "as the main agent… gathers context, plans, and delegates work to parallel subagents"; "trained to orchestrate multi-agent systems"; "generalizes zero-shot to new native tools, MCP servers, and custom skills"; demos included a Facebook Marketplace agent that "extracts photos from a smartphone video and drafts a listing." Partner quote (OpenClaw's Dave Morin): "an awesome model for running agents." — [Meta AI blog](https://ai.meta.com/blog/introducing-muse-spark-meta-model-api/)
- Meta Model API model list (official docs, fetched Nov 3 2026): Muse Wonder `muse-wonder-1.0` and Muse Spark 1.3 `muse-spark-1.3` accept text, image, video, audio, PDF; capabilities listed: tool calling, structured output, image/video/audio understanding, search grounding, computer use, parallel tool calls, sub-agent delegation; 1,048,576-token context; reasoning effort minimal→max. Muse Spark 1.3 audio "not fully supported… quality may degrade" (1.2 recommended for audio). Muse Image `muse-image-1.0`: generation and editing with web search and code execution for layouts, via Responses API and `/v1/images/generations`, `/v1/images/edits`. Muse Voice Transcribe `muse-voice-transcribe-1.0`: streaming speaker diarization, endpointing/VAD, keyword biasing, 25 languages with code-switching, turn-level timestamps. SAM 3.1 `sam-3.1`: segments every match for a noun phrase or objects marked by boxes/points, tracks across video frames, returns boxes and masks via Responses API. Muse Spark Open (816B MoE, 42B active; text/image/video/audio in) and Muse Glimmer (distilled, text+image in) are open-weight, self-host or hosted provider, support SFT/RL. "Muse Wonder is built for planning, sub-agent delegation, and multi-step error recovery. Muse Spark suits sub-agent tasks and tight tool loops." — [Meta Model API docs](https://dev.meta.ai/docs/models.md)
- Muse Spark 1.3 (released Sep 2 2026): ~20% fewer tool calls and 25% fewer tokens than 1.2 in Meta's internal agentic comparisons; parallel tool calling and structured output; OpenAI-compatible chat completions body. — [Oxen.ai model reference](https://docs.oxen.ai/inference-api/reference/models/muse-spark-1-3)
- Meta for Developers on partner inference for this hackathon: "run Muse Glimmer and Muse Spark Open on the tools you already build with" (Fireworks, Baseten, Modal). — [Meta for Developers on X](https://x.com/MetaforDevs/status/2112971571321332179)
- Participant Discord notes (read Oct 26) recorded in a public repo: Baseten model ID `meta-models/muse-spark-open-1026`; default Model API model `muse-spark-1.3`; base URL `https://api.meta.ai/v1` (OpenAI-compatible) with Anthropic Messages format at `https://api.meta.ai`; env var `MODEL_API_KEY`; office hours weekdays 10–11am ET in `#office-hours`; "The demo must show only work done during the event, or the project is disqualified." — [sholaola23/meta-hackathon-2026](https://github.com/sholaola23/meta-hackathon-2026)
- Another participant README records the organizers' position that "any coding tools or agents are fine during development and need no disclosure" and that Muse Code is "optional but preferred." — [davidklett/lawnlens](https://github.com/davidklett/lawnlens)

### Inferences
- "Surprised even us" is most plausibly earned by *combining* models in a pipeline the docs don't demo together, and by using capabilities most entrants will skip: SAM 3.1 noun-phrase segmentation on a kid's photo/video of a real-world mission ("count the red leaves", "find the triangle"), Muse Voice Transcribe diarization to tell parent vs child apart in a read-aloud exam, Muse Image to generate the lesson's game assets from the parent's curriculum text, video input to Muse Spark to grade a recorded experiment, and Muse Wonder as orchestrator delegating to Muse Spark sub-agents (curriculum compiler, quest designer, grader). The docs explicitly position Wonder as the planner/delegator and Spark as the sub-agent, so naming that split in the architecture reads as "went beyond basic integration" in Meta's own vocabulary.
- Structured output + parallel tool calls are the cheap, demonstrable "craft" signals for Technical Depth: show typed JSON schemas for Lesson/Quest/Rubric/GradeReport and a verifier that rejects malformed output.
- Including an open-weight model (Muse Spark Open on Baseten/Fireworks, or Glimmer locally) for one job (e.g., a cheap "hint" agent or offline mode) ticks both halves of the Stage One gate ("Meta Model API and/or open-weight models") and lets the "Describe your use of Meta products" field list two product classes plus Muse Code.
- Use Muse Spark 1.2 if any audio goes into Spark directly; the docs flag 1.3 audio degradation. Safer: route audio through Muse Voice Transcribe, then text to 1.3.

### Gaps
- No public Meta statement describes what Meta judges personally found "surprising" at any prior hackathon.
- The Agents 101/102 session content (Suraj Subramanian; Yash Khare "Best Practices for Verifiable Agents") is not indexed publicly; I could not retrieve slides or recordings. The session titles themselves are the only evidence that Meta is steering entrants toward multimodal and verifiable agents.

---

## KQ3. Evidence-based 3-minute demo video structure; tools; does a real child/parent on camera help?

### Takeaway
Every credible guide converges on: state what it is and who it is for in the first ~10 seconds, show the product working on real input for the bulk of the runtime, address the rubric explicitly, keep tech to a short architecture beat, and close on impact/next steps. Production polish is not scored, but a confusing demo loses to a simpler one judges understand. There is no study on child/parent-on-camera, but winners repeatedly won with real-world inputs and real users in frame (a city adopting CrossBeam, a cardiologist's patients, a lawyer's permits).

### Cited Findings
- Devpost's six tips: plan early and leave 2–3 hours buffer; write a script and time each section (most videos must be under three minutes); cover "what it does, how it solves the problem, and how it works"; open with a quick overview "since judges may review many projects back to back"; "state what your app does and how it addresses the hackathon within the first few seconds"; skip slide decks, stay visually engaging; "showing the product working with real input, addressing the judging criteria, and discussing future potential"; use tools you already know (OBS, built-in Mac recorder, Premiere/Kdenlive); upload to YouTube early and mark "Not for Kids" so judges can access it; typical flow "intro and pitch, problem and idea, components and tech stack, live demo, then a short closing." — [Devpost](https://info.devpost.com/blog/6-tips-for-making-a-hackathon-demo-video)
- AI Tinkerers video guide: "Production quality doesn't affect scoring"; structure ~30s overview, 1–2 min showing 3–5 key features of the working demo, tech highlights incl. sponsor tools, team contributions, optional next steps; total 2–4 minutes; "Show actual functionality, not just slides"; narrate while demoing; test microphone. — [AI Tinkerers](https://aitinkerers.org/docs/public/video_production_guide.md?markdown=1)
- Devpost-submission advice from an organizer: judges "typically have about five minutes per project, and if they can't find what they need, they'll move on"; tailor the write-up to the published judging criteria; put sponsor-product usage ("which products you used, why, and what they do in your project") near the top; keep template headings. — [dev.to (Jacklyn Biggin)](https://dev.to/jacklyn/how-to-make-your-devpost-submissions-not-suck-37i0)
- JetBrains "notes from the judging table" (June 2026) main point per search snippet: "a strong project with a confusing demo loses to a simpler project that the judges understand" (page itself returned 403). — [JetBrains blog](https://blog.jetbrains.com/ai/2026/06/how-to-win-a-hackathon-notes-from-the-judging-table/)
- HackerEarth: write "the actual 90-second walkthrough you will give the judges before your team writes a meaningful line of code"; "hardcode the demo path", mock/cache external calls because "a demo that never reaches its punchline" gets penalized. — [HackerEarth](https://www.hackerearth.com/blog/10-tips-win-hackathon)
- 2012 HN commenter: winning projects "were never very complicated, but they were highly polished and you could instantly wrap your head around them." — [Hacker News](https://news.ycombinator.com/item?id=4345295)
- Parent Bridge author: input quality is "critical for multimodal models. Image preprocessing can make or break a demo" (lined paper garbled fractions; plain white paper worked). — [Yakubov blog](https://yakubov.pages.dev/blogs/2025-06-01-llama4-hackathon-nyc-win.html)
- PostVisit.ai (3rd, Opus 4.6) "generated more than 3.5 million views within days of the event", i.e., the video itself went viral. — [SHACK15](https://www.shack15.com/journal/inside-claude-codes-first-global-hackathon-at-shack15)
- Tools: a 2026 comparison scores Screen Studio 9/10 vs Loom 5/10 for recording polish and calls Screen Studio "the clear pick for product demos" (macOS only); Loom is cross-platform with instant share links; pricing figures conflict across sources. — [dev.to (pickuma)](https://dev.to/pickuma/loom-vs-screen-studio-which-async-video-tool-works-best-for-developers-in-2026-4ee6)
- This hackathon's Stage Three: top-5 finalists per track have their *video* watched live by final judges and re-ranked with the same rubric (from `00_event_facts_verbatim.md`); Opus 4.6 finals likewise were live presentations in front of Boris Cherny and Catherine Wu. — [SHACK15](https://www.shack15.com/journal/inside-claude-codes-first-global-hackathon-at-shack15)

### Inferences (draft 3:00 script, feasible on a Mac in ~4 hours with Screen Studio/QuickTime + CapCut/iMovie)
- 0:00–0:10 Hook, on camera or voiceover over the kid's screen: "I homeschool my kids. Every week I write lessons, quizzes, and rewards by hand. This is GameSchooling: I write the curriculum, Meta's models turn it into a game my kids actually want to play." Show the product name and "Built solo, Oct 26–Nov 4, for Meta Global AI Developer Hackathon — Indie track — Build for Your World" as a lower-third. (Rubric: Impact 30% is "who benefits"; identity first mirrors CrossBeam/MedKit/Maieutic.)
- 0:10–0:40 Parent side: create a family server, paste/type a real week of curriculum (or upload a PDF — Muse Spark reads PDFs natively), set risk/reward rules. Show the "compile" button and the agents working (visible agent log: Orchestrator → Curriculum Compiler → Quest Designer → Rubric Writer). Keep the log terse and readable.
- 0:40–1:50 Child side, the longest segment, with real input: kid picks a quest, Muse Image-generated scene appears, a real-world mission ("photograph three things that are symmetrical in the garden") → child uploads a photo/short video → SAM 3.1 masks the objects on screen → grader agent scores against the parent's rubric → risk/reward resolves (coins won/lost). Then a voice exam: child reads an answer aloud → Muse Voice Transcribe diarization labels "Child" vs "Parent" → grade. If a real child is available, 10–15 seconds of them reacting is worth more than any slide; if not, narrate as the parent and show the child's screen.
- 1:50–2:20 Parent dashboard: what the child mastered, what the verifier flagged, one click to regenerate a remediation quest. (Rubric: "Could this actually become something people use?")
- 2:20–2:45 Architecture card on screen for ~15–20 seconds: boxes for Muse Wonder (orchestrator) → Muse Spark 1.3 sub-agents (compiler, quest designer, grader with structured output + parallel tool calls) → SAM 3.1, Muse Image, Muse Voice Transcribe → Muse Spark Open (Baseten) for hints/offline; Muse Code used for X. Say the sentence "every box is a Meta model" out loud.
- 2:45–3:00 Close: "Everything you saw was built this week, solo. Repo and live demo linked. Next: multiplayer sibling raids and a curriculum marketplace." End card with repo URL + live URL + X handle.
- Recording rules from the sources: script first, time each section, record each segment separately so a failed take costs 30 seconds, cache/pre-warm model calls so no segment waits on the API, unlisted YouTube marked "Not for Kids", upload at least 3 hours before Nov 4 9PM ET.

### Gaps
- No controlled evidence that a child/parent on camera raises scores; only the pattern that real users/real inputs appear in winners' demos and that human-story videos (PostVisit) went viral.
- Cerebral Valley has published no demo-video guidance for this event.

---

## KQ4. "Working, holds up live": deployed URL vs localhost, seeded demo accounts, fallback recordings

### Takeaway
The rubric's primary artifacts are the video, the code, and the live product; guides consistently say judges will not clone and run your project, so a public URL with a working seeded account and instructions is the expected baseline, with the video as the guaranteed-to-work path.

### Cited Findings
- Supabase hackathon docs: judges look at the code and "you should not expect them to clone and run your project"; host live so judges can try it in the browser; if the product needs an account, "provide a login and instructions." — [Supabase hackathon docs](https://hackathon.supabase.com/docs)
- AI Tinkerers hackathon handbook asks for a runnable demo, README with run steps, a short demo script, a way for judges to verify the project, a smoke-test script that exits non-zero on failure, and suggests a `JUDGE.md` mapping the demo to the judging categories; keep API keys out of the repo and give judges setup instructions instead. — [AI Tinkerers Paris](https://paris.aitinkerers.org/hackathons/h_vJPzSulnsyM); [AI Tinkerers Abu Dhabi](https://abu-dhabi.aitinkerers.org/hackathons/h_vJPzSulnsyM)
- Hack Club submission checklist: clone fresh into an empty directory and start it to catch uncommitted files; include an actual LICENSE file. — [Hack Club](https://sterndocs.hackclub.dev/cloudfall/submitting)
- HackerEarth: cache API responses and mock external services on the demo path; rehearse the live demo five times to find break points; always prep a video backup. — [HackerEarth](https://www.hackerearth.com/blog/10-tips-win-hackathon)
- A participant in this very hackathon runs a production URL on Vercel (`meta-hack-omega.vercel.app`), a `pnpm walkthrough` CLI that runs end-to-end journeys "against local or deployed URLs", and 128/128 validation assertions, documented in the README. — [meta-ai-hackathon/meta-hack](https://github.com/meta-ai-hackathon/meta-hack)
- The startup track is judged on "whether it holds up in production"; the indie track on "whether it works" (from `00_event_facts_verbatim.md`; also [Cerebral Valley event page](https://cerebralvalley.ai/e/meta-ai-developer-hackathon.md)).

### Inferences
- Minimum viable "holds up live" for a solo dev in 36h: deploy the web app to a public URL (Vercel/Fly/Render), seed one family server with a parent account and one child account, print the credentials and a 5-step judge path in the README and in the Project Description, and pre-generate one compiled lesson so judges see content instantly even if the model API is slow. Keep a "Regenerate with live Meta models" button so judges can watch a real call.
- Guard the demo against the one failure mode you cannot control (Meta API rate limits or credit exhaustion): cache every model response keyed by input hash; the demo path should run from cache if the API fails. Say so in the README (that is "craft", not cheating, as long as live calls are also possible).
- Warm the deployment and re-check the judge path in a private browser window right before submission; free tiers sleep.
- Record the video from the deployed URL, not localhost, so the URL bar itself proves deployment.

### Gaps
- No Cerebral Valley statement on whether first-round judges will open live URLs at all; given 20,000 potential entrants, assume many will only watch the video, which makes the video the real "live" artifact.

---

## KQ5. Differentiation: framing education so it is not a "simple AI for Education chatbot"; which angles read as technical ambition

### Takeaway
Judges and winners' write-ups reward a specific mechanism and a specific user; "AI chatbot for X" is explicitly tired. Placed education projects each had a non-chat core loop (block IDE, explain-before-code gate, photo-of-homework → structured report, teacher-set rubric grading). For GameSchooling the ambition signals that map to Meta's own capability vocabulary are: parent-authored curriculum compiled by an orchestrator + sub-agents into typed game content; multimodal real-world missions verified with SAM 3.1 / video input; a verifier/grader agent with structured output; voice exams with diarization; and family multiplayer state.

### Cited Findings
- 2026 hackathon-ideas blog (low authority): judges are tired of "AI chatbot for X"; winning ideas "solve a specific problem for a specific user, they use AI as a multiplier (not the entire product), and they have a demo that works on the first try." — [Reskilll blog](https://blogs.reskilll.com/?p=297)
- Elisa (2nd, Opus 4.6): block-based visual IDE where kids design software while AI writes code, with a built-in teaching engine; 1,500+ tests. — [Claude blog](https://claude.com/blog/meet-the-winners-of-our-built-with-opus-4-6-claude-code-hackathon)
- Maieutic (3rd, Opus 4.7): requires students to explain what they're building and why before they can write code; the model evaluates the explanation. — [EdTech Innovation Hub](https://www.edtechinnovationhub.com/news/a-doctor-a-carpenter-and-a-teacher-win-anthropics-global-opus-47-hackathon)
- Evalssment (3rd, Llama India): teachers set grading criteria; Llama grades and gives individualized feedback; one-click assignment generation. — [Meta AI blog](https://ai.meta.com/blog/llama-hackathon-india/)
- Parent Bridge (Best Use of Llama API, NYC): handwritten homework photo → learning-gap analysis → multilingual parent report; the 128K window let it "process whole assignments rather than fragments." — [Yakubov blog](https://yakubov.pages.dev/blogs/2025-06-01-llama4-hackathon-nyc-win.html)
- Deb8 (2nd, Llama 3 SF): two agents debate, a third agent judges and scores; Llama CCTV Operator (3rd, LlamaCon): plain-language event definitions compiled into vision checks every ~5 frames. — [Meta AI blog](https://ai.meta.com/blog/llama-3-hackathon-recap-cerebral-valley/); [Meta AI blog](https://ai.meta.com/blog/llamacon-hackathon/)
- ARIA (Best Use of Managed Agents, Opus 4.7): "five specialized agents share 17 tools." — [EdTech Innovation Hub](https://www.edtechinnovationhub.com/news/a-doctor-a-carpenter-and-a-teacher-win-anthropics-global-opus-47-hackathon)
- Meta's docs define the orchestration split in their own words ("Muse Wonder is built for planning, sub-agent delegation, and multi-step error recovery. Muse Spark suits sub-agent tasks and tight tool loops") and SAM 3.1 "segments every match for a noun phrase… tracks objects across video frames." — [Meta Model API docs](https://dev.meta.ai/docs/models.md)
- Meta's Llama Impact education criteria: "improving learning outcomes… enhancing the teaching experience", Llama "a core part of the project." — [IT Edge News](https://www.itedgenews.africa/meta-launches-llama-impact-innovation-awards-to-bbost-ai-driven-organizations-in-africa-middle-east-and-turkey/)

### Inferences (ranked by judge-legibility per hour of solo effort)
1. Parent-authored curriculum compiler (highest priority): the parent's text/PDF becomes typed JSON (Lesson → Quests → Exam → Rubric → RewardRules) via Muse Spark structured output, orchestrated by Muse Wonder with parallel sub-agent calls. This is the opposite of a chatbot: the human writes the spec, the agents compile it. Name it "compiler" in the UI and README.
2. Verifiable grading agent: a separate grader agent that must cite the rubric line it applied and output a confidence; parent sees "verifier flagged" items. This directly echoes Meta's "Agents 102: Best Practices for Verifiable Agents" session title and Evalssment/Maieutic.
3. Multimodal real-world mission: one mission type where the child submits a photo or short video of the real world and SAM 3.1 masks are drawn on screen as proof, then Muse Spark grades with video/image input. This is the "capability that surprises" beat; one mission type is enough.
4. Voice exam with Muse Voice Transcribe diarization (child vs parent) feeding the grader. Cheap to add if audio upload already exists.
5. Muse Image for quest art generated from the parent's lesson text (visibly ties art to curriculum; strong in video).
6. Family multiplayer/server: already in the product concept; show two accounts in one server and shared leaderboard/risk pool. Keep real-time optional; a shared state view is sufficient evidence of "family server".
- Avoid in the video: any free-text "ask the tutor" chat box as a centerpiece; any generic RAG-over-PDF framing ("upload your textbook and ask questions"). If RAG exists, call it "curriculum grounding" and keep it off screen.
- Say "no chat window required" once in the description; it preempts the anti-project reading.

### Gaps
- No judge has publicly defined where "simple AI for Education chatbot" ends; the boundary is inferred from placed projects.

---

## KQ6. Community vote and "Most Viral" bonus: how run, what works within rules

### Takeaway
For this event, community vote opens at the Nov 9 closing ceremony (winner Nov 16) and Most Viral is entered via an X post link in the submission form; neither mechanism is documented further by Meta or Cerebral Valley. Prior CV virtual hackathons had no community vote; the one documented "viral" outcome (PostVisit.ai, 3.5M+ views) came from a personal-story video posted by the builder.

### Cited Findings
- Bonus prizes "worth up to $50,000 in total, go to standout projects or community achievements, with categories such as a public vote or the most viral project," slated for ~Nov 10; Meta has not said how many bonus prizes or how the vote works. — [madrobot.blog](https://madrobot.blog/2026/10/03/meta-global-ai-developer-hackathon-1-million-prizes-muse-model-api/)
- Submission form field: "If you're competing for the Most Viral Track, please submit your X post link here to be considered" (from `00_event_facts_verbatim.md`).
- Opus 4.6 hackathon winners were "hand-selected" by Claude team judges; no community vote found. — [Claude blog](https://claude.com/blog/meet-the-winners-of-our-built-with-opus-4-6-claude-code-hackathon)
- PostVisit.ai "generated more than 3.5 million views within days of the event." — [SHACK15](https://www.shack15.com/journal/inside-claude-codes-first-global-hackathon-at-shack15)
- A Bolt-run hackathon's "Most Viral Project" bonus was judged on "how viral this Project might become" (judge-assessed, not vote-based) — weakly sourced aggregator page. — [bolt.host blog mirror](https://amlr-compliance-soft-j7n7.bolt.host/blog/hackathon-prizes-global-glory-regional-highlights-bonus-wins)
- Submitters grant Meta and Cerebral Valley permission to "use, publish, share, and promote the submitted materials across their websites, social media" (form checkbox, from `00_event_facts_verbatim.md`).

### Inferences
- Post the X thread before submitting so the link exists: a 20–30s vertical cut of the child-side demo (SAM masks appearing over a real backyard photo is the most screenshot-able moment), first line in the parent's voice ("I homeschool. I built the game my kids asked for, in 9 days, with Meta's models"), tag @MetaforDevs @AIatMeta @cerebral_valley, link repo + live URL, and the words "Meta Global AI Developer Hackathon" so Meta's social team can find and amplify it (they have the license to repost).
- Reply-thread the architecture image and a "try it" credential; replies add engagement without diluting the main post.
- Within the rules: no paid engagement, no vote-brigading; the only lever is a genuinely shareable clip plus Meta/CV amplification. Cross-post the same clip to LinkedIn and the homeschool communities you already belong to; the Nov 9 community vote is a second window, so keep the clip ready to repost then.

### Gaps
- No official description of the community-vote mechanism (platform, eligibility, whether all submissions or only the top 10 are voteable) was findable publicly as of Nov 3.
- No evidence on how "Most Viral" is scored (raw views, engagement, judge impression).

---

## KQ7. Open-source hygiene: license, commit history, architecture diagram, "built during the hackathon" section, env example, one-command run

### Takeaway
This event's rules make disqualification explicit if judges cannot identify what was built during the hackathon, so the README must open with a dated scope statement. Hackathon guides and participants in this exact event converge on: real LICENSE file, small commits from the start of the window, a dated build log, a model-usage table, a judge path, an `.env.example`, a fresh-clone test, and a smoke test.

### Cited Findings
- Rules say judges will sometimes check commit history to confirm work happened during the event; create the repo at the start and push small commits as you go; a license, README, and code of conduct make a repo an open-source project (GitHub Community Standards page as checklist). — [dev.to (Arindam)](https://dev.to/arindam_1729/how-to-use-github-effectively-at-hackathons-4emh)
- Include an actual LICENSE file, not just a license name in the README; clone fresh into an empty directory to catch uncommitted files. — [Hack Club](https://sterndocs.hackclub.dev/cloudfall/submitting)
- Runnable demo, README run steps, short demo script, a way for judges to verify, a smoke-test script exiting non-zero on failure, `JUDGE.md` mapping demo to judging categories, no API keys in repo. — [AI Tinkerers Paris](https://paris.aitinkerers.org/hackathons/h_vJPzSulnsyM); [AI Tinkerers Abu Dhabi](https://abu-dhabi.aitinkerers.org/hackathons/h_vJPzSulnsyM)
- A participant README for this hackathon opens with a one-line pitch, track and theme, "a note that all work was done during the event", a dated `docs/build-log.md` for the event window, an `ATTRIBUTION.md` for the only pre-existing material (licensed test photos), a table mapping each pipeline step to the Meta model used, a repo-layout table, documented spend caps, copy-paste setup commands, key dates, rules section, and MIT license with third-party licenses listed separately. — [sholaola23/meta-hackathon-2026](https://github.com/sholaola23/meta-hackathon-2026)
- Another participant repo keeps `info/grading criteria.md`, `architecture.md` as a "build contract", `demo/demo-script-v0.md`, `docs/runbooks.md`, PR-gated `main` with CI, and an automated review bot; README states validation counts (128/128). — [meta-ai-hackathon/meta-hack](https://github.com/meta-ai-hackathon/meta-hack)
- Opus 4.6 runner-up Elisa's write-up cites "76 commits, more than 39,000 lines of code, and more than 1,500 tests" in 30 hours as evidence of execution. — [Claude blog](https://claude.com/blog/meet-the-winners-of-our-built-with-opus-4-6-claude-code-hackathon)
- Waiver: open source allowed "if licenses followed and submission enhances/builds on it"; entrant retains IP (from `00_event_facts_verbatim.md`).

### Inferences (README skeleton, ~1 hour)
1. Title + one-line pitch + badges: "Built solo during Meta Global AI Developer Hackathon, Oct 26–Nov 4 2026 · Indie Developer Track · Build for Your World · License: MIT".
2. "What was built during the hackathon" (first H2): a dated bullet list by day, the first commit SHA/date in the window, and an explicit line about anything pre-existing (if GameSchooling had any prior code or design assets, list them and the commit range that is new; if nothing pre-existed, say "No prior code; repo created Oct 26"). Link `docs/BUILD_LOG.md`.
3. "Meta models used" table: Step → Model ID → Why (Muse Wonder orchestrator; Muse Spark 1.3 compiler/grader with structured output + parallel tool calls; SAM 3.1 mission verification; Muse Image quest art; Muse Voice Transcribe voice exams; Muse Spark Open via Baseten `meta-models/muse-spark-open-1026` for hints; Muse Code for scaffolding, if used).
4. Architecture diagram (Mermaid in README renders on GitHub, zero tooling) with the same boxes used in the video.
5. "Try it in 2 minutes": live URL, seeded parent/child credentials, 5-step judge path; optional `JUDGE.md` mapping each rubric criterion to where to look.
6. Run locally: `.env.example` with `MODEL_API_KEY`, `BASETEN_API_KEY`, one command (`pnpm dev` / `docker compose up`), a `pnpm smoke` that hits the compile + grade path and exits non-zero on failure.
7. Demo video link, X post link, "what's next".
- License choice: MIT or Apache-2.0 (Apache adds an explicit patent grant; either is fine for judges). Add `LICENSE` file at root, not just a README mention.
- Commit cadence: many small conventional commits dated inside the window; never squash/rewrite history before judging; do not force-push.
- Never commit keys; the Discord notes above warn spend beyond credits bills the card.

### Gaps
- No statement from Cerebral Valley on *how* judges verify "built during the hackathon" (commit timestamps vs README claims). Assume both.

---

## KQ8. Submission field writing: length, structure, phrasing aligned to rubric language

### Takeaway
Judges spend roughly five minutes per project and score against published criteria, so each textarea should be short, scannable, and mirror the rubric's own words (Impact: who benefits/could people use it; Meta tooling: beyond basic integration/surprising capability; Technical depth: sound, refined, craft; Demo: works, holds up live). The "team name" field doubles as the project name.

### Cited Findings
- Judges "typically have about five minutes per project"; tailor the write-up to published criteria; put sponsor-product usage ("which products… why, and what they do in your project") near the top. — [dev.to (Jacklyn Biggin)](https://dev.to/jacklyn/how-to-make-your-devpost-submissions-not-suck-37i0)
- Devpost: draft the elevator pitch and project story in the submission form before coding; it becomes the video script. — [Devpost](https://info.devpost.com/blog/6-tips-for-making-a-hackathon-demo-video)
- Meta grant criteria wording: "demonstrated utility of Llama… a core part of the project"; "clear path to impact and large potential user base." — [IT Edge News](https://www.itedgenews.africa/meta-launches-llama-impact-innovation-awards-to-bbost-ai-driven-organizations-in-africa-middle-east-and-turkey/); [Bizcommunity](https://www.bizcommunity.com/article/sa-ai-startups-win-meta-data-science-africas-llama-impact-grant-732832a)
- Rubric wording and the full field list are in `00_event_facts_verbatim.md`; the form has no separate project-name field, so Team Name is effectively the project name.
- Meta docs vocabulary to reuse verbatim: "sub-agent delegation", "parallel tool calls", "structured output", "segments every match for a noun phrase", "speaker diarization", "post-training with SFT or RL". — [Meta Model API docs](https://dev.meta.ai/docs/models.md)

### Inferences (draft-ready guidance; keep each textarea ~150–250 words, headed sub-sections, no marketing fluff)

**Team Name:** `GameSchooling` (or `GameSchooling — parent-authored learning games`). Judges will see this as the project name on the gallery card.

**Project Description (placeholder: "Describe your project and what problem it solves…")** — structure in five short paragraphs/bullets:
1. Who/why (Impact, 1–2 sentences, first person): "I homeschool my children. Every week I write lessons, quizzes and reward rules by hand, and my kids still experience it as homework."
2. What it is (1 sentence): "GameSchooling is a family server where a parent authors the curriculum and risk/reward rules, and a team of Meta-model agents compiles it into a game the children play, including real-world missions verified from photos, video and voice."
3. How it works (3 bullets): parent authoring → agent compilation (orchestrator + sub-agents, typed output) → child play loop (quests, risk/reward, exams) → verifiable grading with parent review.
4. What's new / not a chatbot (1–2 sentences): "There is no tutor chat window. The parent is the author; the models are the compiler, game master and grader; every grade cites the parent's rubric."
5. Built-this-week + how to try (2 sentences): "Built solo from Oct 26 to Nov 4. Live demo: URL (parent: …/child: …); repo: URL; 3-minute video: URL."
Also add one explicit sentence tying to the theme: "Built for Your World: this is the tool I use with my own kids."

**Describe your use of Meta products to build the submitted project** — a product-by-product list, each with model ID and the job it does, ordered by how central it is:
- Muse Wonder (`muse-wonder-1.0`): orchestrator that plans a lesson compile and delegates to parallel sub-agents.
- Muse Spark 1.3 (`muse-spark-1.3`): sub-agents for Curriculum Compiler, Quest Designer, Exam Writer and Grader; structured output against our Lesson/Quest/Rubric/Grade schemas; parallel tool calls; PDF/image/video input for grading submissions.
- SAM 3.1 (`sam-3.1`): verifies real-world missions by segmenting the noun phrase the quest asked for in the child's photo/video and overlaying masks as proof.
- Muse Image (`muse-image-1.0`): generates quest art and edits it to match the parent's lesson theme.
- Muse Voice Transcribe (`muse-voice-transcribe-1.0`): voice exams; speaker diarization separates child from parent; transcript feeds the grader.
- Muse Spark Open via Baseten (`meta-models/muse-spark-open-1026`): low-cost hint agent / fallback so the game keeps running when API credits are exhausted (open-weight path).
- Muse Code: (only if actually used) which parts it scaffolded.
End with one sentence: "All runtime intelligence is Meta models; no other LLM provider is called." (Only if true.)

**Why are Meta's models important to your solution?** — three paragraphs mapped to the 25% criterion:
1. Capability fit: multimodal input (image/video/audio/PDF) in one model family lets a child's real-world evidence be graded without a separate vision stack; SAM 3.1 gives visible, checkable proof; diarization makes voice exams possible.
2. Agentic fit: Meta's documented orchestrator/sub-agent split (Wonder plans, Spark executes in tight tool loops) matches the compile pipeline; structured output + parallel tool calls make the compile fast and type-safe.
3. Open-weight path: Muse Spark Open/Glimmer mean a family can self-host the hint/grader agent for privacy and cost, and the parent-authored curriculum + graded outcomes form an SFT/RL dataset for a family-specific tutor later. Close with the "surprised even us" beat: name the one combination you believe is novel (e.g., "SAM 3.1 noun-phrase masks as a grading primitive for children's real-world missions").

**Most Viral Track X post:** see KQ6 draft; post before filling the form so the link exists.

**Partner-technology feedback (Fireworks, Modal, Baseten):** one concrete sentence per partner you used (e.g., the `-1026` model-ID confusion from Discord is a legitimate, specific piece of feedback).

**Biggest obstacle / comparison radios:** answer honestly; these are survey fields, not scored.

### Gaps
- Cerebral Valley publishes no character limits for the textareas; the ~150–250-word guidance is inferred from the 5-minute judging window, not from the platform.

---

## KQ9. Late-breaking info about this specific hackathon (judges, submission volume, organizer tips) as of Nov 3 2026

### Takeaway
No judge names, submission counts, or organizer judging tips have been published publicly; the only late-breaking operational facts come from participants' public repos that transcribed Discord announcements (model IDs, office hours, "demo must show only work done during the event").

### Cited Findings
- As of early Oct 2026, "Meta still hasn't named the judges, or said how many bonus prizes there will be"; a panel chosen by the organisers selects finalists; judging to Nov 8; winners at a live final Nov 9; bonus prizes ~Nov 10. — [madrobot.blog](https://madrobot.blog/2026/10/03/meta-global-ai-developer-hackathon-1-million-prizes-muse-model-api/)
- Cerebral Valley event page: up to 20,000 accepted applicants; applications "scored on project idea and technical skill equally"; office hours on Discord Oct 27–Nov 4; organizer tip: bring "a problem you know firsthand, or an idea that feels out of reach"; no judges named, no FAQ. — [Cerebral Valley event page](https://cerebralvalley.ai/e/meta-ai-developer-hackathon.md)
- Discord announcements transcribed Oct 26 by a participant: anything built Oct 26–Nov 4 counts; eligibility questions to @CV; office hours weekdays 10–11am ET in `#office-hours` (shifted to 3–4pm UK from Nov 2); credit questions only in `#credit-requests`; "A spend-limit notification does not stop billing"; Baseten ID `meta-models/muse-spark-open-1026`. — [sholaola23/meta-hackathon-2026](https://github.com/sholaola23/meta-hackathon-2026)
- Participants' READMEs confirm the organizers allow any coding tools without disclosure and treat Muse Code as "optional but preferred." — [davidklett/lawnlens](https://github.com/davidklett/lawnlens)
- A different Cerebral Valley hackathon the same week (AIE Code Summit 2026, SF, Nov 7) lists judges Ivan Leo (Google DeepMind) and Mike Beltzner (Meta); not this event. — [Cerebral Valley AIE Code page](https://cerebralvalley.ai/e/aie-code-2026-hackathon)
- Meta for Developers' partner post (Fireworks, Baseten, Modal) is the only Meta-side X activity found about the event. — [Meta for Developers on X](https://x.com/MetaforDevs/status/2112971571321332179)
- Scale reference: Anthropic's two CV virtual hackathons each produced ~227–250 projects from 500 selected; this event admits up to 20,000, implying an order of magnitude more submissions. — [Cerebral Valley on X](https://x.com/cerebral_valley/status/2026066211482857844); [EdTech Innovation Hub](https://www.edtechinnovationhub.com/news/a-doctor-a-carpenter-and-a-teacher-win-anthropics-global-opus-47-hackathon)

### Inferences
- With potentially thousands of Indie submissions and a Nov 5–8 window, first-round judges will be screening videos fast; the first 15 seconds and the README's first screen decide whether a project is read at all. Stage Two scoring is per-criterion 0–10, so a project that is merely "fine" on all four loses to one that is exceptional on two (Impact 30% + Demo 25% = 55%).
- The Nov 4 9PM ET Discord office hours are the last chance to ask @CV an eligibility question (e.g., confirming that pre-existing design docs are fine if all code is new). Ask early on Nov 4 rather than at the deadline.
- Claim the $150 Meta credits and Baseten $100 before building the open-weight path; both deadlines are Nov 4 9PM ET and the card-on-file billing warning is real.

### Gaps
- Judge names, number of submissions, and any Cerebral Valley judging tips posted in Discord after Oct 26 are not publicly indexed; only the Discord itself has them.
- I could not retrieve the Agents 101/102 or Fireworks session recordings; if they are on dev.meta.ai on-demand, watching the "Agents 102: Best Practices for Verifiable Agents" session is the single highest-value remaining research step for the grader-agent design and vocabulary.

---

## 36-hour priority stack (synthesis across KQs; feasible solo)

1. Lock the one-sentence mechanism and write the 3:00 script first (Devpost/HackerEarth: script before code). ~1h.
2. Make the demo path bulletproof: deployed URL, seeded parent+child, cached model responses, pre-compiled lesson, `pnpm smoke`. ~4h.
3. Ship the two "surprise" beats that are cheapest given existing code: SAM 3.1 mask overlay on a real-world mission photo; Muse Voice Transcribe diarized voice exam. Then Muse Image quest art if time. ~8–10h.
4. Make agent orchestration *visible* (agent log/timeline in the parent UI, structured-output schemas in repo). ~3h.
5. README per KQ7 (scope statement, model table, Mermaid diagram, judge path, LICENSE, `.env.example`). ~1.5h.
6. Record segments from the deployed URL, edit, upload unlisted YouTube ("Not for Kids"), at least 3h before deadline. ~4h.
7. X post, then fill the form using the KQ8 drafts; claim credits; final private-window check of the judge path. ~1.5h.
