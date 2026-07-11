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
import { TextOverlay } from "../components/TextOverlay";
import { GoldDivider } from "../components/GoldDivider";
import { CTAEndCard } from "../components/CTAEndCard";

loadDMSerif();
loadInter();

export const DramaticReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const layout = getLayout(width, height);
  const isVertical = layout.aspectRatio === "9:16";

  // === PHASE 1: 3D Render (frames 0-105) ===

  // Image fade in + scale
  const imageIn = spring({
    fps,
    frame,
    config: { damping: 20, mass: 1 },
  });
  const renderScale = interpolate(imageIn, [0, 1], [1.05, 1]);
  const renderOpacity = interpolate(imageIn, [0, 1], [0, 1]);

  // Slow ken burns on render during hold
  const renderKenBurns = interpolate(frame, [0, 105], [1, 1.03], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // === PHASE 2: Wipe transition (frames 90-135) ===

  const wipeProgress = spring({
    fps,
    frame: frame - 105,
    config: { damping: 12, mass: 0.8 },
  });
  const clipRight = interpolate(wipeProgress, [0, 1], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // === PHASE 3: Real photo (frames 135-195) ===

  const realPhotoScale = interpolate(
    frame,
    [105, 195],
    [1, 1.03],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // === PHASE 4: CTA (frames 195-240) ===

  const imageHeight = isVertical ? height * 0.55 : height * 0.6;
  const textAreaTop = isVertical ? height * 0.55 : height * 0.6;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.dark }}>
      <Audio src={staticFile("soundtrack.mp3")} volume={0.5} />

      {/* Real photo layer (behind) — hidden until wipe starts */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: isVertical ? imageHeight : "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: frame >= 105 ? 1 : 0,
        }}
      >
        <Img
          src={staticFile("foto-cocina.jpeg")}
          style={{
            width: "115%",
            height: "100%",
            objectFit: "contain",
            transform: `scale(${realPhotoScale}) translateX(7%)`,
          }}
        />
      </div>

      {/* 3D Render layer (on top, gets wiped away) */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: isVertical ? imageHeight : "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          clipPath: `inset(0 ${clipRight}% 0 0)`,
          opacity: renderOpacity,
        }}
      >
        <Img
          src={staticFile("render-cocina.jpeg")}
          style={{
            width: "115%",
            height: "110%",
            objectFit: "contain",
            transform: `scale(${renderScale * renderKenBurns})`,
          }}
        />
      </div>

      {/* Gradient overlay and vignette — hide during CTA */}
      {frame < 195 && <>
        <div
          style={{
            position: "absolute",
            top: isVertical ? imageHeight - 150 : 0,
            left: 0,
            width: "100%",
            height: isVertical ? 150 : "100%",
            background: isVertical
              ? `linear-gradient(to bottom, transparent, ${COLORS.dark})`
              : `linear-gradient(to top, ${COLORS.dark} 30%, transparent 60%)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: isVertical ? imageHeight : "100%",
            boxShadow: `inset 0 0 80px rgba(26, 23, 20, 0.4)`,
            pointerEvents: "none",
            zIndex: 3,
          }}
        />
      </>}

      {/* Text area */}
      <div
        style={{
          position: "absolute",
          top: isVertical ? textAreaTop : undefined,
          bottom: isVertical ? undefined : 0,
          left: 0,
          width: "100%",
          height: isVertical ? height - textAreaTop : height * 0.45,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          paddingLeft: layout.padding,
          paddingRight: layout.padding,
        }}
      >
        {/* Phase 1 text */}
        {frame < 135 && (
          <>
            <GoldDivider startFrame={15} maxWidth={80} />
            <TextOverlay
              text="Diseñamos tu cocina"
              startFrame={18}
              fadeOutFrame={90}
              fontSize={layout.titleFontSize}
            />
            <TextOverlay
              text="Diseño 3D con medidas reales"
              startFrame={35}
              fadeOutFrame={90}
              fontSize={layout.subtitleFontSize}
              fontFamily={FONTS.body}
              color={COLORS.gold}
              fontWeight={500}
            />
          </>
        )}

        {/* Phase 3 text */}
        {frame >= 135 && frame < 195 && (
          <>
            <GoldDivider startFrame={138} maxWidth={80} />
            <TextOverlay
              text="Así te la entregamos"
              startFrame={140}
              fontSize={layout.titleFontSize}
            />
            <TextOverlay
              text="Cocina terminada e instalada"
              startFrame={155}
              fontSize={layout.subtitleFontSize}
              fontFamily={FONTS.body}
              color={COLORS.gold}
              fontWeight={500}
            />
          </>
        )}
      </div>

      {/* Phase 4: CTA End Card */}
      {frame >= 195 && <CTAEndCard startFrame={195} />}
    </AbsoluteFill>
  );
};
