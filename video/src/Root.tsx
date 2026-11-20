import "./theme";
import { Composition, Folder } from "remotion";
import { SCENES, SapatDemo } from "./SapatDemo";
import { FPS, TOTAL_FRAMES, sceneFrames } from "./timeline";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="SapatDemo" component={SapatDemo} durationInFrames={TOTAL_FRAMES} fps={FPS} width={1920} height={1080} />
      <Folder name="SapatDemo-Scenes">
        {SCENES.map((s, i) => (
          <Composition key={s.id} id={s.name} component={s.component} durationInFrames={sceneFrames(i)} fps={FPS} width={1920} height={1080} />
        ))}
      </Folder>
    </>
  );
};
