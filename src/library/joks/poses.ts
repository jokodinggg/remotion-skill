import type { JoksExpression } from "../../fondasi/expression";

export type Pose = {
  tilt: number;
  leftHand: { x: number; y: number; r: number };
  rightHand: { x: number; y: number; r: number; thumb?: boolean; point?: boolean };
};

export const POSES: Record<JoksExpression, Pose> = {
  netral: { tilt: 0, leftHand: { x: 118, y: 878, r: 0 }, rightHand: { x: 758, y: 868, r: 0 } },
  halo: { tilt: 5, leftHand: { x: 110, y: 900, r: 0 }, rightHand: { x: 835, y: 300, r: 25 } },
  senang: { tilt: 0, leftHand: { x: 30, y: 300, r: -15 }, rightHand: { x: 860, y: 290, r: 15 } },
  kaget: { tilt: -3, leftHand: { x: 25, y: 520, r: 0 }, rightHand: { x: 865, y: 505, r: 0 } },
  sedih: { tilt: -4, leftHand: { x: 230, y: 960, r: -10 }, rightHand: { x: 650, y: 960, r: 10 } },
  marah: { tilt: 0, leftHand: { x: 50, y: 880, r: 0 }, rightHand: { x: 840, y: 875, r: 0 } },
  bingung: { tilt: 10, leftHand: { x: 100, y: 905, r: 0 }, rightHand: { x: 560, y: 770, r: -20 } },
  jempol: { tilt: 0, leftHand: { x: 105, y: 935, r: 0 }, rightHand: { x: 860, y: 600, r: 0, thumb: true } },
  nunjuk: { tilt: 6, leftHand: { x: 90, y: 905, r: 0 }, rightHand: { x: 830, y: 250, r: 35, point: true } },
};

/** Linear blend between two poses, for transitions between expressions. */
export function lerpPose(a: Pose, b: Pose, t: number): Pose {
  const l = (x: number, y: number) => x + (y - x) * t;
  const src = t < 0.5 ? a.rightHand : b.rightHand;
  const rightHand: Pose["rightHand"] = {
    x: l(a.rightHand.x, b.rightHand.x),
    y: l(a.rightHand.y, b.rightHand.y),
    r: l(a.rightHand.r, b.rightHand.r),
  };
  if (src.thumb) rightHand.thumb = true;
  if (src.point) rightHand.point = true;
  return {
    tilt: l(a.tilt, b.tilt),
    leftHand: {
      x: l(a.leftHand.x, b.leftHand.x),
      y: l(a.leftHand.y, b.leftHand.y),
      r: l(a.leftHand.r, b.leftHand.r),
    },
    rightHand,
  };
}
