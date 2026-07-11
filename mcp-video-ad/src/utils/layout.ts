export type AspectRatio = "9:16" | "1:1";

export interface LayoutConfig {
  aspectRatio: AspectRatio;
  padding: number;
  titleFontSize: number;
  subtitleFontSize: number;
  ctaTitleFontSize: number;
  ctaSubtitleFontSize: number;
  // For side-by-side
  splitDirection: "horizontal" | "vertical";
}

export function getLayout(width: number, height: number): LayoutConfig {
  const isVertical = height > width;
  return {
    aspectRatio: isVertical ? "9:16" : "1:1",
    padding: isVertical ? 48 : 40,
    titleFontSize: isVertical ? 86 : 72,
    subtitleFontSize: isVertical ? 48 : 42,
    ctaTitleFontSize: isVertical ? 48 : 44,
    ctaSubtitleFontSize: isVertical ? 32 : 28,
    splitDirection: isVertical ? "vertical" : "horizontal",
  };
}
