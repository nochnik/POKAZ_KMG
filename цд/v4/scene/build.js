/* Builds the layer stack from the models: three layers bottom-up —
   reservoir (three slabs), well, surface. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { world } from './core.js';
import { LAYERS_BOTTOM_UP } from '../data/zones.js';
import { zoneColor } from '../theme.js';
import { SHORT_SHOW } from '../params.js';
import { createHologram } from './hologram.js';
import { buildTeoBase, buildRankingColumns } from './wellbores.js';
import { buildAccents, buildPipeline, GROUND_LEVEL } from './surface.js';
import { buildWells } from './wells.js';
import { restLayout } from './layout.js';

/* Layers by zone: { reservoir, well, surface }. Empty while models load. */
export const layers = {};

/* Hitboxes — invisible boxes the cursor is raycast against. They live in
   `world`, not in the layer group, so scene/frame.js mirrors the layer's
   offset and scale onto them.

   Live hitboxes move with the layers. While nothing is clicked, the layout
   itself reacts to hover (slight spread), and raycasting against live
   hitboxes loops: the hitbox moves away from the cursor, hover drops, the
   hitbox moves back, hover returns — most visible at the top edge of the top
   layer and the bottom edge of the bottom one. So without a click the cursor
   is tested against static twins — rest hitboxes. They stand in the collapsed
   stack, i.e. where a layer settles on hover (see focusLayout), and in the
   short show in the spread stack. */
export const hitboxes = [];
export const restHitboxes = [];

/* Layer models, loaded straight from .glb (no base64 — less memory, works on
   GitHub Pages). Paths are relative to the page, models sit next to it. The
   top reservoir slab (TEO) is built in code and needs no model. */
const MODEL_FILES = {
  reservoir1: 'пласт_1_ггдм.glb',
  reservoir2: 'пласт_2_стратегия.glb',
  well:       'слой_03_скважина.glb',
  surface:    'слой_04_наземка.glb',
};

const WIDTH = 250;             // every slab is brought to one footprint
const DEPTH = 190;
const WELL_HEIGHT = 56;        // surface keeps its natural height so objects aren't squashed
const RESERVOIR_HEIGHT = 62;   // all three reservoir slabs together
/* Hologram fill — a dark tone of the zone colour. */
const HOLOGRAM_FILL = { reservoir:0x3A280C, well:0x0E2440, surface:0x07251F };

const loader = new GLTFLoader();
const loadModel = file => new Promise((resolve, reject) =>
  loader.load(encodeURIComponent(file), resolve, undefined, reject));

export async function buildStack(){
  // load in parallel — total time ≈ the slowest file, not the sum
  const gltfs = {};
  await Promise.all(Object.entries(MODEL_FILES).map(([id, file]) =>
    loadModel(file).then(gltf => { gltfs[id] = gltf; })));

  const measures = {};
  for(const id in gltfs) measures[id] = measure(id, gltfs[id].scene);
  const bands = layoutBands(measures);
  const restOffsets = SHORT_SHOW ? restLayout(bands) : Object.fromEntries(LAYERS_BOTTOM_UP.map(id => [id, 0]));

  for(const id of LAYERS_BOTTOM_UP){
    const layer = layers[id] = createLayer(id, bands[id]);
    world.add(layer.group);

    if(id === 'reservoir') buildReservoir(layer, measures, restOffsets.reservoir);
    if(id === 'well') buildWellLayer(layer, measures.well);
    if(id === 'surface') buildSurfaceLayer(layer, measures.surface, gltfs.surface.animations);
    addParticles(layer);
    if(id !== 'reservoir') addLayerHitbox(layer, restOffsets[id]);
  }

  // stack centre at the camera target (−40); hitboxes are already in `world` and move with it
  world.position.y = -40 - (bands.surface.top + bands.reservoir.bottom)/2;
}

function createLayer(id, band){
  return {
    id, bottom:band.bottom, top:band.top,
    group: new THREE.Group(),
    physMaterials:[], wireMaterials:[], holograms:[],
    digitized:0,       // 0..1 — layer turned digital (click or open)
    highlight:0,       // 0..1 — layer hovered or clicked: slight enlargement, bores, bits
    offset:0,          // vertical offset within the layout
    corner: new THREE.Vector3(),   // shift towards the mini stack in the corner
    miniScale:1,
    yaw:0,             // mini stack turn around the vertical
    flightFrom:null,   // snapshot at flight start (see startFlight)
    dimming:1,         // < 1 while the pipeline flow runs over the surface layer
  };
}

/* Model size and scale to the footprint. The well is squeezed to WELL_HEIGHT,
   the surface scaled uniformly by the X/Z average. Reservoir slabs get their
   own height scale (see buildReservoir). */
function measure(id, root){
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const sx = WIDTH / size.x, sz = DEPTH / size.z;
  const sy = id === 'surface' ? (sx + sz)/2 : id === 'well' ? WELL_HEIGHT/size.y : 1;
  const height = id === 'surface' ? size.y*sy : id === 'well' ? WELL_HEIGHT : 0;
  return { root, box, size, sx, sy, sz, height };
}

/* Vertical bands: surface from 0 up, the rest downward. A slight overlap
   (well +5, reservoir +8) hides seams at the joints. */
function layoutBands(measures){
  const bands = {
    surface: { bottom:0, top:measures.surface.height },
    well:    { bottom:-measures.well.height, top:0 },
  };
  bands.reservoir = { bottom:bands.well.bottom - RESERVOIR_HEIGHT, top:bands.well.bottom };
  const raise = (band, by) => { band.bottom += by; band.top += by; };
  raise(bands.well, 5);
  raise(bands.reservoir, 8);
  return bands;
}

/* The physical model and its digital wireframe share one hierarchy: the
   wireframe is a child of the original mesh, so per-part transforms and the
   pump-jack animation (PumpCycle in the surface model) apply to both. The old
   way created new meshes from geometry only and lost node transforms — in
   multi-part models every part would land at the origin. */
function addWireframes(root, color, physMaterials, wireMaterials){
  const meshes = [];
  root.traverse(node => { if(node.isMesh) meshes.push(node); });
  for(const mesh of meshes){
    const originals = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const copies = originals.map(material => {
      const copy = material.clone();
      copy.transparent = true;
      physMaterials.push(copy);
      return copy;
    });
    mesh.material = Array.isArray(mesh.material) ? copies : copies[0];

    const wireMaterial = new THREE.MeshBasicMaterial({ color, wireframe:true,
      transparent:true, opacity:0, blending:THREE.AdditiveBlending, depthWrite:false });
    const wire = new THREE.Mesh(mesh.geometry, wireMaterial);
    wire.renderOrder = 1;
    mesh.add(wire);
    wireMaterials.push(wireMaterial);
  }
  return root;
}

/* ── reservoir: three slabs ───────────────────────────────────────────
   Bottom-up: GGDM and development strategy are models; the techno-economic
   evaluation is a computed layer built in code — a bore from each drill point
   with the numbers next to it. Computing and labelling is more accurate in
   code, and the text stays crisp (the model generator can't render Cyrillic). */
function buildReservoir(layer, measures, restOffset){
  const color = zoneColor('reservoir');
  const third = (layer.top - layer.bottom)/3;
  layer.slabs = [];
  ['reservoir1', 'reservoir2', null].forEach((modelId, step) => {
    const bottom = layer.bottom + third*step, top = bottom + third;
    const wrap = new THREE.Group();
    const content = new THREE.Group();
    const physMaterials = [], wireMaterials = [];

    if(modelId){
      const m = measures[modelId];
      const center = m.box.getCenter(new THREE.Vector3());
      const sx = WIDTH/m.size.x, sz = DEPTH/m.size.z, sy = (third - 3)/m.size.y;
      /* Meshes are rebuilt from geometry here: reservoir models are a single
         mesh at the origin, there are no node transforms to lose. */
      m.root.traverse(node => {
        if(!node.isMesh) return;
        const phys = node.material.clone();
        phys.transparent = true;
        content.add(new THREE.Mesh(node.geometry, phys)); physMaterials.push(phys);
        const wire = new THREE.MeshBasicMaterial({ color, wireframe:true, transparent:true,
          opacity:0, blending:THREE.AdditiveBlending, depthWrite:false });
        content.add(new THREE.Mesh(node.geometry, wire)); wireMaterials.push(wire);
      });
      content.scale.set(sx, sy, sz);
      content.position.set(-center.x*sx, bottom - m.box.min.y*sy + 1.5, -center.z*sz);
    } else {
      buildTeoBase(content, physMaterials, bottom, top, WIDTH, DEPTH);
    }
    wrap.add(content);
    const hologram = createHologram(WIDTH, third - 2.5, DEPTH, (top + bottom)/2, color, 9, HOLOGRAM_FILL.reservoir);
    wrap.add(hologram);
    layer.group.add(wrap);

    const hitbox = addHitbox(third, (top + bottom)/2, 'reservoir', step);
    addRestTwin(hitbox, restOffset);
    layer.slabs.push({ wrap, physMaterials, wireMaterials, hologram:hologram.userData.parts,
      bottom, top, hitbox, offset:0, scale:1, digitized:0 });
  });
  layer.columns = buildRankingColumns(layer.group, layer.bottom, layer.top, WIDTH, DEPTH);
}

/* ── well ─────────────────────────────────────────────────────────────
   The layer is turned −90° so the model's black pipes stand under the surface
   pump jacks. The turn swaps axes: width comes from size.z, depth from size.x.
   No extra multiplier here — it made the layer stick 5 % out of its own
   hologram and the neighbouring slabs. */
function buildWellLayer(layer, m){
  const color = zoneColor('well');
  const model = addWireframes(m.root, color, layer.physMaterials, layer.wireMaterials);
  const center = m.box.getCenter(new THREE.Vector3());
  const inner = new THREE.Group();
  inner.position.set(-center.x, 0, -center.z);
  while(model.children.length) inner.add(model.children[0]);
  const turn = new THREE.Group();
  turn.rotation.y = -Math.PI/2;
  turn.add(inner);
  const outer = new THREE.Group();
  outer.add(turn);
  outer.scale.set(WIDTH/m.size.z, m.sy, DEPTH/m.size.x);
  outer.position.set(0, layer.bottom - m.box.min.y*m.sy, 0);
  layer.group.add(outer);

  const hologram = createHologram(WIDTH, layer.top - layer.bottom, DEPTH, (layer.bottom + layer.top)/2, color, 9, HOLOGRAM_FILL.well);
  layer.group.add(hologram);
  layer.holograms.push(hologram.userData.parts);

  /* Casings are searched in the emptied model root: by now their nodes have
     moved into `inner`, the search finds nothing and the fallback coordinates
     in wells.js are used. Same as in v3; the fallbacks were measured on this
     model, so the pipes land in place. */
  buildWells(layer, model);
}

/* ── surface ──────────────────────────────────────────────────────────
   Pump jacks move with the PumpCycle animation from the model itself — in the
   new model they are already split into moving parts. The hologram covers
   only the ground slab; objects above it keep their own wireframe. */
function buildSurfaceLayer(layer, m, animations){
  const color = zoneColor('surface');
  const model = addWireframes(m.root, color, layer.physMaterials, layer.wireMaterials);
  const center = m.box.getCenter(new THREE.Vector3());
  model.scale.set(m.sx, m.sy, m.sz);
  model.position.set(-center.x*m.sx, layer.bottom - m.box.min.y*m.sy, -center.z*m.sz);
  layer.group.add(model);
  if(animations.length){
    layer.mixer = new THREE.AnimationMixer(m.root);
    animations.forEach(clip => layer.mixer.clipAction(clip).play());
  }

  const h = layer.top - layer.bottom;
  const hologram = createHologram(WIDTH, h*0.30, DEPTH, layer.bottom + h*0.10, color, 10, HOLOGRAM_FILL.surface);
  layer.group.add(hologram);
  layer.holograms.push(hologram.userData.parts);
  layer.accents = buildAccents(layer.group, layer.bottom, layer.top);
  /* The pipeline belongs to the "infrastructure" accent but has its own level:
     on the "tank farm and pipeline" step it shows in full, on a bare hover of
     the layer it shows dimmed and alone, without rings or label (see ui/labels.js). */
  layer.pipeline = buildPipeline(layer.group, layer.bottom + h*GROUND_LEVEL - 5);
}

/* Data particles inside a layer — rise while the layer is digitized. */
function addParticles(layer){
  const count = 130, h = layer.top - layer.bottom;
  const positions = new Float32Array(count*3), seeds = new Float32Array(count*2);
  for(let i = 0; i < count; i++){
    positions[i*3]   = (Math.random() - 0.5)*WIDTH*0.96;
    positions[i*3+1] = layer.bottom + Math.random()*h;
    positions[i*3+2] = (Math.random() - 0.5)*DEPTH*0.96;
    seeds[i*2]   = Math.random()*h;          // start height
    seeds[i*2+1] = 4 + Math.random()*10;     // rise speed
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({ color:zoneColor(layer.id), size:2.4,
    transparent:true, opacity:0, blending:THREE.AdditiveBlending, depthWrite:false });
  layer.group.add(new THREE.Points(geometry, material));
  layer.particles = { geometry, material, seeds, count };
}

function addHitbox(height, centerY, zoneId, step = null){
  const hitbox = new THREE.Mesh(new THREE.BoxGeometry(WIDTH, height, DEPTH),
    new THREE.MeshBasicMaterial({ visible:false }));
  hitbox.position.y = centerY;
  hitbox.userData.zone = zoneId;
  if(step !== null) hitbox.userData.step = step;
  world.add(hitbox);
  hitboxes.push(hitbox);
  return hitbox;
}

function addRestTwin(hitbox, offset){
  const twin = hitbox.clone();
  twin.position.y += offset;
  world.add(twin);
  restHitboxes.push(twin);
}

function addLayerHitbox(layer, restOffset){
  layer.hitbox = addHitbox(layer.top - layer.bottom, (layer.bottom + layer.top)/2, layer.id);
  addRestTwin(layer.hitbox, restOffset);
}
