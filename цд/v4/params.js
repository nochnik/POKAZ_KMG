/* URL flags and how the page is hosted. Read once on load. The debug entry
   for screenshots (`?слой=`, `?угол=` …) lives in debug-entry.js.

   Key names stay in Russian: they are an external interface — сцена_v2.html
   links `?коротко=1`, screenshot scripts use the others. */
const query = new URLSearchParams(location.search);

/** First value set among synonyms: debug keys have Latin twins for scripts. */
export function getParam(...names){
  for(const name of names){
    const value = query.get(name);
    if(value !== null) return value;
  }
  return null;
}

/* `?коротко=1` — "Short show" from сцена_v2.html: the camera stands farther
   back and resting hitboxes follow the spread stack (see scene/build.js).
   `&стопка=1` cancels it. */
export const SHORT_SHOW = query.get('коротко') === '1' && query.get('стопка') !== '1';

/* `?в_рамке=1` — the slide sits in the lead-in frame: arrows and space are
   forwarded to the parent (see input.js). */
export const IN_FRAME = query.get('в_рамке') === '1';

/* The slide lives inside the show's iframe: сцена.html keeps it hidden for the
   whole lead-in and wakes it with the "слайд:показать" message (see main.js). */
export const EMBEDDED = window.self !== window.top;
