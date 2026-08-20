export interface RenderQuality {
  pixelRatio: number;
  shadows: boolean;
  shadowMapSize: number;
  proceduralMotion: boolean;
}

export function getRenderQuality(reducedMotion: boolean): RenderQuality {
  const isSmallScreen = typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;
  const isCoarsePointer = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
  const isMobile = isSmallScreen || isCoarsePointer;
  const devicePixelRatio = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

  return {
    pixelRatio: Math.min(devicePixelRatio, isMobile ? 1.35 : 1.8),
    shadows: false,
    shadowMapSize: isMobile ? 512 : 1024,
    proceduralMotion: !reducedMotion,
  };
}
