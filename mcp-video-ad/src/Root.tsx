import { Composition } from "remotion";
import { DramaticReveal } from "./compositions/DramaticReveal";
import { SideBySide } from "./compositions/SideBySide";

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="DramaticReveal-Reel"
        component={DramaticReveal}
        durationInFrames={1680}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="DramaticReveal-Feed"
        component={DramaticReveal}
        durationInFrames={1680}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="SideBySide-Reel"
        component={SideBySide}
        durationInFrames={1680}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="SideBySide-Feed"
        component={SideBySide}
        durationInFrames={1680}
        fps={30}
        width={1080}
        height={1080}
      />
    </>
  );
};
