/* HTML labels that follow scene objects: TEO drill points, the well being
   drilled, the horizontal lateral, the digitised surface object. The labels
   are written in v4.html; this module only shows them and sets their screen
   position — a point of the 3D model can only be projected in JS. */
import { state, selection } from '../state.js';
import { toScreen } from '../scene/core.js';
import { layers } from '../scene/build.js';

const teoEl = document.getElementById('teo-labels');
const drillEl = document.getElementById('drill-label');
const depthEl = drillEl.querySelector('.depth');
const lateralEl = document.getElementById('horizontal-label');
const surfaceLabels = [...document.querySelectorAll('.surface-label')];

function placeAt(element, anchor){
  const point = toScreen(anchor);
  if(!point){ element.classList.remove('is-visible'); return; }
  element.style.left = point.x + 'px';
  element.style.top = point.y + 'px';
}

/* ── TEO drill points ─────────────────────────────────────────────────
   Two of the eight wells are labelled (see the comment in v4.html): eight
   labels turned the stack into a table floating over the model; two read as a
   comparison of two decisions, which is what the layer is about. Each tag
   follows the top of its column, found by data-well. */
const teoTags = [...teoEl.querySelectorAll('.teo-tag')].map(element => ({ element, anchor:null }));

function linkTeoTags(anchors){
  for(const tag of teoTags) tag.anchor = anchors.find(a => a.point.well === tag.element.dataset.well)?.anchor ?? null;
}

export function updateTeoLabels(){
  const anchors = layers.reservoir?.columns.anchors ?? [];
  const show = anchors.length && !state.openZone && (
    (state.selectedZone === 'reservoir' && selection.step === 2) ||
    (state.hoveredZone === 'reservoir' && state.hoveredStep === 2));
  teoEl.classList.toggle('is-visible', Boolean(show));
  if(!show) return;
  if(!teoTags[0].anchor) linkTeoTags(anchors);

  const points = teoTags.map(tag => {
    const point = tag.anchor && toScreen(tag.anchor);
    tag.element.style.display = point ? '' : 'none';
    return point && { tag, ...point };
  });

  /* Vertical separation. Height bands part the columns in the scene, but at a
     flat angle projection eats the difference and the tags still meet — seen
     at the show. So the lower (to-left) tag is pushed down in screen pixels,
     one-way and only up to the threshold. A two-way "move apart" would jitter:
     both tags jumping around the boundary every frame. */
  const MIN_GAP = 66;
  const upper = points.find(p => p && !p.tag.element.classList.contains('to-left'));
  const lower = points.find(p => p && p.tag.element.classList.contains('to-left'));
  if(upper && lower && lower.y - upper.y < MIN_GAP) lower.y = upper.y + MIN_GAP;

  for(const point of points){
    if(!point) continue;
    point.tag.element.style.left = point.x + 'px';
    point.tag.element.style.top = point.y + 'px';
  }
}

/* ── well being drilled ───────────────────────────────────────────────
   The depth counter grows only while the layer is shown: behind the
   presenter's back it would run into thousands of metres. The rate is for
   show, not field speed: at an honest 20–30 m/h the number looks frozen and
   "drilling in progress" stops reading. */
let depth = 1184.0, lastTick = 0;

/* Shown by highlight, not digitization: the label must come out with the bit
   itself, i.e. already on hover. Hidden with open content — next to the mini
   stack in the corner it is too big and ran off the edge. */
const wellLabelsVisible = () => !state.openZone && (layers.well?.highlight || 0) > 0.35;

export function updateDrillLabel(){
  const bit = layers.well?.drillBit;
  const visible = bit && wellLabelsVisible();
  drillEl.classList.toggle('is-visible', Boolean(visible));
  if(!visible){ lastTick = 0; return; }

  const now = performance.now();
  // cap the step: if the tab was in the background, don't count the whole pause
  if(lastTick) depth += Math.min(0.25, (now - lastTick)/1000) * 0.05;
  lastTick = now;
  depthEl.textContent = depth.toFixed(1).replace('.', ',') + ' м';
  placeAt(drillEl, bit.anchor);
}

export function updateLateralLabel(){
  const lateral = layers.well?.lateral;
  const visible = lateral && wellLabelsVisible();
  lateralEl.classList.toggle('is-visible', Boolean(visible));
  if(visible) placeAt(lateralEl, lateral.anchor);
}

/* ── digitised surface object ─────────────────────────────────────────
   `step` is the surface step whose objects are ringed right now (see
   stepSurfaceAccents in scene/frame.js), `anchor` the point above them, or
   null. Each step has its own label in v4.html. */
export function updateSurfaceLabel(accent){
  for(const label of surfaceLabels){
    const visible = accent && !state.openZone && label.dataset.step === String(accent.step);
    label.classList.toggle('is-visible', Boolean(visible));
    if(visible) placeAt(label, accent.anchor);
  }
}

export const debugInfo = {
  get depth(){ return depth; },
  get teoVisible(){ return teoEl.classList.contains('is-visible'); },
};
