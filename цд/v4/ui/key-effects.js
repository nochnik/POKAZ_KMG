/* Key programme effects under the frame title (markup in v4.html). While a
   layer is selected or open they dock as one column above the stack. */
const effectsEl = document.getElementById('key-effects');
const stackEl = document.getElementById('stack');

export function setKeyEffectsDocked(docked){ effectsEl.classList.toggle('is-docked', docked); }

/* Docked: right above the stack, as wide as the stack or a bit wider, never
   above the top of the screen. Depends on the stack's live height, so it
   can't be pure CSS. */
export function positionKeyEffects(){
  if(!effectsEl.classList.contains('is-docked')){
    effectsEl.style.left = '';
    effectsEl.style.top = '';
    effectsEl.style.width = '';
    return;
  }
  const stackRect = stackEl.getBoundingClientRect();
  effectsEl.style.left = stackRect.left + 'px';
  effectsEl.style.width = Math.max(stackRect.width, Math.min(560, innerWidth * .3 - 52)) + 'px';
  effectsEl.style.top = Math.max(16, stackRect.top - effectsEl.offsetHeight - 12) + 'px';
}
