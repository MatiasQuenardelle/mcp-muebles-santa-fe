import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS } from "../theme";

export const TextOverlay: React.FC<{
  text: string;
  startFrame: number;
  fadeOutFrame?: number;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  fontWeight?: number;
}> = ({
  text,
  startFrame,
  fadeOutFrame,
  fontSize = 64,
  fontFamily = FONTS.heading,
  color = COLORS.cream,
  fontWeight = 400,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slideUp = spring({
    fps,
    frame: frame - startFrame,
    config: { damping: 15, mass: 0.8 },
  });

  const translateY = interpolate(slideUp, [0, 1], [30, 0]);
  const opacity = interpolate(slideUp, [0, 1], [0, 1]);

  let fadeOutOpacity = 1;
  if (fadeOutFrame !== undefined) {
    fadeOutOpacity = interpolate(
      frame,
      [fadeOutFrame, fadeOutFrame + 10],
      [1, 0],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );
  }

  return (
    <div
      style={{
        fontSize,
        fontFamily,
        color,
        fontWeight,
        transform: `translateY(${translateY}px)`,
        opacity: opacity * fadeOutOpacity,
        textAlign: "center",
        lineHeight: 1.2,
        textShadow: "0 2px 12px rgba(0,0,0,0.6), 0 1px 3px rgba(0,0,0,0.4)",
        letterSpacing: fontFamily === FONTS.heading ? 1 : 0,
      }}
    >
      {text}
    </div>
  );
};
