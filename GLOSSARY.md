# Glossary

Use these words in code, tests, issues and UI. Capitalised in prose.

- **Family**: the unit that owns all data. Every row carries `family_id`.
- **Parent**: the signed-in adult (Google, or the shared Demo Parent). One Family per Parent for now.
- **Child**: a member of the Family with a nickname and birth year only. No account; plays on the Parent's device.
- **Plan**: one free-text note per Child: what to learn, in what language, what to avoid, and Rewards with prices.
- **Make quests**: one press that turns a Plan into about five Quests (planner, writer, illustrator).
- **Quest**: one task for a Child, read aloud, with a cover, a fixed number of Points and one Proof kind.
- **Proof**: what the Child submits for a Quest: a `photo`, a `voice` recording, or (age 8 and up) `text`.
- **Verdict**: the outcome of checking a Proof: `accepted`, `not_yet`, or `needs_parent`. A Parent can change any Verdict.
- **Overrule**: a Parent changing a decided Verdict; it writes an `overrule` Points entry so the balance follows.
- **Points**: earned only from accepted Proofs. The balance is the sum of the insert-only Points log.
- **Reward**: a real-world treat with a Points price, read from the Plan each time Quests are made.
- **Model log**: one `model_calls` row per model call: agent, actual model, input summary, output, tokens, cost, latency, error.
- **Demo Family**: the seeded Family behind the Demo button, rebuilt nightly.

Avoid: lesson, task, exercise (say Quest); submission, answer (say Proof); grade, score (say Verdict); XP, coins (say Points); user (say Parent or Child).
