import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { enterPinFn, getPinPad } from "#/server/fns";

export const Route = createFileRoute("/play/$childId/pin")({
  loader: ({ params }) => getPinPad({ data: { childId: params.childId } }),
  component: PinPad,
});

// Big number buttons a Child can press on their own.
function PinPad() {
  const child = Route.useLoaderData();
  const navigate = useNavigate();
  const [pin, setPin] = useState("");
  const [wrong, setWrong] = useState(false);
  const [pausedUntil, setPausedUntil] = useState<Date | null>(
    child.pausedUntil && new Date(child.pausedUntil) > new Date() ? new Date(child.pausedUntil) : null,
  );

  async function press(digit: string) {
    if (pausedUntil && pausedUntil > new Date()) return;
    const next = pin + digit;
    setWrong(false);
    setPin(next);
    if (next.length < 4) return;
    const result = await enterPinFn({ data: { childId: child.id, pin: next } });
    setPin("");
    if (result.ok) {
      await navigate({ to: "/play/$childId", params: { childId: child.id } });
      return;
    }
    setWrong(true);
    if (result.pausedUntil) setPausedUntil(new Date(result.pausedUntil));
  }

  const paused = pausedUntil !== null && pausedUntil > new Date();
  return (
    <main className="mx-auto flex w-full max-w-xs flex-1 flex-col items-center justify-center gap-6 p-4">
      <h1 className="text-3xl font-semibold">{child.nickname}</h1>
      <div className="flex gap-3" aria-label={`${pin.length} of 4 digits`}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`size-5 rounded-full border-2 ${i < pin.length ? "bg-primary" : ""}`} />
        ))}
      </div>
      {paused ? (
        <p className="text-lg text-muted-foreground">Wait a minute, then try again</p>
      ) : (
        wrong && <p className="text-lg text-destructive">Try again</p>
      )}
      <div className="grid w-full grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", ""].map((d, i) =>
          d ? (
            <Button
              key={i}
              disabled={paused}
              className="h-20 rounded-2xl text-3xl"
              onClick={() => void press(d)}
            >
              {d}
            </Button>
          ) : (
            <span key={i} />
          ),
        )}
      </div>
      <Link to="/play" className="text-lg text-muted-foreground">
        Back
      </Link>
    </main>
  );
}
