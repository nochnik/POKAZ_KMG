/* Well layer extras: light casing over the model's three black pipes,
   drilling in the centre and a horizontal lateral on the right.

   All of it starts transparent and fades in with the layer highlight (hover
   or click) — see scene/frame.js. */
import * as THREE from 'three';
import { wellborePath } from './wellbores.js';
import { buildDrillBit } from './drill-bit.js';

const CASING_NODES = ['Well_01_hollow_casing','Well_02_hollow_casing','Well_03_hollow_casing'];
const PIPE_RADIUS = 4.2;
const DRILLING = 1;        // middle well is being drilled
const HORIZONTAL = 2;      // right well — horizontal lateral

/* The casings are separate model nodes. Their actual bounds are taken after
   centring, rotation and layer scale: the former hard-coded coordinates
   belonged to an old model, and the light pipes stood next to the black ones. */
function findCasings(model, bottom, top){
  let casings = CASING_NODES.map(name => {
    const node = model.getObjectByName(name);
    if(!node) return null;
    const box = new THREE.Box3().setFromObject(node);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    return { x:center.x, z:center.z, y0:box.min.y, y1:box.max.y, rx:size.x/2, rz:size.z/2 };
  }).filter(Boolean);
  /* Some exporters rename reused nodes. Fallback coordinates were measured on
     the same model after the same rotation and scale, so drilling doesn't
     disappear with such an export. */
  if(casings.length !== 3) casings = [
    { x:-77.5, z:92.3, y0:bottom, y1:top, rx:4.87, rz:2.68 },
    { x:  0.2, z:92.3, y0:bottom, y1:top, rx:4.87, rz:2.68 },
    { x: 78.0, z:92.3, y0:bottom, y1:top, rx:4.87, rz:2.68 },
  ];
  return casings.sort((a, b) => a.x - b.x);
}

/**
 * Adds the well extras. Writes into `layer`:
 *   producingMaterials — violet casing of the producing well
 *   drillingMaterials  — steel casing of the wells being drilled (no violet:
 *                        violet means the producing stock)
 *   drillBit, lateralDrillBit — the bits; lateral — anchor of the lateral label
 * @param model  model root the casing nodes are searched in
 */
export function buildWells(layer, model){
  const { group, bottom, top } = layer;
  group.updateMatrixWorld(true);
  layer.producingMaterials = [];
  layer.drillingMaterials = [];

  findCasings(model, bottom, top).forEach((casing, index) => {
    const { x, z, y0, y1, rx, rz } = casing;
    const beingDrilled = (index === DRILLING || index === HORIZONTAL);
    const material = beingDrilled
      ? new THREE.MeshStandardMaterial({ color:'#9AA5B4', roughness:0.5, metalness:0.25,
          transparent:true, opacity:0, emissive:new THREE.Color('#38414F'), emissiveIntensity:0.4,
          depthTest:false, depthWrite:false })
      : new THREE.MeshStandardMaterial({ color:'#9B7BE8', roughness:0.35, metalness:0.2,
          transparent:true, opacity:0, emissive:new THREE.Color('#9B7BE8'), emissiveIntensity:0,
          depthTest:false, depthWrite:false });
    (beingDrilled ? layer.drillingMaterials : layer.producingMaterials).push(material);

    /* Full light casing over the black one. A small uniform X/Z margin (×1.18)
       puts it on top without z-fighting, keeping the centre and the ellipse. */
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, y1 - y0, 20), material);
    sleeve.scale.set(rx*1.18, 1, rz*1.18);
    sleeve.position.set(x, (y0 + y1)/2, z);
    sleeve.renderOrder = 6;
    group.add(sleeve);
    for(const share of [0.25, 0.6]){
      const collar = new THREE.Mesh(new THREE.TorusGeometry(rx*1.28, Math.max(.55, rx*.13), 8, 22), material);
      collar.scale.z = rz/rx;
      collar.rotation.x = Math.PI/2;
      collar.position.set(x, y0 + (y1 - y0)*share, z);
      group.add(collar);
    }

    if(index === DRILLING) buildVerticalDrilling(layer, casing, material);
    if(index === HORIZONTAL) buildHorizontalDrilling(layer, casing);
  });
}

/* The bit sits just below the layer base, in the gap where it is visible;
   cuttings rise along the bore to the layer top.

   A straight extension joins the casing and the bit body. Earlier the body
   started right under the pipe and formed a "mushroom"; an even older long
   stem poked above the layer. The extension avoids both and stays on the axis
   of the model node. */
function buildVerticalDrilling(layer, casing, material){
  const { x, z, y0, rx, rz } = casing;
  const EXTENSION = 22;
  const extension = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, EXTENSION, 20), material);
  extension.scale.set(rx*1.18, 1, rz*1.18);
  extension.position.set(x, y0 - EXTENSION/2, z);
  extension.renderOrder = 6;
  layer.group.add(extension);

  const radius = PIPE_RADIUS*2.3;
  const bitY = y0 - EXTENSION - radius*2.25 + 1;   // body top is 2.25R above the bit group origin
  layer.drillBit = buildDrillBit(layer.group, x, bitY, z, radius, (layer.top - layer.bottom) + 12, null, true);
}

/* Horizontal lateral — the second well being drilled. One curve from the
   bottom of the casing: long build-up and a lateral with its own bit.

   Everything stays within the layer band. The first version dropped the
   build-up forty-odd units below the base — the bore fell into the reservoir
   slab, its geometry swallowed it, and with the stack spread it hung in mid-air.

   Heading is exactly along the front face of the block (−X). Pointing it "into
   depth" looked like a stub: the lateral ran away from the camera and the
   angle ate its length. Along the face it shows in profile, like on a cross
   section, and doesn't run into the neighbouring bores. */
function buildHorizontalDrilling(layer, casing){
  const { x, z, y0 } = casing;
  const material = new THREE.MeshStandardMaterial({ color:'#9AA5B4', roughness:0.5, metalness:0.25,
    transparent:true, opacity:0, emissive:new THREE.Color('#38414F'), emissiveIntensity:0.45,
    depthWrite:false });
  layer.drillingMaterials.push(material);

  const path = wellborePath({ azimuth:Math.PI }, x, z, y0 - 28, y0, 28, 30);
  layer.group.add(new THREE.Mesh(new THREE.TubeGeometry(path, 96, PIPE_RADIUS*1.18, 12, false), material));

  // the bit follows the tangent: it drills into the reservoir instead of hanging across the bore
  const end = path.getPoint(1), heading = path.getTangent(1).normalize();
  layer.lateralDrillBit = buildDrillBit(layer.group, end.x, end.y, end.z, PIPE_RADIUS*2.1, 46, heading, true);

  // label anchor on the lateral part, where it can't be mistaken for anything else
  const anchor = new THREE.Object3D();
  anchor.position.copy(path.getPoint(0.82));
  layer.group.add(anchor);
  layer.lateral = { anchor };
}
