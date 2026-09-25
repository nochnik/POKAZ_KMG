/* UI redraw after any state change. Registered as the `refresh()` handler
   in state.js. */
import { state, activeZone, onRefresh } from './state.js';
import { updateStack, updateNavLine } from './ui/stack.js';
import { showPanel, hidePanel, setPanelReplacesStack } from './ui/panel.js';
import { setKeyEffectsDocked, positionKeyEffects } from './ui/key-effects.js';
import { isCardOpen } from './ui/asset-card.js';
import { updateFraming } from './scene/camera-rig.js';

const miniResetEl = document.getElementById('mini-reset');

function redraw(){
  const active = activeZone();
  miniResetEl.classList.toggle('is-visible', Boolean(state.openZone));
  const replacesStack = Boolean(state.selectedZone || state.openZone);
  setKeyEffectsDocked(replacesStack);
  setPanelReplacesStack(replacesStack);
  updateStack();

  /* Nothing hovered — no panel at all. The start-up ABAI modal is gone: it
     opened over the model before the first touch and covered what the slide
     is opened for; its content moved to the show's main screen. */
  const canShowPanel = active && !state.selectedZone && !state.openZone && !state.closingZone && !isCardOpen();
  if(canShowPanel) showPanel(active); else hidePanel();

  updateNavLine();
  // the stack changes height and re-centres — refine once the layout has settled
  requestAnimationFrame(updateNavLine);
  requestAnimationFrame(positionKeyEffects);
  updateFraming();
}

onRefresh(redraw);
