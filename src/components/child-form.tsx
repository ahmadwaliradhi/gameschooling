import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ageOf } from "#/domain/quest";

// Nickname and age only: the app holds nothing else about a Child.
export function ChildForm(props: {
  initial?: { nickname: string; birthYear: number };
  submitLabel: string;
  onSubmit: (child: { nickname: string; birthYear: number }) => Promise<void>;
}) {
  const uid = useId();
  const [nickname, setNickname] = useState(props.initial?.nickname ?? "");
  const [age, setAge] = useState(props.initial ? String(ageOf(props.initial.birthYear)) : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ageNumber = Number(age);
  const ageOk = Number.isInteger(ageNumber) && ageNumber >= 2 && ageNumber <= 18;
  const ageBad = age !== "" && !ageOk;
  const valid = nickname.trim().length > 0 && ageOk;
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!valid) return;
        setBusy(true);
        setError(null);
        try {
          await props.onSubmit({
            nickname: nickname.trim(),
            birthYear: new Date().getFullYear() - ageNumber,
          });
        } catch {
          setError("Could not save. Try again.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${uid}-nickname`}>Nickname</Label>
        <Input
          id={`${uid}-nickname`}
          placeholder="e.g. Nadia"
          maxLength={40}
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${uid}-age`}>Age</Label>
        <Input
          id={`${uid}-age`}
          placeholder="2 to 18"
          inputMode="numeric"
          value={age}
          aria-invalid={ageBad || undefined}
          aria-describedby={ageBad ? `${uid}-age-error` : undefined}
          onChange={(e) => setAge(e.target.value.replace(/\D/g, ""))}
        />
        {ageBad && (
          <p id={`${uid}-age-error`} className="text-xs text-destructive">
            Age must be 2 to 18
          </p>
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" disabled={!valid || busy}>
        {busy ? "Saving…" : props.submitLabel}
      </Button>
    </form>
  );
}
