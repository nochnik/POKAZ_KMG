/* Opening, switching and closing a layer.

   One click opens a layer straight away: the whole stack flies into the
   bottom-left corner as a mini stack, the content slides in on the right, the
   first-asset card folds. The mini stack stays clickable — clicking another
   layer switches the content (switchLayer). Closing is the same flight back.

   Rejected earlier (see первый_слайд_v3.html): a five-beat opening — flash,
   camera turn to the start azimuth, neighbours leaving into the corner, the
   slab turning to face the screen and growing — and a jump to a separate
   project page. The five-beat code was still in v3 but nothing triggered it
   any more, so it did not come over. */
import { state, selection, refresh } from './state.js';
import { controls } from './scene/core.js';
import { layers } from './scene/build.js';
import { startFlight, MINI } from './scene/layout.js';
import { captureCamera, captureFraming } from './scene/camera-rig.js';
import { showContent, hideContent } from './ui/content.js';
import { hideAssetCard, showAssetCard } from './ui/asset-card.js';
import { setPanelLayerOpen } from './ui/panel.js';

const CLOSE_MS = MINI.transitionMs + 100;   // until idle (auto-rotation) returns
let closeTimer = null;

function startStackFlight(){
  startFlight(layers);
  captureFraming();
}

export function openLayer(zoneId, isSwitch = false){
  if(state.closingZone) return;
  if(state.openZone && !isSwitch) return;
  // leaving the reservoir — give back its previous step choice
  if(isSwitch && state.openZone === 'reservoir' && state.stepBeforeOpen !== undefined){
    selection.step = state.stepBeforeOpen;
  }
  state.selectedZone = zoneId;
  state.hoveredZone = null;
  state.hoveredStep = null;
  controls.autoRotate = false;
  controls.enabled = false;
  // on a switch the camera is already held — don't re-capture it
  if(!isSwitch) captureCamera();
  /* The reservoir zone opens straight on "Strategy" (step 1): GGDM has no
     external tool (23.09, "bottom layer without a link") and opening it would
     read as a placeholder. The previous choice is remembered and restored on
     close, so "Strategy" isn't forced on the next hover. */
  if(zoneId === 'reservoir'){
    state.stepBeforeOpen = selection.step;
    const hasChosenStep = selection.zone === 'reservoir' && selection.step !== null && selection.step !== 0;
    selection.zone = 'reservoir';
    if(!hasChosenStep) selection.step = 1;
  }
  showLayerContent(zoneId);
}

/* Also called directly when a different reservoir slab is clicked in the mini
   stack: same zone, new content. */
export function showLayerContent(zoneId){
  const isSwitch = state.openZone !== null;   // already open: the stack stays in the corner, only content changes
  state.openZone = zoneId;
  // the right side is taken by the content; the card comes back on close
  hideAssetCard();
  if(!isSwitch) startStackFlight();
  showContent(isSwitch);
  setPanelLayerOpen(true);
  refresh();   // also updates framing: with an open layer the frame shift drops at once, not by timer
}

/* Switching while a layer is open (click on the mini stack or the left list).
   Rejected: closing the current layer normally and opening the new one after —
   the stack would fly from the corner to the centre and straight back just to
   swap the text on the right. */
export function switchLayer(zoneId){
  if(!state.openZone || state.openZone === zoneId || state.closingZone) return;
  openLayer(zoneId, true);
}

/* The flight back starts from wherever the layers are now (startFlight
   snapshot), so closing mid-opening doesn't jerk. The camera is not moved:
   it didn't move on opening, there is nowhere to return it. */
export function closeLayer(){
  if(!state.openZone) return;
  const zoneId = state.openZone;
  if(zoneId === 'reservoir' && state.stepBeforeOpen !== undefined) selection.step = state.stepBeforeOpen;
  hideContent();
  setPanelLayerOpen(false);
  startStackFlight();
  state.openZone = null;
  state.closingZone = zoneId;
  state.selectedZone = null;
  state.hoveredZone = null;
  controls.autoRotate = false;
  controls.enabled = false;
  refresh();
  closeTimer = setTimeout(finishClosing, CLOSE_MS);
}

function finishClosing(){
  if(!state.closingZone) return;
  state.closingZone = null;
  clearTimeout(closeTimer);
  controls.autoRotate = true;
  controls.enabled = true;
  refresh();
  showAssetCard();   // back in the initial frame: the first-asset card stands on the right again
}
