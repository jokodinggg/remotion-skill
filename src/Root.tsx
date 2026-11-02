import { AbsoluteFill, Composition, Folder, Still } from "remotion";
import { JOKODING } from "../brand/jokoding/brand";
import { BrandProvider } from "./fondasi/brand/BrandProvider";
import { JoksCompare } from "./library/joks/JoksCompare";

const MINT_CREAM = "#F9FDF7";

const Smoke: React.FC = () => <AbsoluteFill style={{ backgroundColor: MINT_CREAM }} />;

const JoksCompareStill: React.FC = () => (
  <BrandProvider brand={JOKODING}>
    <JoksCompare />
  </BrandProvider>
);

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="v-smoke" component={Smoke} width={1080} height={1920} fps={60} durationInFrames={60} />
    <Folder name="Library">
      <Still id="JoksCompare" width={1860} height={1440} component={JoksCompareStill} />
    </Folder>
  </>
);
