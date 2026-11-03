import type { Usage } from "./client";

// USD, from dev.meta.ai pricing (standard mode) and Baseten's Muse Spark Open rate.
const PER_MILLION_TOKENS: Record<string, { input: number; output: number }> = {
  "muse-wonder-1.0": { input: 4, output: 20 },
  "muse-spark-1.3": { input: 1.25, output: 4.25 },
  "meta-models/muse-spark-open-1026": { input: 1.25, output: 4.25 },
};
const PER_IMAGE: Record<string, number> = { "muse-image-1.0": 0.01, "sam-3.1": 0.0025 };
const PER_AUDIO_HOUR: Record<string, number> = { "muse-voice-transcribe-1.0": 0.18 };

export function costUsd(
  model: string,
  used: { usage?: Usage; images?: number; audioMs?: number },
): number | null {
  const tokens = Object.entries(PER_MILLION_TOKENS).find(([id]) => model.startsWith(id))?.[1];
  if (tokens && used.usage) {
    return (used.usage.inputTokens * tokens.input + used.usage.outputTokens * tokens.output) / 1e6;
  }
  if (PER_IMAGE[model] !== undefined && used.images !== undefined) return PER_IMAGE[model] * used.images;
  if (PER_AUDIO_HOUR[model] !== undefined && used.audioMs !== undefined) {
    return (PER_AUDIO_HOUR[model] * Math.floor(used.audioMs / 1000)) / 3600;
  }
  return null;
}
