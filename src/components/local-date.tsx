import { useEffect, useState } from "react";

// Dates render in the viewer's time zone, which the server does not know. The first render uses
// UTC on both sides so hydration matches; the local date replaces it after mount.
export function LocalDate(props: { value: Date | string | number }) {
  const date = new Date(props.value);
  const [local, setLocal] = useState(false);
  useEffect(() => setLocal(true), []);
  return (
    <time dateTime={date.toISOString()}>
      {date.toLocaleDateString(undefined, local ? {} : { timeZone: "UTC" })}
    </time>
  );
}
