import { useEffect, useState } from "react";
import { getModelLog } from "#/server/fns";

type Call = Awaited<ReturnType<typeof getModelLog>>[number];

const usd = (n: number | null) => (n === null ? "" : `$${n < 0.01 ? n.toFixed(4) : n.toFixed(3)}`);

// Which models ran, what they saw, what it cost and how long it took.
export function ModelLog(props: { of: { questId: string } | { verdictId: string } }) {
  const [calls, setCalls] = useState<Call[] | null>(null);
  const key = JSON.stringify(props.of);
  useEffect(() => {
    let live = true;
    void getModelLog({ data: props.of }).then((c) => live && setCalls(c));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  if (!calls || calls.length === 0) return null;
  const total = calls.reduce((s, c) => s + (c.costUsd ?? 0), 0);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <tbody>
          {calls.map((c) => (
            <tr key={c.id} className="border-t align-top">
              <td className="py-2 pr-3 font-medium">{c.agent.replace("_", " ")}</td>
              <td className="py-2 pr-3 font-mono">{c.model}</td>
              <td className="py-2 pr-3 text-muted-foreground">{c.inputSummary}</td>
              <td className="max-w-80 py-2 pr-3 break-words">
                {c.status === "ok" ? (
                  <span className="line-clamp-3">{c.output}</span>
                ) : (
                  <span className="text-destructive">{c.error}</span>
                )}
              </td>
              <td className="py-2 pr-3 text-right tabular-nums">{usd(c.costUsd)}</td>
              <td className="py-2 text-right tabular-nums">{(c.latencyMs / 1000).toFixed(1)}s</td>
            </tr>
          ))}
          <tr className="border-t">
            <td colSpan={4} />
            <td className="py-2 pr-3 text-right font-medium tabular-nums">{usd(total)}</td>
            <td />
          </tr>
        </tbody>
      </table>
    </div>
  );
}
