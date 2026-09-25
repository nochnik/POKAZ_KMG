/* Pointer and keyboard: hover over the 3D stack, clicks, Esc, and key
   forwarding when the slide sits inside the lead-in frame. */
import * as THREE from 'three';
import { state, selection, refresh } from './state.js';
import { camera, renderer } from './scene/core.js';
import { hitboxes, restHitboxes } from './scene/build.js';
import { isGgdm } from './data/zones.js';
import { IN_FRAME } from './params.js';
import { openLayer, switchLayer, showLayerContent, closeLayer } from './transitions.js';
import { hideAssetCard } from './ui/asset-card.js';
import { updateCursorChip } from './ui/cursor-chip.js';

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2(-2, -2);   // off-screen until the mouse moves
let mouse = [0, 0];

/* A drag rotates the model and must not count as a click. */
const DRAG_THRESHOLD = 6;
let pointerStart = null;
let dragged = false;

function pick(targets){
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(targets, false)[0];
  return { zone: hit ? hit.object.userData.zone : null, step: hit ? hit.object.userData.step ?? null : null };
}

/* Per frame: what is under the cursor, hover state, cursor and chip.

   While nothing is clicked the layout reacts to hover itself, so the ray
   goes against the static rest hitboxes (see scene/build.js); a clicked layer
   doesn't move with hover, so live hitboxes are safe and more precise. */
export function trackHover(){
  let hit = { zone:null, step:null };
  const targets = state.selectedZone ? hitboxes : restHitboxes;
  if(Math.abs(pointer.x) <= 1 && Math.abs(pointer.y) <= 1 && targets.length) hit = pick(targets);

  /* `hoverFrozen` is set only by the debug `?наведение=1` entry: there is no
     mouse there, raycasting finds nothing every frame and would reset the
     hover. Never raised during a show. */
  if(!state.hoverFrozen && !state.closingZone && (hit.zone !== state.hoveredZone || hit.step !== state.hoveredStep)){
    const overUi = document.querySelector('#stack:hover, #panel:hover, #content:hover');
    if(overUi){
      if(state.openZone && state.hoveredZone !== null){ state.hoveredZone = null; state.hoveredStep = null; refresh(); }
    } else {
      state.hoveredZone = hit.zone; state.hoveredStep = hit.step; refresh();
    }
  }

  const clickable = hit.zone && !isGgdm(hit.zone, hit.step) && (
    !state.openZone || hit.zone !== state.openZone || (hit.zone === 'reservoir' && hit.step !== null));
  renderer.domElement.style.cursor = clickable ? 'pointer' : '';
  updateCursorChip(hit, clickable, mouse);
}

function onCanvasClick(event){
  const wasDrag = dragged;
  pointerStart = null;
  dragged = false;
  if(wasDrag || state.closingZone) return;

  if(state.openZone){
    // mini stack in the corner: clicking another layer opens its content
    pointer.set((event.clientX/innerWidth)*2 - 1, -(event.clientY/innerHeight)*2 + 1);
    const hit = pick(hitboxes);
    if(!hit.zone || isGgdm(hit.zone, hit.step)) return;
    if(hit.zone === 'reservoir'){ selection.zone = 'reservoir'; selection.step = hit.step; }
    if(hit.zone !== state.openZone) switchLayer(hit.zone);
    else if(hit.zone === 'reservoir' && hit.step !== null) showLayerContent('reservoir');
    return;
  }
  if(state.hoveredZone){
    if(isGgdm(state.hoveredZone, state.hoveredStep)) return;   // GGDM stays a visual layer only
    if(state.hoveredZone === 'reservoir') selection.step = state.hoveredStep;
    openLayer(state.hoveredZone);
  } else if(state.selectedZone){
    state.selectedZone = null;
    refresh();
  }
}

function onEscape(){
  if(state.openZone) closeLayer();
  else if(!state.closingZone){   // closing is short and final — let it finish instead of cutting it
    state.selectedZone = null;
    state.hoveredZone = null;
    refresh();
  }
  // Esc also dismisses the first-asset card; closing a layer brings it back later
  hideAssetCard();
}

/* In the lead-in frame (demo_with_map.html) focus stays inside the frame after
   a click on the model, and "next/back" keys would go nowhere — forward them
   to the parent as messages, the same way the rollout stage does. */
function forwardToParent(event){
  const code = event.code;
  if(['ArrowRight','Enter','NumpadEnter','Space','PageDown'].includes(code)){
    event.preventDefault();
    parent.postMessage({ слайд:true, шаг:+1 }, '*');
  }
  if(['ArrowLeft','Backspace','PageUp'].includes(code)){
    event.preventDefault();
    parent.postMessage({ слайд:true, шаг:-1 }, '*');
  }
}

export function bindInput(){
  const canvas = renderer.domElement;
  canvas.addEventListener('pointerdown', event => {
    if(event.pointerType === 'mouse' && event.button !== 0) return;
    pointerStart = { id:event.pointerId, x:event.clientX, y:event.clientY };
    dragged = false;
  });
  addEventListener('pointermove', event => {
    pointer.x = (event.clientX/innerWidth)*2 - 1;
    pointer.y = -(event.clientY/innerHeight)*2 + 1;
    mouse = [event.clientX, event.clientY];
    if(pointerStart && event.pointerId === pointerStart.id &&
       Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > DRAG_THRESHOLD){
      dragged = true;
    }
  });
  addEventListener('pointercancel', event => {
    if(pointerStart && event.pointerId === pointerStart.id){ pointerStart = null; dragged = false; }
  });
  canvas.addEventListener('click', onCanvasClick);

  addEventListener('keydown', event => { if(event.key === 'Escape') onEscape(); });
  if(IN_FRAME) addEventListener('keydown', forwardToParent);

  document.getElementById('panel-close').addEventListener('click', () => {
    if(state.openZone){ closeLayer(); return; }
    if(state.closingZone) return;
    state.selectedZone = null;
    state.hoveredZone = null;
    refresh();
  });
  document.getElementById('content-back').addEventListener('click', closeLayer);
  document.getElementById('mini-reset').addEventListener('click', event => {
    event.stopPropagation();
    closeLayer();
  });
}
