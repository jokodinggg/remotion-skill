import React, { createContext, useContext } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { atWord, talkAmount } from "../motion/timing";
import type { Timeline, TimelineLine } from "../schema";

type TimelineContextValue = { timeline: Timeline; qa: boolean };

const TimelineContext = createContext<TimelineContextValue | null>(null);

export const TimelineProvider: React.FC<{ timeline: Timeline; qa?: boolean; children: React.ReactNode }> = ({
  timeline,
  qa = false,
  children,
}) => <TimelineContext.Provider value={{ timeline, qa }}>{children}</TimelineContext.Provider>;

function useCtx(): TimelineContextValue {
  const ctx = useContext(TimelineContext);
  if (!ctx) throw new Error("useTimeline harus dipakai di dalam TimelineProvider");
  return ctx;
}

export const useTimeline = (): Timeline => useCtx().timeline;

export const useQa = (): boolean => useCtx().qa;

export function useLine(id: string): TimelineLine {
  const line = useTimeline().lines.find((l) => l.id === id);
  if (!line) throw new Error(`Baris tidak ditemukan: ${id}`);
  return line;
}

/** Frame at which `which` (word text or index) of line `lineId` starts. */
export function useAtWord(lineId: string, which: string | number): number {
  const { fps } = useVideoConfig();
  return atWord(useTimeline(), lineId, which, fps);
}

/** Mouth openness for the current frame; 0 unless the line's speaker is "joks". */
export function useTalk(lineId: string): number {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const timeline = useTimeline();
  const line = useLine(lineId);
  if (line.speaker !== "joks") return 0;
  return talkAmount(timeline, lineId, (frame / fps) * 1000);
}
