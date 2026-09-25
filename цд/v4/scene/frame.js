/* One frame of layer life: where layers move, how digitized they are, how
   the bits spin and the particles rise.

   Everything smooth here uses one "chasing" lerp with factor k (see main.js),
   except the flight into the corner — that one is time-based (layout.js).

   Two values per layer:
     digitized — the layer is turned digital: the physical model fades, the
       wireframe and hologram appear. Rises on click only. Hover used to start
       the hologram too, and quick mouse movement made the slide flicker.
     highlight — the layer is hovered or clicked: slight enlargement, well
       bores and bits, TEO columns. Earlier, hovering the well layer showed
       nothing, so the presenter had to click just to point at the drilling —
       and a click turns the whole layer into a hologram. */
import * as THREE from 'three';
import { state, selection, activeZone } from '../state.js';
import { cameraAzimuth } from './core.js';
import { layers, hitboxes } from './build.js';
import { restLayout, focusLayout, miniLayout, miniStackOffset, MINI,
         flightProgress, easeInOutCubic, angleDelta } from './layout.js';

const VERTICAL = new THREE.Vector3(0, 1, 0);
const ZERO = new THREE.Vector3();
const miniOffset = new THREE.Vector3();

function layoutTargets(){
  const active = activeZone();
  if(state.openZone) return miniLayout(layers, state.hoveredZone);
  if(active) return focusLayout(layers, active, Boolean(state.selectedZone));
  return restLayout(layers);
}

/**
 * @param dt seconds since last frame, t seconds since start, k lerp factor
 * @returns flight progress (the frame shift needs it too, see camera-rig.js)
 */
export function stepLayers(dt, t, k){
  const inFlight = Boolean(state.openZone || state.closingZone);
  const progress = flightProgress(inFlight);
  const easedProgress = easeInOutCubic(progress);
  if(!hitboxes.length) return { progress, easedProgress };   // models still loading

  const offsets = layoutTargets();
  const mini = state.openZone !== null;
  if(mini) miniStackOffset(miniOffset);
  const target = {
    corner: mini ? miniOffset : ZERO,
    miniScale: mini ? MINI.scale : 1,
    yaw: mini ? cameraAzimuth() : 0,     // the mini stack faces the camera with the same side
  };
  const pulse = 0.72 + 0.28*Math.sin(t*3.1);

  for(const id in layers){
    const layer = layers[id];
    stepPosition(layer, offsets[id], target, k, progress, easedProgress);
    stepDigitization(layer, k);
    paintLayer(layer, dt, pulse);
    if(layer.producingMaterials) stepWells(layer, t);
    if(layer.slabs) stepReservoir(layer, dt, t, k, pulse);
    stepParticles(layer, t);
    // enlargement on highlight; mini scale on top of it
    layer.group.scale.setScalar((1 + 0.05*layer.highlight) * layer.miniScale);
  }
  return { progress, easedProgress };
}

/* ── position ─────────────────────────────────────────────────────────
   While content is open, the whole stack is a miniature in the bottom-left
   corner: three layers together, one piece, and clicking one of them opens
   another layer. */
function stepPosition(layer, targetOffset, target, k, progress, easedProgress){
  if(progress < 1 && layer.flightFrom){
    const from = layer.flightFrom, p = easedProgress;
    layer.offset = from.offset + (targetOffset - from.offset)*p;
    layer.corner.set(from.x + (target.corner.x - from.x)*p, from.y + (target.corner.y - from.y)*p, from.z + (target.corner.z - from.z)*p);
    layer.miniScale = from.scale + (target.miniScale - from.scale)*p;
    layer.yaw = from.yaw + angleDelta(from.yaw, target.yaw)*p;
  } else {
    layer.offset += (targetOffset - layer.offset)*k;
    layer.corner.lerp(target.corner, k);
    layer.miniScale += (target.miniScale - layer.miniScale)*k;
    layer.yaw += angleDelta(layer.yaw, target.yaw)*k;
  }
  layer.group.position.set(layer.corner.x, layer.offset + layer.corner.y, layer.corner.z);
  if(Math.abs(layer.yaw) > 0.0004) layer.group.quaternion.setFromAxisAngle(VERTICAL, layer.yaw);
  else layer.group.quaternion.identity();
  if(layer.hitbox) placeHitbox(layer, layer.hitbox, (layer.bottom + layer.top)/2);
}

/* A hitbox lives in `world`, not in the layer group, and doesn't inherit its
   offset or scale — mirrored by hand, otherwise the mini stack couldn't be
   clicked: the ray would look for the layer where it used to be. */
function placeHitbox(layer, hitbox, centerY){
  const s = Math.max(layer.miniScale, 0.001);
  hitbox.position.set(layer.corner.x, centerY*s + layer.offset + layer.corner.y, layer.corner.z);
  hitbox.scale.setScalar(s);
  hitbox.rotation.y = layer.yaw;
}

/* In the mini stack only the open layer is digitized, the rest stay physical;
   highlight there belongs to the hovered layer only. */
function stepDigitization(layer, k){
  const { openZone, selectedZone, hoveredZone } = state;
  const targetDigitized = openZone ? (layer.id === openZone ? 1 : 0) : (layer.id === selectedZone ? 1 : 0);
  const targetHighlight = openZone ? (layer.id === hoveredZone ? 1 : 0) : (layer.id === activeZone() ? 1 : 0);
  layer.digitized += (targetDigitized - layer.digitized)*k;
  layer.highlight = openZone && !hoveredZone ? 0 : layer.highlight + (targetHighlight - layer.highlight)*k;
}

const scrollGrid = (texture, amount) =>
  texture.offset.x = ((texture.offset.x - amount) % 1 + 1) % 1;   // wrapped so the float doesn't grow

function paintLayer(layer, dt, pulse){
  const m = layer.digitized;
  for(const material of layer.physMaterials) material.opacity = 1 - m*0.9;
  for(const material of layer.wireMaterials) material.opacity = 0.5*m*pulse*layer.dimming;
  for(const parts of layer.holograms){
    parts.fill.material.opacity = 0.28*m;
    parts.grid.material.opacity = 0.6*m*pulse;
    scrollGrid(parts.grid.material.map, dt*0.05*m);
    parts.edges.material.opacity = 0.9*m;
    parts.corners.material.opacity = m;
  }
}

/* Bores don't fade with the layer — they light up: the producing one violet,
   the ones being drilled steel. Bits spin and lift cuttings; on the lateral the
   bit follows the bore and cuttings travel back to the wellhead. */
function stepWells(layer, t){
  const h = layer.highlight;
  for(const material of layer.producingMaterials){
    material.opacity = h*0.85;
    material.emissiveIntensity = h*(2.2 + 0.8*Math.sin(t*3.4));
  }
  for(const material of layer.drillingMaterials) material.opacity = h*0.7;
  for(const bit of [layer.drillBit, layer.lateralDrillBit]){
    if(!bit) continue;
    for(const material of bit.materials) material.opacity = h;
    bit.cones.rotation.y = t*2.6;
    const dust = bit.dust, positions = dust.geometry.attributes.position;
    for(let i = 0; i < dust.count; i++) positions.setY(i, (dust.seeds[i] + t*7) % dust.height);
    positions.needsUpdate = true;
    dust.material.opacity = h*0.6;
  }
}

/* ── reservoir ────────────────────────────────────────────────────────
   The three slabs part slightly while the reservoir is active. The chosen slab
   stays in place and grows, its neighbours move noticeably farther and shrink
   a little. */
function stepReservoir(layer, dt, t, k, pulse){
  const { openZone, selectedZone, hoveredZone, hoveredStep } = state;
  const active = openZone ? hoveredZone === 'reservoir' : activeZone() === 'reservoir';
  const step = openZone
    ? (hoveredZone === 'reservoir' ? hoveredStep : null)
    : (selectedZone === 'reservoir' ? selection.step : (hoveredZone === 'reservoir' ? hoveredStep : null));

  /* Ranking columns come with the TEO slab (step 2). Not in the mini stack —
     without labels they are just sticks there. Hidden columns leave the render
     entirely: otherwise they still take part in the transparency pass and
     smear the neighbouring layers. */
  const columns = layer.columns;
  columns.visibility += ((step === 2 && !openZone ? 1 : 0) - columns.visibility)*k;
  const visible = columns.visibility > 0.02;
  for(const node of columns.nodes) node.visible = visible;
  if(visible) for(const material of columns.materials){
    const seeThrough = material.depthTest === false;   // the faint copy inside the rock
    material.opacity = (seeThrough ? 0.58 : 0.95) * columns.visibility;
    if(!seeThrough) material.emissiveIntensity = 0.45 + 0.3*Math.sin(t*3);
  }

  layer.slabs.forEach((slab, index) => {
    let targetOffset = 0;
    if(active){
      const base = index === 0 ? -8 : index === 2 ? 8 : 0;   // 0 — bottom, 2 — top
      targetOffset = step === null || index === step ? base
                   : base + (index < step ? -1 : 1) * 34 * Math.abs(index - step);
    }
    slab.offset += (targetOffset - slab.offset)*k;
    const targetScale = !active || step === null ? 1 : (index === step ? 1.22 : 0.93);
    slab.scale += (targetScale - slab.scale)*k;
    const center = (slab.top + slab.bottom)/2;
    slab.wrap.scale.setScalar(slab.scale);
    slab.wrap.position.y = slab.offset + center*(1 - slab.scale);   // grows from its own centre
    placeHitbox(layer, slab.hitbox, center + slab.offset);

    const targetDigitized = active ? (step === null || step === index ? 1 : 0.4) : 0;
    slab.digitized += (targetDigitized - slab.digitized)*k;
    const m = slab.digitized;
    /* The top-face map is the slab's content itself: the GGDM grid, the
       flooding map. For the development strategy (step 1) it is the main thing
       to see, so its hologram is dimmed harder and the model fades less. */
    const dim = index === 1 ? 0.32 : 1;
    for(const material of slab.physMaterials) material.opacity = 1 - m*(index === 1 ? 0.18 : 0.45);
    for(const material of slab.wireMaterials) material.opacity = 0.32*m*pulse*dim;
    const parts = slab.hologram;
    parts.fill.material.opacity = 0.12*m*dim;
    parts.grid.material.opacity = 0.45*m*pulse*dim;
    scrollGrid(parts.grid.material.map, dt*0.05*m);
    parts.edges.material.opacity = 0.9*m*(index === 1 ? 0.6 : 1);
    parts.corners.material.opacity = m*dim;
  });
}

/* Data particles rise inside a digitized layer. */
function stepParticles(layer, t){
  const particles = layer.particles, m = layer.digitized;
  if(m <= 0.02){ particles.material.opacity = 0; return; }
  const positions = particles.geometry.attributes.position, h = layer.top - layer.bottom;
  for(let i = 0; i < particles.count; i++){
    positions.setY(i, layer.bottom + ((particles.seeds[i*2] + t*particles.seeds[i*2+1]) % h));
  }
  positions.needsUpdate = true;
  particles.material.opacity = 0.85*m;
}

/* ── surface accents ──────────────────────────────────────────────────
   Step 0 rings the tank farm and runs the pipeline flow, step 1 rings the
   producing wells; only the chosen set is shown. Runs after the render, like
   the labels, and returns the active accent for the HTML label.

   Hovering the bare surface layer (no step) brings out the pipeline alone,
   dimmed, while the field stays physical: the presenter points and sees what
   is in the twin here instead of the whole slab in wireframe — that is a
   separate step of the story. Rings and labels don't show on hover: they
   belong to the steps. */
const PIPELINE_ON_HOVER = 0.85;      // share of full brightness on the preview
const ACCENT_KEYS = ['infrastructure', 'production'];   // in step order

export function stepSurfaceAccents(k, t){
  const layer = layers.surface;
  if(!layer) return null;
  const { selectedZone, hoveredZone, hoveredStep } = state;
  const step = selectedZone === 'surface' ? selection.step
             : (hoveredZone === 'surface' ? hoveredStep : null);
  const bareHover = selectedZone !== 'surface' && hoveredZone === 'surface' && hoveredStep == null;

  let activeAccent = null;
  ACCENT_KEYS.forEach((key, index) => {
    const accent = layer.accents[key];
    const wanted = step === index ? 1 : 0;
    accent.visibility += (wanted - accent.visibility)*k;
    const visible = accent.visibility > 0.02;
    for(const node of accent.nodes) node.visible = visible;
    for(const material of accent.materials) material.opacity = accent.visibility * (0.55 + 0.45*Math.abs(Math.sin(t*2.2)));
    if(wanted) activeAccent = accent;
  });

  /* Pipeline: slugs run by texture offset, one speed for all segments, from
     the wellheads to the tank farm. Full level on the "tank farm and pipeline"
     step, dimmed on a bare hover of the layer. */
  const pipeline = layer.pipeline;
  const wanted = step === 0 ? 1 : (bareHover ? PIPELINE_ON_HOVER : 0);
  pipeline.visibility += (wanted - pipeline.visibility)*k;
  const v = pipeline.visibility;
  const visible = v > 0.02;
  for(const node of pipeline.nodes) node.visible = visible;
  pipeline.casingMaterial.opacity = v * 0.85;
  for(const material of pipeline.flowMaterials) material.opacity = v;
  for(const texture of pipeline.textures) texture.offset.x = -(t * 2.2) % 1;
  /* The layer wireframe yields to the flow only on the chosen step. On hover
     there is nothing to dim: the layer isn't digitized. */
  layer.dimming = 1 - (step === 0 ? v : 0) * 0.72;

  return activeAccent;
}
