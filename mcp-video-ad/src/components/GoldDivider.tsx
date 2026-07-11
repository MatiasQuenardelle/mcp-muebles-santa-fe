import { interpolate, useCurrentFrame } from "remotion";
import { COLORS } from "../theme";

export const GoldDivider: React.FC<{
  startFrame: number;
  maxWidth?: number;
  vertical?: boolean;
}> = ({ startFrame, maxWidth = 80, vertical = false }) => {
  const frame = useCurrentFrame();

  const progress = interpolate(frame, [startFrame, startFrame + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  if (vertical) {
    return (
      <div
        style={{
          width: 3,
          height: maxWidth * progress,
          backgroundColor: COLORS.gold,
          borderRadius: 2,
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: maxWidth * progress,
        height: 3,
        backgroundColor: COLORS.gold,
        borderRadius: 2,
      }}
    />
  );
};
