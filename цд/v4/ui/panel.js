/* Zone panel on the right. Its views are written in v4.html; this module
   picks the current one. Shows on hover when nothing is selected and the
   first-asset card is dismissed (see refresh.js). */
import { selection } from '../state.js';

const panelEl = document.getElementById('panel');
const views = [...panelEl.querySelectorAll('.panel-view')];

/* The zone view, or a step view when a step of that zone is chosen. */
export function showPanel(zoneId){
  // hovering another zone resets the chosen step
  if(selection.zone !== zoneId){ selection.zone = zoneId; selection.step = null; }
  const wantedStep = selection.step === null ? undefined : String(selection.step);
  const stepView = wantedStep !== undefined &&
    views.find(view => view.dataset.zone === zoneId && view.dataset.step === wantedStep);
  const current = stepView || views.find(view => view.dataset.zone === zoneId && view.dataset.step === undefined);
  for(const view of views) view.classList.toggle('is-current', view === current);
  panelEl.dataset.zone = zoneId;
  panelEl.classList.add('is-visible');
}

export function hidePanel(){ panelEl.classList.remove('is-visible'); }

/* Selected or open layer: the panel gives way to the stack and the content. */
export function setPanelReplacesStack(replaces){ panelEl.classList.toggle('is-replacing-stack', replaces); }
export function setPanelLayerOpen(open){ panelEl.classList.toggle('is-layer-open', open); }
