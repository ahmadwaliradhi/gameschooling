# Meta Model API and Meta models: developer fact sheet for GameSchooling (state as of 2026-11-03)

Reading guide: every fact below is tagged with the page it came from. "Confirmed" = read directly from a dev.meta.ai docs page, the Meta cookbook repo, the Hugging Face model card, or Baseten docs. "Unverified" / "inferred" are marked as such. All dev.meta.ai pages loaded without login (a "Please confirm your identity" SSO overlay appears but does not block content); only "Start building", the dashboard (`/platform`) and API-key creation require login. One important correction to the event-facts file: `ai.developer.meta.com/docs` 302-redirects to `https://dev.meta.ai/docs/`, so dev.meta.ai is the canonical docs host.

## Q1. Base URL, model identifiers, protocols, SDKs, auth, rate limits, pricing, errors

### Takeaway
Meta Model API is a single OpenAI-compatible (and Anthropic-Messages-compatible) service at `https://api.meta.ai/v1` with Bearer auth; every model in the hackathon list except Voice Transcribe is called through the OpenAI SDK (Responses or Chat Completions), and the exact hosted model IDs are `muse-spark-1.3`, `muse-spark-1.2`, `muse-spark-1.1` (+ `-contributor` variants), `muse-wonder-1.0`, `muse-image-1.0`, `muse-voice-transcribe-1.0`, `sam-3.1`.

### Cited Findings
- Base URL `https://api.meta.ai/v1`; auth is `Authorization: Bearer <key>` with the key conventionally in env var `MODEL_API_KEY`; send `Content-Type: application/json` — [dev.meta.ai/docs](https://dev.meta.ai/docs/)
- Three protocols: Responses API (`POST /v1/responses`), Chat Completions (OpenAI-compatible, `POST /v1/chat/completions`), Messages API (Anthropic-compatible, base `https://api.meta.ai` without `/v1`) — [dev.meta.ai/docs](https://dev.meta.ai/docs/); [SDKs page](https://dev.meta.ai/docs/sdks)
- Other endpoints: `POST /v1/images/generations`, `POST /v1/images/edits` (Muse Image); `POST /v1/asr/transcribe` and `wss://api.meta.ai/v1/asr/realtime` (Voice); `POST /v1/files` (file upload, used with SAM, video, images) — [dev.meta.ai/docs](https://dev.meta.ai/docs/)
- Hosted model ID table: `muse-wonder-1.0` (preview), `muse-spark-1.3`, `muse-spark-1.2`, `muse-spark-1.1`, `muse-spark-1.3-contributor`, `muse-spark-1.2-contributor`, `muse-image-1.0`, `muse-voice-transcribe-1.0`, `sam-3.1`. Muse Spark Open and Muse Glimmer are NOT served on Model API — [Models page](https://dev.meta.ai/docs/models)
- Model API key format is `LLM|{numeric_id}|{secret}` (cookbook `.env` instructions) — [meta-model-cookbook README](https://github.com/meta-models/meta-model-cookbook)
- No Meta-specific SDK: use `pip install openai` (Python 3.9+) / `npm install openai` (Node 18+), or the Anthropic SDK (pass key as `auth_token`, base `https://api.meta.ai`; first content block is `redacted_thinking`, so read `text` blocks), or LiteLLM (`openai/` prefix + `api_base`), LangChain, LlamaIndex, Vercel AI SDK — [SDKs page](https://dev.meta.ai/docs/sdks); [Quickstart](https://dev.meta.ai/docs/quickstart)
- Gotcha: OpenAI/Anthropic SDKs do not auto-read `MODEL_API_KEY`; pass `api_key=os.environ["MODEL_API_KEY"]` explicitly (or set `OPENAI_API_KEY` to the Meta key) — [Quickstart](https://dev.meta.ai/docs/quickstart)
- Pricing per 1M tokens (Standard / Contributor): Muse Spark 1.3/1.2/1.1 input $1.25 / $0.10, cached input $0.15 / $0.002, output $4.25 / $0.20; Muse Wonder input $4.00, cached $0.20, output $20.00 (no contributor). Web search grounding $2.50 per 1,000 queries. Muse Image $0.01/image. Voice $0.18/hour of audio ($3 per 1,000 min). SAM 3.1 $2.50 per 1k images, $0.20 per 1k video frames, min 50 frames billed per video request — [Pricing & rate limits](https://dev.meta.ai/docs/pricing-rate-limits)
- Contributor mode = discounted in exchange for Meta using your content to train; not available for Muse Wonder or Voice Transcribe; Standard mode content "is not used to train Meta models" — [Pricing & rate limits](https://dev.meta.ai/docs/pricing-rate-limits)
- Rate limits are per team, not per key: `muse-wonder-1.0` and `muse-spark-1.3/1.2/1.1` 3,000 RPM / 4,000,000 TPM; `-contributor` 150 RPM / 3,000,000 TPM; `sam-3.1` 3,000 RPM; `muse-image-1.0` 150 RPM; voice 256 concurrent streams and 16,000 streams/hour; background responses capped at 600 submissions/min — [Pricing & rate limits](https://dev.meta.ai/docs/pricing-rate-limits)
- Rate-limit headers: `x-ratelimit-limit-tokens`, `x-ratelimit-remaining-tokens`, `x-ratelimit-limit-requests`, `x-ratelimit-remaining-requests`; on 429 honour `Retry-After`, backoff with jitter starting ~500 ms — [Pricing & rate limits](https://dev.meta.ai/docs/pricing-rate-limits)
- Error codes: 401 `invalid_api_key`, 402 `billing_not_configured`, 404 `model_not_found` / `file_not_found`, 413 `payload_too_large`, 429 `rate_limit_exceeded`, 503 `service_overloaded` / `backend_unavailable` / `server_shutting_down` (Retry-After: 60), 504 `gateway_timeout` (non-streaming request exceeded server time limit; for streaming the limit applies only to the first event), 400 `content_policy_violation` (media). Validation errors usually have `code: null`. Retry 429/500/503 with backoff (cap 3-5 attempts); do not blindly retry 504, use streaming or `background: true` instead — [Error handling](https://dev.meta.ai/docs/error-handling)
- Billing rules: pay-as-you-go, no minimums; no long-context premium; Meta's injected system scaffolding is not billed; Muse Image billed only for successfully returned images; voice billed per whole second rounded down — [Pricing & rate limits](https://dev.meta.ai/docs/pricing-rate-limits)
- Third-party routes also exist: Muse Spark on OpenRouter (`openrouter.ai/meta/muse-spark-1.2`), Muse Image on fal, Runway, OpenRouter — [Model API product page](https://dev.meta.ai/products/meta-model-api); [Muse Image page](https://dev.meta.ai/models/muse-image)

Minimal snippets (confirmed shapes from Quickstart / cookbook):

```bash
# curl, Responses API
curl -X POST "https://api.meta.ai/v1/responses" \
  -H "Authorization: Bearer $MODEL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "muse-spark-1.3", "input": "What is the capital of France?"}'
```

```python
# Python, OpenAI SDK, Chat Completions (cookbook quickstart)
import os
from openai import OpenAI
client = OpenAI(base_url="https://api.meta.ai/v1", api_key=os.environ["MODEL_API_KEY"])
r = client.chat.completions.create(model="muse-spark-1.3",
    messages=[{"role": "user", "content": "Hello, world!"}])
print(r.choices[0].message.content)
```

```ts
// TypeScript, OpenAI SDK, Responses API
import OpenAI from "openai";
const client = new OpenAI({ baseURL: "https://api.meta.ai/v1", apiKey: process.env.MODEL_API_KEY });
const res = await client.responses.create({ model: "muse-spark-1.3", input: "What is the capital of France?" });
console.log(res.output_text);
```

### Inferences
- For a Next.js/TypeScript web app, one `OpenAI` client instance with `baseURL: https://api.meta.ai/v1` covers Muse Spark, Muse Wonder, Muse Image (via `client.images.generate` / `client.responses.create`) and SAM 3.1 (via `client.responses.create`). Only Voice Transcribe needs a raw `fetch` multipart POST or a WebSocket client.
- The $150 hackathon credit goes far: at Muse Spark standard pricing a 2k-in/1k-out lesson generation costs ~$0.007; Muse Image is $0.01/image; a 1-minute child voice answer costs $0.003; a SAM image call is $0.0025.

### Gaps
- Regional availability of Model API is not documented on any page fetched (docs mention 403 "team restrictions on specific models or endpoints" only). Check `https://dev.meta.ai/help` or the dashboard after login.
- Numeric server time limit for non-streaming requests is not published; only "504 gateway_timeout" behaviour is. Stream anything that might run >~60 s (inferred safe practice).
- Free-tier / rate-limit tiers beyond the per-model table are not documented; whether hackathon accounts get the same 3,000 RPM is unverified.

## Q2. Muse Spark series (1.1 / 1.2 / 1.3): differences, modalities, tools, structured output, reasoning, context, pricing

### Takeaway
All three Muse Spark versions are 1,048,576-token-context multimodal reasoning models (text, image, video, audio, PDF in; text out) with the same pricing; 1.3 is the recommended default (better agentic/coding behaviour, `max` reasoning), 1.1 is the original "standard mode only" model, and the `-contributor` variants are 12x cheaper but train on your data and lack `max` reasoning.

### Cited Findings
- Model IDs and modalities: `muse-spark-1.3`, `muse-spark-1.3-contributor`, `muse-spark-1.2`, `muse-spark-1.2-contributor`, `muse-spark-1.1`; input text, image, video, audio, PDF; output text; context 1,048,576 tokens; "audio input not fully supported" note on 1.3; 1.3 "recommended for new work"; 1.1 "original version, standard mode only, not available in Muse Code" — [Models page](https://dev.meta.ai/docs/models)
- Muse Spark 1.3 product page: perceives video, images, documents; trained for long-horizon agentic tasks, "reliable" tool calling, fewer unnecessary turns in coding; benchmarks run at `max` reasoning (e.g. Terminal-Bench 2.1 88.8, MRCR 512K-1M 98.1, DeepSWE 75.4) vs 1.2 at `xhigh` (82.9 / 55.5 / 55.0) — [Muse Spark page](https://dev.meta.ai/models/muse-spark)
- Secondary coverage of 1.3 launch (Sep 2026): ~20% fewer tool calls and ~25% fewer tokens than 1.2 on internal coding comparisons; better long-form instruction following; improved awareness of its own limitations; `max` reasoning initially limited preview; one blog claims audio regressed vs 1.2 (unconfirmed) — [ProPakistani](https://propakistani.pk/2026/09/03/meta-launches-muse-spark-1-3-with-faster-coding-and-smarter-agents/); [mezha.ua](https://mezha.ua/en/news/meta-muse-spark-1-3-314839/)
- Reasoning: Chat Completions uses top-level `reasoning_effort`; Responses uses `reasoning: {"effort": ...}` plus optional `reasoning.summary` (`auto`/`concise`/`detailed`). Values `minimal`, `low`, `medium`, `high`, `xhigh`; `max` supported by `muse-wonder-1.0` and `muse-spark-1.3` only (not contributor); `none` returns 400 on Muse models. If omitted the model picks a level. Raw reasoning is never returned; reasoning tokens count toward `max_tokens`/`max_output_tokens` and are billed as output (`completion_tokens_details.reasoning_tokens`). Chat Completions cannot carry reasoning across turns (`reasoning_content` redacted); Responses can via `previous_response_id` or `include: ["reasoning.encrypted_content"]` — [Reasoning](https://dev.meta.ai/docs/reasoning)
- Tool calling: `tools` array (Chat Completions nests under `function`; Responses top-level `name/description/parameters`); `tool_choice` only `"auto"` (others 400); `parallel_tool_calls` default true; `strict` default false and arguments are NOT guaranteed to match schema, so validate; built-in `web_search` (server-side) and `tool_search` (`defer_loading: true`); `max_tool_calls` caps built-in tools; names must match `^[a-zA-Z0-9_.-]+$` — [Tool calling](https://dev.meta.ai/docs/tool-calling)
- Structured output: `response_format: {"type": "json_schema", "json_schema": {...}}` on Chat Completions, `text.format` on Responses; constrained decoding so output always conforms regardless of `strict`; limits: depth 10, 5,000 properties, no recursive schemas, enum 1,000 values; Pydantic via `client.beta.chat.completions.parse()` — [Structured output](https://dev.meta.ai/docs/structured-output)
- Chat Completions rejects (400): `stop`, `logit_bias`, `prediction`, `n>1`, `verbosity`, `web_search_options` (use Responses), `modalities`/`audio` (no audio output), `logprobs: true`, `reasoning_effort: "none"`, `max_output_tokens`, `text.format`. `frequency_penalty`/`presence_penalty` should be left unset. `max_completion_tokens` preferred over deprecated `max_tokens` — [Chat Completions protocol](https://dev.meta.ai/docs/protocols/chat-completions)
- Image input: Responses `input_image` with `image_url` (http(s) URL or `data:image/jpeg;base64,...`) or `input_file` with `file_id`; Chat Completions `image_url: {url: ...}`; images only in `user` messages; formats JPEG/PNG/GIF/WebP/ICO; max 50 MB inline, 1 GiB via Files API, 50 images per request, first 50 PDF pages; token cost scales with resolution (~1,300-1,500 tokens for ~1280px image); exact count via `POST /v1/responses/input_tokens` — [Image understanding](https://dev.meta.ai/docs/image-understanding)
- Video input: `input_video` with `video_url` (public or base64 data URL) or `file_id` (upload with `purpose: "user_data"`), or Responses `input_file`; Chat Completions `video_url` content part; mp4 only; examples use `muse-spark-1.3` — [Video understanding](https://dev.meta.ai/docs/video-understanding)
- Prompt caching: cached-input rate applies when prompt prefix matches; `prompt_cache_key` and `prompt_cache_retention` accepted on Chat Completions — [Pricing & rate limits](https://dev.meta.ai/docs/pricing-rate-limits); [Chat Completions protocol](https://dev.meta.ai/docs/protocols/chat-completions)

Snippet: structured-output grader with tool calling (Chat Completions, confirmed parameter shapes):

```python
from openai import OpenAI; import os, json
client = OpenAI(base_url="https://api.meta.ai/v1", api_key=os.environ["MODEL_API_KEY"])
schema = {"type":"object","properties":{
  "score":{"type":"integer"},"max_score":{"type":"integer"},
  "feedback_for_child":{"type":"string"},"misconceptions":{"type":"array","items":{"type":"string"}},
  "xp_awarded":{"type":"integer"}},
  "required":["score","max_score","feedback_for_child","misconceptions","xp_awarded"],
  "additionalProperties":False}
r = client.chat.completions.create(
  model="muse-spark-1.3", reasoning_effort="medium",
  messages=[{"role":"system","content":"You grade a 9-year-old's answer against the rubric. Be kind, concrete."},
            {"role":"user","content":[{"type":"text","text":"Rubric: ...\nChild's answer (photo):"},
              {"type":"image_url","image_url":{"url":"data:image/jpeg;base64,..."}}]}],
  response_format={"type":"json_schema","json_schema":{"name":"Grade","schema":schema,"strict":True}})
grade = json.loads(r.choices[0].message.content)
```

### Inferences
- Use `muse-spark-1.3` for every text/agent role (curriculum planner, lesson writer, exam generator, grader, quest-master). Use `reasoning_effort="low"` for chatty kid-facing turns (latency), `"high"` for curriculum planning and grading. Use `-contributor` only for demo-time bulk generation if cost matters (it is 12x cheaper) — but note data-use implications for a children's product.
- Multimodal grading (child uploads photo of worksheet) can be done by Muse Spark directly via `image_url`; SAM 3.1 is only needed when you want per-object masks.
- The "audio input not fully supported" note on 1.3 means: do not send raw child audio to Muse Spark; route it through Muse Voice Transcribe first.

### Gaps
- No official changelog page comparing 1.1 vs 1.2 vs 1.3 was found; differences above combine the Models page prose and secondary press. Likely page to check after login: `https://dev.meta.ai/docs/models` and Meta AI blog.
- Max output tokens per model is not published anywhere fetched.
- Whether the `max` reasoning level is generally available (press said "limited preview" in Sep 2026) vs Reasoning docs listing it as supported on 1.3 — the docs are newer; treat `max` as available but fall back to `xhigh` on 400.

## Q3. Muse Wonder: what it is, modality, how to call, best use

### Takeaway
Muse Wonder (`muse-wonder-1.0`, preview) is Meta's frontier agentic model for long-running multi-hour tasks, large-repo coding and computer use, with the same multimodal inputs and 1M context as Muse Spark but ~3-5x the price; "Muse Wonder Full" exists only inside Muse Code subscriptions.

### Cited Findings
- Two variants: `muse-wonder-1.0` (Model API + Muse Code) and `muse-wonder-full-1.0` (Muse Code Power $50/mo or Maximum $200/mo subscription only); 1M context; positioned as "frontier coding, long-running agents and advanced computer use"; features: multi-file parallel changes with verification, hours-long multi-step tasks with planning, sub-agent delegation, parallel tool calls, error recovery, "active memory" across conversations — [Muse Wonder page](https://dev.meta.ai/models/muse-wonder)
- Models page: input text, image, video, audio, PDF; output text; reasoning effort `minimal`..`max`; supports chat, image/video/audio understanding, tool calling, structured output, search grounding, computer use; standard mode only, "in preview" — [Models page](https://dev.meta.ai/docs/models)
- Pricing: $4.00 input / $0.20 cached / $20.00 output per 1M; 3,000 RPM, 4M TPM — [Pricing & rate limits](https://dev.meta.ai/docs/pricing-rate-limits)
- Called identically to Muse Spark (the docs' first-call example is a curl to `/v1/responses` with `"model": "muse-wonder-1.0"` and `"reasoning": {"effort": "high"}`) — [dev.meta.ai/docs](https://dev.meta.ai/docs/)
- The GitHub-agent cookbook is explicitly "built with Muse Wonder"; Muse Wonder Full claimed to top DeepSWE and SWE-Marathon in third-party runs — [Muse Wonder page](https://dev.meta.ai/models/muse-wonder)

### Inferences
- In GameSchooling, Muse Wonder is best cast as the parent-side "Curriculum Architect" orchestrator: one long-horizon call that plans a multi-week curriculum, delegates lesson/exam/art generation to Muse Spark and Muse Image via tool calls, and verifies the result. Keep kid-facing real-time turns on Muse Spark for cost/latency. This also gives a natural "Agents 101/102" story (orchestrator + verifiable sub-agents).
- Because it is in preview, wrap it with a fallback to `muse-spark-1.3` on 404/403.

### Gaps
- No Muse-Wonder-specific API parameters (e.g. memory, sub-agent APIs) are documented; those appear to be Muse Code features, not API features. Unverified whether "active memory" is exposed via API.

## Q4. Muse Image: generation, editing, sizes, safety, pricing, consistency

### Takeaway
`muse-image-1.0` is a single agentic model for text-to-image, editing and composition, $0.01/image, callable via OpenAI-style `/v1/images/generations` and `/v1/images/edits` or conversationally via `/v1/responses` with the `image_generation` tool; character consistency is achieved by chaining turns with `previous_response_id` and/or attaching reference images.

### Cited Findings
- Three endpoints: Responses API (`POST /v1/responses`, only the `image_generation` tool allowed, multi-turn refinement); `POST /v1/images/generations` (one-off); `POST /v1/images/edits` (edit/compose, 1-10 input images each as `image_url` (public URL or base64 data URL) or `file_id`) — [Image generation](https://dev.meta.ai/docs/image-generation)
- Parameters: `prompt` (required), `n` 1-10 (default 1), `size` as `"WxH"` string that sets aspect ratio only (returned dimensions may differ; ratios >16:1 → 400), `response_format` `b64_json` (default) or `url` (temporary signed URL), `output_format` `webp` (default) / `png` / `jpeg`, `stream: true` (emits `image_generation.completed` / `image_edit.completed`), `user`/`safety_identifier`. `mask`, `input_fidelity`, `partial_images` → 400 `unsupported_parameter`. `moderation` param → 400. Tool controls: `enable_image_search`, `enable_web_search`, `enable_shell` (all default true), `reasoning_strength` `"high"` (default) / `"low"` — via `tool_enablement` + `extra_body` on images endpoints — [Image generation](https://dev.meta.ai/docs/image-generation)
- Responses-API output items: `reasoning` (summary), `message`, one `image_generation_call` per image with base64 in `result`; `store` defaults true; chain with `previous_response_id`; any non-`image_generation` tool → 400 — [Image generation](https://dev.meta.ai/docs/image-generation)
- Response shape (images endpoints): `created`, `data[]` with `b64_json` or `url`, `output_format`, `background` (always `opaque`), `usage` — [Image generation](https://dev.meta.ai/docs/image-generation)
- Safety: content-safety blocks return 400 `content_policy_violation` (`param: prompt`); failed/safety-filtered images are not billed — [Image generation](https://dev.meta.ai/docs/image-generation)
- Pricing $0.01/image regardless of reasoning strength or tool use; built-in web/image search not charged separately; rate limit 150 RPM — [Pricing & rate limits](https://dev.meta.ai/docs/pricing-rate-limits)
- Product page capabilities: plans before rendering, pulls web references, generates/runs code where precision matters, verifies result; edits change only what is specified; multi-turn refinement incl. typography; "anchored generation" keeps character/style/setting consistent across a series using a small reference set — [Muse Image page](https://dev.meta.ai/models/muse-image)
- Anchored series recipe: build anchors (character sheet on plain white background, full body, centered; location plates with "no characters"), then chain panels with `previous_response_id` referring to "the cat shown earlier"; repeat the same style words every prompt; add "no speech bubbles, no text, single comic panel"; existing art can be attached once as `input_image`; output is non-deterministic and consistency is not guaranteed; each chained turn grows context — [Anchored image series cookbook](https://dev.meta.ai/docs/cookbook/anchored-image-series)
- Cookbook recipes: generate/edit/compose; search-grounded generation; anchored series; editing with reasoning (`05_muse_image` in repo) — [Cookbook index](https://dev.meta.ai/docs/cookbook); [cookbook repo](https://github.com/meta-models/meta-model-cookbook)

Snippets (confirmed shapes):

```python
# one-off badge/illustration
import base64, os
from openai import OpenAI
client = OpenAI(base_url="https://api.meta.ai/v1", api_key=os.environ["MODEL_API_KEY"])
r = client.images.generate(model="muse-image-1.0", n=1, size="1024x1024",
    prompt="flat vector reward badge, gold star, 'FRACTIONS MASTER' text, kid-friendly, white background",
    extra_body={"output_format": "png"})
open("badge.png","wb").write(base64.b64decode(r.data[0].b64_json))

# consistent mascot across lessons via Responses chaining
anchor = client.responses.create(model="muse-image-1.0",
    input="Character sheet: Pip, a small orange fox explorer with a green scarf, full body, plain white background, soft storybook style")
prev = anchor.id
img = [o for o in anchor.output if o.type == "image_generation_call"][0].result  # base64
scene = client.responses.create(model="muse-image-1.0", previous_response_id=prev,
    input="Pip the fox shown earlier counting 3 apples under a tree, same soft storybook style, no text")
```

```bash
curl -X POST "https://api.meta.ai/v1/images/generations" \
  -H "Authorization: Bearer $MODEL_API_KEY" -H "Content-Type: application/json" \
  -d '{"model":"muse-image-1.0","prompt":"watercolor map of ancient Rome for a 10-year-old, labelled","n":1}'
```

### Inferences
- GameSchooling roles: (a) lesson illustrations and story panels (anchored mascot series = strong "surprising use" story); (b) reward badges/stickers per quest; (c) edit-based mechanics, e.g. child uploads their drawing, Muse Image "levels it up" or adds the mascot; (d) worksheet/exam figure generation (geometry diagrams via its built-in code execution).
- Latency is undocumented; with `reasoning_strength: "high"` and web search on, expect multi-second to tens-of-seconds generations (inferred from "plans, searches, runs code, verifies"). Pre-generate assets at curriculum-build time; use `reasoning_strength: "low"` and `enable_web_search: false` for live demo paths.

### Gaps
- Max resolution, exact default size, and latency are not published. Check `https://dev.meta.ai/docs/api-reference/images/schemas` after login.
- No documented child-specific safety settings; only the generic content-policy block.

## Q5. Muse Voice Transcribe: languages, formats, streaming vs batch, diarization, timestamps, pricing

### Takeaway
`muse-voice-transcribe-1.0` is a streaming-first ASR model (WebSocket realtime or one-shot WAV upload) with 25 validated languages including English, Arabic and Indonesian, built-in diarization and endpointing, turn-level timestamps only (no word-level timestamps or confidences), at $0.18 per audio hour.

### Cited Findings
- Endpoints: `wss://api.meta.ai/v1/asr/realtime` (auth sent in the first handshake frame as `authorization.accessToken: "Bearer <key>"`; HTTP header ignored) and `POST https://api.meta.ai/v1/asr/transcribe` (multipart: `request` JSON part + `audio` WAV part; `Authorization: Bearer` header). Optional `sessionId` query param — [Speech to text](https://dev.meta.ai/docs/speech-to-text/)
- Request fields: `model`, `mode` (`PUSH_TO_TALK` default single turn; `ENDPOINTING` model detects turns; `DIARIZATION` labels speakers), `audioEncoding` (`WAV` for upload; `PCM_24KHZ` native or `PCM_16KHZ` for realtime), `languageBias` (list of language names, hint only; omit for auto-detect), `keywords` (biasing, no exact-spelling guarantee), `partialMode` (`CUMULATIVE` default / `DELTA`), `emitAudioProgress` — [Speech to text](https://dev.meta.ai/docs/speech-to-text/)
- Response (`Accept: application/json`): `{sessionId, transcript, audioDurationMs, turns:[{turnId,startMs,endMs,transcript,speaker}]}`; `turns` empty in PUSH_TO_TALK; `speaker` only in DIARIZATION. `Accept: text/event-stream` gives SSE events like realtime; `text/plain` gives one turn per line or `A:Hello` lines — [Speech to text](https://dev.meta.ai/docs/speech-to-text/)
- Realtime events: handshake ack `{sessionId}`, `speechStart`, `transcript` (`final` flag), `speaker`, `speechEnd`, `speechComplete` (final text per turn), `audioProgress`, `error`; send `{"type":"endStream"}` to finish; PCM must be 16-bit LE mono sent at ~real-time pace; handshake within 10 s; max session 60 min; backlog ≤5 s ahead — [Speech to text](https://dev.meta.ai/docs/speech-to-text/)
- Upload limits: RIFF/WAVE mono 16-bit PCM at 16 or 24 kHz; max body 32 MB (413); max 10 minutes audio (400); convert with `ffmpeg -i in.webm -ac 1 -ar 24000 -c:a pcm_s16le -map_metadata -1 out.wav` (docs example parameters) — [Speech to text](https://dev.meta.ai/docs/speech-to-text/)
- Languages (25, validated): Arabic, Bengali, Dutch, English, French, German, Hebrew, Hindi, Indonesian, Italian, Japanese, Kannada, Korean, Malay, Mandarin Chinese, Marathi, Polish, Portuguese, Spanish, Tagalog, Tamil, Telugu, Thai, Turkish, Vietnamese; code-switching supported; `languageBias` takes names not ISO codes — [Speech to text](https://dev.meta.ai/docs/speech-to-text/); trained on 70+ languages per launch press — [TechRepublic](https://www.techrepublic.com/article/news-meta-muse-voice-transcribe-real-time-speech/)
- Not available: word-level timestamps, confidence scores, sound-event or emotion detection, transcript reformatting — [Speech to text](https://dev.meta.ai/docs/speech-to-text/); Models page confirms "turn-level timestamps, no word-level" — [Models page](https://dev.meta.ai/docs/models)
- Pricing $0.18/hour, same for streaming and upload, ZDR at parity, billed per whole second rounded down, 429/failed not billed; limits 256 concurrent streams, 16,000 streams/hour per tenant — [Speech to text](https://dev.meta.ai/docs/speech-to-text/)
- Diarization: 20+ speakers live; speaker attribution and end-of-speech run inside the recognition model — [Muse Voice Transcribe page](https://dev.meta.ai/models/muse-voice-transcribe)
- Cookbook note: voice is "the one part of the Model API that is not an HTTP endpoint" for realtime; recipes use a WebSocket client, not the OpenAI SDK — [cookbook repo](https://github.com/meta-models/meta-model-cookbook)

Snippet (confirmed from API reference):

```bash
curl -X POST "https://api.meta.ai/v1/asr/transcribe" \
  -H "Authorization: Bearer $MODEL_API_KEY" -H "Accept: application/json" \
  -F 'request={"model":"muse-voice-transcribe-1.0","audioEncoding":"WAV","mode":"PUSH_TO_TALK","languageBias":["Indonesian","English"]};type=application/json' \
  -F "audio=@answer.wav;type=audio/wav"
```

```ts
// Node/Next.js route handler: browser records webm -> ffmpeg -> wav -> transcribe
const form = new FormData();
form.append("request", new Blob([JSON.stringify({model:"muse-voice-transcribe-1.0",audioEncoding:"WAV",mode:"ENDPOINTING"})],{type:"application/json"}));
form.append("audio", new Blob([wavBytes],{type:"audio/wav"}), "answer.wav");
const r = await fetch("https://api.meta.ai/v1/asr/transcribe",{method:"POST",
  headers:{Authorization:`Bearer ${process.env.MODEL_API_KEY}`,Accept:"application/json"},body:form});
const {transcript, turns} = await r.json();
```

Realtime handshake JSON (first WebSocket text frame, per docs example): `{"authorization":{"accessToken":"Bearer <key>"},"audioEncoding":"PCM_24KHZ","model":"muse-voice-transcribe-1.0","mode":"PUSH_TO_TALK","partialMode":"CUMULATIVE","emitAudioProgress":false}` then binary PCM frames (~80 ms), then `{"type":"endStream"}`.

### Inferences
- GameSchooling roles: child's spoken answers to quiz prompts (PUSH_TO_TALK upload, then Muse Spark grades the transcript); read-aloud fluency check (compare transcript to passage with Muse Spark — but note no word timestamps/confidence, so WPM must be computed from `audioDurationMs` and word count, and mispronunciation detection is not possible); parent voice notes → curriculum edits (`DIARIZATION` if parent + child discuss together); bilingual households (Indonesian/Arabic/English code-switching is explicitly supported).
- Browser `MediaRecorder` produces webm/opus; a server-side ffmpeg conversion step to 24 kHz mono 16-bit WAV is mandatory for the upload path. For realtime, use the Web Audio API to produce PCM16 directly and proxy the WebSocket through your server (key must not reach the browser).

### Gaps
- Full `request` field list (e.g. whether `languageBias` is exact field name on upload path, defaults) lives in `/docs/api-reference/voice/schemas`, which was not fetched; names above come from the Speech-to-text guide.
- Per-language accuracy (WER) is only in images on the product page; Indonesian/Arabic quality is unverified.

## Q6. SAM 3.1: what's new, API shape, prompts, outputs, limits, pricing

### Takeaway
`sam-3.1` is called through the ordinary Responses API with a user message containing one short noun phrase (or box/point prompt tokens) plus an `input_image` or `input_video`; it streams a compact token grammar (one box + one mask per object per frame) that Meta's `@meta-sam/parser` (npm) or `meta-sam-parser` (pip) decodes into pixel boxes and binary rasters, at $2.50 per 1k images.

### Cited Findings
- Capabilities: detect, segment and track in images and video with one model; returns a box and a mask for every match of a noun phrase; segments objects marked with boxes/points and tracks forward/backward/both; stable identities across frames; zero-shot — [SAM overview](https://dev.meta.ai/docs/sam/overview); [SAM 3.1 page](https://dev.meta.ai/models/sam-3-1)
- What's new vs SAM 3 is NOT stated on any dev.meta.ai page. Secondary coverage of the SAM 3.1 open release (~Mar 2026): "object multiplexing" (all tracked objects in one pass, up to 16 per forward pass), "global reasoning" over the whole frame, ~3x speedup at 16 objects on H100, >11 fps at 128 objects — [aiproductivity.ai](https://aiproductivity.ai/news/meta-sam-3-1-multiplexing-global-reasoning-video-tracking/); [aigazine](https://aigazine.com/industry/meta-sam-31-hits-30-fps-at-16-objects-on-a-single-h100-gpu--s) (both secondary; Meta blog not fetched)
- Request: `POST /v1/responses`, `model: "sam-3.1"`, `input: [{type:"message", role:"user", content:[{type:"input_text", text:"glasses"}, {type:"input_image", image_url:"https://... or data:image/png;base64,..."}]}]`, `stream: true` recommended (required for video); video via `{type:"input_video", video_url: ...}` or `file_id` from `POST /v1/files` (`purpose: "user_data"`, synchronous); one concept per request, several requests for several object types — [SAM segmenting](https://dev.meta.ai/docs/sam/segmenting); [Media segmentation](https://dev.meta.ai/docs/media-segmentation/)
- Box/point prompts go in the `input_text` instead of a noun phrase: `<0f>1<|box;x1=444;y1=626;x2=675;y2=849;w=1800;h=1200|>`; `<|point;x=..;y=..;w=..;h=..|>` positive, leading `-` negative; `w`/`h` must equal displayed pixel size after EXIF rotation (aspect mismatch → 400); up to 16 objects; `<Nf>` for frame N; helper `buildObjectPrompt` / `build_object_prompt` — [SAM segmenting](https://dev.meta.ai/docs/sam/segmenting)
- `metadata` options (string values): `include_confidence` `"true"`/`"false"` (adds `c` 0-1), `mask_encoding` `"lossless"` (default, `~`) / `"one_bit"` (`!`, smaller; box/point prompts always one_bit), `propagation_direction` `"both"`/`"forward"`/`"backward"` — [SAM segmenting](https://dev.meta.ai/docs/sam/segmenting)
- Output grammar: each frame is one `response.output_text.delta` line starting `<0f>`; records `id <|box;x1;y1;x2;y2;w;h[;c]|> <|mask;x=0;y=0[;c];data=H,W,<enc>payload|>` with base85 payload; object ids are stable but not dense; zero matches → empty `output_text` — [SAM reading segmentation](https://dev.meta.ai/docs/sam/reading-segmentation)
- Client libs: `npm install @meta-sam/parser` (zero deps; `parseImageStream`, `parseVideoStream`, `parseResponsesStream`, `recordsOfKind`, `decodeMaskToRaster` → row-major `Uint8Array` 0/1 of length H*W, `decodeMaskToRLE` (COCO), `decodeMaskToSVGPath`), optional `@meta-sam/graphics` (`SegmentationRenderer`), `@meta-sam/video`, `@meta-sam/react` (`Video`, `useMediaPlayer`); `pip install meta-sam-parser` (module `meta_sam_parser`: `build_object_prompt`, `decode_mask_to_raster`, `decode_mask_to_rle`, `decode_mask_to_svg_path`) — [SAM client libraries](https://dev.meta.ai/docs/sam/client-libraries)
- Limits: video MP4/MOV with H.264/H.265/MPEG-4 (no VP9/WebM); up to 15,000 frames (~10 min) per request; 16 tracked objects per frame; min 50 frames billed; image resolution limit not stated; errors 400 (bad prompt/metadata), 404 `model_not_found` — [SAM segmenting](https://dev.meta.ai/docs/sam/segmenting)
- Pricing $2.50/1k images, $0.20/1k frames; 3,000 RPM — [Pricing & rate limits](https://dev.meta.ai/docs/pricing-rate-limits)
- Playground: `https://dev.meta.ai/playground/segmentation` — [SAM 3.1 page](https://dev.meta.ai/models/sam-3-1)
- Cookbook: SAM API basics (Python/TS), video-to-sticker pack (track animal, remove background, export animated stickers), headlocked captions (diarized voice + tracked people) — [Cookbook index](https://dev.meta.ai/docs/cookbook)

Snippet (TypeScript, confirmed request shape + parser API):

```ts
import OpenAI from "openai";
import { parseImageStream, recordsOfKind, decodeMaskToRaster } from "@meta-sam/parser";
const client = new OpenAI({ baseURL: "https://api.meta.ai/v1", apiKey: process.env.MODEL_API_KEY });
const stream = await client.responses.create({
  model: "sam-3.1", stream: true,
  metadata: { mask_encoding: "one_bit", include_confidence: "true" },
  input: [{ type: "message", role: "user", content: [
    { type: "input_text", text: "leaf" },
    { type: "input_image", image_url: `data:image/jpeg;base64,${b64}` } ] }],
});
const parsed = parseImageStream(stream as any);     // see docs for exact event adapter
const result = await parsed.finalResult;
for (const m of recordsOfKind(result, "mask")) { const raster = decodeMaskToRaster(m.mask); /* H*W 0/1 */ }
```

```python
# Python, requests, streaming SSE, then parse with meta_sam_parser (function names per docs)
import os, requests, json
r = requests.post("https://api.meta.ai/v1/responses", stream=True,
  headers={"Authorization": f"Bearer {os.environ['MODEL_API_KEY']}", "Accept": "text/event-stream"},
  json={"model":"sam-3.1","stream":True,"metadata":{"mask_encoding":"one_bit"},
        "input":[{"type":"message","role":"user","content":[
          {"type":"input_text","text":"handwritten number"},
          {"type":"input_image","image_url":"https://example.com/worksheet.jpg"}]}]})
# collect response.output_text.delta lines, feed to meta_sam_parser, decode_mask_to_raster(...)
```

### Inferences
- GameSchooling roles: scavenger-hunt missions ("find 3 round things in the kitchen" → child photo → SAM counts/segments "apple", Muse Spark verifies the quest and awards XP); worksheet grading pipeline (SAM isolates each handwritten answer region → crop → Muse Spark reads/grades; or simply SAM "circle" / "tick" detection); child-drawing-to-sticker (segment the drawing from the paper background → transparent PNG reward sticker via `decodeMaskToRaster`); video missions (child films a plant experiment, SAM tracks the object; mind the 50-frame minimum billing and MP4/MOV-only input — browser webm must be transcoded).
- One concept per request means a "find 5 object types" quest costs 5 image calls (~$0.0125). Fine.

### Gaps
- Official "what's new in SAM 3.1 vs SAM 3" from Meta was not fetched (Meta AI blog). API docs do not distinguish.
- Image resolution limits, mask raster downsampling behaviour, and exact Python parse-stream function name (TS is `parseImageStream`; Python likely `parse_image_stream`, unverified) — check `https://dev.meta.ai/docs/sam/client-libraries` full examples.

## Q7. Muse Spark Open on Baseten (hackathon id `meta-models/muse-spark-open-1026`)

### Takeaway
Muse Spark Open is Meta's 816B-total/42B-active MoE open-weight multimodal (text+image+video+audio in) reasoning model with 1M context, served on Baseten's OpenAI-compatible Model API at `https://inference.baseten.co/v1` with `reasoning_content` returned alongside `content`; the hackathon page instructs using model id `meta-models/muse-spark-open-1026` (Baseten docs show `meta-models/muse-spark-open`).

### Cited Findings
- Hackathon page: Baseten gives $100 credits + 2M TPM to up to 2,000 participants; "for hackathon use model id `meta-models/muse-spark-open-1026` (docs say `meta-models/muse-spark-open`)" — [event facts file](research_notes/Gameschooling Meta hackathon strategy/00_event_facts_verbatim.md) (read from dev.meta.ai/events/global-hackathon while logged in)
- Baseten base URL `https://inference.baseten.co/v1` (OpenAI-compatible), Anthropic Messages at `https://inference.baseten.co`; auth `Authorization: Bearer $BASETEN_API_KEY`; catalog via `GET /v1/models` or `baseten model-api list`; Muse Spark Open "supports audio input" — [Baseten Model APIs overview](https://docs.baseten.co/development/model-apis/overview)
- Baseten reasoning: message returns reasoning in `reasoning_content` and the answer in `content`; reasoning tokens counted in `completion_tokens`; Muse Spark Open `reasoning_effort` values `low`, `medium`, `high`, `xhigh` (default), reasoning "always on", `none`/`minimal` run as `low` — [Baseten reasoning docs](https://docs.baseten.co/development/model-apis/reasoning)
- Baseten vision: `image_url` content parts with optional `detail` (`low`/`high`/`original`/`auto`); Muse Spark Open (`meta-models/muse-spark-open`) formats JPEG, PNG, WebP, GIF (first frame), BMP, TIFF; limits max 8 images/request, 10 MB per URL image, 200 MB total URL media, 100 MiB base64 body, max 2 videos/request, 896 MiB encoded-media budget, no PDFs; images billed as input tokens — [Baseten vision docs](https://docs.baseten.co/development/model-apis/vision)
- Baseten pricing (third-party aggregators, consistent): $1.25 input / $4.25 output / $0.15 cache read per 1M; features listed: function calling, vision, reasoning, audio input, prompt caching, tool choice — [getmaxim.ai](https://www.getmaxim.ai/bifrost/llm-cost-calculator/provider/baseten/model/muse-spark-open); [cloudprice.net](https://cloudprice.net/models/muse-spark-open)
- Model card: Muse Model License ("Muse Spark Open" version) requiring products to "prominently display 'Built with Muse Spark Open'"; released Oct 15, 2026; input text+image+video+audio, output text; "1M at inference"; MoE 816B/42B active, 62 layers, 256 experts top-8, 1.8B Perception Encoder; `reasoning_effort` low/medium/high/xhigh (default xhigh); temperature 1.0, top_p 1.0, top_k off; `vllm serve "meta-models/Muse-Spark-Open-816B-A42B"`; not intended for users under 18; recommends system-level guardrails; benchmarks (xhigh): Terminal-Bench 2.1 76.4, GPQA 89.0, OSWorld Verified 80.4, MCP-Atlas 89.2 — [HF model card](https://huggingface.co/meta-models/Muse-Spark-Open-816B-A42B)
- HF collection: `meta-models/Muse-Spark-Open-816B-A42B` (BF16) and `-NVFP4` — [HF collection](https://huggingface.co/collections/meta-models/muse-spark-open)
- Self-host prompting docs: recipients `self` (reasoning), `commentary`, tool name, `user`; reasoning strength numbers low=8, medium=32, high=256, xhigh=512 (a "Reasoning strength: 256." line in system prompt overrides `reasoning_effort`); media parts `image_url`, `video_url`, `audio_url` in user content; short/low-res video (<few seconds, ~100 px) may be refused, use ≥448 px short side; stop on `<|eot|>` not `<|eom|>`; use `stream: true` at high effort to avoid timeouts; model weights system-prompt beginning most — [Muse Spark Open prompting](https://dev.meta.ai/docs/muse-spark-open/prompting); [settings](https://dev.meta.ai/docs/muse-spark-open/settings)
- Deployment partners listed: Baseten, Fireworks, Modal, Groq, Together, OpenRouter, vLLM, SGLang, AWS, Azure, Google Cloud, NVIDIA, etc. — [Muse Spark Open page](https://dev.meta.ai/models/muse-spark-open)
- Cookbook: "Muse Spark Open on Mac" (two or four Mac Studios), TorchTitan RL/SFT recipes — [Cookbook index](https://dev.meta.ai/docs/cookbook)

Snippet (Baseten, confirmed shapes; model id per hackathon page):

```python
import os
from openai import OpenAI
client = OpenAI(base_url="https://inference.baseten.co/v1", api_key=os.environ["BASETEN_API_KEY"])
r = client.chat.completions.create(
    model="meta-models/muse-spark-open-1026",   # hackathon id; docs use meta-models/muse-spark-open
    reasoning_effort="low",
    messages=[{"role":"user","content":[
        {"type":"text","text":"What did the child draw? One sentence, then a fun follow-up question."},
        {"type":"image_url","image_url":{"url":"https://example.com/drawing.jpg","detail":"auto"}}]}],
    stream=False)
m = r.choices[0].message
print(m.reasoning_content)  # thinking
print(m.content)            # answer
```

```bash
curl https://inference.baseten.co/v1/chat/completions \
  -H "Authorization: Bearer $BASETEN_API_KEY" -H "Content-Type: application/json" \
  -d '{"model":"meta-models/muse-spark-open-1026","reasoning_effort":"medium",
       "messages":[{"role":"user","content":"Explain fractions to an 8-year-old using pizza, 3 sentences."}]}'
```

### Inferences
- Role in GameSchooling: the "open-weight twin" for offline/privacy-sensitive paths and as a cheap second opinion. Concretely: (a) run the kid-facing tutor turns on Muse Spark Open via Baseten (2M TPM headroom) and the grading/curriculum on Muse Spark 1.3; (b) a "two-judge" grader (Model API + Open) that must agree before XP is awarded — maps directly to "verifiable agents"; (c) audio input: Open accepts `audio_url`/audio parts natively, which could let a child's voice note go straight in without ASR (but Baseten's audio schema is unverified; keep Voice Transcribe as the primary path).
- Add "Built with Muse Spark Open" to the app footer/about page (license requirement).

### Gaps
- Baseten's audio-input doc page could not be found (`/model-apis/audio` and `/multimodal` 404). The OpenAI-style `{"type":"input_audio","input_audio":{"data":"<b64>","format":"wav"}}` part is the likely shape but is unverified; the self-hosted docs use `audio_url`. Check `https://docs.baseten.co/development/model-apis/` nav (Audio page) with a logged-in browser.
- Baseten's official per-model pricing/limits page 404'd under guessed paths; 2M TPM comes from the hackathon page, $1.25/$4.25 from aggregators.
- The `-1026` suffix on the hackathon model id is not explained anywhere public (likely an Oct-26 snapshot/dedicated hackathon deployment); confirm with `GET https://inference.baseten.co/v1/models`.

## Q8. Muse Glimmer and Muse Code (brief)

### Takeaway
Muse Glimmer is a 30B Apache-2.0 open-weight multimodal agent model built to run on one consumer GPU or Mac (Ollama/LM Studio/vLLM), and Muse Code is Meta's CLI coding agent (`curl -fsSL https://dev.meta.ai/install.sh | sh`) with $5-$200/month plans that is co-trained with the Muse models.

### Cited Findings
- Muse Glimmer: 30B params, Apache 2.0 (+ Meta Usage Policy), "always-on local agents", multimodal perception (chart/doc/screen benchmarks), reliable tool calling, persistent state across restarts, self-managed memory; runs on a single consumer GPU or Mac; HF `meta-models/Muse-Glimmer-30B`; run via transformers/llama.cpp/vLLM/Ollama/Unsloth/LM Studio, hosted on Fireworks/Together/OpenRouter; guides for quantization, speculative decoding, ExecuTorch (mobile); self-reported SWE-Bench Verified 76.0, MCP Atlas 75.5, AIME 2026 94.7, OSWorld-Verified 65.9 — [Muse Glimmer page](https://dev.meta.ai/models/muse-glimmer); Models page: input text+image, output text, distilled from Muse Spark, self-hosted only — [Models page](https://dev.meta.ai/docs/models)
- Cookbook "Local agent that asks first": run Muse Glimmer locally and escalate to Muse Spark only after approval — [Cookbook index](https://dev.meta.ai/docs/cookbook)
- Muse Code: coding agent CLI for macOS/Windows/Linux; install `curl -fsSL https://dev.meta.ai/install.sh | sh` (Windows `irm https://dev.meta.ai/install.ps1 | iex`), run `muse`, sign in via browser or API key; plans Everyday $5 (Muse Spark/Wonder/Image, 10-50 prompts per 5 h), High $15, Power $50 (Muse Wonder Full), Maximum $200; multi-agent by default (parallel workers, background reviewers), fully auditable, computer use, co-trained with Muse models; bundled skills `/plan`, `/grilling`, `/grill-with-docs`, `/taste`; features: audit log + crash-safe resume, deterministic replay in CI, staged approvals, contained execution, immutable guardrails, subagent fan-out in git worktrees, goal tracking with a judge, loop/cron, side chats — [Muse Code page](https://dev.meta.ai/products/muse-code); [dev.meta.ai/docs](https://dev.meta.ai/docs/); [Cookbook index](https://dev.meta.ai/docs/cookbook)

### Inferences
- Rubric lever: use Muse Code to build the app (submission form asks about it) and mention it in "use of Meta products". Muse Glimmer is a stretch: an "offline parent laptop mode" demo via Ollama is feasible in minutes if a 30B quant fits the user's Mac; otherwise cite it as roadmap.

### Gaps
- Glimmer exact Ollama tag and quantized memory footprint not fetched (`https://dev.meta.ai/docs/muse-glimmer/quantization`).

## Q9. Cookbook and recommended agent patterns ("Agents 101" multimodal agent, "Agents 102" verifiable agents)

### Takeaway
No public transcript or page for the "Agents 101 / 102" hackathon sessions was found; the closest documented guidance is the cookbook's agent-patterns section (perceive-decide-act loop, interleaved reasoning + tools, context management, strict-JSON self-assessment) and the Muse Code "durable, auditable agents" recipes (audit log, deterministic replay, staged approvals, guardrails, goal tracking with a judge), which together define what Meta means by multimodal and verifiable agents.

### Cited Findings
- Cookbook is public at `github.com/meta-models/meta-model-cookbook` (MIT) with folders `01_api_fundamentals` (10), `02_agent_patterns` (5), `03_use_cases` (15), `04_muse_code` (11), `05_muse_image` (4), `06_muse_voice` (2), `07_sam` (3); "drop-in compatible with the OpenAI SDK, the Anthropic SDK, and agent CLIs like OpenCode and Claude Code" — [cookbook repo](https://github.com/meta-models/meta-model-cookbook)
- Agent patterns: basic agent loop (perceive, decide, act), interleaved reasoning and tool use in one turn, multi-turn context management, validated search-and-replace edits, "alert fatigue copilot" (grounded patterns, probe, chat, self-assess with strict JSON) — [Cookbook index](https://dev.meta.ai/docs/cookbook)
- Multimodal use cases: chart analysis, error-screenshot fix, Ray-Ban Meta smart glasses look-and-ask, perception grounding (pin dots at object pixel locations in an HTML overlay), computer use from screenshots, "Muse robotics" demo orchestrating Muse Voice + Muse Spark + SAM + Muse Image — [Cookbook index](https://dev.meta.ai/docs/cookbook); [cookbook repo](https://github.com/meta-models/meta-model-cookbook)
- Verifiability patterns (Muse Code section): append-only audit log + crash-safe resume, deterministic replay as CI golden fixtures, staged approvals (fail closed), contained execution, immutable guardrails, goal tracking "work is not closed until acceptance checks pass" (judge), browser-verified web design, iterative game dev verified in a browser, sandboxed execution — [Cookbook index](https://dev.meta.ai/docs/cookbook)
- Structured-output and tool-calling docs stress validating tool arguments yourself and using constrained JSON for self-assessment — [Tool calling](https://dev.meta.ai/docs/tool-calling); [Structured output](https://dev.meta.ai/docs/structured-output)
- Searches for "Agents 101 Build a Multimodal AI Agent" (Suraj Subramanian) and "Agents 102 Best Practices for Verifiable Agents" (Yash Khare) returned no matching public pages — [search 1](https://interestingengineering.com/ai-robotics/meta-muse-spark-ai-launch); [search 2](https://www.mind-verse.de/news/meta-plant-globalen-ki-hackathon-fuer-entwickler)

### Inferences
- "Verifiable agent" for GameSchooling, in Meta's vocabulary: every XP/badge award goes through (1) a strict-JSON grader output, (2) an independent check (second model or deterministic rule, e.g. math answers verified by code execution / SAM object count), (3) an append-only event log parents can replay ("why did my child get this badge?"), and (4) staged approval: curriculum changes proposed by the agent are held for the parent to approve. This directly mirrors cookbook recipes 04-01, 04-03, 04-07.
- "Multimodal agent": one Muse Spark agent loop whose tools include `transcribe_audio` (Voice), `segment_image` (SAM), `generate_image` (Muse Image) and `grade_answer` (structured output) — the exact shape of the "Muse robotics" cookbook demo, applied to home education.

### Gaps
- Session recordings are presumably on the Cerebral Valley / dev.meta.ai events page behind login; content not retrievable here.

## Q10. Known gotchas: regional availability, children's content, image sizes, timeouts

### Takeaway
The main practical traps are: WAV-only 10-minute uploads for voice, MP4/MOV-only video for SAM and Muse Spark, no audio output anywhere, 504 on long non-streaming calls, `tool_choice` locked to auto, Chat Completions discarding reasoning between turns, Muse Image refusing masks/moderation params, and no published child-safety or regional-availability policy for the Model API.

### Cited Findings
- Non-streaming requests over the server time limit return 504 `gateway_timeout`; streaming is exempt except for first event; `background: true` requests have a 1 MiB body cap — [Error handling](https://dev.meta.ai/docs/error-handling); [Chat Completions protocol](https://dev.meta.ai/docs/protocols/chat-completions)
- No audio output: `modalities`/`audio` → 400 — [Chat Completions protocol](https://dev.meta.ai/docs/protocols/chat-completions)
- Image inline limit 50 MB, 50 images/request, formats JPEG/PNG/GIF/WebP/ICO, model may resize — [Image understanding](https://dev.meta.ai/docs/image-understanding)
- Voice: WAV mono 16-bit 16/24 kHz only, 32 MB, 10 min; realtime PCM only; auth in handshake not header — [Speech to text](https://dev.meta.ai/docs/speech-to-text/)
- SAM: MP4/MOV only (no WebM/VP9), 16 objects, 50-frame minimum billing, one concept per request, `metadata` values are strings — [SAM segmenting](https://dev.meta.ai/docs/sam/segmenting)
- Muse Image: `mask`, `input_fidelity`, `partial_images`, `moderation` all → 400; `size` is aspect-ratio only; non-image tools → 400 — [Image generation](https://dev.meta.ai/docs/image-generation)
- Content moderation: media policy violations → 400 `content_policy_violation`; no documented child-mode or age-gating in the API — [Error handling](https://dev.meta.ai/docs/error-handling)
- Muse Spark Open model card: "not intended for individuals under 18"; recommends system-level guardrails and not exposing raw chain-of-thought — [HF model card](https://huggingface.co/meta-models/Muse-Spark-Open-816B-A42B)
- Meta Platform Policy (developer platform, not Model API) prohibits building products directed to under-13s without special approval and COPPA compliance — [conductatlas summary of Meta Platform Policy](https://conductatlas.com/platform/meta/meta-platform-policy/restrictions-on-applications-for-children-and-age-verification/) (secondary; applicability to Model API unverified)
- Rate limits are per team; contributor models only 150 RPM; Muse Image 150 RPM — [Pricing & rate limits](https://dev.meta.ai/docs/pricing-rate-limits)
- Hackathon-specific: $150 Meta credit must be claimed by Nov 4 9 PM ET with a credit card on the account — [event facts file](research_notes/Gameschooling Meta hackathon strategy/00_event_facts_verbatim.md)

### Inferences
- Design the product so the parent is the account holder and the API caller (server-side keys, parent-authenticated sessions); the child is a supervised end user. Put "parent-supervised, no child accounts" in the README to pre-empt policy questions, and never show raw reasoning to the child.
- Always `stream: true` for Muse Spark/Wonder/SAM calls that could exceed ~30 s; use Responses API (not Chat Completions) wherever multi-turn reasoning continuity or `previous_response_id` matters (Muse Image series, long agent loops).
- Build one server-side ffmpeg utility: webm→WAV 24 kHz mono (voice) and webm→MP4 H.264 (SAM/Muse Spark video).

### Gaps
- Regional availability of Model API (e.g. Indonesia) is undocumented publicly; the user is in GMT+7 and already has a logged-in account, which implies access works, but this is inferred from the event-facts file, not confirmed.
- Model API Terms/Usage Policy page URL not fetched; check the dashboard's terms after login for minors language.

## Q11. Model-to-GameSchooling role map (synthesis)

### Takeaway
Every one of the five required Model API models plus Muse Spark Open maps to a distinct, demonstrable GameSchooling agent role; the strongest "surprise the judges" combos are SAM-verified real-world quests, anchored Muse Image mascot story arcs, voice-graded bilingual oral quizzes, and a two-model verifiable grader with a parent-replayable audit log.

### Cited Findings
- Each model's documented capability is cited in Q1-Q8 above; this section is synthesis only.

### Inferences
| Model (ID) | GameSchooling agent role | Call surface | Notes |
|---|---|---|---|
| Muse Wonder (`muse-wonder-1.0`) | Curriculum Architect: parent gives goals, model plans weeks of lessons/quests/exams and delegates via tools; held for parent approval (staged approval) | `/v1/responses`, `reasoning.effort: "high"`, function tools | Preview; fall back to Spark 1.3 |
| Muse Spark 1.3 (`muse-spark-1.3`) | Lesson Writer, Exam Generator, Grader (strict JSON), Quest Master dialogue, risk/reward economy calculator (tool calling into your XP ledger) | Chat Completions or Responses; `response_format json_schema`; `image_url` for worksheet photos | 1M context fits whole curriculum + child history |
| Muse Spark 1.2 / 1.1 | Fallback / A-B "difficulty tuner" (same price) | same | 1.1 = standard only |
| Muse Image (`muse-image-1.0`) | Illustrator: lesson art, story panels with consistent mascot (anchored series), reward badges/stickers, drawing "level-up" edits | `/v1/images/generations`, `/v1/images/edits`, `/v1/responses` chained | $0.01/img, 150 RPM |
| Muse Voice Transcribe (`muse-voice-transcribe-1.0`) | Oral quiz answers, read-aloud fluency (WPM from `audioDurationMs`), parent voice notes → curriculum edits, bilingual ID/AR/EN | `POST /v1/asr/transcribe` (WAV) or realtime WS | no word timestamps/confidence |
| SAM 3.1 (`sam-3.1`) | Real-world scavenger quests (count/segment objects in child photo), worksheet region isolation before grading, drawing → transparent sticker, experiment video tracking | `/v1/responses` streaming + `@meta-sam/parser` | one noun phrase per call |
| Muse Spark Open (`meta-models/muse-spark-open-1026` on Baseten) | Second-opinion grader (verifiable agent), kid-chat tutor turns with 2M TPM headroom, optional native audio understanding | `https://inference.baseten.co/v1/chat/completions`, `reasoning_content` | show "Built with Muse Spark Open" |
| Muse Glimmer | Optional offline "parent laptop" mode / roadmap | Ollama/vLLM local | not on Model API |
| Muse Code | Build tool for the hackathon; cite in submission | CLI | $5 plan sufficient |

### Gaps
- None beyond those listed per model above.
