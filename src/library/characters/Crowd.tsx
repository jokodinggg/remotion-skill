import React from "react";
import type { PersonMood } from "../../fondasi/expression";
import { Person } from "./Person";
import { crowdLayout, crowdPersonWidth } from "./variants";

export { crowdLayout } from "./variants";

/** Seeded group of seated Person busts filling `area` (px); back rows render first. */
export const Crowd: React.FC<{ count: number; seed: number; area: { w: number; h: number }; mood: PersonMood }> = ({ count, seed, area, mood }) => {
  const base = crowdPersonWidth(count, area);
  return (
    <div style={{ position: "relative", width: area.w, height: area.h }}>
      {crowdLayout(count, seed, area).map((p, i) => (
        <Person
          key={i}
          look={p.look}
          mood={mood}
          pose="duduk"
          width={base * p.scale}
          seed={seed * 1000 + i}
          style={{ position: "absolute", left: p.x, top: p.y }}
        />
      ))}
    </div>
  );
};
