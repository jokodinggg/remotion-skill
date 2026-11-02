import React from "react";
import { AbsoluteFill, Freeze, useVideoConfig } from "remotion";
import { useBrand } from "../fondasi/brand/BrandProvider";
import { CtaEnd } from "../fondasi/brand/CtaEnd";
import { poppins } from "../fondasi/brand/fonts";
import { QaOverlay } from "../fondasi/layout/QaOverlay";
import { TimelineProvider } from "../fondasi/timeline/TimelineProvider";
import { Person } from "../library/characters/Person";
import { Joks } from "../library/joks/Joks";
import { Calendar } from "../library/props/Calendar";
import { Coffee } from "../library/props/Coffee";
import { Laptop } from "../library/props/Laptop";
import { PaperStack } from "../library/props/PaperStack";
import { WallClock } from "../library/props/WallClock";
import { PanggungIso } from "../library/stages/PanggungIso";
import { EXTRA_COLORS as X } from "../library/style";
import { Angka } from "./Angka";
import { Diagram } from "./Diagram";
import { Hook } from "./Hook";
import { JoksSolusi } from "./JoksSolusi";
import { Langkah } from "./Langkah";
import { Masalah } from "./Masalah";
import { Backdrop } from "./parts";
import { Perbandingan } from "./Perbandingan";
import { SAMPLE_LINE as L, sampleTimeline } from "./sampleTimeline";

/**
 * Archetype QA sheet, 3240 x 3840: a 3 x 3 grid. Cell 1 is the legend, then
 * the seven archetypes and CtaEnd, each a full 1080 x 1920 frame scaled to
 * 0.57, frozen at its sample line's midpoint, with QaOverlay on top.
 */

const S = 0.57;
const TILE_W = 1080 * S;
const TILE_H = 1920 * S;
const COLS = 3;
const LABEL_H = 90;
const ms2f = (ms: number, fps: number) => Math.round((ms / 1000) * fps);

const lineMid = (id: string, fps: number): number => {
  const l = sampleTimeline.lines.find((x) => x.id === id)!;
  return ms2f(l.startMs + l.durMs / 2, fps);
};
const tailStartMs = sampleTimeline.durationMs - sampleTimeline.tailMs;

/** Composition length: covers every frozen frame (CtaEnd freezes 1 s into the tail). */
export const archetypeGalleryFrames = (fps: number): number => ms2f(sampleTimeline.durationMs, fps);

type Tile = { n: number; name: string; note: string; frame: (fps: number) => number; node: React.ReactNode };

const TILES: Tile[] = [
  {
    n: 1,
    name: "Hook",
    note: "headline + reaksi + push kamera",
    frame: (fps) => lineMid(L.hook, fps),
    node: (
      <Hook
        lineId={L.hook}
        headline="Deadline tinggal 3 hari?"
        character={<Person look={{ hair: "pendek", skin: 1, outfit: "lawnGreen" }} mood="panik" pose="duduk" width={340} />}
      />
    ),
  },
  {
    n: 2,
    name: "Masalah",
    note: "karakter di stage + prop masalah",
    frame: (fps) => lineMid(L.masalah, fps),
    node: (
      <Masalah
        lineId={L.masalah}
        stage={<PanggungIso />}
        character={<Person look={{ hair: "hijab", skin: 2, outfit: "kuning", accessory: "kacamata" }} mood="panik" pose="angkat-tangan" width={330} />}
        problem={
          <div style={{ position: "relative", width: 330, height: 330 }}>
            <Calendar label="BESOK" circled={9} width={270} />
            <div style={{ position: "absolute", right: 0, bottom: 0 }}>
              <WallClock minutes={23 * 60 + 52} width={150} />
            </div>
          </div>
        }
      />
    ),
  },
  {
    n: 3,
    name: "Perbandingan",
    note: "A vs B, kiri-kanan",
    frame: (fps) => lineMid(L.perbandingan, fps),
    node: (
      <Perbandingan
        lineId={L.perbandingan}
        left={{
          label: "Begadang",
          visual: (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <Coffee width={210} />
              <PaperStack width={240} />
            </div>
          ),
        }}
        right={{ label: "Konsultasi", visual: <Joks expression="jempol" width={330} /> }}
      />
    ),
  },
  {
    n: 4,
    name: "Angka",
    note: "angka menghitung + cincin progres",
    frame: (fps) => lineMid(L.angka, fps),
    node: <Angka lineId={L.angka} value={92} suffix="%" label="tugas kelar sebelum deadline" countAt="92%" />,
  },
  {
    n: 5,
    name: "Langkah",
    note: "kartu 1-2-3 di Kata Kunci",
    frame: (fps) => lineMid(L.langkah, fps),
    node: (
      <Langkah
        lineId={L.langkah}
        items={[
          { title: "Chat admin", at: "chat" },
          { title: "Diskusi", at: "diskusi" },
          { title: "Beres!", at: "beres" },
        ]}
      />
    ),
  },
  {
    n: 6,
    name: "JoksSolusi",
    note: "Joks bicara + menunjuk prop",
    frame: (fps) => lineMid(L.joksSolusi, fps),
    node: <JoksSolusi lineId={L.joksSolusi} prop={<Laptop side="front" glow={0.9} width={280} />} />,
  },
  {
    n: 7,
    name: "Diagram",
    note: "alur node + panah",
    frame: (fps) => lineMid(L.diagram, fps),
    node: (
      <Diagram
        lineId={L.diagram}
        nodes={[
          { id: "p", label: "Perintah", at: "perintah" },
          { id: "a", label: "AI agent", at: "agent" },
          { id: "t", label: "Pakai tools", at: "tools" },
          { id: "h", label: "Hasil", at: "hasil" },
        ]}
        edges={[
          ["p", "a"],
          ["a", "t"],
          ["t", "h"],
        ]}
      />
    ),
  },
  {
    n: 8,
    name: "CtaEnd",
    note: "otomatis dari VideoShell",
    frame: (fps) => ms2f(tailStartMs, fps) + fps,
    node: <CtaEndTile />,
  },
];

function CtaEndTile() {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <Backdrop />
      <CtaEnd startFrame={ms2f(tailStartMs, fps)} />
    </AbsoluteFill>
  );
}

const TileFrame: React.FC<{ tile: Tile }> = ({ tile }) => {
  const { palette: C } = useBrand();
  const { fps } = useVideoConfig();
  const frame = tile.frame(fps);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, width: TILE_W }}>
      <div style={{ height: LABEL_H, display: "flex", flexDirection: "column", justifyContent: "flex-end", whiteSpace: "nowrap" }}>
        <div style={{ fontSize: 44, fontWeight: 800, lineHeight: 1.1, color: C.thunder }}>
          {tile.n} · {tile.name}
        </div>
        <div style={{ fontSize: 26, fontWeight: 500, lineHeight: 1.3, color: X.charcoal }}>
          {tile.note} · beku di f{frame}
        </div>
      </div>
      <div style={{ width: TILE_W, height: TILE_H, overflow: "hidden", borderRadius: 20, outline: `6px solid ${C.thunder}` }}>
        <div style={{ position: "relative", width: 1080, height: 1920, transform: `scale(${S})`, transformOrigin: "0 0", overflow: "hidden" }}>
          <TimelineProvider timeline={sampleTimeline} qa>
            <Freeze frame={frame}>
              {tile.node}
              <QaOverlay />
            </Freeze>
          </TimelineProvider>
        </div>
      </div>
    </div>
  );
};

const Legend: React.FC = () => {
  const { palette: C } = useBrand();
  const row = (swatch: React.CSSProperties, text: string) => (
    <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
      <div style={{ width: 64, height: 40, borderRadius: 8, flexShrink: 0, ...swatch }} />
      <span style={{ fontSize: 36, fontWeight: 600, color: C.thunder }}>{text}</span>
    </div>
  );
  return (
    <div style={{ width: TILE_W, height: TILE_H + LABEL_H, display: "flex", flexDirection: "column", justifyContent: "center", gap: 36 }}>
      <div style={{ fontSize: 120, fontWeight: 800, lineHeight: 1, color: C.thunder, letterSpacing: -3 }}>Arketipe Scene</div>
      <div style={{ fontSize: 36, fontWeight: 500, color: X.charcoal, lineHeight: 1.35 }}>
        Tiap tile = frame 1080 x 1920 skala {S}, dibekukan di tengah Baris VO contohnya (sampleTimeline). Isi arketipe hanya di kotak aman x 120–960,
        y 300–1150.
      </div>
      {row({ background: "rgba(255,0,0,0.28)" }, "zona terlarang (UI platform)")}
      {row({ border: "4px solid #00E5FF", boxSizing: "border-box" }, "pita caption & area logo")}
      {row({ background: C.lawnGreen }, "aksen di setiap Kata Kunci")}
    </div>
  );
};

export const ArchetypeGallery: React.FC = () => {
  const { palette: C } = useBrand();
  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.mintCream,
        fontFamily: poppins,
        display: "grid",
        gridTemplateColumns: `repeat(${COLS}, ${TILE_W}px)`,
        justifyContent: "space-evenly",
        alignContent: "space-evenly",
      }}
    >
      <Legend />
      {TILES.map((t) => (
        <TileFrame key={t.name} tile={t} />
      ))}
    </AbsoluteFill>
  );
};
