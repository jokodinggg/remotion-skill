import { z } from "zod";

export const ScriptLineSchema = z.object({
  id: z.string().regex(/^\d{2}$/, "id must be two digits (01..99)"),
  speaker: z.string().min(1),
  tag: z.string().min(1),
  spoken: z.string().min(1),
  caption: z.string().optional(),
  keywords: z.array(z.string()),
  visual: z.string(),
});

export const ScriptSchema = z.object({
  slug: z.string().min(1),
  seri: z.string().min(1),
  voice: z.string().nullable(),
  cta: z.boolean().optional(),
  title: z.string().min(1),
  music: z.object({
    mood: z.string(),
    bpm: z.number(),
    prompt: z.string(),
  }),
  lines: z.array(ScriptLineSchema).min(1),
});

export const TimedWordSchema = z.object({
  text: z.string(),
  startMs: z.number(),
  endMs: z.number(),
  keyword: z.boolean(),
  inserted: z.boolean(),
});

export const PauseSchema = z.object({
  atMs: z.number(),
  durMs: z.number(),
});

export const TimelineLineSchema = z.object({
  id: z.string(),
  speaker: z.string(),
  tag: z.string(),
  startMs: z.number(),
  durMs: z.number(),
  words: z.array(TimedWordSchema),
  pauses: z.array(PauseSchema),
});

export const VoSourceSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("single"), src: z.string() }),
  z.object({
    mode: z.literal("perLine"),
    files: z.array(
      z.object({ lineId: z.string(), src: z.string(), startMs: z.number() }),
    ),
  }),
]);

export const DiffSchema = z.object({
  line: z.string(),
  kind: z.enum(["missing", "inserted", "changed"]),
  expected: z.string().optional(),
  heard: z.string().optional(),
});

export const HeardWordSchema = z.object({
  text: z.string(),
  startMs: z.number(),
  endMs: z.number(),
});

export const TimelineSchema = z.object({
  slug: z.string(),
  seri: z.string(),
  title: z.string(),
  cta: z.boolean(),
  fps: z.literal(60),
  durationMs: z.number(),
  tailMs: z.number(),
  voOffsetMs: z.number(),
  vo: VoSourceSchema,
  lines: z.array(TimelineLineSchema),
  music: z
    .object({ src: z.string(), loop: z.boolean(), durationMs: z.number() })
    .nullable(),
  diffs: z.array(DiffSchema),
});

export type ScriptLine = z.infer<typeof ScriptLineSchema>;
export type Script = z.infer<typeof ScriptSchema>;
export type TimedWord = z.infer<typeof TimedWordSchema>;
export type Pause = z.infer<typeof PauseSchema>;
export type TimelineLine = z.infer<typeof TimelineLineSchema>;
export type VoSource = z.infer<typeof VoSourceSchema>;
export type Diff = z.infer<typeof DiffSchema>;
export type HeardWord = z.infer<typeof HeardWordSchema>;
export type Timeline = z.infer<typeof TimelineSchema>;
