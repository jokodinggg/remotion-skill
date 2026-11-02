import { AbsoluteFill, Composition } from "remotion";

const MINT_CREAM = "#F9FDF7";

const Smoke: React.FC = () => <AbsoluteFill style={{ backgroundColor: MINT_CREAM }} />;

export const RemotionRoot: React.FC = () => (
  <Composition
    id="v-smoke"
    component={Smoke}
    width={1080}
    height={1920}
    fps={60}
    durationInFrames={60}
  />
);
