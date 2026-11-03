# GameSchooling: technical architecture and 36-hour build plan (solo, Meta Model API)

Research date: 2026-11-03 ~22:00 GMT+7. Deadline: Nov 4 2026 9:00 PM ET = Nov 5 09:00 GMT+7 (see `00_event_facts_verbatim.md`). Roughly 35 hours remain at time of writing.

Legend used throughout: **[VERIFIED]** = read directly from the cited primary doc page during this research. **[SECONDARY]** = third-party source only. **[ASSUMED]** = my design decision or training-knowledge claim, not verified against a doc today.

---

## Key Question 1: Which stack minimizes setup time with solid auth and a realtime leaderboard?

### Takeaway
Use **Next.js 16.4 (App Router) + TypeScript + Tailwind + shadcn/ui, Supabase (Postgres + Auth + Realtime + Storage + RLS), Vercel hosting, Vercel AI SDK 7 with `@ai-sdk/openai-compatible` pointed at `https://api.meta.ai/v1`, plus the raw `openai` npm SDK for Images/Responses/SAM and plain `fetch` for ASR multipart**. The Meta Model API is documented as OpenAI-SDK drop-in and explicitly names the Vercel AI SDK as a supported OpenAI-compatible client, so this is the lowest-friction path; Supabase gives auth, RLS multi-tenancy, storage and realtime from one dashboard; Vercel gives one-click deploys with 300s function duration on Hobby.

### Cited Findings
- Meta Model API base URL is `https://api.meta.ai/v1`, auth is `Authorization: Bearer $MODEL_API_KEY`; the API is "drop-in compatible with the OpenAI SDK and the Anthropic SDK" and exposes Responses (`POST /v1/responses`), Chat Completions, Messages, Images (`/v1/images/generations`, `/v1/images/edits`), Voice (`wss://api.meta.ai/v1/asr/realtime`, `POST /v1/asr/transcribe`), SAM via `/v1/responses` and `/v1/files`. [VERIFIED] — [Meta Model API docs landing](https://dev.meta.ai/docs/)
- Meta's SDK page lists "OpenAI-compatible clients: LangChain, LlamaIndex, the Vercel AI SDK, and LiteLLM. Each needs a base URL, your API key, and a model ID." It has **no Vercel AI SDK code snippet**; it says only to set base URL `https://api.meta.ai/v1`, pass the key, and use a model ID such as `muse-spark-1.3`. OpenAI JS SDK config: `new OpenAI({ apiKey: process.env.MODEL_API_KEY, baseURL: "https://api.meta.ai/v1" })`. None of the clients read `MODEL_API_KEY` automatically. [VERIFIED] — [dev.meta.ai/docs/sdks](https://dev.meta.ai/docs/sdks.md)
- `@ai-sdk/openai-compatible`: `createOpenAICompatible({ name, apiKey, baseURL, includeUsage: true })`; supports streaming, tool calling (with streaming), structured output via `supportsStructuredOutputs`, image inputs (provider-dependent); provider chat options include `reasoningEffort` and `strictJsonSchema` (defaults to `true`); `includeUsage` defaults to false. [VERIFIED] — [AI SDK OpenAI-compatible providers](https://ai-sdk.dev/providers/openai-compatible-providers)
- AI SDK structured output is `generateText`/`streamText` with `output: Output.object({ schema })`; read result from `result.output`; streaming gives `partialOutputStream`; failure modes `AI_NoObjectGeneratedError` / `AI_NoOutputGeneratedError`; Zod, Valibot and JSON Schema supported. [VERIFIED] — [AI SDK generating structured data](https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data)
- Third-party guides say `generateObject()`/`streamObject()` are deprecated in AI SDK 6 in favor of `Output.object`. [SECONDARY] — [Smithery ai-sdk-6 skill](https://smithery.ai/skills/laguagu/ai-sdk-6); official recipe shows `generateText` + `Output.object` returning `result.output` — [AI SDK recipe](https://ai-sdk.dev/resources/recipes/next/generate-object)
- Current npm versions (fetched from registry on 2026-11-03): `next` **16.4.4** (react `^18.2.0 || ^19.0.0`, node `>=20.9.0`); `ai` **7.0.162** (peer `zod ^3.25.76 || ^4.1.8`); `@ai-sdk/openai-compatible` **3.0.84** (same zod peer); `@supabase/ssr` **0.12.7** (peer `@supabase/supabase-js ^2.114.0`). [VERIFIED] — [npm next](https://registry.npmjs.org/next/latest), [npm ai](https://registry.npmjs.org/ai/latest), [npm @ai-sdk/openai-compatible](https://registry.npmjs.org/@ai-sdk/openai-compatible/latest), [npm @supabase/ssr](https://registry.npmjs.org/@supabase/ssr/latest)
- Next.js 16.3 was announced Aug 3 2026 on the official blog; a third-party tracker lists 16.4.1 on 2026-10-15. [VERIFIED for 16.3 / SECONDARY for 16.4.1] — [nextjs.org blog](https://nextjs.org/blog?page=1), [versio.io](https://www.versio.io/de/product-release-end-of-life-eol-vercel-nextjs.html)
- Supabase SSR for Next.js: `npm install @supabase/supabase-js @supabase/ssr`; env vars `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; Next.js 16 renamed `middleware.ts` to `proxy.ts` (Supabase code identical); the proxy calls `supabase.auth.getClaims()` to refresh tokens; use `getClaims()` not `getSession()` server-side; create a new server client per request; apply cache headers from `setAll` so CDNs don't cache `Set-Cookie`; refresh tokens are single-use (double refresh triggers reuse detection and random sign-outs). [VERIFIED] — [Supabase server-side auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)
- Supabase Realtime Postgres Changes: `alter publication supabase_realtime add table your_table_name;` then `supabase.channel('x').on('postgres_changes', { event:'INSERT', schema:'public', table:'todos', filter:'id=eq.1' }, cb).subscribe()`; RLS is checked per event per subscriber; filters combine with AND only; RLS not applied to DELETE unless `replica identity full`; Broadcast recommended only above ~3,000 concurrent subscribers. [VERIFIED] — [Supabase Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes)
- Vercel Functions limits with Fluid compute: Hobby max duration **300s** default and max; memory 2 GB; **request/response body max 4.5 MB** (413 `FUNCTION_PAYLOAD_TOO_LARGE`); set `maxDuration` via the duration config. [VERIFIED] — [Vercel Functions limits](https://vercel.com/docs/functions/limits)
- Vercel Cron: configured in `vercel.json`; "available on all plans"; triggers are HTTP GET to the path with user agent `vercel-cron/1.0`; timezone always UTC; 100 crons per project on every plan (changelog link). [VERIFIED] — [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- The official Meta cookbook repo `meta-models/meta-model-cookbook` is Python-first (OpenAI SDK, Colab); the only TypeScript example is `07_sam/01_api_basics`. [VERIFIED] — [meta-model-cookbook](https://github.com/meta-models/meta-model-cookbook)

### Inferences
- **Why not SvelteKit/Remix:** the Meta docs and AI SDK docs only give TS examples in the OpenAI-SDK / AI SDK idiom; shadcn/ui and the Supabase SSR guide are Next-first; the solo dev's muscle memory is the deciding factor in 36h. [ASSUMED]
- **Why not Convex/Firebase:** Supabase gives Postgres (double-entry ledger with SQL views, leaderboard view), RLS multi-tenancy, Storage for generated images/photos/audio, and Realtime in one project with a single env pair; Convex would force re-modeling the ledger and Storage. [ASSUMED]
- **Why not Cloudflare Pages/Workers:** Workers' Node compatibility and body-size handling add risk; Vercel's 300s Hobby duration covers Muse Image (`reasoning_strength: high` is multi-pass) and SAM streaming. [ASSUMED]
- **Two-client policy (important for speed):**
  - `lib/meta/ai-sdk.ts`: `createOpenAICompatible({ name: 'meta', baseURL: 'https://api.meta.ai/v1', apiKey: process.env.MODEL_API_KEY, includeUsage: true })` for chat/streaming UI and `Output.object` structured generation (hits `/v1/chat/completions`).
  - `lib/meta/openai.ts`: `new OpenAI({ baseURL: 'https://api.meta.ai/v1', apiKey })` for `client.images.generate` and `client.responses.create({ model: 'sam-3.1', stream: true })` (the SAM parser consumes OpenAI SDK stream events). [VERIFIED pattern from SAM client-libraries page]
  - `lib/meta/transcribe.ts`: raw `fetch` multipart to `/v1/asr/transcribe` (no SDK covers it).
- **Known pitfalls to pre-empt (from verified docs):**
  1. Meta supports only `tool_choice: "auto"`; `"none"`, `"required"`, and named functions return 400 → never pass `toolChoice: 'required'` in AI SDK. [VERIFIED, see KQ3]
  2. Meta `strict` defaults false but AI SDK's openai-compatible provider sets `strictJsonSchema: true` by default → Meta then validates the schema against the strict subset (root plain object, `additionalProperties: false`, every key in `required`, no `allOf/oneOf`, no recursive `$ref`). Zod `.optional()` fields will violate "required must list every property". Mitigation: avoid `.optional()` (use `.nullable()`), or pass `providerOptions: { meta: { strictJsonSchema: false } }`. [Inferred from VERIFIED strict rules in KQ3]
  3. Vercel 4.5 MB body limit → upload photos/audio **from the browser straight to Supabase Storage**, then pass a signed URL or server-fetched base64 to Meta. SAM and Spark accept public URLs or base64 data URLs. [VERIFIED limits]
  4. `includeUsage: true` so every agent run can log tokens/cost into the audit table. [VERIFIED option]
  5. Don't ship `middleware.ts` on Next 16; file is `proxy.ts`. [VERIFIED]
- **Exact bootstrap commands [ASSUMED but standard]:**
  ```bash
  npx create-next-app@latest gameschooling --ts --tailwind --app --eslint --src-dir=false --import-alias "@/*"
  cd gameschooling
  npx shadcn@latest init -d && npx shadcn@latest add button card badge dialog input label progress tabs avatar sheet toast
  npm i ai @ai-sdk/openai-compatible @ai-sdk/react openai zod @supabase/supabase-js @supabase/ssr @meta-sam/parser @meta-sam/graphics
  npm i -D supabase tsx
  npx supabase init && npx supabase login && npx supabase link --project-ref <ref>
  ```
  (`@meta-sam/*` are ESM-only and need Node `^20.17.0 || >=22.9.0` — see KQ4.)

### Gaps
- No official Vercel AI SDK snippet exists on Meta's docs; whether `Output.object` + tools in the same call works through `/v1/chat/completions` on Meta is untested. Budget 20 minutes in hour 2 to smoke-test streaming, tool calling, and `Output.object` separately (an AI gateway guide gives the same advice). [SECONDARY] — [API7 AI gateway Vercel AI SDK guide](https://docs.api7.ai/ai-gateway/integrations/frameworks/vercel-ai-sdk)
- I did not verify shadcn/ui's current CLI against Next 16.4 / Tailwind v4; assume it works (it has since Next 15).
- Baseten's JS request shape for image/audio parts on `meta-models/muse-spark-open-1026` not found in docs (see KQ3 gaps).

---

## Key Question 2: Multi-tenant family model (schema + RLS)

### Takeaway
One `families` tenant row; `members` holds parents (linked to `auth.users`) and children (no auth user, PIN hash); the family device stays logged in as a parent and "child mode" is a signed httpOnly cookie layered on top, so RLS stays a single predicate (`family_id IN (my families)`) and children never hold a Supabase session. Points are a double-entry ledger; the leaderboard is a SQL view over it; every model call lands in `agent_runs` for an "Agent Console" page judges can inspect.

### Cited Findings
- Supabase recommends protecting pages/data with `getClaims()`; "Anyone can forge the session cookie, so unverified cookie data must never be trusted." [VERIFIED] — [Supabase SSR Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)
- Realtime Postgres Changes authorizes each event per subscriber under RLS; keep RLS policies cheap and indexed. [VERIFIED] — [Supabase Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes)
- Meta structured output: `response_format: { type: "json_schema", json_schema: { name, schema, strict } }` on Chat Completions; `text.format` on Responses; limits: depth 10, 5,000 properties, recursive `$ref` rejected. [VERIFIED] — [Meta structured output](https://dev.meta.ai/docs/structured-output.md)

### Inferences (schema design — all [ASSUMED], written to be pasted into `supabase/migrations/0001_init.sql`)
```sql
-- tenants
create table families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  locale text not null default 'en',           -- 'en' | 'id' | 'ar'
  approach text not null default 'eclectic',   -- montessori | classical | unschooling | eclectic | quran_first
  created_at timestamptz default now()
);

create type member_role as enum ('father','mother','guardian','child');

create table members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  user_id uuid references auth.users(id),      -- null for children
  role member_role not null,
  display_name text not null,
  birth_year int,                              -- children only; drives age bands
  avatar_url text,                             -- Muse Image generated, cached in Storage
  pin_hash text,                               -- children only (bcrypt/argon via pgcrypto crypt())
  created_at timestamptz default now(),
  unique (family_id, user_id)
);

-- curriculum
create table curriculum_profiles (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  child_id uuid references members(id),
  title text not null,                         -- "Singapore Math P3", "Cambridge Science Stage 4", "Quran & Arabic (Iqra)"
  source_notes text,                           -- parent-pasted goals / uploaded syllabus text
  competency_graph jsonb not null,             -- Curriculum Architect output (nodes, edges, mastery thresholds)
  model text, agent_run_id uuid,
  created_at timestamptz default now()
);

create table lesson_plans (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  curriculum_id uuid references curriculum_profiles(id),
  week_start date, title text, goals jsonb, created_at timestamptz default now()
);

create type lesson_kind as enum ('quiz','read_aloud','photo_mission','worksheet','exam','practical');

create table lessons (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  plan_id uuid references lesson_plans(id),
  competency_ids text[] not null default '{}',
  kind lesson_kind not null,
  title text not null, narrative jsonb not null,  -- quest intro, NPC, story beats (Lesson Forge)
  difficulty int not null default 2,              -- 1..5, adjusted by Game Director
  cover_image_path text,                          -- Storage path, pre-generated
  reward_points int not null default 10,
  status text not null default 'draft',           -- draft | published | archived
  created_by text not null default 'agent:lesson_forge',
  created_at timestamptz default now()
);

create table questions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references lessons(id) on delete cascade,
  family_id uuid not null,
  idx int not null,
  qtype text not null,                -- mcq | short | spoken | photo | segment_find
  prompt text not null, media_path text,
  answer_key jsonb not null,          -- {correct:'B'} | {rubric:[...], max:5} | {concept:'round object', min_count:3}
  points int not null default 1
);

create table attempts (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null, lesson_id uuid not null references lessons(id),
  child_id uuid not null references members(id),
  started_at timestamptz default now(), submitted_at timestamptz,
  status text not null default 'in_progress'   -- in_progress | grading | graded | needs_parent
);

create table answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references attempts(id) on delete cascade,
  question_id uuid not null references questions(id),
  family_id uuid not null,
  text_answer text, audio_path text, photo_path text,
  transcript jsonb,                   -- Muse Voice Transcribe raw response
  segmentation jsonb,                 -- SAM boxes/masks summary + crop paths
  grade jsonb,                        -- Examiner: {score, max, verdict, evidence[], second_opinion}
  graded_by text, graded_at timestamptz
);

-- double-entry points economy
create type ledger_account as enum ('child_points','family_bank','rewards_escrow','penalty_sink');
create table ledger_entries (
  id bigint generated always as identity primary key,
  family_id uuid not null references families(id) on delete cascade,
  member_id uuid references members(id),        -- the child the entry concerns
  debit ledger_account not null, credit ledger_account not null,
  amount int not null check (amount > 0),
  reason text not null,                          -- 'lesson_reward' | 'bonus' | 'penalty:late_chores' | 'redeem:ice_cream'
  ref_type text, ref_id uuid,                    -- attempt / redemption / penalty
  created_by text not null,                      -- 'parent:<member_id>' | 'agent:quest_master'
  created_at timestamptz default now()
);
-- child balance = sum(amount where credit='child_points') - sum(amount where debit='child_points')

create table rewards (id uuid primary key default gen_random_uuid(), family_id uuid not null, title text, cost int, icon_path text, active bool default true);
create table redemptions (id uuid primary key default gen_random_uuid(), family_id uuid not null, child_id uuid, reward_id uuid, status text default 'requested', approved_by uuid, created_at timestamptz default now());
create table penalty_rules (id uuid primary key default gen_random_uuid(), family_id uuid not null, title text, points int, auto bool default false);

create view leaderboard as
select m.family_id, m.id as member_id, m.display_name, m.avatar_url,
  coalesce(sum(case when l.credit='child_points' then l.amount else 0 end)
         - sum(case when l.debit='child_points' then l.amount else 0 end),0) as balance,
  coalesce(sum(case when l.credit='child_points' and l.created_at > now() - interval '7 days' then l.amount else 0 end),0) as week_points
from members m left join ledger_entries l on l.member_id = m.id
where m.role='child' group by m.family_id, m.id;

-- audit log of every model call (drives the "Agent Console" page)
create table agent_runs (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade,
  agent text not null,        -- curriculum_architect | lesson_forge | quest_master | examiner | guardian | illustrator | transcriber | segmenter | second_opinion
  model text not null,        -- muse-wonder-1.0 | muse-spark-1.3 | muse-image-1.0 | muse-voice-transcribe-1.0 | sam-3.1 | baseten:meta-models/muse-spark-open-1026
  endpoint text not null,
  input_summary text, output jsonb, evidence_paths text[],
  input_tokens int, output_tokens int, cost_usd numeric(10,6), latency_ms int,
  status text not null default 'ok', error text,
  created_at timestamptz default now()
);

-- RLS
alter table families enable row level security;  -- repeat for every table above
create or replace function my_family_ids() returns setof uuid language sql stable security definer as
$$ select family_id from members where user_id = auth.uid() $$;
create policy fam_select on families for select using (id in (select my_family_ids()));
create policy fam_insert on families for insert with check (true);          -- creator inserts, then inserts self as member in same server action
create policy members_rw on members for all using (family_id in (select my_family_ids())) with check (family_id in (select my_family_ids()));
-- same pattern for every family_id-bearing table; index (family_id) everywhere; index ledger_entries(member_id, created_at)
alter publication supabase_realtime add table ledger_entries;
```
- **Child login without email [ASSUMED design]:** parent signs in (Supabase email+password or magic link). On the child picker page the child taps their avatar and enters a 4-digit PIN; a Server Action verifies with `crypt(pin, pin_hash) = pin_hash` using the parent's RLS-scoped client, then sets an httpOnly cookie `gs_child = <member_id>.<hmac>` (HMAC with `CHILD_SESSION_SECRET`). All child pages are Server Components/Actions that read and verify that cookie, and still query through the parent's Supabase session (so RLS still applies). The browser's realtime subscription to `ledger_entries` filtered by `family_id=eq.<id>` also runs under the parent session. Parent-only pages additionally require `gs_child` to be absent or a parent PIN re-entry. This avoids Supabase anonymous auth and custom claims entirely.
- **Why double-entry:** every reward/penalty/redemption is one insert with two accounts; balances and the leaderboard are pure sums; reversals are new rows; agent-granted points are attributable (`created_by='agent:quest_master'`) — this is what makes "verifiable agent" claims concrete for judges.
- **Realtime leaderboard:** subscribe to INSERT on `ledger_entries` filtered by family, then re-fetch `leaderboard` view (cheap). RLS perf is irrelevant at family scale.

### Gaps
- I did not verify Supabase anonymous sign-in or custom-claims docs today; the cookie design above avoids needing them. If a real per-child device session is wanted later, that is a post-hackathon item.
- `security definer` helper + RLS recursion pitfalls on `members` are from training knowledge, not re-verified today; test with `supabase db reset` locally before deploying.

---

## Key Question 3: Multi-agent orchestration that uses every Meta model non-trivially

### Takeaway
Run an orchestrator-worker design where each agent is a typed server function with JSON-schema output and an `agent_runs` audit row, assign each Meta model to the job its documented strengths fit (Wonder = long-horizon curriculum planning over 1M context incl. PDFs; Spark 1.3 = everything interactive; Muse Image = illustrations/badges/avatars via Responses multi-turn for consistency; Voice Transcribe = spoken answers + read-aloud fluency from turn timestamps; SAM 3.1 = evidence crops for photo missions and worksheets; Spark Open on Baseten = independent second-opinion grader), and surface it all in an "Agent Console" so judges see the orchestration, not just a chatbot.

### Cited Findings (model facts)
- Model IDs and roles on Model API: `muse-wonder-1.0` (preview; text/image/video/audio/PDF → text; Responses/Chat/Messages; 1,048,576 ctx; reasoning effort `minimal`…`max`; "Standard mode only"; not in South Korea); `muse-spark-1.3` (recommended; all reasoning levels incl. `max`; "Audio understanding isn't fully supported, so use 1.2 for audio"); `muse-spark-1.3-contributor` (cheaper, trains Meta models, no `max`); `muse-spark-1.2` (recommended for audio input); `muse-image-1.0` (text+image → image; "Agentic: can search the web and run code before rendering"; Responses for multi-turn editing); `muse-voice-transcribe-1.0` (25 languages, streaming diarization, VAD, turn-level timestamps; no word-level timestamps); `sam-3.1` (noun phrase or marked objects → boxes and masks; video tracking). Muse Spark Open and Muse Glimmer have **no Model API endpoints**. [VERIFIED] — [Meta models page](https://dev.meta.ai/docs/models.md)
- Pricing (pay-as-you-go, per 1M tokens): `muse-wonder-1.0` $4.00 in / $20.00 out / $0.20 cached; `muse-spark-1.3/1.2/1.1` $1.25 / $4.25 / $0.15 cached; `-contributor` $0.10 / $0.20 / $0.002. `muse-image-1.0` $0.01 per generated image (billed only on success, safety-filtered images not billed). `muse-voice-transcribe-1.0` $0.18 per audio hour, metered per whole second. `sam-3.1` $2.50 per 1,000 images; video $0.20 per 1,000 frames (min 50 frames). Web search grounding $2.50 per 1,000 queries. [VERIFIED] — [Meta pricing and rate limits](https://dev.meta.ai/docs/pricing-rate-limits.md)
- Rate limits, **per team not per key**: Wonder/Spark 1.3/1.2/1.1 **3,000 RPM / 4,000,000 TPM**; `-contributor` **150 RPM / 3,000,000 TPM**; `sam-3.1` **3,000 RPM**; `muse-image-1.0` **150 RPM**; voice transcribe 256 concurrent streams, 16,000 streams/hour; `background: true` responses capped at 600/min. [VERIFIED] — same page
- Tool calling: parallel tool calls default true on both endpoints; streamed args via `tool_calls` deltas (Chat) or `response.function_call_arguments.delta` (Responses); `strict` defaults false; **`tool_choice` only `"auto"` — `"none"`, `"required"`, named function return 400**; function names `^[a-zA-Z0-9_.-]+$` with at most one dot; Responses API "preserves reasoning across tool turns" via `previous_response_id` or stateless replay; custom (freeform) tools are Responses-only. [VERIFIED] — [Meta tool calling](https://dev.meta.ai/docs/tool-calling.md)
- Structured output: `strict: true` requires plain-object root, `additionalProperties:false`, all keys in `required`, no `allOf/oneOf`, no recursive `$ref`; output is schema-constrained even with `strict:false`; limits depth 10 / 5,000 properties / 120,000 chars string / 200,000 nodes. Examples use `muse-spark-1.3`; TS example via OpenAI SDK `client.beta.chat.completions.parse()`. [VERIFIED] — [Meta structured output](https://dev.meta.ai/docs/structured-output.md)
- Image understanding (Spark): jpeg/png/gif/webp/ico; inline `image_url` up to 50 MB; up to 50 images per request; public URL, base64 data URL, or Files API `file_id`; user-role messages only; ~1,300–1,500 tokens for a ~1280px image; `POST /v1/responses/input_tokens` for exact counts. [VERIFIED] — [Meta image understanding](https://dev.meta.ai/docs/image-understanding.md)
- Muse Wonder (press/secondary): launched Oct 12 2026; "Active Memory" (keeps details across conversations) and "Active Focus" (keeps working through blockers); Muse Wonder Full is Muse Code-only; Artificial Analysis index Wonder 52 vs Spark 1.3 48. [SECONDARY] — [deeplearning.ai The Batch](https://www.deeplearning.ai/the-batch/meta-releases-wonder-opens-spark/), [AI Magazine](https://aimagazine.com/news/muse-wonder-how-is-meta-competing-at-the-frontier), [apidog](https://apidog.com/blog/what-is-muse-wonder/). The official models page does not describe Active Memory/Focus; it lists Wonder as a preview agentic/coding/reasoning model with the same input modalities as Spark. [VERIFIED] — [Meta models page](https://dev.meta.ai/docs/models.md)
- Muse Spark Open: 816B MoE / 42B active / 256 experts; text, image, video, audio input → text; Muse Model license (commercial use for companies under $20M revenue; must display "Built with Muse Spark Open"); ~$1.25/$4.15 per M via providers. [SECONDARY] — [deeplearning.ai](https://www.deeplearning.ai/the-batch/meta-releases-wonder-opens-spark/)
- Baseten: Muse Spark Open "available through Baseten Model APIs", OpenAI-compatible endpoint at `inference.baseten.co/v1/chat/completions`, model ID `meta-models/muse-spark-open`, accepts text, image, audio, video → text. [SECONDARY summary of Baseten changelog, page body could not be fetched] — [Baseten changelog](https://www.baseten.co/resources/changelog/muse-spark-open-and-nemotron-35-super-vl-available-on-baseten/). Hackathon-specific ID is `meta-models/muse-spark-open-1026` with $100 credits and 2M TPM (from `00_event_facts_verbatim.md`). LangChain's Baseten page says Model APIs are text-only (likely stale). [SECONDARY] — [LangChain Baseten](https://docs.langchain.com/oss/python/integrations/chat/baseten)
- Cookbook patterns Meta publishes: basic agent loop, interleaved reasoning + tool use, multi-turn context management, search-and-replace edits, "alert fatigue copilot" (grounded patterns + strict JSON self-assessment); use cases include "Multi-agent product studio" (four-profile team coordinating through a shared Kanban), "Perception grounding", "Muse robotics" (voice + language + SAM + camera + image). Muse Image recipes: `03_anchored_generation` "keeps characters and style consistent across a series"; SAM recipes: `03_headlocked_speech_bubble_captions` maps diarized voices to tracked people. [VERIFIED] — [Meta agent patterns](https://dev.meta.ai/docs/cookbook/agent-patterns.md), [meta-model-cookbook](https://github.com/meta-models/meta-model-cookbook)
- Event signals: live sessions "Agents 101: Build a Multimodal AI Agent" and "Agents 102: Best Practices for Verifiable Agents"; judging weights Use of Meta AI Tooling 25% ("surfaced capabilities that surprised even us"). — `00_event_facts_verbatim.md`

### Inferences (the agent design — [ASSUMED], grounded in the verified model facts)
Agents live in `lib/agents/*.ts`, each: `(input, ctx) => Promise<TypedOutput>`, wraps the model call in `withAgentRun(agent, model, fn)` which writes `agent_runs` (tokens from `includeUsage`, cost from the verified price table, latency, evidence Storage paths). Orchestration is plain TypeScript (`Promise.all` for fan-out); no job framework.

| Agent | Model (endpoint) | Why this model | Output schema (Zod → JSON schema, strict-compatible) | "Surprise" angle for judges |
|---|---|---|---|---|
| **Curriculum Architect** | `muse-wonder-1.0` via `/v1/responses`, `reasoning: {effort: "high"}` (fallback `muse-spark-1.3` effort `max`) | 1M context + PDF input lets a parent drop a whole syllabus PDF (Singapore Math scheme of work, Cambridge Science stage doc) plus free-text goals and philosophy; Wonder is Meta's agentic/reasoning flagship | `{ competencies: [{id, title, strand, age_band, prerequisites[], mastery_rule}], sequencing: [...], rationale }` | A single call that turns a 60-page PDF + "we are Montessori-leaning, Arabic first" into a dependency graph rendered as an interactive map |
| **Lesson Forge** | `muse-spark-1.3` (Chat Completions via AI SDK `Output.object`) then `muse-image-1.0` | Spark for fast JSON quest generation; Muse Image for cover + per-question illustrations | `{ title, narrative:{npc, intro, beats[]}, questions:[{qtype, prompt, answer_key, points, image_prompt}] }` | Image prompts are generated by Spark, then rendered via Responses API `image_generation` tool with `previous_response_id` chaining so NPC/style stays consistent across a lesson (Meta's own "anchored generation" recipe) |
| **Quest Master / Game Director** | `muse-spark-1.3` with function tools: `grant_points`, `apply_penalty`, `adjust_difficulty`, `unlock_reward`, `ask_parent` | Parallel tool calls (default on) let it, e.g., grant points and unlock a badge in one turn; it only acts through tools that enforce parent rules in SQL | tool calls + short narration | The tools write ledger rows tagged `agent:quest_master`; the parent dashboard shows exactly which points were agent-granted and why (verifiable agent) |
| **Examiner** | Pipeline: `muse-voice-transcribe-1.0` (spoken) → `sam-3.1` (photo/worksheet) → `muse-spark-1.3` vision with rubric → optional **second opinion** from `meta-models/muse-spark-open-1026` on Baseten | Spark grades against the rubric with the SAM crops as evidence; the open-weight model independently grades the same evidence; disagreement → `needs_parent` | `{ score, max, verdict:'correct'|'partial'|'incorrect', evidence:[{crop_path, box, claim}], confidence, second_opinion:{score, agrees:boolean} }` | "Two Meta models must agree before points are paid" — cross-model verification using the open weights as an auditor of the hosted model |
| **Guardian** | `muse-spark-1.3-contributor` for cheap async checks (fallback 1.3) + `muse-wonder-1.0` weekly digest over the whole family history (1M ctx) | Age filter on every generated question/narrative before publish; weekly parent digest | `{ safe:boolean, issues[], rewrite? }` / digest markdown | Safety gate is a separate model call logged in the console, not a prompt line |
| **Illustrator** (helper) | `muse-image-1.0` `/v1/images/generations` (`reasoning_strength: "low"` for speed, `output_format: "webp"`, `n: 1`) | Avatars at child onboarding; badges on level-up | — | Badge images are generated at run time when a child levels up (one call, ~seconds) |

- **Where Muse Wonder fits (answer to the explicit question):** the two jobs where 1M context and heavy reasoning matter and latency doesn't: (1) compiling the competency graph from parent goals + uploaded PDFs/photos of textbook tables of contents (PDF/image input verified), (2) the weekly Guardian digest across all `attempts`, `answers`, `ledger_entries`. Everything interactive stays on Spark 1.3 (same rate limits, 3.2× cheaper input, 4.7× cheaper output). Because Wonder is marked **preview**, every Wonder call has a `muse-spark-1.3` fallback behind a `MODEL_ARCHITECT` env var.
- **Audio caveat:** Spark 1.3's audio understanding "isn't fully supported" [VERIFIED], so spoken answers always go through Voice Transcribe first, then text to Spark 1.3. Do not send audio directly to Spark 1.3. (Optionally send the audio to `muse-spark-1.2` or Spark Open on Baseten for a pronunciation remark as a stretch — not in must-have.)
- **Why orchestrator-in-TypeScript, not Inngest/Trigger.dev:** every pipeline step completes in well under Vercel Hobby's 300s; pre-generation runs in `scripts/pregen-assets.ts` locally; a single Vercel cron (`0 22 * * *` UTC = 05:00 GMT+7) calls `/api/cron/guardian-digest` guarded by `CRON_SECRET`. Adding a job framework in 36h is pure setup cost.
- **Caching generated content per family:** `lessons.cover_image_path` and `questions.media_path` are Storage paths; the Lesson Forge checks `lessons` for an existing published lesson on the same `competency_ids` + `difficulty` before generating; avatars/badges are keyed `avatars/<member_id>.webp`, `badges/<family_id>/<badge_key>.webp`.
- **Streaming to UI:** Lesson Forge streams via `streamText` + `Output.object` → `partialOutputStream` → `useObject` on the client so the parent watches the quest assemble; the Examiner streams a short narration via `streamText` after grading completes.
- **Retries:** Meta documents 503 as retryable with backoff and 429 for rate limits [VERIFIED on images/ASR pages]; wrap every call with 3 attempts, exponential backoff 1s/3s/9s, and never retry 400s.

### Gaps
- Baseten multimodal request body for Spark Open not verified; the second-opinion grader will receive **text + the SAM crop as an OpenAI-style `image_url` part**; if Baseten rejects image parts, fall back to text-only (Spark's transcription of the crop) and label it "text-only second opinion" in the console.
- Whether Meta's `/v1/chat/completions` honors AI SDK `Output.object` while function tools are also present was not tested; design keeps structured-output calls and tool-calling calls separate (Lesson Forge = output only; Quest Master = tools only).
- Muse Wonder "Active Memory/Focus" are only in press coverage; do not claim them in the submission unless the Wonder docs page confirms them at build time.

---

## Key Question 4: SAM 3.1 integration pattern in a web app

### Takeaway
Call `sam-3.1` through `/v1/responses` (OpenAI SDK, `stream: true`, one noun phrase per request, `metadata.mask_encoding: "one_bit"`), parse with the official `@meta-sam/parser` npm package, crop each returned box server-side with `sharp`, store crops in Supabase Storage, and send crops to Spark 1.3 vision for grading/identification; render masks client-side with `@meta-sam/graphics` on a Canvas 2D overlay.

### Cited Findings
- Request: `POST https://api.meta.ai/v1/responses`, `model: "sam-3.1"`, one user message with `input_text` (noun phrase such as `"glasses"`) and `input_image` with `image_url` (public URL or base64 data URL). **One concept per request** — commas/"and"/newlines do not list multiple concepts; avoid commands, questions, negation, spatial phrasing. No matches → `response.completed` with empty `output_text` (not an error). Box/point prompts go in `input_text` as `<0f>1<|box;x1=..;y1=..;x2=..;y2=..;w=..;h=..|>`, max 16 prompted objects; `w`/`h` must equal the media's displayed pixel size. `metadata`: `include_confidence: "true"`, `mask_encoding: "lossless" | "one_bit"`. Streaming recommended; read `response.output_text.delta` until `response.completed`. Image size limits and latency are **not stated**. [VERIFIED] — [Meta SAM segmenting](https://dev.meta.ai/docs/sam/segmenting.md)
- Output grammar: one line per frame `<Nf>` then comma-separated records `id<|box;…[;c=]|><|mask;x=0;y=0[;c=];data=H,W,<enc>payload|>`; payload is base85 (custom alphabet, pass through unchanged); `~` lossless / `!` one_bit marker; `decodeMaskToRaster` → row-major `Uint8Array` of 0/1 with H×W entries. [VERIFIED] — [Meta SAM reading segmentation](https://dev.meta.ai/docs/sam/reading-segmentation.md)
- Client libraries: `npm install @meta-sam/parser` (core), optional `@meta-sam/graphics` (Canvas 2D drawing), `@meta-sam/video`, `@meta-sam/react` (peer react `>=18.2 <20`); Python `pip install meta-sam-parser`. ESM-only; Node `^20.17.0 || >=22.9.0`; root imports only. Functions: `parseImageStream`, `parseVideoStream`, `parseResponsesStream`, `buildObjectPrompt`, `decodeMaskToRaster`, `decodeMaskToRLE`, `decodeMaskToSVGPath`, `recordsOfKind`. Full TS example (OpenAI SDK `client.responses.create({model:'sam-3.1', …, stream:true, metadata:{mask_encoding:'one_bit'}})` → `parseImageStream(events)` → `parsed.finalResult` → `recordsOfKind(result.records,'mask')`). [VERIFIED] — [Meta SAM client libraries](https://dev.meta.ai/docs/sam/client-libraries.md)
- SAM pricing $2.50 / 1,000 images; 3,000 RPM. [VERIFIED] — [pricing](https://dev.meta.ai/docs/pricing-rate-limits.md)
- Meta's own cookbook uses SAM for "Perception grounding" and combines SAM + diarized voice + image in the robotics recipe. [VERIFIED] — [meta-model-cookbook](https://github.com/meta-models/meta-model-cookbook)

### Inferences ([ASSUMED] implementation)
- **Flow for "Find 3 round things in your kitchen" (segment_find question):**
  1. Child takes photo (`<input type=file accept="image/*" capture="environment">`), browser resizes to ≤1600px long edge via canvas (keeps SAM/Spark payloads small and the 4.5 MB Vercel limit irrelevant), uploads to Storage bucket `missions/<family>/<attempt>/<question>.jpg` with the parent-session client.
  2. Server Action `segmentMission()`: `createSignedUrl` (or fetch bytes → base64 data URL) → run `sam-3.1` with the question's `answer_key.concept` (e.g. `"round object"`); if the concept is abstract, first ask Spark 1.3 vision for ≤5 concrete nouns present (`{nouns:[...]}`) and run SAM once per noun with `Promise.all` (3,000 RPM is ample).
  3. For each box record: `sharp(buffer).extract({left:x1, top:y1, width:x2-x1+1, height:y2-y1+1})` → `crops/<answer_id>/<n>.webp` in Storage.
  4. Spark 1.3 vision receives the crops (≤50 images per request verified) + rubric → `{found:[{crop_index, label, is_round:boolean, reason}], count_valid}`; Examiner awards points if `count_valid >= answer_key.min_count`; the crops + boxes are stored as `answers.segmentation` and shown as evidence.
  5. Client overlay: `@meta-sam/graphics` draws masks on a `<canvas>` sized to the displayed image; boxes scaled by `displayedWidth / w` using the `w`/`h` in each token. If `@meta-sam/graphics` API is unclear at build time, fall back to `decodeMaskToSVGPath` → inline `<svg><path/></svg>` overlay (verified function exists).
- **Worksheet flow (photo of a paper worksheet):** Spark 1.3 vision first returns the answer regions as pixel boxes (`{regions:[{q_idx, x1,y1,x2,y2}]}` with the image's w/h), then SAM is called with `buildObjectPrompt({size:[w,h], objects:[...boxes]})` so each handwritten answer becomes a clean crop with a mask (box prompts always return `one_bit`); each crop goes back to Spark 1.3 with the answer key → per-question grade with crop evidence. This is the "evidence-backed grading" story. Expect handwriting legibility to be the weak link; show the crop next to the model's reading so the parent can override (one tap → `needs_parent` → parent sets score; ledger row `created_by='parent:…'`).
- **Latency:** not documented. Streaming is recommended by the docs, so show "Scanning…" with the partial records as they arrive (`for await (const snapshot of parsed)`). Budget 5–15s per image in the demo script; pre-run the demo images during seeding so the recorded video never waits.
- **Image bytes vs URL:** Supabase signed URLs are public-but-unguessable, acceptable for SAM `image_url`; base64 data URLs avoid any URL reachability doubt at the cost of payload size. Default to base64 after the client-side resize.

### Gaps
- No documented SAM image size/resolution limits or latency numbers; test at hour 4 with a real phone photo.
- Segmenting handwriting by concept prompt ("handwritten number") is unproven; the box-prompt path above is the safer primary.

---

## Key Question 5: Voice (MediaRecorder → Muse Voice Transcribe), fluency, multilingual, fallback

### Takeaway
Muse Voice Transcribe's file endpoint only accepts mono 16-bit PCM WAV at 16/24 kHz, so record raw PCM in the browser with an `AudioWorklet`/`ScriptProcessor` and encode WAV client-side (not MediaRecorder's webm/opus), POST to a Route Handler that forwards multipart to `/v1/asr/transcribe` with `languageBias: ["Indonesian","Arabic","English"]`, and compute read-aloud fluency from the returned turn timestamps + Spark's accuracy comparison; fall back to Web Speech API only for display, never for grading.

### Cited Findings
- `POST https://api.meta.ai/v1/asr/transcribe` multipart with `request` (JSON: `mode`, `model`, `audioEncoding`, `partialMode`, `emitAudioProgress`, `languageBias`, `keywords`) and `audio` (WAV). Accepted audio: **RIFF/WAVE, mono, 16-bit integer PCM, 16 kHz or 24 kHz** (convert with ffmpeg `-ac 1 -ar 24000 -c:a pcm_s16le`). Limits: body 32 MB (413), audio 10 minutes (400), 429 on rate/concurrency. No `language` parameter; `languageBias` is a hint (e.g. `["English","French"]`); omit to auto-detect; Indonesian, Arabic, English are among the 25 supported languages. Response: `sessionId`, `transcript`, `audioDurationMs`, `turns[{turnId,startMs,endMs,transcript,speaker}]` (speaker only in `DIARIZATION`; turns empty in `PUSH_TO_TALK`). No word-level timestamps, no `segments`. `Accept: text/event-stream` also supported. curl: `-F 'request={"mode":"DIARIZATION","model":"muse-voice-transcribe-1.0","audioEncoding":"WAV"};type=application/json' -F 'audio=@file.wav'`. Realtime: `wss://api.meta.ai/v1/asr/realtime`, JSON handshake within 10 s with `authorization.accessToken`, `audioEncoding` `PCM_24KHZ|PCM_16KHZ`, binary PCM frames paced real time, events `speechStart|transcript|speaker|speechEnd|speechComplete|audioProgress|error`, end with `{"type":"endStream"}`. Pricing $0.18/hour per whole second; failed requests and 429s not billed. [VERIFIED] — [Meta speech-to-text](https://dev.meta.ai/docs/speech-to-text.md)
- Model page: "25 evaluated languages, with streaming diarization, endpointing, VAD, and turn-level timestamps. No word-level timestamps, speech synthesis, or emotion detection." [VERIFIED] — [models](https://dev.meta.ai/docs/models.md)
- `keywords` field exists in the request JSON (useful for Arabic/Quranic vocabulary and Indonesian proper nouns). [VERIFIED, semantics not detailed] — same page

### Inferences ([ASSUMED])
- **Browser capture:** `navigator.mediaDevices.getUserMedia({audio:{channelCount:1, sampleRate:16000}})` → `AudioContext({sampleRate:16000})` → `AudioWorkletNode` collecting `Float32Array` chunks → on stop, convert to Int16 and write a 44-byte RIFF header (standard ~40-line WAV encoder). Browsers may ignore the requested sample rate; read `audioContext.sampleRate` and resample to 16 kHz with a simple linear resampler if needed. This avoids ffmpeg on Vercel entirely (no ffmpeg binary in Vercel Functions by default).
- **Upload path:** WAV at 16 kHz mono 16-bit = 32 KB/s → a 60 s answer is ~1.9 MB, under Vercel's 4.5 MB body limit, so the Route Handler can accept it directly (`export const maxDuration = 60`). For longer read-aloud passages (>2 min) upload to Storage first and have the server fetch it.
- **Request JSON to send:** `{"mode":"PUSH_TO_TALK","model":"muse-voice-transcribe-1.0","audioEncoding":"WAV","languageBias":["Indonesian","Arabic","English"],"keywords":[…lesson vocabulary…]}`. Use `DIARIZATION` instead when a parent and child are both in the room (gives `turns` with timestamps and speakers; `PUSH_TO_TALK` returns empty `turns`, so if timestamps are needed use `DIARIZATION`).
- **Read-aloud fluency score (no word timestamps available):** words-per-minute = `wordCount(transcript) / (audioDurationMs/60000)`; accuracy = Spark 1.3 compares `transcript` to the passage and returns `{wcpm, omissions[], substitutions[], accuracy_pct}`; pauses approximated from gaps between `turns` in `DIARIZATION` mode. Be honest in the UI: "fluency estimate".
- **Multilingual:** Arabic letter/Quran recitation lessons send `languageBias:["Arabic"]` + `keywords` with the expected ayah words; Indonesian lessons `["Indonesian"]`. Spark 1.3 grades in the lesson language.
- **Fallback:** if `/v1/asr/transcribe` returns 5xx/429 after 3 retries, show the Web Speech API (`window.SpeechRecognition`) interim text as a client-side draft, store `transcript.source = 'web_speech_fallback'`, and mark the answer `needs_parent` (no auto points). Label as fallback in the Agent Console so judges aren't misled.

### Gaps
- Whether `keywords` boosts recognition or merely biases spelling is not detailed on the page.
- Realtime WebSocket from a Vercel Function is not needed; a browser-direct WS would expose the API key, so realtime mode is out of scope for the hackathon.

---

## Key Question 6: Image generation (avatars, badges, lesson art) with Muse Image

### Takeaway
Use `/v1/images/generations` with `muse-image-1.0`, `reasoning_strength: "low"`, `output_format: "webp"`, `response_format: "b64_json"` for one-shot avatars/badges, and the Responses API `image_generation` tool with `previous_response_id` for a lesson's multi-image set so characters stay consistent; store everything in Supabase Storage keyed by entity id; rely on Meta's built-in safety block (400 `content_policy_violation`) plus a Guardian text check on the prompt, since the `moderation` parameter is explicitly unsupported.

### Cited Findings
- Endpoints `POST /v1/images/generations` (text-to-image), `POST /v1/images/edits` (edit/compose), `POST /v1/responses` (multi-turn). Params: `model` (required), `prompt` (required), `n` 1–10, `size` "WxH" sets **aspect ratio only** (ratios beyond 16:1 → 400), `response_format` `b64_json` (default) | `url` (temporary signed URL), `output_format` `webp` (default) | `png` | `jpeg`, `stream`, `user`, Meta extensions `reasoning_strength` (`"high"` default multi-pass, `"low"` single pass, faster) and `tool_enablement` (`enable_image_search`, `enable_web_search`, `enable_shell`, all default true). No `quality` param. Edits: JSON body `images[]` (1–10) each with `image_url` or `file_id`; `mask`, `input_fidelity`, `partial_images` → 400. Responses API: `tools:[{type:"image_generation", size, output_format, reasoning_strength, enable_*}]`, output contains `image_generation_call` items with base64 in `result`; chain with `previous_response_id` or `store:false` + replay. Response shape `{created, data:[{b64_json}], output_format, background:"opaque", usage}`. Streaming emits `image_generation.completed`. **`moderation` is not enabled (400 if sent)**; safety block → 400 `content_policy_violation` on `prompt`; filtered images not billed. 503 retryable, 500 not. No latency figures. TS sample: `client.images.generate({ model:'muse-image-1.0', prompt, n:1 })`. [VERIFIED] — [Meta image generation](https://dev.meta.ai/docs/image-generation.md)
- `muse-image-1.0` rate limit **150 RPM**; $0.01/image. [VERIFIED] — [pricing](https://dev.meta.ai/docs/pricing-rate-limits.md)
- Meta's own cookbook has `05_muse_image/03_anchored_generation` "keeps characters and style consistent across a series" and `04_image_editing_with_reasoning`. [VERIFIED] — [cookbook](https://github.com/meta-models/meta-model-cookbook)

### Inferences ([ASSUMED])
- **Style lock:** a family-level `art_style` string (e.g. "flat vector, soft pastel, thick outlines, no text, child-friendly") prepended to every prompt; `tool_enablement:{enable_web_search:false, enable_image_search:false, enable_shell:false}` for avatars/badges so generations are faster and don't pull real-world imagery; `reasoning_strength:"low"` everywhere except the lesson cover.
- **Consistency across a lesson:** generate the cover via Responses with the `image_generation` tool, then each question illustration as a follow-up turn with `previous_response_id` ("same hero, now holding three apples"). Cheap at $0.01/image.
- **Caching:** `Storage: art/<family_id>/avatars/<member_id>.webp`, `art/<family_id>/badges/<key>.webp`, `art/<family_id>/lessons/<lesson_id>/cover.webp|q<idx>.webp`; the `lessons`/`members`/`rewards` rows store the path; a `getArt(path)` helper returns a long-lived signed URL. Never regenerate if the path exists.
- **Kids' safety:** (1) Guardian (Spark) screens the prompt text before any image call; (2) Meta's safety filter is the second gate; (3) prompts are generated by Spark from the lesson, never typed by the child; (4) parent approval step for custom reward icons. Log every `content_policy_violation` to `agent_runs` with `status='blocked'`.
- **Pre-generation:** the seed script generates all demo family avatars, ~12 badges, and covers for the seeded lessons at ≤150 RPM (add a 500 ms spacing); ~60 images ≈ $0.60.

### Gaps
- No documented latency; measure in hour 3. If `high` takes >30 s, use `low` universally.
- Whether Muse Image can reliably render Arabic script on badges is unknown; design badges with no text.

---

## Key Question 7: Deployment of gameschooling.site, env vars, OG image, public repo

### Takeaway
Create the Vercel project from the GitHub repo in hour 1, add `gameschooling.site` + `www` in Project → Settings → Domains, set the registrar's apex **A record to `76.76.21.21`** and `www` **CNAME to the project-specific `*.vercel-dns-*.com` value shown in the dashboard** (DNS-only if the zone is on Cloudflare), add the env vars, push to `main` on every milestone so the commit log is the evidence trail.

### Cited Findings
- Add a domain via dashboard **Settings → Domains → Add Domain** or CLI `vercel domains add example.com [project]`; adding an apex prompts to add `www`; apex domains are configured with an **A record**, subdomains with a **CNAME** that is unique per project (e.g. `d1d4fc829fe7bc7c.vercel-dns-017.com`); if the domain is used by another Vercel account, verify with a `TXT` at `_vercel`; Vercel redirects between www/apex and recommends explicitly adding both and configuring a redirect; "Changing only the website's A or CNAME record at your current DNS provider does not require moving the rest of your DNS records"; Hobby teams: 50 custom domains/project. [VERIFIED] — [Vercel add a domain](https://vercel.com/docs/domains/working-with-domains/add-a-domain)
- Related Vercel KB: "Point your apex domain to Vercel with an A record (76.76.21.21 or your domain card's value), pair it with a www CNAME"; separate KB on using Cloudflare as a reverse proxy in front of Vercel. [VERIFIED, from the same page's link summaries] — [A record KB](https://vercel.com/kb/guide/a-record-and-caa-with-vercel), [Cloudflare proxy KB](https://vercel.com/kb/guide/can-i-use-a-proxy-on-top-of-my-vercel-deployment)
- Cron jobs via `vercel.json`, GET to the path, `vercel-cron/1.0` UA, UTC only. [VERIFIED] — [Vercel cron](https://vercel.com/docs/cron-jobs)
- Hackathon rules: public repo required; demo must show only hackathon-built work; "clearly identify what was newly developed". — `00_event_facts_verbatim.md`

### Inferences ([ASSUMED] exact steps)
1. `gh repo create <you>/gameschooling --public --license mit --source . --push` (repo already has a `LICENSE` file in this worktree; confirm it is MIT/Apache-2.0 and keep it).
2. Vercel dashboard → Add New Project → import repo → Framework Next.js (auto) → add env vars for Production + Preview:
   `MODEL_API_KEY`, `BASETEN_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (seed/admin only, server-only), `CHILD_SESSION_SECRET`, `CRON_SECRET`, `NEXT_PUBLIC_SITE_URL=https://gameschooling.site`, `MODEL_ARCHITECT=muse-wonder-1.0`, `MODEL_CHAT=muse-spark-1.3`, `MODEL_CHEAP=muse-spark-1.3-contributor`.
3. Settings → Domains → add `gameschooling.site` (accept the `www` prompt; set `gameschooling.site` as primary redirect target).
4. At the registrar (unknown — if Namecheap: Advanced DNS; if Cloudflare: DNS tab with proxy **off/grey cloud** to let Vercel issue the certificate): `A @ 76.76.21.21`, `CNAME www <value from the Vercel domain card>`. Remove any parking A/CNAME records first. Verify in Settings → Domains until "Valid Configuration".
5. `vercel.json`: `{ "crons": [{ "path": "/api/cron/guardian-digest", "schedule": "0 22 * * *" }] }`; the handler checks `Authorization: Bearer ${process.env.CRON_SECRET}`.
6. OG image: `app/opengraph-image.tsx` (Next.js built-in `ImageResponse`) rendering the GameSchooling wordmark + "Built with Meta Muse" — no external service. [ASSUMED Next feature from training knowledge; verify file convention]
7. README sections: What it is · Built during Meta AI Developer Hackathon (Oct 27–Nov 4 2026) — everything in this repo was written during the event · Meta models used (table mapping each model to a feature + file path) · Architecture diagram · Run locally · Seed demo · License. Add `HACKATHON_LOG.md` with timestamped milestones mirroring commits.
8. Commit cadence: `git commit` at every milestone in the hour plan (≥20 commits), conventional messages (`feat(examiner): SAM crops as grading evidence`). Push after each so Vercel preview deploys double as a timeline.

### Gaps
- Where `gameschooling.site` was registered is unknown; the A/CNAME instructions are registrar-agnostic. If nameservers are already on Cloudflare with the orange-cloud proxy on, Vercel's cert issuance can fail — switch to DNS-only.
- I did not fetch the Next.js `opengraph-image` doc page; the convention is from training knowledge.

---

## Key Question 8: Demo-data seeding

### Takeaway
A `scripts/seed-demo.ts` (run locally with the service-role key) creates one family with two parents and three children of different ages, three curricula, six published lessons with pre-generated covers/illustrations, prior attempts and ledger history so the leaderboard is non-trivial, and pre-computed SAM/transcription results for the exact photos and audio used in the video; a `/demo` login button restores this family in one click.

### Cited Findings
- Hackathon demo rule: only hackathon-built features; judges rely on the 3-minute video, code, and live product. — `00_event_facts_verbatim.md`
- Muse Image 150 RPM; SAM 3,000 RPM; Spark 3,000 RPM standard / 150 contributor. [VERIFIED] — [pricing](https://dev.meta.ai/docs/pricing-rate-limits.md)
- Supabase CLI seeding convention `supabase/seed.sql` plus TS scripts is standard; `@supabase/ssr` requires a fresh server client per request, but seeding uses the plain `createClient(url, serviceRoleKey)`. [ASSUMED]

### Inferences ([ASSUMED] seed content)
- Family **"Radhi Homeschool"** (slug `radhi`), locale `id`, approach `eclectic`. Parents: father, mother (email+password accounts created via admin API). Children: **Aisyah (11)**, **Yusuf (8)**, **Maryam (5)** with Muse Image avatars.
- Curricula (3): `Singapore Math P3` (Yusuf) — competency graph from a short pasted scheme-of-work text; `Cambridge Primary Science Stage 6` (Aisyah); `Quran & Arabic: Iqra 3 + Juz Amma` (Maryam + Yusuf). Optional 4th: `Montessori Practical Life` (Maryam) — practical missions.
- Lessons (6) covering every modality: (1) Math quiz "Market Day fractions" (mcq/short, cover + 3 illustrations); (2) Science photo mission "Find 3 living things in the garden" (segment_find, SAM); (3) Worksheet "Long division sheet 2" (photo of a real handwritten sheet, box-prompt SAM crops); (4) Quran read-aloud "Surah Al-Fil" (spoken, Arabic languageBias); (5) Indonesian read-aloud "Si Kancil" paragraph (fluency WCPM); (6) Practical life "Fold 3 shirts" (photo → Spark vision checklist).
- History: 2 weeks of attempts and ledger rows (rewards, 1 penalty "left Lego on floor", 1 redemption "30 min Minecraft") so the leaderboard and parent digest have data; agent_runs rows for the pre-generation so the Agent Console isn't empty on load.
- Pre-generation (`scripts/pregen-assets.ts`): avatars (3), badges (12), covers (6), question art (~15), SAM results for the 2 demo photos, transcripts for the 2 demo WAVs; store outputs with deterministic paths so re-running is idempotent (skip if path exists). Approx cost: ~40 images $0.40 + SAM 4 calls $0.01 + ~2 min audio $0.01 + Spark/Wonder calls <$1.
- Video flow uses seeded lessons for the "child plays" shots and **one live generation** (Lesson Forge streaming) for the "parent authors" shot so judges see real latency once.
- `/demo` route: "Try the demo family" button signs in as the seeded mother (`demo@gameschooling.site` / env-stored password) — label it clearly as a shared demo account; a nightly cron can reset it (stretch).

### Gaps
- Real handwritten worksheet and real kitchen/garden photos must be shot by the developer during the build; no synthetic substitute planned.

---

## Key Question 9: Hour-by-hour plan (GMT+7), scope tiers, risk register

### Takeaway
Freeze features at Nov 4 20:00, record the video while alert (20:00–23:00), submit a complete entry by ~01:00 Nov 5 (= Nov 4 13:00 ET), then sleep with an 8-hour buffer to the 09:00 deadline; the plan allots ~21 build hours, ~5.5 hours video+submission, ~7 hours sleep, and 1.5 hours slack.

### Cited Findings
- Deadline Nov 5 09:00 GMT+7; Nov 4 9 PM ET final Discord office hours; credits must be claimed by deadline. — `00_event_facts_verbatim.md`
- Vercel Hobby 300 s function max. [VERIFIED] — [Vercel limits](https://vercel.com/docs/functions/limits)
- Muse Image and contributor-tier Spark are limited to 150 RPM; Meta documents 503 as retryable and 429 as rate/concurrency. [VERIFIED] — [pricing](https://dev.meta.ai/docs/pricing-rate-limits.md), [images](https://dev.meta.ai/docs/image-generation.md), [ASR](https://dev.meta.ai/docs/speech-to-text.md)

### Inferences — the schedule ([ASSUMED])
**Tue Nov 3**
- 22:00–22:30 — Claim Meta $150 credits + Baseten credits now (deadline-bound); create Supabase project; `create-next-app`; push public repo; import to Vercel; add domain + DNS. Commit 1.
- 22:30–23:30 — Smoke-test every Meta endpoint from a `scripts/smoke.ts`: Spark chat via AI SDK (stream), `Output.object` (strict pitfall check), one tool call, Wonder responses call, `images.generate` (time it), `/v1/asr/transcribe` with a sample WAV, SAM with a sample photo + `@meta-sam/parser`, Baseten `muse-spark-open-1026` text + image part. Record latencies in `HACKATHON_LOG.md`. Commit 2. **This hour decides every fallback below.**
- 23:30–01:00 — Schema migration (KQ2 SQL), RLS, `lib/supabase/{client,server}.ts`, `proxy.ts`, parent sign-up/sign-in, create-family flow, child add with PIN, child picker + PIN cookie. Commit 3–4.
- 01:00–02:00 — Parent shell layout (shadcn sidebar: Curriculum · Lessons · Economy · Leaderboard · Agent Console) + child shell (big buttons, avatar, points). Deploy; verify `https://gameschooling.site` serves. Commit 5.
- 02:00–07:00 — **Sleep (5 h).**

**Wed Nov 4**
- 07:00–08:30 — Curriculum Architect (Wonder → competency graph JSON, fallback Spark) + graph view (simple grouped list/cards; skip D3). Commit 6.
- 08:30–10:30 — Lesson Forge: streaming `Output.object` quest generation → review/publish screen; Illustrator helper (cover via Responses `image_generation`, question art chained). Commit 7–8.
- 10:30–12:00 — Child play loop: quiz (mcq/short) → attempt/answers → Examiner (Spark rubric) → Quest Master tools (`grant_points`) → ledger insert → realtime leaderboard. Commit 9–10.
- 12:00–12:45 — Lunch/walk. 
- 12:45–14:30 — Photo mission + SAM: capture → resize → Storage → SAM → crops (`sharp`) → Spark vision verify → evidence panel with mask overlay. Commit 11–12.
- 14:30–16:00 — Voice: WAV recorder worklet → `/api/transcribe` → fluency score → Examiner grading; Arabic + Indonesian bias. Commit 13.
- 16:00–17:00 — Worksheet flow (Spark regions → SAM box prompts → crops → per-question grades, parent override). Commit 14.
- 17:00–18:00 — Economy UI: rewards catalog, redemption request/approve, penalties; Guardian gate on publish; Agent Console page (table over `agent_runs` with model, cost, latency, evidence thumbnails). Commit 15–16.
- 18:00–19:00 — Baseten second-opinion grader + "agreement" badge in evidence panel; weekly digest endpoint + cron. Commit 17.
- 19:00–20:00 — Seed script + pregen assets; shoot the real worksheet/kitchen photos and record the two demo WAVs; run pregen. **Feature freeze 20:00.** Commit 18.
- 20:00–20:45 — Bug sweep on production URL on a phone (child flows) and laptop (parent flows). Commit 19.
- 20:45–23:00 — **Video (2 h 15 m):** script (15 min) → screen-record parent authoring (live Forge stream), child quiz, photo mission with SAM overlay, spoken answer, leaderboard update, Agent Console → voiceover → cut to ≤3:00 → upload unlisted YouTube.
- 23:00–00:30 — README (hackathon section, model table, architecture), `HACKATHON_LOG.md`, submission text drafts for fields 6, 9, 10, 11 (see event facts), X post for "Most Viral" (optional).
- 00:30–01:00 — **Submit on Cerebral Valley.** Verify repo public, video plays, site loads logged-out. 
- 01:00–07:30 — **Sleep (6.5 h).** 
- 07:30–08:30 Nov 5 — Buffer: re-check submission, hotfix if site is down; do not add features. Deadline 09:00.

**Scope tiers**
- **Must-have (demo-critical, every model visible):** parent auth + family + child PIN; Architect (Wonder); Forge + Muse Image cover; quiz play + Examiner + Quest Master tools + ledger + realtime leaderboard; photo mission with SAM evidence overlay; spoken answer via Voice Transcribe; Agent Console; seed; gameschooling.site live; README.
- **Should-have:** worksheet box-prompt grading; Baseten second opinion; rewards/redemptions/penalties UI; Guardian gate; weekly digest cron; chained question illustrations; read-aloud fluency metrics; Indonesian/Arabic bias.
- **Cut if behind at 16:00:** worksheet flow (keep photo mission only), digest cron, redemption approvals (keep catalog display), competency graph visualization (show list), `@meta-sam/graphics` overlay (show crops only), streaming Forge (plain generate).

**Risk register (what to stub, how to label)**
| Risk | Signal | Mitigation / stub | Honest label in product + README |
|---|---|---|---|
| Wonder preview unavailable / slow / region-blocked | 4xx/5xx at smoke test | `MODEL_ARCHITECT=muse-spark-1.3`, effort `max` | Console shows actual model used per run |
| AI SDK `Output.object` 400 on strict schema | 400 at smoke test | `strictJsonSchema:false`, or use OpenAI SDK `beta.chat.completions.parse` | none needed |
| AI SDK sends unsupported `tool_choice` | 400 | never set `toolChoice`; keep `auto` | none |
| Muse Image >30 s or 150 RPM hit during pregen | timings | `reasoning_strength:"low"`, disable tools, 500 ms spacing; fall back to a static placeholder cover with "illustration pending" | Placeholder is visibly labeled; never claim generated |
| SAM returns nothing for abstract concept | empty output_text | Spark nouns → per-noun SAM; if still empty, Spark-vision-only grading | Evidence panel says "no segmentation evidence; vision-only" |
| `@meta-sam/parser` ESM/Node version issue on Vercel | build error | set Node 22 in project settings; or parse with the documented grammar (regex on box tokens, skip masks) and show boxes only | README notes masks disabled |
| ASR rejects browser WAV | 400 | verify header/sample rate; fallback Web Speech draft + `needs_parent` | Transcript tagged `web_speech_fallback`, no auto points |
| Baseten image parts unsupported | 400 | text-only second opinion | Badge reads "second opinion (text)" |
| Vercel 4.5 MB body | 413 | client-side resize; direct-to-Storage upload | n/a |
| Supabase refresh/sign-out weirdness | random logouts | follow docs: `proxy.ts` only place that refreshes; `getClaims()` | n/a |
| Demo account vandalized before judging | — | nightly reset cron (stretch) or judge-facing read-only mode | README: "shared demo account resets daily" |

### Gaps
- Whether Cerebral Valley allows editing a submission after submitting is unknown; the plan submits a complete entry first and treats any later edit as optional.
- No source on typical Wonder/Spark latency at `max` effort; the smoke test fills this.

---

## Key Question 10: Rate-limit and cost estimate against $150 Meta + $100 Baseten

### Takeaway
At documented prices the whole hackathon (dev loops + pregen + demo + judging traffic) should cost roughly **$10–25 on Meta** and **under $5 on Baseten**, far inside the credits; the only limits that can actually bite are Muse Image's 150 RPM (pregen spacing) and the contributor tier's 150 RPM (don't use contributor models in hot paths).

### Cited Findings
- Prices and limits as in KQ3 (Spark $1.25/$4.25; Wonder $4/$20; Image $0.01; SAM $0.0025/image; ASR $0.18/h; contributor $0.10/$0.20; limits 3,000 RPM / 4M TPM standard, 150 RPM Image and contributor, SAM 3,000 RPM; per team). [VERIFIED] — [pricing](https://dev.meta.ai/docs/pricing-rate-limits.md)
- Vision token cost ~1,300–1,500 tokens per ~1280px image. [VERIFIED] — [image understanding](https://dev.meta.ai/docs/image-understanding.md)
- Baseten hackathon: $100 credits + 2M TPM; Spark Open ≈ $1.25/$4.25 per M via Baseten (third-party listing). — `00_event_facts_verbatim.md`; [SECONDARY] [getmaxim cost calculator](https://www.getmaxim.ai/bifrost/llm-cost-calculator/provider/baseten/model/muse-spark-open)

### Inferences ([ASSUMED] arithmetic from verified prices)
- Curriculum Architect on Wonder: ~15k input (PDF text + goals) + ~4k output = $0.06 + $0.08 = **~$0.14 per curriculum**; 20 dev runs ≈ $3.
- Lesson Forge on Spark: ~3k in / 2.5k out = **~$0.014 per lesson**; 100 dev runs ≈ $1.4.
- Examiner with 5 crops (≈7k vision tokens) + rubric 1k in / 0.8k out = **~$0.013 per graded photo answer**.
- Quest Master tool turn: ~2k in / 0.3k out = **~$0.004**.
- Muse Image: 60 pregen + ~100 dev = **$1.60**.
- SAM: 200 calls = **$0.50**.
- ASR: 1 hour total dev audio = **$0.18**.
- Guardian digest on Wonder with 200k tokens of history: **$0.80 per digest**; run 3 times ≈ $2.4.
- Total Meta ≈ $10–12 nominal; triple for retries/experiments → **<$40**. Baseten second opinions ~2k tokens each × 300 ≈ **$1.5**.
- Throughput: judges' traffic is a handful of RPM; nothing approaches 3,000 RPM. Pregen images at 150 RPM cap → 1 request / 500 ms is safe.

### Gaps
- Baseten's exact per-token price for `muse-spark-open-1026` and any multimodal surcharge were not confirmed on Baseten's own docs.

---

## Appendix A: Repo layout ([ASSUMED])
```
gameschooling/
  app/
    (marketing)/page.tsx               # landing + "Try demo family"
    (auth)/sign-in, sign-up/
    (parent)/p/[family]/{curriculum,lessons,economy,leaderboard,console}/
    (child)/c/[family]/{pick,play/[lesson],missions,rewards}/
    api/transcribe/route.ts            # multipart → Meta ASR (maxDuration 60)
    api/segment/route.ts               # SAM stream → crops
    api/agents/forge/route.ts          # streamText + Output.object
    api/cron/guardian-digest/route.ts
    opengraph-image.tsx
  lib/
    meta/{ai-sdk.ts, openai.ts, transcribe.ts, sam.ts, image.ts, baseten.ts, pricing.ts}
    agents/{architect.ts, forge.ts, questMaster.ts, examiner.ts, guardian.ts, withAgentRun.ts}
    schemas/{competency.ts, lesson.ts, grade.ts}   # Zod, strict-compatible (nullable, not optional)
    supabase/{client.ts, server.ts, admin.ts}
    economy/{ledger.ts, rules.ts}
    child-session.ts                   # HMAC cookie
  proxy.ts
  supabase/migrations/0001_init.sql, supabase/seed.sql
  scripts/{smoke.ts, seed-demo.ts, pregen-assets.ts}
  vercel.json
  README.md, HACKATHON_LOG.md, LICENSE
```

## Appendix B: Minimal verified call shapes to copy
- AI SDK provider (shape from AI SDK docs; base URL/model from Meta docs):
  ```ts
  import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
  export const meta = createOpenAICompatible({ name: 'meta', baseURL: 'https://api.meta.ai/v1', apiKey: process.env.MODEL_API_KEY!, includeUsage: true });
  // generateText({ model: meta('muse-spark-1.3'), output: Output.object({ schema }), providerOptions: { meta: { reasoningEffort: 'low', strictJsonSchema: false } } })
  ```
- SAM (verified TS example, abbreviated): `client.responses.create({ model:'sam-3.1', input:[{type:'message',role:'user',content:[{type:'input_text',text:'yellow school bus'},{type:'input_image',image_url}]}], stream:true, metadata:{mask_encoding:'one_bit'} })` → `parseImageStream(events)` → `await parsed.finalResult` → `recordsOfKind(result.records,'mask')` → `decodeMaskToRaster(m.mask)`.
- Image: `client.images.generate({ model:'muse-image-1.0', prompt, n:1 })` (+ `extra_body`-style fields `reasoning_strength`, `output_format`, `tool_enablement` in raw JSON).
- ASR: multipart `request={"mode":"DIARIZATION","model":"muse-voice-transcribe-1.0","audioEncoding":"WAV","languageBias":["Indonesian","Arabic","English"]}` + `audio=<wav>` → `{transcript, audioDurationMs, turns[]}`.
- Structured output raw: `response_format:{type:'json_schema', json_schema:{name, schema, strict:false}}`.
