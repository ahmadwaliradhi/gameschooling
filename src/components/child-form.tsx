import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ageOf } from "#/domain/quest";

// Nickname and age only: the app holds nothing else about a Child.
export function ChildForm(props: {
  initial?: { nickname: string; birthYear: number };
  submitLabel: string;
  onSubmit: (child: { nickname: string; birthYear: number }) => Promise<void>;
}) {
  const [nickname, setNickname] = useState(props.initial?.nickname ?? "");
  const [age, setAge] = useState(props.initial ? String(ageOf(props.initial.birthYear)) : "");
  const [busy, setBusy] = useState(false);
  const ageNumber = Number(age);
  const valid =
    nickname.trim().length > 0 && Number.isInteger(ageNumber) && ageNumber >= 2 && ageNumber <= 18;
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!valid) return;
        setBusy(true);
        try {
          await props.onSubmit({ nickname, birthYear: new Date().getFullYear() - ageNumber });
        } finally {
          setBusy(false);
        }
      }}
    >
      <Input
        aria-label="Nickname"
        placeholder="Nickname"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
      />
      <Input
        aria-label="Age"
        placeholder="Age"
        inputMode="numeric"
        value={age}
        onChange={(e) => setAge(e.target.value.replace(/\D/g, ""))}
      />
      <Button type="submit" disabled={!valid || busy}>
        {props.submitLabel}
      </Button>
    </form>
  );
}
