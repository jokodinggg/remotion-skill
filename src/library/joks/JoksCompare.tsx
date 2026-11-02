import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { useBrand } from "../../fondasi/brand/BrandProvider";
import type { JoksExpression } from "../../fondasi/expression";
import { Joks } from "./Joks";

const ALL: JoksExpression[] = ["netral", "halo", "senang", "kaget", "sedih", "marah", "bingung", "jempol", "nunjuk"];

/** Side-by-side QA: official PNG (left) vs vector rig (right) for every expression. Mandatory per ADR 0004. */
export const JoksCompare: React.FC = () => {
  const { palette, font } = useBrand();
  return (
    <AbsoluteFill style={{ background: palette.mintCream, fontFamily: `${font.family}, sans-serif`, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", padding: 20, gap: 16 }}>
      {ALL.map((e) => (
        <div key={e} style={{ background: "#fff", borderRadius: 16, padding: 12, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontWeight: 600, fontSize: 26, color: palette.thunder }}>{e}</div>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end", height: 400 }}>
            <Img src={staticFile(`brand/jokoding/joks/joks-${e}.png`)} style={{ height: 330, objectFit: "contain", width: 270 }} />
            <Joks expression={e} width={280} />
          </div>
        </div>
      ))}
    </AbsoluteFill>
  );
};
