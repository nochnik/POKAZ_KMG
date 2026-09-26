import * as THREE from 'three';
import { OrbitControls } from '../vendor/addons/controls/OrbitControls.js';
import { sceneData, getHorizonDepth } from './scene-data.js?v=20260926.7';
import { layoutDepthLabels, layoutHorizontalLabels, createAxisTicks } from './grid-labels.js?v=20260926.8';

const area = document.querySelector('#model-area');
const host = document.querySelector('#scene-host');
const status = document.querySelector('#scene-status');
const diameterLabel = document.querySelector('#diameter-label');
const tooltip = document.querySelector('#scene-tooltip');
const depthLabels = document.querySelector('#depth-labels');
const compass = document.querySelector('#orientation-gizmo');
const initialTarget = new THREE.Vector3(...sceneData.camera.target);
const initialOffset = new THREE.Vector3(...sceneData.camera.offset);
const state = { exaggeration: sceneData.exaggeration, grid: true, ellipses: true, bit: true, mode: 'isometric', follow: false, mdStart: 0 };
let renderer;

try {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
} catch (error) {
  status.hidden = false;
  status.textContent = '3D unavailable. Enable hardware acceleration and reload.';
  console.error('Unable to initialize the directional scene:', error);
}

if (renderer) initializeScene();

function initializeScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#192a36');
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.append(renderer.domElement);
  const canvas = renderer.domElement;
  canvas.id = 'directional-canvas';
  canvas.tabIndex = 0;
  canvas.setAttribute('role', 'application');
  canvas.setAttribute('aria-label', '3D well model. Drag to rotate, wheel to zoom, right-drag to pan. Arrow keys rotate, Shift and arrows pan, plus and minus zoom, Home resets.');
  canvas.setAttribute('aria-describedby', 'scene-help');

  const camera = new THREE.OrthographicCamera(-800, 800, 750, -750, .1, 20000);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = .14;
  controls.rotateSpeed = .7;
  controls.zoomSpeed = 1;
  controls.panSpeed = .85;
  controls.minZoom = .2;
  controls.maxZoom = 12;
  controls.minPolarAngle = .02;
  controls.maxPolarAngle = Math.PI - .02;
  controls.screenSpacePanning = true;
  controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
  controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };

  const world = new THREE.Group();
  world.scale.y = state.exaggeration;
  scene.add(world);

  const surfaces = sceneData.surfaces.map(createSurface);
  surfaces.forEach(surface => world.add(surface));
  const sectionPlane = createSectionPlane();
  world.add(sectionPlane);
  const trajectory = new THREE.CatmullRomCurve3(sceneData.trajectory.map(([x, depth, z]) => new THREE.Vector3(x, -depth, z)), false, 'centripetal');
  const well = new THREE.Mesh(new THREE.TubeGeometry(trajectory, 240, 1.6, 8, false), new THREE.MeshBasicMaterial({ color: '#c72c2c' }));
  world.add(well);
  const casingMarker = new THREE.Mesh(new THREE.SphereGeometry(4.2, 12, 8), new THREE.MeshBasicMaterial({ color: '#a6b1ba' }));
  casingMarker.position.set(0, -50, 0);
  casingMarker.scale.y = 1 / state.exaggeration;
  world.add(casingMarker);

  const bitMarker = new THREE.Mesh(new THREE.SphereGeometry(4, 12, 8), new THREE.MeshBasicMaterial({ color: '#d6dce0' }));
  bitMarker.position.copy(trajectory.getPoint(1));
  bitMarker.scale.y = 1 / state.exaggeration;
  world.add(bitMarker);
  const ellipses = createUncertaintyEllipses(trajectory);
  scene.add(ellipses);

  const depthTicks = Array.from({ length: 9 }, (_, index) => sceneData.extent.minDepth + index * (sceneData.extent.maxDepth - sceneData.extent.minDepth) / 8);
  const xTicks = createAxisTicks(sceneData.extent.minX, sceneData.extent.maxX);
  const zTicks = createAxisTicks(sceneData.extent.minZ, sceneData.extent.maxZ);
  const grid = new THREE.Group();
  world.add(grid);
  const gridWalls = createGrid(grid);
  const depthMarks = depthTicks.map(depth => {
    const label = document.createElement('span');
    label.textContent = String(Math.round(depth));
    depthLabels.append(label);
    return { depth, label };
  });
  const horizontalMarks = [...xTicks.map(value => ({ axis: 'x', value })), ...zTicks.map(value => ({ axis: 'z', value }))].map(({ axis, value }) => {
    const label = document.createElement('span');
    label.className = 'horizontal-axis-label';
    label.dataset.axis = axis;
    label.textContent = String(value);
    depthLabels.append(label);
    return label;
  });
  const axisDirections = createCompass();
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const projectedPoint = new THREE.Vector3();
  const cameraDirection = new THREE.Vector3();
  let width = 1;
  let height = 1;
  let frame = null;
  let dragging = false;
  let destroyed = false;
  let restoreFrame = null;

  function createSurface(surface) {
    const positions = [];
    const indices = [];
    const alongSteps = 64;
    const acrossSteps = 6;
    for (let along = 0; along <= alongSteps; along += 1) {
      const distance = along / alongSteps * 535;
      for (let across = 0; across <= acrossSteps; across += 1) {
        const z = (across / acrossSteps - .5) * 150;
        positions.push(distance + .55 * z, -getHorizonDepth(distance, z, surface.depth), z);
      }
    }
    for (let along = 0; along < alongSteps; along += 1) {
      for (let across = 0; across < acrossSteps; across += 1) {
        const corner = along * (acrossSteps + 1) + across;
        indices.push(corner, corner + 1, corner + acrossSteps + 1, corner + 1, corner + acrossSteps + 2, corner + acrossSteps + 1);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: surface.color, side: THREE.DoubleSide }));
    mesh.userData.surface = surface;
    const edgePoints = [];
    for (let index = 0; index <= alongSteps; index += 1) {
      const distance = index / alongSteps * 535;
      edgePoints.push(new THREE.Vector3(distance - .55 * 75, -getHorizonDepth(distance, -75, surface.depth), -75));
    }
    const edge = new THREE.Line(new THREE.BufferGeometry().setFromPoints(edgePoints), new THREE.LineBasicMaterial({ color: surface.edgeColor || surface.color }));
    mesh.add(edge);
    return mesh;
  }

  function createSectionPlane() {
    const section = sceneData.section;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute([
      section.x, -section.top, -section.halfWidth, section.x, -section.top, section.halfWidth,
      section.x, -section.bottom, -section.halfWidth, section.x, -section.bottom, section.halfWidth,
    ], 3));
    geometry.setIndex([0, 1, 2, 1, 3, 2]);
    return new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: section.color, side: THREE.DoubleSide }));
  }

  function createUncertaintyEllipses(curve) {
    const group = new THREE.Group();
    for (let index = 0; index < 9; index += 1) {
      const fraction = .75 + index * .03125;
      const points = [];
      const radius = 4 + index * 1.3;
      for (let segment = 0; segment < 48; segment += 1) {
        const angle = segment / 48 * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0));
      }
      const ring = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: '#b9c7cf', transparent: true, opacity: .5 }));
      ring.position.copy(curve.getPoint(fraction));
      ring.userData.depth = ring.position.y;
      ring.position.y *= state.exaggeration;
      group.add(ring);
    }
    return group;
  }

  function createGrid(group) {
    const { minX, maxX, minZ, maxZ, minDepth, maxDepth } = sceneData.extent;
    const material = new THREE.LineBasicMaterial({ color: '#354959', transparent: true, opacity: .45 });
    const makeLines = (points) => new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(points), material);
    const xPoints = [];
    const zPoints = [];
    const floorPoints = [];
    for (const depth of depthTicks) {
      xPoints.push(new THREE.Vector3(0, -depth, minZ), new THREE.Vector3(0, -depth, maxZ));
      zPoints.push(new THREE.Vector3(minX, -depth, 0), new THREE.Vector3(maxX, -depth, 0));
    }
    for (const z of zTicks) {
      xPoints.push(new THREE.Vector3(0, -minDepth, z), new THREE.Vector3(0, -maxDepth, z));
      floorPoints.push(new THREE.Vector3(minX, -maxDepth, z), new THREE.Vector3(maxX, -maxDepth, z));
    }
    for (const x of xTicks) {
      zPoints.push(new THREE.Vector3(x, -minDepth, 0), new THREE.Vector3(x, -maxDepth, 0));
      floorPoints.push(new THREE.Vector3(x, -maxDepth, minZ), new THREE.Vector3(x, -maxDepth, maxZ));
    }
    const xWall = makeLines(xPoints);
    const zWall = makeLines(zPoints);
    group.add(xWall, zWall, makeLines(floorPoints));
    return { xWall, zWall };
  }

  function createCompass() {
    return [['E', 1, 0, 0], ['W', -1, 0, 0], ['UP', 0, 1, 0], ['DOWN', 0, -1, 0], ['N', 0, 0, -1], ['S', 0, 0, 1]].map(([name, x, y, z]) => {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      line.setAttribute('x1', '50');
      line.setAttribute('y1', '50');
      text.textContent = name;
      compass.append(line, text);
      return { direction: new THREE.Vector3(x, y, z), line, text };
    });
  }

  function scheduleRender() {
    if (frame === null && !destroyed && !document.hidden) frame = requestAnimationFrame(render);
  }

  function render() {
    frame = null;
    controls.update();
    const { minX, maxX, minZ, maxZ } = sceneData.extent;
    gridWalls.xWall.position.x = camera.position.x >= controls.target.x ? minX : maxX;
    gridWalls.zWall.position.z = camera.position.z >= controls.target.z ? minZ : maxZ;
    ellipses.children.forEach(ring => { ring.quaternion.copy(camera.quaternion); });
    renderer.render(scene, camera);
    updateLabels();
    // Also serves as an observable state for keyboard users and browser verification.
    canvas.dataset.view = [camera.position.x, camera.position.y, camera.position.z, camera.zoom].map(value => value.toFixed(3)).join(',');
  }

  function project(point) {
    projectedPoint.copy(point).applyMatrix4(world.matrixWorld).project(camera);
    return { x: (projectedPoint.x + 1) * width / 2, y: (1 - projectedPoint.y) * height / 2, visible: Math.abs(projectedPoint.x) <= 1 && Math.abs(projectedPoint.y) <= 1 && Math.abs(projectedPoint.z) <= 1 };
  }

  function updateLabels() {
    const marker = project(casingMarker.position);
    diameterLabel.hidden = !marker.visible;
    diameterLabel.style.transform = `translate(${marker.x + 12}px, ${marker.y - 9}px)`;
    const labels = layoutDepthLabels({
      extent: sceneData.extent,
      wallX: gridWalls.xWall.position.x,
      wallZ: gridWalls.zWall.position.z,
      ticks: depthTicks,
      project: (x, y, z) => project(new THREE.Vector3(x, y, z)),
      minSpacing: parseFloat(getComputedStyle(depthLabels).fontSize) * 1.6,
    });
    depthMarks.forEach(({ label }, index) => {
      const point = labels[index];
      label.hidden = !state.grid || !point.visible;
      // No screen-edge clamping: an off-screen grid anchor has an off-screen label.
      label.style.transform = `translate(${point.x}px, ${point.y}px) translate(calc(-100% - .6rem), -50%)`;
      label.dataset.gridAnchor = point.anchor.join(',');
    });
    const fontSize = parseFloat(getComputedStyle(depthLabels).fontSize);
    const horizontalLabels = layoutHorizontalLabels({
      extent: sceneData.extent,
      wallX: gridWalls.xWall.position.x,
      wallZ: gridWalls.zWall.position.z,
      xTicks, zTicks,
      project: (x, y, z) => project(new THREE.Vector3(x, y, z)),
      minSpacing: fontSize * 3.8,
      offset: fontSize * 1.25,
    });
    horizontalMarks.forEach((label, index) => {
      const point = horizontalLabels[index];
      label.hidden = !state.grid || !point.visible;
      label.style.transform = `translate(${point.x}px, ${point.y}px) translate(-50%, -50%)`;
      label.dataset.gridAnchor = point.anchor.join(',');
    });
    const inverseRotation = camera.quaternion.clone().invert();
    axisDirections.forEach(({ direction, line, text }) => {
      cameraDirection.copy(direction).applyQuaternion(inverseRotation);
      line.setAttribute('x2', String(50 + cameraDirection.x * 29));
      line.setAttribute('y2', String(50 - cameraDirection.y * 29));
      line.style.opacity = cameraDirection.z < 0 ? '.35' : '1';
      text.setAttribute('x', String(50 + cameraDirection.x * 39));
      text.setAttribute('y', String(53 - cameraDirection.y * 39));
      text.style.opacity = cameraDirection.z < 0 ? '.45' : '1';
    });
  }

  function resize() {
    width = host.clientWidth;
    height = host.clientHeight;
    if (!width || !height) return;
    const halfHeight = sceneData.camera.height / 2;
    camera.left = -halfHeight * width / height;
    camera.right = halfHeight * width / height;
    camera.top = halfHeight;
    camera.bottom = -halfHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    scheduleRender();
  }

  function resetView() {
    state.follow = false;
    document.querySelector('#scene-follow').setAttribute('aria-pressed', 'false');
    controls.enableDamping = false;
    controls.update();
    controls.reset();
    controls.target.copy(initialTarget);
    controls.target.y *= state.exaggeration / sceneData.exaggeration;
    camera.position.copy(controls.target).add(initialOffset);
    camera.up.set(0, 1, 0);
    camera.zoom = Math.min(1, sceneData.exaggeration / state.exaggeration);
    camera.updateProjectionMatrix();
    camera.lookAt(controls.target);
    controls.update();
    controls.enableDamping = true;
    setViewMode('isometric');
    frameGrid();
    scheduleRender();
  }

  function frameGrid() {
    const { minX, maxX, minZ, maxZ, minDepth, maxDepth } = sceneData.extent;
    const center = new THREE.Vector3((minX + maxX) / 2, -(minDepth + maxDepth) / 2 * state.exaggeration, (minZ + maxZ) / 2);
    camera.position.add(center.clone().sub(controls.target));
    controls.target.copy(center);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
    let horizontal = 0;
    let vertical = 0;
    for (const x of [minX, maxX]) {
      for (const depth of [minDepth, maxDepth]) {
        for (const z of [minZ, maxZ]) {
          const offset = new THREE.Vector3(x, -depth * state.exaggeration, z).sub(center);
          horizontal = Math.max(horizontal, Math.abs(offset.dot(right)));
          vertical = Math.max(vertical, Math.abs(offset.dot(up)));
        }
      }
    }
    // Leave room for axis text and the fixed survey overlays, not just the model.
    camera.zoom = THREE.MathUtils.clamp(Math.min((camera.right - camera.left) * .78 / (2 * horizontal), (camera.top - camera.bottom) * .70 / (2 * vertical)), controls.minZoom, controls.maxZoom);
    camera.updateProjectionMatrix();
    controls.update();
  }

  function setViewMode(mode) {
    state.mode = mode;
    const viewButton = document.querySelector('#scene-view');
    const viewLabel = { isometric: '3D', front: 'Front', side: 'Side', top: 'Top' }[mode];
    viewButton.value = mode;
    viewButton.setAttribute('aria-label', `${viewLabel} view`);
    document.querySelector('#scene-view-label').textContent = viewLabel;
    if (mode === 'isometric') return;
    const distance = initialOffset.length();
    const offset = mode === 'top' ? new THREE.Vector3(0, distance, .01) : mode === 'front' ? new THREE.Vector3(0, 0, distance) : new THREE.Vector3(distance, 0, 0);
    camera.position.copy(controls.target).add(offset);
    camera.lookAt(controls.target);
    controls.update();
    scheduleRender();
  }

  function zoomBy(factor) {
    camera.zoom = THREE.MathUtils.clamp(camera.zoom * factor, controls.minZoom, controls.maxZoom);
    camera.updateProjectionMatrix();
    scheduleRender();
  }

  function focusDepth(depth) {
    const target = new THREE.Vector3(455, -depth * state.exaggeration, 0);
    camera.position.add(target.clone().sub(controls.target));
    controls.target.copy(target);
    controls.update();
    scheduleRender();
  }

  function followActiveWell() {
    const target = bitMarker.position.clone();
    target.y *= state.exaggeration;
    camera.position.add(target.clone().sub(controls.target));
    controls.target.copy(target);
    controls.update();
    scheduleRender();
  }

  function fitModelInView() {
    state.follow = false;
    document.querySelector('#scene-follow').setAttribute('aria-pressed', 'false');
    controls.enableDamping = false;
    controls.update();
    world.updateMatrixWorld(true);
    const bounds = new THREE.Box3();
    [...surfaces, sectionPlane, well].filter(object => object.visible).forEach(object => bounds.expandByObject(object));
    const center = bounds.getCenter(new THREE.Vector3());
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
    let halfWidth = 0;
    let halfHeight = 0;
    for (const x of [bounds.min.x, bounds.max.x]) {
      for (const y of [bounds.min.y, bounds.max.y]) {
        for (const z of [bounds.min.z, bounds.max.z]) {
          const offset = new THREE.Vector3(x, y, z).sub(center);
          halfWidth = Math.max(halfWidth, Math.abs(offset.dot(right)));
          halfHeight = Math.max(halfHeight, Math.abs(offset.dot(up)));
        }
      }
    }
    camera.position.add(center.clone().sub(controls.target));
    controls.target.copy(center);
    camera.zoom = THREE.MathUtils.clamp(Math.min((camera.right - camera.left) / (2 * halfWidth), (camera.top - camera.bottom) / (2 * halfHeight)) * .8, controls.minZoom, controls.maxZoom);
    camera.updateProjectionMatrix();
    controls.update();
    controls.enableDamping = true;
    scheduleRender();
  }

  function handleKey(event) {
    if (event.key === 'Home' || event.key.toLowerCase() === 'r') { event.preventDefault(); resetView(); return; }
    if (event.key === '+' || event.key === '=') { event.preventDefault(); zoomBy(1.15); return; }
    if (event.key === '-') { event.preventDefault(); zoomBy(1 / 1.15); return; }
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    const horizontal = Number(event.key === 'ArrowRight') - Number(event.key === 'ArrowLeft');
    const vertical = Number(event.key === 'ArrowUp') - Number(event.key === 'ArrowDown');
    if (event.shiftKey) {
      const shift = new THREE.Vector3(horizontal * 35, vertical * 35, 0).applyQuaternion(camera.quaternion).multiplyScalar(1 / camera.zoom);
      camera.position.add(shift);
      controls.target.add(shift);
    } else {
      const spherical = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
      spherical.theta -= horizontal * .08;
      spherical.phi = THREE.MathUtils.clamp(spherical.phi - vertical * .08, .02, Math.PI - .02);
      camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));
    }
    controls.update();
    scheduleRender();
  }

  controls.addEventListener('change', scheduleRender);
  controls.addEventListener('start', () => {
    dragging = true;
    tooltip.hidden = true;
    state.follow = false;
    document.querySelector('#scene-follow').setAttribute('aria-pressed', 'false');
  });
  controls.addEventListener('end', () => { dragging = false; });
  canvas.addEventListener('pointerdown', () => {
    canvas.focus({ preventScroll: true });
    document.dispatchEvent(new CustomEvent('directional:activate'));
  });
  canvas.addEventListener('dblclick', resetView);
  canvas.addEventListener('keydown', handleKey);
  canvas.addEventListener('pointermove', (event) => {
    if (dragging || event.buttons) return;
    const bounds = canvas.getBoundingClientRect();
    pointer.set((event.clientX - bounds.left) / bounds.width * 2 - 1, -(event.clientY - bounds.top) / bounds.height * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(surfaces, false)[0];
    tooltip.hidden = !hit;
    if (!hit) return;
    tooltip.textContent = `${hit.object.userData.surface.name} · TVD ${(-hit.point.y / state.exaggeration).toFixed(1)} m`;
    tooltip.style.left = `${Math.min(width - tooltip.offsetWidth - 8, event.clientX - bounds.left + 14)}px`;
    tooltip.style.top = `${Math.min(height - 45, event.clientY - bounds.top + 14)}px`;
  });
  canvas.addEventListener('pointerleave', () => { tooltip.hidden = true; });
  document.querySelectorAll('[data-scene-action]').forEach(button => button.addEventListener('click', () => {
    const action = button.dataset.sceneAction;
    if (action === 'reset') resetView();
    if (action === 'fit') fitModelInView();
    if (action === 'zoom-in') zoomBy(1.2);
    if (action === 'zoom-out') zoomBy(1 / 1.2);
    if (action === 'top') focusDepth(sceneData.surfaces[0].depth);
    if (action === 'base') focusDepth(sceneData.surfaces.at(-1).depth);
  }));
  document.querySelector('#scene-view').addEventListener('change', event => {
    if (event.target.value === 'isometric') resetView();
    else setViewMode(event.target.value);
  });
  document.querySelector('#scene-exaggeration').addEventListener('change', event => {
    const next = Number(event.target.value);
    const ratio = next / state.exaggeration;
    const offsetY = camera.position.y - controls.target.y;
    controls.target.y *= ratio;
    camera.position.y = controls.target.y + offsetY;
    state.exaggeration = next;
    world.scale.y = next;
    casingMarker.scale.y = 1 / next;
    bitMarker.scale.y = 1 / next;
    ellipses.children.forEach(ring => { ring.position.y = ring.userData.depth * next; });
    if (state.follow) followActiveWell();
    controls.update();
    scheduleRender();
  });
  document.querySelector('#scene-grid').addEventListener('change', event => { state.grid = grid.visible = event.target.checked; scheduleRender(); });
  document.querySelector('#scene-ellipses').addEventListener('change', event => { state.ellipses = ellipses.visible = event.target.checked; scheduleRender(); });
  document.querySelector('#scene-bit').addEventListener('change', event => { state.bit = bitMarker.visible = event.target.checked; scheduleRender(); });
  document.querySelector('#scene-components').addEventListener('change', event => {
    well.visible = event.target.value === 'all';
    casingMarker.visible = well.visible && state.mdStart <= 50;
    diameterLabel.style.display = casingMarker.visible ? '' : 'none';
    scheduleRender();
  });
  document.querySelector('#scene-follow').addEventListener('click', event => {
    state.follow = !state.follow;
    event.currentTarget.setAttribute('aria-pressed', String(state.follow));
    if (state.follow) followActiveWell();
  });
  document.querySelector('#scene-md-start').addEventListener('input', event => {
    const value = Number(event.target.value);
    state.mdStart = THREE.MathUtils.clamp(Number.isFinite(value) ? value : 0, 0, 721.1);
    // TubeGeometry samples by arc length; map the demo MD interval to its rings.
    const firstIndex = Math.floor(state.mdStart / 721.1 * 240) * 8 * 6;
    well.geometry.setDrawRange(firstIndex, well.geometry.index.count - firstIndex);
    casingMarker.visible = well.visible && state.mdStart <= 50;
    diameterLabel.style.display = casingMarker.visible ? '' : 'none';
    ellipses.children.forEach((ring, index) => { ring.visible = (.75 + index * .03125) * 721.1 >= state.mdStart; });
    scheduleRender();
  });
  document.querySelector('#scene-md-start').addEventListener('change', event => { event.target.value = state.mdStart; });

  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    status.hidden = false;
    status.textContent = 'Restoring 3D view…';
  });
  canvas.addEventListener('webglcontextrestored', () => {
    restoreFrame = requestAnimationFrame(() => { status.hidden = true; resize(); });
  });
  document.addEventListener('visibilitychange', scheduleRender);
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  window.addEventListener('pagehide', event => {
    if (event.persisted) return;
    destroyed = true;
    cancelAnimationFrame(frame);
    cancelAnimationFrame(restoreFrame);
    resizeObserver.disconnect();
    controls.dispose();
    scene.traverse(object => {
      object.geometry?.dispose();
      if (Array.isArray(object.material)) object.material.forEach(material => material.dispose());
      else object.material?.dispose();
    });
    renderer.dispose();
  }, { once: true });

  camera.position.copy(initialTarget).add(initialOffset);
  controls.target.copy(initialTarget);
  camera.lookAt(initialTarget);
  controls.update();
  controls.saveState();
  status.hidden = true;
  area.classList.add('scene-ready');
  resize();
  resetView();
}
