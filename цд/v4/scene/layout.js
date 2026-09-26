/* Where each stack layer stands: at rest, on hover/selection, and as a mini
   stack in the corner while an open layer's content is on the right.

   Only targets are computed here; easing layers towards them frame by frame
   is scene/frame.js's job. */
import * as THREE from 'three';
import { camera, world } from './core.js';
import { LAYERS_BOTTOM_UP } from '../data/zones.js';

const zeros = () => Object.fromEntries(LAYERS_BOTTOM_UP.map(id => [id, 0]));
const heightOf = band => band.top - band.bottom;
const centerOf = band => (band.bottom + band.top)/2;

/* ── rest ─────────────────────────────────────────────────────────────
   The three layers are spread vertically around the stack centre. Heights get
   a 6 % margin for the slight hover enlargement.
   `layers` is any { zoneId: { bottom, top } } object. */
export function restLayout(layers){
  const GAP = 24;
  const offsets = zeros();
  let total = GAP * (LAYERS_BOTTOM_UP.length - 1);
  for(const id of LAYERS_BOTTOM_UP) total += heightOf(layers[id]) * 1.06;
  let bottom = -total/2;
  for(const id of LAYERS_BOTTOM_UP){
    const h = heightOf(layers[id]) * 1.06, center = bottom + h/2;
    offsets[id] = center - centerOf(layers[id]);
    bottom = center + h/2 + GAP;
  }
  return offsets;
}

/* ── hover and selection ──────────────────────────────────────────────
   The active layer stays put (on hover — where it sits in the collapsed stack;
   when clicked — at the centre), neighbours move away up and down. */
export function focusLayout(layers, activeId, clicked){
  const GAP = clicked ? 34 : 14;
  const offsets = zeros();
  const active = layers[activeId];
  const anchor = clicked ? 0 : centerOf(active);
  offsets[activeId] = anchor - centerOf(active);
  const index = LAYERS_BOTTOM_UP.indexOf(activeId);
  /* Spread reservoir slabs stick out of the layer box — neighbours move away by
     the same amount, otherwise the top slab runs into the well layer. */
  const spread = slabSpread(active);
  let edge = anchor + heightOf(active)/2 * 1.06 + spread.up;
  for(let i = index + 1; i < LAYERS_BOTTOM_UP.length; i++){
    const layer = layers[LAYERS_BOTTOM_UP[i]], center = edge + GAP + heightOf(layer)/2;
    offsets[layer.id] = center - centerOf(layer);
    edge = center + heightOf(layer)/2;
  }
  edge = anchor - heightOf(active)/2 * 1.06 - spread.down;
  for(let i = index - 1; i >= 0; i--){
    const layer = layers[LAYERS_BOTTOM_UP[i]], center = edge - GAP - heightOf(layer)/2;
    offsets[layer.id] = center - centerOf(layer);
    edge = center - heightOf(layer)/2;
  }
  return offsets;
}

/* How far the spread reservoir slabs stick out of their layer box. Uses last
   frame's values — stack and slabs move in sync. */
function slabSpread(layer){
  if(!layer.slabs) return { up:0, down:0 };
  let top = -Infinity, bottom = Infinity;
  for(const slab of layer.slabs){
    const center = (slab.top + slab.bottom)/2, half = (slab.top - slab.bottom)/2 * slab.scale;
    top = Math.max(top, center + half + slab.offset);
    bottom = Math.min(bottom, center - half + slab.offset);
  }
  return { up:Math.max(0, (top - layer.top) * 1.06), down:Math.max(0, (layer.bottom - bottom) * 1.06) };
}

/* ── mini stack ───────────────────────────────────────────────────────
   While a layer's content is open, the whole stack is a miniature in the
   bottom-left corner of the SCREEN. The spot is defined in fractions of the
   window height rather than world units: the former −260/−150 scene units
   depended on where the camera stood, and on another window size the mini
   stack ended up under the panel or off-frame. Everything is measured from the
   window height because the model on screen scales with it too. */
export const MINI = {
  scale: 0.50,
  heightRatio: 0.39,
  aspect: 0.90,          // spot width to height
  margin: 34,            // from the window edge, px
  transitionMs: 900,     // flight into the corner and back
};
// the back button (#mini-reset) sits right of the mini stack and needs its size
document.documentElement.style.setProperty('--mini-width', (MINI.heightRatio*MINI.aspect*100) + 'vh');
document.documentElement.style.setProperty('--mini-margin', MINI.margin + 'px');

/* In the mini stack layers sit tighter again, and the hovered one pushes its
   neighbours away — it's clear which one a click will hit. */
export function miniLayout(layers, hoveredId){
  const GAP = 22, HOVER_GAP = 48;
  const gapAfter = i => {
    const current = LAYERS_BOTTOM_UP[i], next = LAYERS_BOTTOM_UP[i + 1];
    return hoveredId && (current === hoveredId || next === hoveredId) ? HOVER_GAP : GAP;
  };
  const offsets = zeros();
  let total = 0;
  for(const id of LAYERS_BOTTOM_UP) total += heightOf(layers[id]) * MINI.scale;
  for(let i = 0; i < LAYERS_BOTTOM_UP.length - 1; i++) total += gapAfter(i);
  let bottom = -total/2;
  LAYERS_BOTTOM_UP.forEach((id, i) => {
    const layer = layers[id], h = heightOf(layer) * MINI.scale, center = bottom + h/2;
    offsets[id] = center - centerOf(layer) * MINI.scale;
    bottom = center + h/2 + (i < LAYERS_BOTTOM_UP.length - 1 ? gapAfter(i) : 0);
  });
  return offsets;
}

/* World offset that puts the stack centre into the centre of the corner spot.
   The shift is in the plane perpendicular to the view (camera right and up,
   not world X/Y): the centre's depth doesn't change, so pixels convert to
   world units with a single factor. Via world X, "left" on screen would depend
   on where auto-rotation happened to stop the camera. */
const forward = new THREE.Vector3(), right = new THREE.Vector3(), up = new THREE.Vector3(), toStack = new THREE.Vector3();
export function miniStackOffset(out){
  const W = innerWidth, H = innerHeight;
  const spotHeight = H*MINI.heightRatio, spotWidth = spotHeight*MINI.aspect;
  const centerX = MINI.margin + spotWidth/2, centerY = H - MINI.margin - spotHeight/2;
  camera.getWorldDirection(forward);
  right.crossVectors(forward, camera.up).normalize();
  up.crossVectors(right, forward);
  toStack.set(0, world.position.y, 0).sub(camera.position);
  const depth = toStack.dot(forward);
  const unitsPerPixel = depth*Math.tan(THREE.MathUtils.degToRad(camera.fov/2)) / (H/2);
  const moveRight = (centerX - W/2)*unitsPerPixel - toStack.dot(right);
  const moveUp = -(centerY - H/2)*unitsPerPixel - toStack.dot(up);
  return out.set(0, 0, 0).addScaledVector(right, moveRight).addScaledVector(up, moveUp);
}

/* ── flight into the corner and back ──────────────────────────────────
   Time-based with ease-in-out rather than the "chasing" lerp used elsewhere:
   travelling half the screen at full speed on the very first frame read as a
   jerk. The start is a snapshot of every layer at click time (it could be at
   rest, hovered or mid-flight). The target is recomputed every frame, so a
   resize mid-flight breaks nothing. */
const flight = { startedAt:0 };

export function startFlight(layers){
  flight.startedAt = performance.now();
  for(const id in layers){
    const layer = layers[id];
    layer.flightFrom = { offset:layer.offset, x:layer.corner.x, y:layer.corner.y, z:layer.corner.z,
                         scale:layer.miniScale, yaw:layer.yaw };
  }
}

/* Share of the path travelled, 0..1. Outside opening/closing there is no flight: 1. */
export function flightProgress(inFlight){
  return inFlight ? Math.min(1, (performance.now() - flight.startedAt)/MINI.transitionMs) : 1;
}

export const easeInOutCubic = p => p < 0.5 ? 4*p*p*p : 1 - Math.pow(-2*p + 2, 3)/2;

/* Shortest angle difference b−a in (−π, π]: without it the turn sometimes
   went the long way round the circle. */
export function angleDelta(a, b){
  let d = (b - a) % (Math.PI*2);
  if(d > Math.PI) d -= Math.PI*2;
  if(d < -Math.PI) d += Math.PI*2;
  return d;
}
