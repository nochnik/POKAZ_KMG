// Reconstructed from the supplied screenshot and drillspot_cut.mp4.
// Coordinates are local metres, with TVD positive down; these are visual fixtures,
// not an exported geological model or a survey suitable for drilling decisions.
export const sceneData = {
  exaggeration: 3,
  camera: {
    target: [290, -400, 0],
    offset: [1500, 2100, 1800],
    height: 1500,
  },
  extent: { minX: -450, maxX: 1000, minZ: -850, maxZ: 500, minDepth: -200 / 3, maxDepth: 1400 / 3 },
  section: { x: 455, halfWidth: 100, top: 60, bottom: 400, color: '#6088bb' },
  surfaces: [
    { name: 'Top_M-I-B', depth: 180, color: '#5c83b2' },
    { name: 'Bot_M-I-B', depth: 203, color: '#e8bf50' },
    { name: 'Top_M-I-V', depth: 222, color: '#a1b4ad', edgeColor: '#779969' },
    { name: 'Bot_M-I-V', depth: 244, color: '#689bda' },
    { name: 'Top_M-II', depth: 254, color: '#ec3e36' },
    { name: 'Base_M-II', depth: 272, color: '#c92825' },
  ],
  // [east, true vertical depth, north]
  trajectory: [
    [0, 0, 0], [0, 50, 0], [1, 100, 0], [5, 145, 0],
    [17, 181, 0], [43, 214, -1], [83, 240, -2],
    [140, 257, -3], [220, 266, -4], [310, 271, -5],
    [400, 273, -6], [470, 274, -7], [522.29, 275.32, -8],
  ],
};

export function getHorizonDepth(distance, across, baseDepth) {
  const progress = distance / 535;
  return baseDepth + 10 * progress - 14 * Math.sin(progress * Math.PI)
    + 1.2 * Math.sin(across / 45 + progress * 4) + .012 * across;
}
