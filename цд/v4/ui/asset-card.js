/* First-asset card (East Moldabek), markup in v4.html.

   18.09 (Adil): "a card should come out, but the 3D stays". Tier 1 is the
   asset passport, tier 2 adds "already done". 24.09 (Adil): the card is the
   entry point of the frame, not a button popup — it shows both tiers on load.
   Opening a layer folds it (tier 0), closing brings it back (tier 2); Esc
   dismisses it, and then the zone panel starts showing on hover. */
import { state, refresh } from '../state.js';
import { getParam } from '../params.js';

const cardEl = document.getElementById('asset-card');
const passportEl = cardEl.querySelector('.passport');
const doneEl = cardEl.querySelector('.done');
let tier = 0;

export function setCardTier(n){
  tier = Math.max(0, Math.min(2, n));
  cardEl.classList.toggle('is-visible', tier > 0);
  passportEl.classList.toggle('is-visible', tier >= 1);
  doneEl.classList.toggle('is-visible', tier >= 2);
  // while the card is out the zone panel isn't needed — it would sit under the card
  if(tier > 0){ state.selectedZone = null; state.hoveredZone = null; refresh(); }
}

export const isCardOpen = () => tier > 0;
export const hideAssetCard = () => setCardTier(0);
export const showAssetCard = () => setCardTier(2);

export function initAssetCard(){
  // `?справка=N` — open with N tiers (screenshots)
  const requested = +(getParam('справка') || 0);
  setTimeout(() => setCardTier(requested > 0 ? requested : 2), 400);
}
