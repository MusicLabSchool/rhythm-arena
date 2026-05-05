export function getGameLayoutConfig(isMobile) {
  if (isMobile) {
    return {
      laneStartY: 0.16,
      laneEndY: 0.64,
      hitLineY: 0.65,
      drumVisibleStartY: 0.64,
      mobileControlsStartY: 0.88,
      laneOpacity: 0.18,
    };
  }

  return {
    laneStartY: 0.12,
    laneEndY: 0.68,
    hitLineY: 0.68,
    drumVisibleStartY: 0.68,
    mobileControlsStartY: 0.90,
    laneOpacity: 0.22,
  };
}
