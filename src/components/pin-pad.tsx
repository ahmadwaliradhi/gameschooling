import { type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";

type Entry = { ok: true } | { ok: false; pausedUntil: Date | string | null };

// Big number buttons for a 4-digit PIN: the Child PIN and the Parent PIN.
export function PinPad(props: {
  title: string;
  pausedUntil: Date | string | null;
  enter: (pin: string) => Promise<Entry>;
  onUnlocked: () => Promise<void>;
  children?: ReactNode;
}) {
  const [pin, setPin] = useState("");
  const [wrong, setWrong] = useState(false);
  const [pausedUntil, setPausedUntil] = useState<Date | null>(
    props.pausedUntil && new Date(props.pausedUntil) > new Date() ? new Date(props.pausedUntil) : null,
  );

  async function press(digit: string) {
    if (pausedUntil && pausedUntil > new Date()) return;
    const next = pin + digit;
    setWrong(false);
    setPin(next);
    if (next.length < 4) return;
    const result = await props.enter(next);
    setPin("");
    if (result.ok) {
      await props.onUnlocked();
      return;
    }
    setWrong(true);
    if (result.pausedUntil) setPausedUntil(new Date(result.pausedUntil));
  }

  const paused = pausedUntil !== null && pausedUntil > new Date();
  return (
    <main className="mx-auto flex w-full max-w-xs flex-1 flex-col items-center justify-center gap-6 p-4">
      <h1 className="text-3xl font-semibold">{props.title}</h1>
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
      {props.children}
    </main>
  );
}
