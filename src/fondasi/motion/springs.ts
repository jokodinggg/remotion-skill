export const SPRINGS = {
  snappy: { damping: 16, stiffness: 180 },
  soft: { damping: 20, stiffness: 90 },
  bouncy: { damping: 10, stiffness: 140, mass: 0.9 },
} as const;

export type SpringPreset = keyof typeof SPRINGS;
