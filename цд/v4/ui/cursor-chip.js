/* Chip next to the cursor naming the layer under it. The names are the
   data-short attributes of the stack buttons in v4.html; the colour comes
   from data-zone (styles/base.css). */
import { state } from '../state.js';
import { shortName } from './stack.js';

const chipEl = document.getElementById('cursor-chip');

function show(x, y, zoneId, text){
  chipEl.style.display = 'block';
  chipEl.style.left = (x + 16) + 'px';
  chipEl.style.top = (y + 14) + 'px';
  chipEl.dataset.zone = zoneId;
  chipEl.textContent = text;
}

/**
 * @param hit       { zone, step } under the cursor, or zone null
 * @param clickable whether a click on it would open something
 * @param mouse     [x, y] of the cursor
 */
export function updateCursorChip(hit, clickable, [x, y]){
  if(clickable && state.openZone){
    // with content open the chip only names the layer under the cursor
    show(x, y, hit.zone, shortName(hit.zone));
  } else if(hit.zone && !state.selectedZone){
    // over the reservoir the chip names the slab (step) under the cursor
    const step = hit.zone === 'reservoir' ? hit.step : null;
    show(x, y, hit.zone, shortName(hit.zone, step));
  } else {
    chipEl.style.display = 'none';
  }
}
