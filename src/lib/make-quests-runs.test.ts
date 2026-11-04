import { describe, expect, it } from "vitest";
import { createRuns } from "./make-quests-runs";

// A fake /api/make-quests whose lines the test releases one at a time, per Child.
function fakeServer() {
  const streams = new Map<string, ReadableStreamDefaultController<Uint8Array>>();
  const bodies: { childId: string; planText: string }[] = [];
  const enc = new TextEncoder();
  const fetchFn = (async (_url: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body)) as { childId: string; planText: string };
    bodies.push(body);
    const stream = new ReadableStream<Uint8Array>({ start: (c) => void streams.set(body.childId, c) });
    return new Response(stream, { status: 200 });
  }) as typeof fetch;
  return {
    fetchFn,
    bodies,
    send: (childId: string, line: string) => streams.get(childId)!.enqueue(enc.encode(`${line}\n`)),
    end: (childId: string) => streams.get(childId)!.close(),
  };
}

const tick = () => new Promise((r) => setTimeout(r, 0));

describe("Make quests runs", () => {
  it("keeps each Child's stream apart and runs on while another Child is on screen", async () => {
    const server = fakeServer();
    const runs = createRuns(server.fetchFn);
    const a = runs.start("a", "Plan A");
    await tick();
    server.send("a", "Reading the Plan");
    await tick();
    // The Parent switches to Child b and makes Quests there too.
    const b = runs.start("b", "Plan B");
    await tick();
    server.send("b", "Reading the Plan");
    server.send("a", "Wrote Quest 1");
    await tick();
    expect(runs.run("a")).toEqual({ lines: ["Reading the Plan", "Wrote Quest 1"], running: true });
    expect(runs.run("b")).toEqual({ lines: ["Reading the Plan"], running: true });
    server.end("a");
    await a;
    expect(runs.run("a").running).toBe(false);
    expect(runs.run("b").running).toBe(true);
    server.end("b");
    await b;
  });

  it("does not start a second run for a Child already running", async () => {
    const server = fakeServer();
    const runs = createRuns(server.fetchFn);
    void runs.start("a", "Plan A");
    await tick();
    await runs.start("a", "Plan A");
    expect(server.bodies).toHaveLength(1);
    server.end("a");
  });

  it("sends the Plan box text with the run and keeps drafts per Child", async () => {
    const server = fakeServer();
    const runs = createRuns(server.fetchFn);
    runs.setDraft("a", "Draft A");
    runs.setDraft("b", "Draft B");
    const a = runs.start("a", "Draft A");
    await tick();
    expect(server.bodies).toEqual([{ childId: "a", planText: "Draft A" }]);
    // Saved with the run, so a's box shows the saved Plan; b's draft is untouched.
    expect(runs.draft("a")).toBeUndefined();
    expect(runs.draft("b")).toBe("Draft B");
    server.end("a");
    await a;
  });

  it("asks for a Plan instead of sending an empty one", async () => {
    const server = fakeServer();
    const runs = createRuns(server.fetchFn);
    await runs.start("a", "   ");
    expect(server.bodies).toHaveLength(0);
    expect(runs.run("a")).toEqual({ lines: ["Write a Plan first."], running: false });
  });

  it("knows which Children are running and when leaving the tab would lose work", async () => {
    const server = fakeServer();
    const runs = createRuns(server.fetchFn);
    expect(runs.unsafeToLeave()).toBe(false);
    runs.setDraft("c", "Unsaved");
    expect(runs.unsafeToLeave()).toBe(true);
    runs.setDraft("c", undefined);
    const b = runs.start("b", "Plan B");
    const a = runs.start("a", "Plan A");
    await tick();
    expect(runs.runningIds()).toBe("a,b");
    expect(runs.unsafeToLeave()).toBe(true);
    server.end("a");
    server.end("b");
    await Promise.all([a, b]);
    expect(runs.runningIds()).toBe("");
    expect(runs.unsafeToLeave()).toBe(false);
  });
});
