/* Zones (контуры) of the digital twin as the 3D scene knows them. Titles,
   texts and short names live in v4.html; colours in styles/base.css. */

/* 3D layers, bottom to top. */
export const LAYERS_BOTTOM_UP = ['reservoir', 'well', 'surface'];

/* GGDM — the bottom reservoir slab — stays a picture only: it has no external
   tool of its own (23.09, "bottom layer without a link"), and opening it would
   read as a placeholder. Checked on slab click, step click and mini-stack hover. */
export const isGgdm = (zoneId, step) => zoneId === 'reservoir' && step === 0;
