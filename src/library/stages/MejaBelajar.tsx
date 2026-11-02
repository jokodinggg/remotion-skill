import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { useBrand } from "../../fondasi/brand/BrandProvider";
import { Desk } from "../props/Desk";
import { NightWindow } from "../props/NightWindow";
import { EXTRA_COLORS as X, STYLE } from "../style";

/**
 * Stage layout in composition px. The floor starts at `floorY` with a single
 * Thunder line; the desk top sits `deskTop` (its outline centre), clear of the
 * floor line so the two never stack into a double line (the spike's bug).
 * Place a seated Person bust so its bottom edge lands on `deskTop`.
 */
export const MEJA_BELAJAR = { floorY: 1180, deskTop: 1250, deskLeft: 60, deskWidth: 960 } as const;
const DESK_NATIVE_TOP = 10; // outline centre of the slab in Desk's 960-wide viewBox

/** Study-desk room, 1080 x 1920: wall, floor, a night or daylight window and the desk. */
export const MejaBelajar: React.FC<{ time: "malam" | "siang"; children?: React.ReactNode }> = ({ time, children }) => {
  const { palette: C } = useBrand();
  const frame = useCurrentFrame();
  const L = MEJA_BELAJAR;
  return (
    <AbsoluteFill style={{ backgroundColor: time === "malam" ? X.wallNight : X.wall }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: L.floorY,
          bottom: 0,
          backgroundColor: X.floor,
          borderTop: `${STYLE.outlineProp}px solid ${C.thunder}`,
        }}
      />
      <div style={{ position: "absolute", left: 90, top: 330 }}>
        <NightWindow t={frame} night={time === "malam"} width={300} />
      </div>
      <div style={{ position: "absolute", left: L.deskLeft, top: L.deskTop - DESK_NATIVE_TOP * (L.deskWidth / 960) }}>
        <Desk width={L.deskWidth} />
      </div>
      <AbsoluteFill>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};
