import {
  OffthreadVideo,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS, FONTS } from "../theme";
import { BrandWatermark } from "./BrandWatermark";
import { getLayout } from "../utils/layout";

export const CTAEndCard: React.FC<{
  startFrame: number;
  title?: string;
}> = ({
  startFrame,
  title = "Pedinos tu presupuesto",
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const layout = getLayout(width, height);

  // Background fade in
  const bgOpacity = interpolate(
    frame,
    [startFrame, startFrame + 15],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Logo
  const logoProgress = spring({
    fps,
    frame: frame - (startFrame + 5),
    config: { damping: 14 },
  });

  // Title
  const titleProgress = spring({
    fps,
    frame: frame - (startFrame + 15),
    config: { damping: 15 },
  });
  const titleY = interpolate(titleProgress, [0, 1], [20, 0]);

  // Location text
  const locationProgress = spring({
    fps,
    frame: frame - (startFrame + 20),
    config: { damping: 15 },
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        opacity: bgOpacity,
        overflow: "hidden",
      }}
    >
      {/* Background video */}
      <OffthreadVideo
        src={staticFile("video-cocina.mp4")}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
        muted
      />

      {/* Dark overlay for text legibility */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(26, 23, 20, 0.55)",
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
        }}
      >
        {/* Gold glow behind logo */}
        <div
          style={{
            position: "relative",
            transform: `scale(${interpolate(logoProgress, [0, 1], [0.8, 1])})`,
            opacity: logoProgress,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 240,
              height: 240,
              borderRadius: "50%",
              background: `radial-gradient(circle, rgba(196, 162, 69, 0.3) 0%, transparent 70%)`,
              filter: "blur(10px)",
            }}
          />
          <BrandWatermark size={160} showText />
        </div>

        <div
          style={{
            fontFamily: FONTS.heading,
            fontSize: layout.ctaTitleFontSize,
            color: COLORS.cream,
            transform: `translateY(${titleY}px)`,
            opacity: titleProgress,
            textAlign: "center",
            marginTop: 12,
            paddingLeft: layout.padding,
            paddingRight: layout.padding,
            textShadow: "0 2px 16px rgba(0,0,0,0.6)",
          }}
        >
          {title}
        </div>

        {/* Location */}
        <div
          style={{
            fontFamily: FONTS.body,
            fontSize: layout.subtitleFontSize || 20,
            color: COLORS.gold,
            opacity: locationProgress,
            letterSpacing: 2,
            fontWeight: 500,
            textShadow: "0 1px 8px rgba(0,0,0,0.5)",
          }}
        >
          Santa Fe, Argentina
        </div>
      </div>
    </div>
  );
};
