import { useSyncExternalStore } from "react";

// Make quests runs and Plan drafts, one per Child, kept outside any component.
// Switching Children unmounts the Child page, so state held there would die with it:
// a run kept streaming but nobody showed it, and unsaved Plan text was dropped.

export type Run = { lines: string[]; running: boolean };

const IDLE: Run = { lines: [], running: false };

type Listener = () => void;

export function createRuns(fetchFn: typeof fetch = (...a) => fetch(...a)) {
  const runs = new Map<string, Run>();
  const drafts = new Map<string, string>();
  const listeners = new Set<Listener>();
  const emit = () => listeners.forEach((l) => l());
  const set = (childId: string, update: (r: Run) => Run) => {
    runs.set(childId, update(runs.get(childId) ?? IDLE));
    emit();
  };
  const push = (childId: string, ...lines: string[]) =>
    set(childId, (r) => ({ ...r, lines: [...r.lines, ...lines] }));

  const runsApi = {
    subscribe(l: Listener) {
      listeners.add(l);
      return () => void listeners.delete(l);
    },
    run: (childId: string): Run => runs.get(childId) ?? IDLE,
    // Children with a run going, comma-joined so the snapshot compares by value.
    runningIds: (): string =>
      [...runs]
        .filter(([, r]) => r.running)
        .map(([id]) => id)
        .sort()
        .join(","),
    // True when leaving the page would lose something: a run or unsaved Plan text.
    unsafeToLeave: (): boolean => drafts.size > 0 || [...runs.values()].some((r) => r.running),
    // Unsaved Plan text, or undefined when the box shows the saved Plan.
    draft: (childId: string): string | undefined => drafts.get(childId),
    setDraft(childId: string, text: string | undefined) {
      if (text === undefined) drafts.delete(childId);
      else drafts.set(childId, text);
      emit();
    },
    // Saves the Plan text and makes Quests in one request. Runs to the end
    // whichever Child is on screen.
    async start(
      childId: string,
      planText: string,
      on: { progress?: () => unknown; signedOut?: () => void; locked?: () => void } = {},
    ): Promise<void> {
      if (runs.get(childId)?.running) return;
      if (!planText.trim()) {
        set(childId, () => ({ lines: ["Write a Plan first."], running: false }));
        return;
      }
      set(childId, () => ({ lines: [], running: true }));
      try {
        const res = await fetchFn("/api/make-quests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ childId, planText }),
        });
        if (!res.ok || !res.body) {
          push(
            childId,
            res.status === 401
              ? "You are signed out. Sign in again."
              : res.status === 423
                ? "Enter the Parent PIN first."
                : "Could not make Quests. Try again.",
          );
          if (res.status === 401) on.signedOut?.();
          if (res.status === 423) on.locked?.();
          return;
        }
        // The server has the Plan now: load it, then let the box show it again.
        await on.progress?.();
        if (drafts.get(childId) === planText) runsApi.setDraft(childId, undefined);
        const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
        let buffer = "";
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += value;
          const parts = buffer.split("\n");
          buffer = parts.pop() ?? "";
          if (parts.length) {
            push(childId, ...parts);
            if (parts.some((p) => p.startsWith("Wrote") || p.startsWith("Drew"))) void on.progress?.();
          }
        }
        if (buffer) push(childId, buffer);
      } catch {
        push(childId, "Connection lost");
      } finally {
        set(childId, (r) => ({ ...r, running: false }));
        void on.progress?.();
      }
    },
  };
  return runsApi;
}

export const runs = createRuns();

// Runs live in this tab. Reloading or closing it stops them, so the browser asks first.
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", (e) => {
    if (runs.unsafeToLeave()) e.preventDefault();
  });
}

export function useRunningChildIds(): string[] {
  const ids = useSyncExternalStore(runs.subscribe, runs.runningIds, () => "");
  return ids ? ids.split(",") : [];
}

export function useRun(childId: string): Run {
  return useSyncExternalStore(
    runs.subscribe,
    () => runs.run(childId),
    () => IDLE,
  );
}

export function useDraft(childId: string): string | undefined {
  return useSyncExternalStore(
    runs.subscribe,
    () => runs.draft(childId),
    () => undefined,
  );
}
