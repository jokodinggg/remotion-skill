import { AbsoluteFill, Composition, Folder, Still } from "remotion";
import { JOKODING } from "../brand/jokoding/brand";
import { ArchetypeGallery, archetypeGalleryFrames } from "./archetypes/ArchetypeGallery";
import { BrandProvider } from "./fondasi/brand/BrandProvider";
import { JoksCompare } from "./library/joks/JoksCompare";
import { LibraryGallery } from "./library/LibraryGallery";

const MINT_CREAM = "#F9FDF7";

const Smoke: React.FC = () => <AbsoluteFill style={{ backgroundColor: MINT_CREAM }} />;

const JoksCompareStill: React.FC = () => (
  <BrandProvider brand={JOKODING}>
    <JoksCompare />
  </BrandProvider>
);

const LibraryGalleryStill: React.FC = () => (
  <BrandProvider brand={JOKODING}>
    <LibraryGallery />
  </BrandProvider>
);

const ArchetypeGalleryStill: React.FC = () => (
  <BrandProvider brand={JOKODING}>
    <ArchetypeGallery />
  </BrandProvider>
);

const FPS = 60;

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="v-smoke" component={Smoke} width={1080} height={1920} fps={60} durationInFrames={60} />
    <Folder name="Library">
      <Still id="JoksCompare" width={1860} height={1440} component={JoksCompareStill} />
      <Still id="LibraryGallery" width={2160} height={3840} component={LibraryGalleryStill} />
    </Folder>
    <Folder name="Galeri">
      {/* A Composition, not a Still: tiles <Freeze> at timeline frames, which must lie inside durationInFrames. */}
      <Composition
        id="ArchetypeGallery"
        width={3240}
        height={3840}
        fps={FPS}
        durationInFrames={archetypeGalleryFrames(FPS)}
        component={ArchetypeGalleryStill}
      />
    </Folder>
  </>
);
