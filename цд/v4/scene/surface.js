/* Accents on the surface-infrastructure layer: rings around digitised
   objects and the pipeline with running flow.

   The surface model is a single mesh; individual objects can't be picked out
   of it. So they are ringed from above — rings at coordinates taken from the
   top view, plus an HTML label (v4.html, .surface-label). That shows what
   exactly is digitised at each step of the zone. */
import * as THREE from 'three';

/* Keys follow the zone steps: step 0 — infrastructure (tank farm and
   pipeline), step 1 — production (producing wells). */
export const SURFACE_OBJECTS = {
  infrastructure: {
    rings:[[54, -55, 34]],                          // x, z, radius
    anchor:[54, -55],
  },
  production: {
    rings:[[-64, 41, 24], [0, 41, 24], [64, 41, 24]],
    anchor:[0, 41],
  },
};

/* Amber, not the zone's teal: on the teal hologram same-colour markings
   merged and the object stopped reading. */
const RING_COLOR = '#FFB020';

/* Fraction of the layer height where the field ground is. The top of the band
   is the top of tall objects, not the ground: rings up there would float in
   the air and look shifted relative to the objects in isometry. */
export const GROUND_LEVEL = 0.34;

export function buildAccents(group, bottom, top){
  const accents = {};
  const y = bottom + (top - bottom)*GROUND_LEVEL + 2;
  Object.keys(SURFACE_OBJECTS).forEach((key, step) => {
    const object = SURFACE_OBJECTS[key];
    const nodes = [];
    const material = new THREE.MeshBasicMaterial({ color:RING_COLOR, transparent:true, opacity:0,
      depthTest:false, depthWrite:false });

    for(const [x, z, r] of object.rings){
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 1.1, 8, 40), material);
      ring.rotation.x = Math.PI/2;
      ring.position.set(x, y, z);
      ring.renderOrder = 7;
      group.add(ring); nodes.push(ring);
      // ticks around the ring — reads as "object under control"
      for(let i = 0; i < 4; i++){
        const a = i/4*Math.PI*2 + Math.PI/4;
        const tick = new THREE.Mesh(new THREE.BoxGeometry(r*0.22, 1.1, 2.2), material);
        tick.position.set(x + Math.cos(a)*r, y, z + Math.sin(a)*r);
        tick.rotation.y = -a;
        tick.renderOrder = 7;
        group.add(tick); nodes.push(tick);
      }
    }
    const anchor = new THREE.Object3D();
    anchor.position.set(object.anchor[0], y + 16, object.anchor[1]);
    group.add(anchor);
    accents[key] = { materials:[material], nodes, anchor, step, visibility:0 };
  });
  return accents;
}

/* ── pipeline with running flow ───────────────────────────────────────
   Belongs to the "tank farm and pipeline" accent: from each station a branch
   runs to the road corridor (z = −2, where the model has the route), the
   trunk line collects them and a spur goes into the tank farm. The route used
   to be a flat strip on the ground — a 3D pipe reads better.

   Amber slugs run from the wellheads to storage, bright head first. The flow
   is a texture, not particles: same trick as the hologram grid — shifting
   offset.x every frame. Pattern repeat is proportional to segment length, so
   slug speed is the same on branches and the trunk. */
const SEGMENTS = [                    // [from] → [to], along the flow; tie-ins don't overlap
  [[-74.8, 40], [-74.8, -2]],         // branches from the three stations
  [[  2.5, 40], [  2.5, -2]],
  [[ 74.4, 40], [ 74.4, -2]],
  [[-74.8, -2], [ 54,   -2]],         // trunk from both sides to the spur
  [[ 74.4, -2], [ 54,   -2]],
  [[ 54,   -2], [ 54,  -24]],         // spur into the tank farm
];
const SLUG_PERIOD = 20;               // scene units

/* The pipe looks the same on hover and on the step: dark casing with running
   slugs. Tried a digital violet pipe without flow on hover — read worse: a
   pipe without oil stops being a pipe and becomes one more glowing line. The
   casing is dark and opaque rather than glowing: it covers the layer
   wireframe behind it, so the slugs read on it instead of drowning in the mesh. */
const CASING_COLOR = '#1A1006';

function slugCanvas(){
  // transparent tail, hot head in the direction of travel (+u of the texture)
  const canvas = document.createElement('canvas');
  canvas.width = 128; canvas.height = 16;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(6, 0, 78, 0);
  gradient.addColorStop(0, 'rgba(255,176,32,0)');
  gradient.addColorStop(0.55, 'rgba(255,178,32,0.9)');
  gradient.addColorStop(0.9, '#FFD87A');
  gradient.addColorStop(1, '#FFF4D6');
  ctx.fillStyle = gradient;
  ctx.fillRect(6, 2, 72, 12);
  return canvas;
}

export function buildPipeline(group, y){
  const casingMaterial = new THREE.MeshBasicMaterial({ color:CASING_COLOR,
    transparent:true, opacity:0, depthTest:false, depthWrite:false });
  const canvas = slugCanvas();

  const nodes = [], flowMaterials = [], textures = [];
  for(const [[x1, z1], [x2, z2]] of SEGMENTS){
    const length = Math.hypot(x2 - x1, z2 - z1);
    const axis = new THREE.LineCurve3(new THREE.Vector3(x1, y, z1), new THREE.Vector3(x2, y, z2));
    const casing = new THREE.Mesh(new THREE.TubeGeometry(axis, 1, 2.2, 10, false), casingMaterial);
    casing.renderOrder = 7;
    group.add(casing); nodes.push(casing);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(Math.max(1, Math.round(length / SLUG_PERIOD)), 1);
    const flowMaterial = new THREE.MeshBasicMaterial({ map:texture, transparent:true, opacity:0,
      blending:THREE.AdditiveBlending, depthTest:false, depthWrite:false });
    const flow = new THREE.Mesh(new THREE.TubeGeometry(axis, 1, 2.45, 10, false), flowMaterial);
    flow.renderOrder = 8;
    group.add(flow); nodes.push(flow);
    flowMaterials.push(flowMaterial); textures.push(texture);
  }
  return { nodes, casingMaterial, flowMaterials, textures, visibility:0 };
}
