import type { BrandKit } from "../brand/types";
import { useBrand } from "../brand/BrandProvider";

export const SAFE = { width: 1080, height: 1920 } as const;

export type Rect = { x: number; y: number; w: number; h: number };

const overlaps = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

/** The three platform-UI zones where nothing important may sit (spec §6.7). */
export const forbiddenZones = (brand: BrandKit): Rect[] => {
  const { top, bottom, rail } = brand.safeArea;
  return [
    { x: 0, y: 0, w: SAFE.width, h: top },
    { x: 0, y: SAFE.height - bottom, w: SAFE.width, h: bottom },
    { x: rail.xMin, y: rail.yMin, w: SAFE.width - rail.xMin, h: rail.yMax - rail.yMin },
  ];
};

export const isInForbiddenZone = (rect: Rect, brand: BrandKit): boolean =>
  forbiddenZones(brand).some((z) => overlaps(rect, z));

/** Composition box for scene content (spec §6.7). */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- brand kept in the signature for future per-brand boxes
export const safeBox = (_brand: BrandKit): Rect => ({ x: 120, y: 300, w: 840, h: 1050 });

export const useSafeArea = (): Rect => safeBox(useBrand());
