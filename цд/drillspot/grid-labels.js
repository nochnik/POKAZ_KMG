// The two outer vertical edges belong to the actual, currently rendered walls.
// Choosing them in screen space also handles views from opposite quadrants.
export function layoutDepthLabels({ extent, wallX, wallZ, ticks, project, minSpacing }) {
  const oppositeX = wallX === extent.minX ? extent.maxX : extent.minX;
  const oppositeZ = wallZ === extent.minZ ? extent.maxZ : extent.minZ;
  const middleDepth = (extent.minDepth + extent.maxDepth) / 2;
  const edges = [{ x: wallX, z: oppositeZ }, { x: oppositeX, z: wallZ }];
  const edge = edges.reduce((left, candidate) =>
    project(candidate.x, -middleDepth, candidate.z).x < project(left.x, -middleDepth, left.z).x ? candidate : left);
  const points = ticks.map(depth => project(edge.x, -depth, edge.z));
  const spacing = points.length > 1 ? Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y) : 0;
  const stride = spacing > .5 ? Math.max(1, Math.ceil(minSpacing / spacing)) : Infinity;
  return points.map((point, index) => ({
    ...point,
    visible: point.visible && Number.isFinite(stride) && index % stride === 0,
    anchor: [edge.x, -ticks[index], edge.z],
  }));
}

export function createAxisTicks(minimum, maximum, step = 150) {
  const ticks = [];
  for (let value = minimum; value < maximum; value += step) ticks.push(value);
  ticks.push(maximum);
  return ticks;
}

export function layoutHorizontalLabels({ extent, wallX, wallZ, xTicks, zTicks, project, minSpacing, offset }) {
  const frontX = wallX === extent.minX ? extent.maxX : extent.minX;
  const frontZ = wallZ === extent.minZ ? extent.maxZ : extent.minZ;
  const floorY = -extent.maxDepth;
  const center = project((extent.minX + extent.maxX) / 2, floorY, (extent.minZ + extent.maxZ) / 2);
  const axes = [
    { axis: 'x', ticks: xTicks, anchor: value => [value, floorY, frontZ] },
    { axis: 'z', ticks: zTicks, anchor: value => [frontX, floorY, value] },
  ];
  const placed = [];
  return axes.flatMap(({ axis, ticks, anchor }) => {
    const start = project(...anchor(ticks[0]));
    const end = project(...anchor(ticks.at(-1)));
    const length = Math.hypot(end.x - start.x, end.y - start.y);
    let normalX = -(end.y - start.y) / (length || 1);
    let normalY = (end.x - start.x) / (length || 1);
    if (normalX * ((start.x + end.x) / 2 - center.x) + normalY * ((start.y + end.y) / 2 - center.y) < 0) {
      normalX *= -1;
      normalY *= -1;
    }
    return ticks.map(value => {
      const position = anchor(value);
      const point = project(...position);
      const x = point.x + normalX * offset;
      const y = point.y + normalY * offset;
      const visible = point.visible && length > minSpacing && !placed.some(label => Math.abs(label.x - x) < minSpacing && Math.abs(label.y - y) < offset * 1.6);
      if (visible) placed.push({ x, y });
      return { axis, value, anchor: position, x, y, visible };
    });
  });
}
