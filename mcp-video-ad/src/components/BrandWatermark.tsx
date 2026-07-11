import { Img, staticFile } from "remotion";
import { COLORS, FONTS } from "../theme";

export const BrandWatermark: React.FC<{
  size?: number;
  showText?: boolean;
}> = ({ size = 60, showText = false }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
      }}
    >
      <Img
        src={staticFile("logo.jpg")}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          objectFit: "cover",
        }}
      />
      {showText && (
        <div
          style={{
            fontFamily: FONTS.heading,
            fontSize: 40,
            color: COLORS.gold,
            letterSpacing: 2,
          }}
        >
          MCP MUEBLES
        </div>
      )}
    </div>
  );
};
