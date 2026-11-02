import type React from "react";
import type { Timeline } from "./schema";

/** One video in the generated registry (src/videos.generated.ts). */
export type RegisteredVideo = {
  slug: string;
  timeline: Timeline;
  Scenes: React.FC;
  background: "light" | "dark";
};
