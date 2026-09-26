import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import { layoutDepthLabels, layoutHorizontalLabels, createAxisTicks } from './grid-labels.js';
import { sceneData } from './scene-data.js';

const extent = sceneData.extent;
const ticks = Array.from({ length: 9 }, (_, index) => extent.minDepth + index * (extent.maxDepth - extent.minDepth) / 8);

function fixture(angle, exaggeration = 3, zoom = 1, top = false) {
  const camera = new THREE.OrthographicCamera(-900, 900, 750, -750, .1, 20000);
  const target = new THREE.Vector3(275, -200 * exaggeration, 0);
  camera.position.copy(target).add(top ? new THREE.Vector3(0, 3000, .01) : new THREE.Vector3(Math.cos(angle) * 2000, 1400, Math.sin(angle) * 2000));
  camera.lookAt(target);
  camera.zoom = zoom;
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);
  const wallX = camera.position.x >= target.x ? extent.minX : extent.maxX;
  const wallZ = camera.position.z >= target.z ? extent.minZ : extent.maxZ;
  const project = (x, y, z) => {
    const point = new THREE.Vector3(x, y * exaggeration, z).project(camera);
    return { x: (point.x + 1) * 600, y: (1 - point.y) * 500, visible: Math.abs(point.x) <= 1 && Math.abs(point.y) <= 1 && Math.abs(point.z) <= 1 };
  };
  return { extent, wallX, wallZ, ticks, project, minSpacing: 18 };
}

function close(actual, expected) {
  assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} differs from ${expected}`);
}

test('every depth label uses an outer edge of a rendered wall in every quadrant', () => {
  for (let index = 0; index < 16; index++) {
    for (const exaggeration of [1, 3, 10]) {
      const input = fixture((index + .5) * Math.PI / 8, exaggeration);
      const labels = layoutDepthLabels(input);
      const farX = input.wallX === extent.minX ? extent.maxX : extent.minX;
      const farZ = input.wallZ === extent.minZ ? extent.maxZ : extent.minZ;
      labels.forEach((label, tickIndex) => {
        const [x, y, z] = label.anchor;
        assert.ok((x === input.wallX && z === farZ) || (x === farX && z === input.wallZ));
        close(y, -ticks[tickIndex]);
        const projected = input.project(x, y, z);
        close(label.x, projected.x);
        close(label.y, projected.y);
        const other = x === input.wallX ? input.project(farX, y, input.wallZ) : input.project(input.wallX, y, farZ);
        assert.ok(label.x <= other.x + 1e-8);
      });
    }
  }
});

test('grid ticks share exact depths; only the displayed text is rounded', () => {
  assert.deepEqual(ticks.map(value => Math.round(value)), [-67, 0, 67, 133, 200, 267, 333, 400, 467]);
  ticks.slice(1).forEach((value, index) => close(value - ticks[index], 200 / 3));
});

test('zooming does not pin labels to the viewport edge', () => {
  const near = layoutDepthLabels(fixture(Math.PI / 4, 3, 8));
  const far = layoutDepthLabels(fixture(Math.PI / 4, 3, .4));
  assert.ok(near.some(label => label.x < 0 && !label.visible));
  near.forEach((label, index) => assert.deepEqual(label.anchor, far[index].anchor));
  assert.notEqual(near[4].x, far[4].x);
  assert.ok(far.some(label => label.visible));
});

test('top view hides the collapsed depth axis; distant labels do not overlap', () => {
  assert.ok(layoutDepthLabels(fixture(0, 3, 1, true)).every(label => !label.visible));
  const visible = layoutDepthLabels(fixture(Math.PI / 4, 3, .1)).filter(label => label.visible);
  visible.slice(1).forEach((label, index) => {
    assert.ok(Math.hypot(label.x - visible[index].x, label.y - visible[index].y) >= 18);
  });
});


test('horizontal labels stay on exact floor ticks in all camera quadrants', () => {
  const xTicks = createAxisTicks(extent.minX, extent.maxX);
  const zTicks = createAxisTicks(extent.minZ, extent.maxZ);
  for (let index = 0; index < 16; index++) {
    const input = fixture((index + .5) * Math.PI / 8, 3, .4);
    const labels = layoutHorizontalLabels({ ...input, xTicks, zTicks, minSpacing: 40, offset: 12 });
    const frontX = input.wallX === extent.minX ? extent.maxX : extent.minX;
    const frontZ = input.wallZ === extent.minZ ? extent.maxZ : extent.minZ;
    for (const label of labels) {
      const expected = label.axis === 'x' ? [label.value, -extent.maxDepth, frontZ] : [frontX, -extent.maxDepth, label.value];
      assert.deepEqual(label.anchor, expected);
      const point = input.project(...label.anchor);
      close(Math.hypot(label.x - point.x, label.y - point.y), 12);
    }
    const visible = labels.filter(label => label.visible);
    assert.ok(visible.some(label => label.axis === 'x'));
    assert.ok(visible.some(label => label.axis === 'z'));
    visible.forEach((label, i) => visible.slice(i + 1).forEach(other => {
      assert.ok(Math.abs(label.x - other.x) >= 40 || Math.abs(label.y - other.y) >= 19.2);
    }));
  }
});

test('horizontal grid includes both boundary lines and labels', () => {
  assert.deepEqual(createAxisTicks(-450, 1000), [-450, -300, -150, 0, 150, 300, 450, 600, 750, 900, 1000]);
  assert.deepEqual(createAxisTicks(-850, 500), [-850, -700, -550, -400, -250, -100, 50, 200, 350, 500]);
});
