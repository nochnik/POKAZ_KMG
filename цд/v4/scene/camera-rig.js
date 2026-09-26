/* Camera outside the orbit controls: holding it still while a layer is open,
   and shifting the frame into the free corridor between panels. */
import * as THREE from 'three';
import { camera, controls, cameraAzimuth } from './core.js';
import { state } from '../state.js';

/* ── hold ─────────────────────────────────────────────────────────────
   While a layer is open and while it closes, the camera stays where the click
   found it and is driven by hand rather than by the orbit: OrbitControls with
   damping could play out leftover inertia on top of the stack flight. Radius
   and tilt are untouched — the zoom and angle the presenter chose stay. */
const hold = { azimuth:0, radius:0, polar:0 };

export function captureCamera(){
  const offset = new THREE.Vector3().copy(camera.position).sub(controls.target);
  hold.radius = offset.length();
  hold.polar = Math.acos(THREE.MathUtils.clamp(offset.y / hold.radius, -1, 1));
  hold.azimuth = cameraAzimuth();
}

export function holdCamera(){
  const { azimuth, radius, polar } = hold;
  const horizontal = radius * Math.sin(polar);
  camera.position.set(
    controls.target.x + horizontal*Math.sin(azimuth),
    controls.target.y + radius*Math.cos(polar),
    controls.target.z + horizontal*Math.cos(azimuth)
  );
  camera.lookAt(controls.target);
}

/* ── frame shift ──────────────────────────────────────────────────────
   The model is centred in the free corridor between the panels. What moves is
   the projection window (setViewOffset), not the scene — orbit and clicks
   stay where they are.

   The shift is not applied instantly: updateFraming() only changes the target,
   stepFraming() eases towards it every frame. There used to be a direct
   setViewOffset here, and when a layer opened the shift reset in the very frame
   the content's CSS transition started — the picture visibly jerked right
   "when the content comes in". */
const framing = { shift:0, target:0, from:0 };

export function captureFraming(){ framing.from = framing.shift; }

export function updateFraming(){
  const W = innerWidth, H = innerHeight;
  /* Aspect is applied at once, not eased: it is a real resize and must hold
     even while the renderer sleeps in an embedded iframe (the sleeping loop
     doesn't update the projection matrix itself). */
  camera.aspect = W/H;
  camera.updateProjectionMatrix();

  if(state.openZone){
    /* Mini stack on the left, 70 % content on the right — there is no real
       corridor, and shifting would send the camera somewhere arbitrary. */
    framing.target = 0;
    return;
  }
  const panel = document.getElementById('panel');
  if(state.selectedZone){
    // the panel is hidden while a layer is selected — the corridor starts at the left edge
    const left = panel.getBoundingClientRect().right + 24;
    const right = W - 26;
    framing.target = -((left + right)/2 - W/2);
    return;
  }
  const left = document.getElementById('stack').getBoundingClientRect().right + 24;
  /* Room for the right panel is reserved whether it is shown or not. Measured
     against the visible panel, the model would sit in the centre of the whole
     frame, then on the first hover the panel appears, the corridor narrows —
     and the picture jumps left right when everyone is looking at it.

     Width and margin come from the layout, not the on-screen rect: the hidden
     panel is offset by its 30px transition and its rect would be off by that. */
  const margin = parseFloat(getComputedStyle(panel).right) || 0;
  const right = W - margin - panel.offsetWidth - 24;
  const shift = (left + right)/2 - W/2;
  /* Extra shift left: the left stack is narrow, and with the corridor alone the
     model sat too far right, right up against the panel. A positive x in
     setViewOffset moves the picture left. */
  const EXTRA_LEFT = 34;
  framing.target = -shift + EXTRA_LEFT;
}

/* During the stack flight the shift follows the same progress instead of its
   own fast lerp: otherwise it finished within the first 200 ms, and the model
   first jerked right and only then travelled to the corner. */
export function stepFraming(k, progress, easedProgress){
  if(progress < 1) framing.shift = framing.from + (framing.target - framing.from)*easedProgress;
  else framing.shift += (framing.target - framing.shift)*k;
  if(Math.abs(framing.shift) > 0.4) camera.setViewOffset(innerWidth, innerHeight, framing.shift, 0, innerWidth, innerHeight);
  else camera.clearViewOffset();
  camera.updateProjectionMatrix();
}
