# Glossary

Use these words in code, tests, issues and UI. Capitalised in prose.

- **Family**: the unit that owns all data. Every row carries `family_id`.
- **Parent**: a signed-in adult (Google, or the shared Demo Parent). One Family per Parent; a Family may have several Parents, all equal, joined by a single-use invite.
- **Child**: a member of the Family with a nickname and birth year only. No account; plays on the Parent's device, optionally behind a 4-digit **PIN**.
- **Plan**: one free-text note per Child: what to learn, in what language, what to avoid, and Rewards with prices.
- **Starter Plan**: a ready-made Plan text a Parent copies into a Plan and edits freely. No link is kept.
- **Make quests**: one press that turns a Plan into about five Quests (planner, writer, illustrator).
- **Quest**: one task for a Child, read aloud, with a cover, a fixed number of Points and one Proof kind.
- **Guardian check**: a separate Muse Spark call that checks each Quest's text and cover prompt before a Child sees it. Fails twice: the Quest is dropped and shown to the Parent with the reason.
- **Answer**: one question's reply on a worksheet Proof; each gets its own Verdict.
- **Proof**: what the Child submits for a Quest: a `photo`, a `voice` recording, (age 8 and up) `text`, or (age 6 and up) a `worksheet`: one photo of a paper sheet, with a Verdict per answer.
- **Verdict**: the outcome of checking a Proof: `accepted`, `not_yet`, or `needs_parent`. A Parent can change any Verdict.
- **Overrule**: a Parent changing a decided Verdict; it writes an `overrule` Points entry so the balance follows.
- **Points**: earned only from accepted Proofs. The balance comes from the insert-only Points log through the family rules (`src/domain/family-rules.ts`).
- **Stake**: a Child's opt-in bet on a harder Quest: win a bonus with an accepted Verdict, or lose only that bonus. Off by default under 8.
- **Streak**: weeks in a row with Points, with automatic freezes (one per four weeks, at most two). Hidden under 5.
- **Family Goal**: one shared weekly Points target and Reward for the whole Family, shown with two or more Children.
- **Sibling Board**: opt-in per Child; this week's age-adjusted progress, showing only the nearest siblings.
- **Consequence**: a privilege a Parent takes away, with a required reason. Parents only; never touches Points.
- **Digest**: the weekly Muse Wonder summary per Child, for Parents, pointing at the Verdicts it used.
- **Reward**: a real-world treat with a Points price, read from the Plan each time Quests are made.
- **Model log**: one `model_calls` row per model call: agent, actual model, input summary, output, tokens, cost, latency, error.
- **Demo Family**: the seeded Family behind the Demo button, rebuilt nightly.

Avoid: lesson, task, exercise (say Quest); submission (say Proof); grade, score (say Verdict); XP, coins (say Points); user (say Parent or Child).
