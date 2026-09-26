/* Shared frame state. Read by both the scene and the UI; the UI redraws
   with a single `refresh()` call.

   The redraw itself lives in refresh.js and is plugged in via `onRefresh`,
   so UI modules can ask for a redraw without importing each other in a circle. */
export const state = {
  hoveredZone: null,     // zone under the cursor — in the scene or in the left stack
  hoveredStep: null,     // step under the cursor (for the reservoir: one of three slabs)
  selectedZone: null,    // clicked zone; equals `openZone` while a layer is open
  openZone: null,        // zone whose content is on the right; the stack is then a mini stack in the corner
  closingZone: null,     // zone currently collapsing back
  hoverFrozen: false,    // debug `?наведение=1`: raycasting must not reset the hover
  stepBeforeOpen: undefined,   // reservoir step chosen before opening — restored on close
};

/* Which step the panel shows and which reservoir video opens. Separate from
   hover: hover leaves with the cursor, the step choice stays. */
export const selection = { zone:null, step:null };

export const activeZone = () => state.selectedZone || state.hoveredZone;

let redraw = () => {};
export function onRefresh(callback){ redraw = callback; }
export function refresh(){ redraw(); }
