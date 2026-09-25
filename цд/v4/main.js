/* Entry point of the first digital-twin frame: binds the interface written
   in v4.html, loads the models and runs the frame loop. */
import * as THREE from 'three';
import { scene, camera, renderer, controls, world, syncPixelRatio } from './scene/core.js';
import { buildStack, layers, hitboxes } from './scene/build.js';
import { stepLayers, stepSurfaceAccents } from './scene/frame.js';
import { holdCamera, stepFraming, updateFraming } from './scene/camera-rig.js';
import { state, refresh } from './state.js';
import { EMBEDDED } from './params.js';
import './refresh.js';
import { bindStack, updateNavLine } from './ui/stack.js';
import { positionKeyEffects } from './ui/key-effects.js';
import { initAssetCard } from './ui/asset-card.js';
import { updateTeoLabels, updateDrillLabel, updateLateralLabel, updateSurfaceLabel, debugInfo } from './ui/labels.js';
import { bindInput, trackHover } from './input.js';
import { applyDebugEntry } from './debug-entry.js';

buildStack()
  .then(() => document.getElementById('loader').classList.add('is-done'))
  .catch(error => { document.querySelector('#loader .message').textContent = 'Ошибка: ' + error.message; });

bindInput();
bindStack();
updateFraming();

/* Sleep mode for the embedded show.

   сцена.html keeps the slide in a hidden iframe for the whole lead-in so the
   scene is ready by the finale. Hidden isn't free: the loop spins at full
   rate, raycasts every frame, and the tape on top starts to stutter. Until
   the parent says "showing", render rarely — just so the frame appears as
   models load — and don't raycast at all. */
let awake = !EMBEDDED;
let lastSleepFrame = 0;
addEventListener('message', event => {
  if(event.data !== 'слайд:показать') return;
  awake = true;
  // in a hidden iframe the pixel density may have been detected wrong
  syncPixelRatio();
  renderer.setSize(innerWidth, innerHeight);
});

const clock = new THREE.Clock();

function animate(){
  requestAnimationFrame(animate);

  if(!awake){
    const now = performance.now();
    if(now - lastSleepFrame < 250) return;
    lastSleepFrame = now;
    clock.getDelta();                 // don't accumulate delta until wake-up
    controls.update();
    renderer.render(scene, camera);
    return;
  }

  const dt = Math.min(clock.getDelta(), 0.1);
  const t = clock.elapsedTime;
  const k = 1 - Math.exp(-dt*8);

  // pump jacks: PumpCycle from the surface model; the nested wireframe follows
  layers.surface?.mixer?.update(dt);
  trackHover();
  const { progress, easedProgress } = stepLayers(dt, t, k);
  // with content open and while closing, the camera stays where the click found it
  if(state.openZone || state.closingZone) holdCamera(); else controls.update();
  stepFraming(k, progress, easedProgress);
  renderer.render(scene, camera);

  updateTeoLabels();
  updateDrillLabel();
  updateLateralLabel();
  updateSurfaceLabel(stepSurfaceAccents(k, t));
}
animate();

initAssetCard();
applyDebugEntry();

addEventListener('resize', () => {
  syncPixelRatio();
  renderer.setSize(innerWidth, innerHeight);
  positionKeyEffects();
  updateFraming();
  updateNavLine();
});

// debugging hook, same idea as window.__dbg in the other show pages
window.__dbg = {
  renderer, scene, camera, state, layers, refresh, world,
  get hitboxCount(){ return hitboxes.length; },
  get asleep(){ return !awake; },
  get drillDepth(){ return debugInfo.depth; },
  get teoLabelsVisible(){ return debugInfo.teoVisible; },
  updateTeoLabels, updateDrillLabel, updateLateralLabel,
};
