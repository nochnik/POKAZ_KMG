/* Drill points of the techno-economic evaluation (TEO) layer and their economics.

   THE BASIS IS ACTUAL DATA — EMG daily production report for V. Moldabek,
   January–June 2026, 369 wells. Half-year production = oil rate × days worked,
   money from the "profit/loss" column. Well names come from the residual
   reserves map; x/z are fractions of the footprint from its centre.

   Eight points out of 369: the three best by return and five from the upper
   middle of the stock — the band between the 60th and 85th percentile
   (335–831 t per half-year against a median of 245), not the median itself:
   noticeably above typical, but not record holders.

   ANNUAL FIGURES ARE AN ESTIMATE, NOT A FACT. The half-year is multiplied by
   1.85, not 2: the target is depleted, water cut 88.8 %, and the second half on
   declining production does not repeat the first. Hence "≈" on the labels.
   The two TEO labels in v4.html show these figures ÷ 12 per month — when the
   annual report or the CRNS calculation arrives, update both places and drop
   the "≈".

   `rank` is never shown: it sets the column height. Height follows rank rather
   than the numbers themselves — otherwise mid wells next to the best ones would
   shrink to invisible stubs.

   `azimuth` — heading of the horizontal lateral, radians. Column colour tells
   the wellbore type (green horizontal, red vertical; CSS variables
   --wellbore-* in styles/base.css). Exactly two horizontals — as many as the
   layer text promises: "1–2 horizontal wells planned".

   CAVEAT: the report does not state the wellbore type. The two best are marked
   horizontal because returns like that on a depleted target come from
   horizontals. If that turns out wrong, remove `azimuth` from the point. */
export const DRILL_POINTS = [
  { well:'VMB_2783', x:-0.28, z:-0.18, rank:1, production:'5 750', profit:'612', azimuth:-0.35 },
  { well:'VMB_2787', x:-0.06, z: 0.28, rank:2, production:'4 700', profit:'485', azimuth:-1.90 },
  { well:'VMB_2746', x:-0.34, z: 0.24, rank:3, production:'4 640', profit:'488' },
  { well:'VMB_2768', x: 0.02, z:-0.06, rank:4, production:'1 540', profit:'126' },
  { well:'VMB_418',  x: 0.18, z:-0.02, rank:5, production:'1 540', profit:'117' },
  { well:'VMB_615',  x:-0.12, z: 0.10, rank:6, production:'1 490', profit:'113' },
  { well:'VMB_202',  x: 0.24, z: 0.20, rank:7, production:'1 420', profit:'112' },
  { well:'VMB_2793', x: 0.31, z: 0.06, rank:8, production:'1 360', profit:'142' },
];

export const isHorizontal = point => point.azimuth !== undefined;
