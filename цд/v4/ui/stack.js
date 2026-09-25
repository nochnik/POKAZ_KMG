/* Zone stack on the left. The buttons are written in v4.html; this module
   binds them to the state and toggles is-hot / is-expanded / is-visible. */
import { isGgdm } from '../data/zones.js';
import { state, selection, activeZone, refresh } from '../state.js';
import { openLayer, switchLayer } from '../transitions.js';

const stackEl = document.getElementById('stack');
const items = [...stackEl.querySelectorAll('.stack-item')];

/* data-zone / data-step of a stack button; step is null for a zone button. */
const zoneOf = item => item.dataset.zone;
const stepOf = item => item.dataset.step === undefined ? null : Number(item.dataset.step);

/* Short name shown next to the cursor over the 3D model (data-short). */
export function shortName(zoneId, step = null){
  const selector = step === null
    ? `.stack-item:not(.step)[data-zone="${zoneId}"]`
    : `.stack-item.step[data-zone="${zoneId}"][data-step="${step}"]`;
  return stackEl.querySelector(selector)?.dataset.short ?? '';
}

export function bindStack(){
  for(const item of items){
    const zoneId = zoneOf(item), step = stepOf(item);
    if(step === null){
      item.addEventListener('mouseenter', () => { state.hoveredZone = zoneId; state.hoveredStep = null; refresh(); });
      item.addEventListener('mouseleave', () => { state.hoveredZone = null; refresh(); });
      item.addEventListener('click', () => {
        if(state.closingZone) return;
        if(state.openZone){ switchLayer(zoneId); return; }
        selection.step = null;
        openLayer(zoneId);
      });
    } else {
      item.addEventListener('mouseenter', () => { state.hoveredZone = zoneId; state.hoveredStep = step; refresh(); });
      item.addEventListener('mouseleave', () => { state.hoveredStep = null; refresh(); });
      item.addEventListener('click', () => {
        if(state.closingZone) return;
        if(isGgdm(zoneId, step)) return;   // same rule as clicking the slab itself
        if(state.openZone){ switchLayer(zoneId); return; }
        selection.zone = zoneId;
        selection.step = step;
        openLayer(zoneId);
      });
    }
  }
}

export function updateStack(){
  const active = activeZone();
  stackEl.classList.toggle('is-selected', Boolean(state.selectedZone || state.openZone));
  for(const item of items){
    const zoneId = zoneOf(item), step = stepOf(item);
    /* Steps unfold only for the selected zone. Hover isn't enough: the list
       would jump in height under the cursor and slide out from under it. And
       only while the layer isn't fully open: with a system on the right the
       left side keeps just the three zones (23.09, Adil) — two levels at once
       leave the eye unsure where to look. */
    const expanded = state.selectedZone === zoneId && !state.openZone;
    if(step === null){
      item.classList.toggle('is-hot', zoneId === active);
      item.classList.toggle('is-expanded', expanded);
    } else {
      const currentStep = state.selectedZone === zoneId ? selection.step
                        : (state.hoveredZone === zoneId ? state.hoveredStep : null);
      item.classList.toggle('is-visible', expanded);
      item.classList.toggle('is-hot', active === zoneId && currentStep === step);
    }
  }
}

/* Fill and running dot reach the current item: the process visibly flows from
   the reservoir through the steps to the next zones rather than being a set of
   separate buttons. */
export function updateNavLine(){
  const line = document.getElementById('nav-line');
  const fill = document.getElementById('nav-fill');
  const dot = document.getElementById('nav-dot');
  const hot = items.filter(item => item.classList.contains('is-hot')).pop();
  if(!hot){
    fill.style.height = '0px';
    dot.classList.remove('is-visible');
    items.forEach(item => item.classList.remove('is-done'));
    return;
  }
  const middleOf = item => { const r = item.getBoundingClientRect(); return r.top + r.height/2; };
  const y = middleOf(hot);
  line.style.setProperty('--line-color', getComputedStyle(hot).getPropertyValue('--color').trim() || '#F0AE4A');
  const dy = Math.max(0, y - line.getBoundingClientRect().top);
  fill.style.height = dy + 'px';
  dot.style.transform = 'translateY(' + dy + 'px)';
  dot.classList.add('is-visible');
  items.forEach(item => item.classList.toggle('is-done', middleOf(item) <= y + 1));
}
