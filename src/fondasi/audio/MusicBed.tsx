import React from "react";
import { Sequence, staticFile, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { useQa, useTimeline } from "../timeline/TimelineProvider";
import { musicVolumeAt } from "./ducking";

const FADE_OUT_MS = 1200;
const CROSSFADE_MS = 1000;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

export const MusicBed: React.FC = () => {
  const timeline = useTimeline();
  const qa = useQa();
  const { fps } = useVideoConfig();
  const { music, durationMs, lines } = timeline;
  if (qa || !music) return null;

  const fadeOut = (ms: number) => clamp01((durationMs - ms) / FADE_OUT_MS);
  const src = staticFile(music.src);

  if (!music.loop) {
    return (
      <Audio
        src={src}
        volume={(frame) => {
          const ms = (frame / fps) * 1000;
          return musicVolumeAt(ms, lines) * fadeOut(ms);
        }}
      />
    );
  }

  const stepMs = music.durationMs - CROSSFADE_MS;
  const copies = Math.max(1, Math.ceil(durationMs / stepMs));
  return (
    <>
      {Array.from({ length: copies }, (_, k) => {
        const startMs = k * stepMs;
        // Edge fades only where a neighbouring copy exists to crossfade with.
        const edge = (local: number) => {
          const fadeIn = k === 0 ? 1 : clamp01(local / CROSSFADE_MS);
          const fadeOutEdge = k === copies - 1 ? 1 : clamp01((music.durationMs - local) / CROSSFADE_MS);
          return fadeIn * fadeOutEdge;
        };
        return (
          <Sequence key={k} from={Math.round((startMs / 1000) * fps)} layout="none">
            <Audio
              src={src}
              volume={(frame) => {
                const local = (frame / fps) * 1000;
                const ms = startMs + local;
                return musicVolumeAt(ms, lines) * fadeOut(ms) * edge(local);
              }}
            />
          </Sequence>
        );
      })}
    </>
  );
};
