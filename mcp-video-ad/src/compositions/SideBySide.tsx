import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadDMSerif } from "@remotion/google-fonts/DMSerifDisplay";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { COLORS, FONTS } from "../theme";
import { getLayout } from "../utils/layout";
import { GoldDivider } from "../components/GoldDivider";
import { CTAEndCard } from "../components/CTAEndCard";

loadDMSerif();
loadInter();

const ImageLabel: React.FC<{
  text: string;
  startFrame: number;
  fadeOutFrame?: number;
}> = ({ text, startFrame, fadeOutFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    fps,
    frame: frame - startFrame,
    config: { damping: 15 },
  });
  const translateY = interpolate(progress, [0, 1], [20, 0]);

  let fadeOut = 1;
  if (fadeOutFrame !== undefined) {
    fadeOut = interpolate(frame, [fadeOutFrame, fadeOutFrame + 10], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  }

  return (
    <div
      style={{
        position: "absolute",
        bottom: 24,
        left: 0,
        width: "100%",
        textAlign: "center",
        opacity: progress * fadeOut,
        transform: `translateY(${translateY}px)`,
      }}
    >
      <span
        style={{
          fontFamily: FONTS.body,
          fontSize: 26,
          color: COLORS.white,
          backgroundColor: "rgba(26, 23, 20, 0.75)",
          paddingLeft: 24,
          paddingRight: 24,
          paddingTop: 12,
          paddingBottom: 12,
          borderRadius: 8,
          fontWeight: 600,
          textShadow: "0 1px 6px rgba(0,0,0,0.5)",
          borderBottom: `2px solid ${COLORS.gold}`,
        }}
      >
        {text}
      </span>
    </div>
  );
};

export const SideBySide: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const layout = getLayout(width, height);
  const isVertical = layout.aspectRatio === "9:16";

  // === PHASE 1: Build-Up (frames 0-75) ===

  const renderSlide = spring({
    fps,
    frame,
    config: { damping: 14 },
  });
  const renderTranslate = interpolate(renderSlide, [0, 1], [-100, 0]);

  const photoSlide = spring({
    fps,
    frame: frame - 10,
    config: { damping: 14 },
  });
  const photoTranslate = interpolate(photoSlide, [0, 1], [100, 0]);

  // Ken burns on both images
  const kenBurns = interpolate(frame, [0, 210], [1, 1.04], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // === PHASE 2: Emphasis banner (frames 75-135) ===

  const bannerExpand = spring({
    fps,
    frame: frame - 80,
    config: { damping: 14, mass: 0.8 },
  });
  const bannerHeight = interpolate(bannerExpand, [0, 1], [0, 130]);
  const bannerOpacity = interpolate(bannerExpand, [0, 1], [0, 1]);

  const words = ["Lo", "que", "ves", "es", "lo", "que", "recibís"];
  const wordStartFrame = 90;
  const wordInterval = 4;

  // === PHASE 3: CTA (frames 135-210) ===

  const darkenOpacity = interpolate(
    frame,
    [135, 155],
    [0, 0.7],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const imageContainerStyle = (isFirst: boolean): React.CSSProperties => {
    if (isVertical) {
      return {
        position: "absolute",
        top: isFirst ? 0 : "50%",
        left: 0,
        width: "100%",
        height: "50%",
        overflow: "hidden",
        transform: `translateY(${isFirst ? renderTranslate : photoTranslate}%)`,
      };
    }
    return {
      position: "absolute",
      top: 0,
      left: isFirst ? 0 : "50%",
      width: "50%",
      height: "100%",
      overflow: "hidden",
      transform: `translateX(${isFirst ? renderTranslate : photoTranslate}%)`,
    };
  };

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.dark }}>
      <Audio src={staticFile("soundtrack.mp3")} volume={0.5} />

      {/* Render image */}
      <div style={{ ...imageContainerStyle(true), display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Img
          src={staticFile("render-cocina.jpeg")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            transform: `scale(${kenBurns})`,
          }}
        />
        {/* Dark edge vignette */}
        <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 40px rgba(26,23,20,0.3)", pointerEvents: "none" }} />
        <ImageLabel text="Lo que diseñamos" startFrame={30} fadeOutFrame={75} />
      </div>

      {/* Real photo */}
      <div style={{ ...imageContainerStyle(false), display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Img
          src={staticFile("foto-cocina.jpeg")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            transform: `scale(${kenBurns})`,
          }}
        />
        <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 40px rgba(26,23,20,0.3)", pointerEvents: "none" }} />
        <ImageLabel text="Lo que entregamos" startFrame={40} fadeOutFrame={75} />
      </div>

      {/* Gold divider between images — hide during CTA */}
      {frame < 135 && <div
        style={{
          position: "absolute",
          top: isVertical ? "50%" : 0,
          left: "50%",
          transform: isVertical ? "translate(-50%, -50%)" : "translate(-50%, 0)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: isVertical ? undefined : "100%",
          zIndex: 10,
        }}
      >
        <GoldDivider
          startFrame={25}
          maxWidth={isVertical ? width * 0.8 : height * 0.8}
          vertical={!isVertical}
        />
      </div>}

      {/* Phase 2: Emphasis banner */}
      {frame >= 75 && frame < 135 && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: isVertical ? width * 0.85 : width * 0.7,
            height: bannerHeight,
            background: `linear-gradient(135deg, ${COLORS.dark} 0%, rgba(40, 35, 28, 1) 100%)`,
            border: `2px solid ${COLORS.gold}`,
            borderRadius: 12,
            opacity: bannerOpacity,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 20,
            overflow: "hidden",
            boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(196, 162, 69, 0.15)`,
          }}
        >
          <div
            style={{
              fontFamily: FONTS.heading,
              fontSize: isVertical ? 42 : 38,
              color: COLORS.cream,
              textAlign: "center",
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              justifyContent: "center",
              paddingLeft: 24,
              paddingRight: 24,
            }}
          >
            {words.map((word, i) => {
              const wordFrame = wordStartFrame + i * wordInterval;
              const wordProgress = spring({
                fps,
                frame: frame - wordFrame,
                config: { damping: 18, mass: 0.6 },
              });
              return (
                <span
                  key={i}
                  style={{
                    opacity: wordProgress,
                    transform: `translateY(${interpolate(wordProgress, [0, 1], [8, 0])}px)`,
                    color:
                      word === "ves" || word === "recibís"
                        ? COLORS.gold
                        : COLORS.cream,
                    textShadow:
                      word === "ves" || word === "recibís"
                        ? `0 0 12px rgba(196, 162, 69, 0.4)`
                        : "none",
                  }}
                >
                  {word}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Darken overlay for CTA transition */}
      {frame >= 135 && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: COLORS.dark,
            opacity: darkenOpacity,
            zIndex: 25,
          }}
        />
      )}

      {/* Phase 3: CTA End Card */}
      {frame >= 140 && (
        <div style={{ zIndex: 30, position: "absolute", inset: 0 }}>
          <CTAEndCard
            startFrame={145}
            title="20+ años haciendo cocinas a medida"
          />
        </div>
      )}
    </AbsoluteFill>
  );
};
