/* Open a layer from the URL, without a mouse — for screenshots: headless
   Chrome opens the page and there is nobody to click.

   `?слой=reservoir|well|surface` selects a zone (the v3 ids plast|skv|naz
   work too), `&шаг=N` its step (from zero), `&наведение=1` hovers instead of
   clicking, `&угол=45` turns the model and stops auto-rotation. Latin twins:
   layer, step, hover, angle. Without these keys nothing changes. */
import { state, selection, refresh } from './state.js';
import { camera, controls } from './scene/core.js';
import { LAYERS_BOTTOM_UP } from './data/zones.js';
import { getParam } from './params.js';

const V3_IDS = { plast:'reservoir', skv:'well', naz:'surface' };

export function applyDebugEntry(){
  const rawZone = getParam('слой', 'layer');
  const zoneId = V3_IDS[rawZone] ?? rawZone;
  const validZone = LAYERS_BOTTOM_UP.includes(zoneId);
  const step = getParam('шаг', 'step');
  const hover = getParam('наведение', 'hover');
  const angle = parseFloat(getParam('угол', 'angle'));
  if(!validZone && !Number.isFinite(angle)) return;

  /* Applied several times in a row, not once: layers finish loading in random
     order, and the first refresh after the last .glb used to reset the chosen
     zone back to the overview — the screenshot came out empty. */
  const apply = () => {
    if(validZone){
      if(hover){
        state.hoveredZone = zoneId; state.selectedZone = null; state.hoveredStep = null;
        state.hoverFrozen = true;
      } else {
        state.selectedZone = zoneId; state.hoveredZone = null;
      }
      refresh();
      if(step !== null && step !== ''){
        selection.zone = zoneId;
        selection.step = +step;
        refresh();
      }
    }
    if(Number.isFinite(angle)){
      controls.autoRotate = false;
      const radius = Math.hypot(camera.position.x, camera.position.z);
      const a = angle * Math.PI/180;
      camera.position.x = Math.sin(a)*radius;
      camera.position.z = Math.cos(a)*radius;
      camera.lookAt(controls.target);
    }
  };
  // first pass once the layers stand in the stack, then keep it for eight more seconds
  for(let ms = 400; ms <= 8400; ms += 800) setTimeout(apply, ms);
}
