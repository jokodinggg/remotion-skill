import React from "react";
import { AbsoluteFill } from "remotion";
import { useBrand } from "../fondasi/brand/BrandProvider";
import { poppins } from "../fondasi/brand/fonts";
import { Crowd } from "./characters/Crowd";
import { Person } from "./characters/Person";
import { personSize } from "./characters/variants";
import { Joks } from "./joks/Joks";
import { AiBadge } from "./props/AiBadge";
import { Calendar } from "./props/Calendar";
import { Chart } from "./props/Chart";
import { ChatBubble } from "./props/ChatBubble";
import { CheckCross } from "./props/CheckCross";
import { CodeWindow } from "./props/CodeWindow";
import { Coffee } from "./props/Coffee";
import { Desk } from "./props/Desk";
import { DeskLamp } from "./props/DeskLamp";
import { GradCap } from "./props/GradCap";
import { Laptop } from "./props/Laptop";
import { NightWindow } from "./props/NightWindow";
import { PaperStack } from "./props/PaperStack";
import { Phone } from "./props/Phone";
import { Server } from "./props/Server";
import { WallClock } from "./props/WallClock";
import { LatarBrand } from "./stages/LatarBrand";
import { MEJA_BELAJAR, MejaBelajar } from "./stages/MejaBelajar";
import { PANGGUNG_ISO, PanggungIso } from "./stages/PanggungIso";
import { EXTRA_COLORS as X, STYLE } from "./style";

/**
 * Library QA sheet, 2160 x 3840 (2x the video frame): every prop at one shared
 * scale (so outline weights compare directly), three Person variants, a Crowd,
 * and the three stages at 1/4 scale with a figure on each.
 */

const S = 0.8; // shared prop scale: every prop renders at S x its native width
const PAD = 60;

type Item = { label: string; name: string; span?: number; node: React.ReactNode };

const PROPS: Item[] = [
  { label: "meja", name: "Desk", span: 2, node: <Desk width={960 * S} /> },
  { label: "laptop (belakang)", name: "Laptop side=back", node: <Laptop side="back" width={340 * S} /> },
  { label: "laptop (depan)", name: "Laptop side=front", node: <Laptop side="front" width={340 * S} /> },
  { label: "lampu meja", name: "DeskLamp", node: <DeskLamp width={260 * S} /> },
  { label: "tumpukan kertas", name: "PaperStack", node: <PaperStack width={200 * S} /> },
  { label: "jam dinding", name: "WallClock", node: <WallClock minutes={23 * 60 + 52} width={200 * S} /> },
  { label: "kalender", name: "Calendar", node: <Calendar label="BESOK" circled={9} width={220 * S} /> },
  { label: "jendela malam", name: "NightWindow", node: <NightWindow t={0} width={300 * S} /> },
  { label: "jendela siang", name: "NightWindow night=false", node: <NightWindow t={0} night={false} width={300 * S} /> },
  { label: "hp", name: "Phone", node: <Phone width={200 * S} /> },
  { label: "bubble chat (masuk)", name: "ChatBubble from=left", node: <ChatBubble from="left" text="tugas akhirku gimana?" width={480 * S} /> },
  { label: "bubble chat (keluar)", name: "ChatBubble from=right", node: <ChatBubble from="right" text="tenang, ada jokoding!" width={480 * S} /> },
  { label: "jendela kode", name: "CodeWindow", node: <CodeWindow lines={6} typed={0.7} width={440 * S} /> },
  { label: "server", name: "Server", node: <Server width={240 * S} /> },
  { label: "ikon AI", name: "AiBadge", node: <AiBadge width={240 * S} /> },
  { label: "toga", name: "GradCap", node: <GradCap width={300 * S} /> },
  { label: "kopi", name: "Coffee", node: <Coffee width={220 * S} /> },
  { label: "grafik", name: "Chart", node: <Chart values={[3, 5, 4, 7, 9]} width={420 * S} /> },
  {
    label: "centang / silang",
    name: "CheckCross ok · ok=false",
    node: (
      <div style={{ display: "flex", gap: 40 }}>
        <CheckCross ok width={160 * S} />
        <CheckCross ok={false} width={160 * S} />
      </div>
    ),
  },
];

const Label: React.FC<{ label: string; name: string }> = ({ label, name }) => {
  const { palette: C } = useBrand();
  return (
    <div style={{ textAlign: "center", lineHeight: 1.15 }}>
      <div style={{ fontSize: 32, fontWeight: 600, color: C.thunder }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 500, color: X.charcoal }}>{name}</div>
    </div>
  );
};

const Cell: React.FC<{ label: string; name: string; height: number; span?: number; width?: number; children: React.ReactNode }> = ({
  label,
  name,
  height,
  span,
  width,
  children,
}) => (
  <div
    style={{
      gridColumn: span ? `span ${span}` : undefined,
      width,
      height,
      background: X.white,
      borderRadius: 24,
      padding: "20px 16px 16px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "space-between",
      boxSizing: "border-box",
    }}
  >
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div>
    <Label label={label} name={name} />
  </div>
);

const Heading: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { palette: C } = useBrand();
  return <div style={{ fontSize: 44, fontWeight: 700, color: C.hijauTua, margin: "36px 0 16px" }}>{children}</div>;
};

/** A 1080 x 1920 stage rendered at 1/4 scale (270 x 480). */
const MiniStage: React.FC<{ label: string; name: string; children: React.ReactNode }> = ({ label, name, children }) => {
  const { palette: C } = useBrand();
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
      <div style={{ width: 270, height: 480, overflow: "hidden", borderRadius: 16, outline: `4px solid ${C.thunder}` }}>
        <div style={{ position: "relative", width: 1080, height: 1920, transform: "scale(0.25)", transformOrigin: "0 0" }}>{children}</div>
      </div>
      <Label label={label} name={name} />
    </div>
  );
};

const BUST_W = 440;
const bust = personSize("duduk", BUST_W);
const STAND_W = 380;
const stand = personSize("berdiri", STAND_W);
const SHOE_BOTTOM = 740 / 760; // shoe soles sit at y 740 of the 760-tall standing box
const TORSO_BOTTOM = 455 / 460; // seated torso outline ends at y 455 of the 460 crop

export const LibraryGallery: React.FC = () => {
  const { palette: C } = useBrand();
  return (
    <AbsoluteFill style={{ backgroundColor: C.mintCream, fontFamily: poppins, padding: PAD, boxSizing: "border-box", display: "block" }}>
      <div style={{ fontSize: 72, fontWeight: 800, color: C.thunder, lineHeight: 1.1 }}>Library Ilustrasi</div>
      <div style={{ fontSize: 30, fontWeight: 500, color: X.charcoal }}>
        satu gaya stiker: outline Thunder {STYLE.outlineProp} pada skala 1, isian flat, satu kilau per volume · props di sini skala {S}
      </div>

      <Heading>Props</Heading>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16 }}>
        {PROPS.map((p) => (
          <Cell key={p.name} label={p.label} name={p.name} span={p.span} height={420}>
            {p.node}
          </Cell>
        ))}
      </div>

      <Heading>Karakter</Heading>
      <div style={{ display: "flex", gap: 16 }}>
        <Cell label="orang · pendek, berdiri, senang" name="Person" height={620} width={400}>
          <Person look={{ hair: "pendek", skin: 1, outfit: "lawnGreen" }} mood="senang" pose="berdiri" width={280} />
        </Cell>
        <Cell label="orang · panjang, duduk, bingung" name="Person + kacamata" height={620} width={400}>
          <Person look={{ hair: "panjang", skin: 0, outfit: "kuning", accessory: "kacamata" }} mood="bingung" pose="duduk" width={300} />
        </Cell>
        <Cell label="orang · hijab, nunjuk, kagum" name="Person + headset" height={620} width={460}>
          <Person look={{ hair: "hijab", skin: 2, outfit: "hijauTua", accessory: "headset" }} mood="kagum" pose="nunjuk" width={280} />
        </Cell>
        <Cell label="kerumunan · 10 orang" name="Crowd" height={620} width={732}>
          <Crowd count={10} seed={3} area={{ w: 680, h: 440 }} mood="senang" />
        </Cell>
      </div>

      <Heading>Stage</Heading>
      <div style={{ display: "flex", gap: 120, justifyContent: "center" }}>
        <MiniStage label="meja belajar (malam)" name="MejaBelajar">
          <MejaBelajar time="malam">
            <Person
              look={{ hair: "pendek", skin: 1, outfit: "lawnGreen" }}
              mood="panik"
              pose="duduk"
              width={BUST_W}
              style={{ position: "absolute", left: 540 - bust.w / 2, top: MEJA_BELAJAR.deskTop - bust.h * TORSO_BOTTOM }}
            />
            <div style={{ position: "absolute", left: 540 - 165, top: MEJA_BELAJAR.deskTop - (330 * 224) / 340 }}>
              <Laptop side="back" glow={0.8} width={330} />
            </div>
          </MejaBelajar>
        </MiniStage>
        <MiniStage label="meja belajar (siang)" name="MejaBelajar">
          <MejaBelajar time="siang">
            <Person
              look={{ hair: "panjang", skin: 3, outfit: "hijauTerang" }}
              mood="senang"
              pose="duduk"
              width={BUST_W}
              style={{ position: "absolute", left: 540 - bust.w / 2, top: MEJA_BELAJAR.deskTop - bust.h * TORSO_BOTTOM }}
            />
          </MejaBelajar>
        </MiniStage>
        <MiniStage label="latar brand" name="LatarBrand">
          <LatarBrand t={0}>
            <Joks expression="senang" width={560} style={{ position: "absolute", left: 540 - 280, top: 620 }} />
          </LatarBrand>
        </MiniStage>
        <MiniStage label="panggung iso" name="PanggungIso">
          <PanggungIso>
            <Person
              look={{ hair: "hijab", skin: 2, outfit: "hijauTua" }}
              mood="senang"
              pose="berdiri"
              width={STAND_W}
              style={{ position: "absolute", left: PANGGUNG_ISO.cx - stand.w / 2, top: PANGGUNG_ISO.cy - stand.h * SHOE_BOTTOM }}
            />
          </PanggungIso>
        </MiniStage>
      </div>
    </AbsoluteFill>
  );
};
