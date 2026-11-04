# AGENTS.md

Read [`GLOSSARY.md`](GLOSSARY.md) first and use its words. Specs: GitHub issue #2 (core), issue #1 (post-hackathon features).

## Scripts

- `pnpm dev`: local app on :3000 with local D1 and R2 (applies migrations first). Secrets in `.dev.vars` (`cp .env.example .dev.vars`).
- `pnpm check`: oxlint, oxfmt, `tsc`, Vitest. Run before every commit.
- `pnpm test` / `pnpm vitest run <file>`: tests only.
- `pnpm smoke`: calls every Meta and Baseten endpoint once with real keys. Not part of `check`.
- `pnpm seed`: rebuilds the Demo Family in local D1.
- `pnpm db:generate`: new migration in `migrations/` after editing `src/db/schema.ts`.
- `pnpm deploy`: build, apply remote migrations, deploy the Worker.

## Layout

- `src/domain/`: pure rules. `verdict.ts` (the Verdict rule), `points.ts` (overrules, Rewards), `quest.ts` (Proof kind by age, Points range, worksheet Verdicts), `family-rules.ts` (balance, Stakes, Streaks, Family Goal, Sibling Board: every screen reads the Points log through it).
- `src/models/`: one module per model, all behind `client.ts` (`ModelClient`, the only code that talks to model APIs).
  - `planner.ts` Muse Wonder (fallback Muse Spark), `writer.ts` Muse Spark 1.3, `illustrator.ts` Muse Image,
    `segmenter.ts` SAM 3.1, `transcriber.ts` Muse Voice Transcribe, `judge.ts` Muse Spark 1.3,
    `second-judge.ts` Muse Spark Open on Baseten, `guardian.ts` Muse Spark (Guardian check), `worksheet-reader.ts` Muse Spark,
    `digest.ts` Muse Wonder. `log.ts` writes a model log row for every call; `pricing.ts` prices it.
- `src/services/`: use cases over D1 (`make-quests.ts`, `check-proof.ts`, `worksheet.ts`, `stakes.ts`, `family-goal.ts`, `consequences.ts`, `pin.ts`, `parents.ts`, `starter-plans.ts`, `digest.ts`, `family.ts`, `views.ts`, `demo.ts`, `rewards.ts`). `points-log.ts` holds the guarded Points log writes: each check rides on its own insert, so concurrent requests cannot double-pay or overspend. `deps.ts` holds the ports (`Deps`, `Blobs`).
- `src/content/`: Starter Plan texts.
- `src/server/`: Worker wiring (auth, session, server functions). `src/routes/`: screens and API routes. `src/lib/`: browser-only code (image resize, WAV recording, SAM mask drawing, speech).
- `src/server.ts`: Worker entry (`fetch`, nightly Demo re-seed, Monday Weekly Digests).

## Rules

- Every server function calls `requireParent()` and passes its `familyId` down; every query filters by it.
- The Worker only stores, reads and waits on model APIs. Image resizing, WAV encoding and mask drawing run in the browser.
- Never use `muse-spark-1.3-contributor`, never send audio to Muse Spark, never set `tool_choice`. Prompts carry the Child's age and the Plan, never names.
- Tests go through services with `src/test/harness.ts` (in-memory libsql with real migrations, fake `ModelClient`). Assert what a Parent or Child would see, not tables or calls.
