import type { Turn } from "./client";
import { MODELS } from "./ids";
import { recorded, type CallContext } from "./log";

// Transcriber: Muse Voice Transcribe, diarized so a Parent's prompting is told apart from the Child.

export const LANGUAGE_BIAS = ["Indonesian", "Arabic", "English"];

export async function transcribe(ctx: CallContext, wav: Uint8Array): Promise<Turn[]> {
  return recorded(
    ctx,
    {
      agent: "transcriber",
      model: MODELS.voice,
      endpoint: "meta /v1/asr/transcribe",
      inputSummary: `WAV ${Math.round(wav.byteLength / 1024)} KB, bias ${LANGUAGE_BIAS.join("/")}`,
    },
    async () => {
      const res = await ctx.client.transcribe({ model: MODELS.voice, wav, languageBias: LANGUAGE_BIAS });
      const turns = res.turns.length
        ? res.turns
        : [{ speaker: null, text: res.transcript, startMs: 0, endMs: res.audioDurationMs }];
      return {
        value: turns,
        output: turns.map((t) => `${t.speaker ?? "?"}: ${t.text}`).join("\n"),
        audioMs: res.audioDurationMs,
      };
    },
  );
}
