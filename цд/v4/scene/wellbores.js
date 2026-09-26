/* Wellbores: the path of a single bore and the drill-point ranking columns of
   the techno-economic evaluation (TEO). */
import * as THREE from 'three';
import { DRILL_POINTS, isHorizontal } from '../data/drill-points.js';
import { wellboreColor } from '../theme.js';

/* Bore path. Vertical — a straight segment. Horizontal — vertical part, a
   quarter-circle build-up and a lateral along the reservoir; the build-up sits
   in the bottom slab (GGDM), because the bore has to turn exactly where the
   saturation map puts the target. `point.azimuth` (radians) also spreads the
   laterals so they don't lie on top of each other. */
export function wellborePath(point, x, z, bottom, top, radius = 34, lateral = 46){
  const points = [new THREE.Vector3(x, top, z)];
  if(!isHorizontal(point)){
    points.push(new THREE.Vector3(x, bottom, z));
    return new THREE.CatmullRomCurve3(points);
  }
  const dx = Math.cos(point.azimuth), dz = Math.sin(point.azimuth);
  const kickoff = bottom + radius;                 // vertical above, build-up below
  points.push(new THREE.Vector3(x, kickoff, z));
  /* A deliberately large radius: a small one reads as a knee, while a real
     build-up takes metres of angle gain — a long soft curve, not a corner.
     Twenty steps on the arc: with ten the faceting shows. */
  for(let i = 1; i <= 20; i++){
    const a = (Math.PI/2) * (i/20);
    points.push(new THREE.Vector3(x + dx*radius*(1 - Math.cos(a)),
                                  kickoff - radius*Math.sin(a),
                                  z + dz*radius*(1 - Math.cos(a))));
  }
  /* The lateral gets four points, not one far end: Catmull-Rom pulls the curve
     through its control points, and a dense arc followed by a lone far point
     made the lateral hump. */
  for(let i = 1; i <= 4; i++){
    const s = radius + lateral*i/4;
    points.push(new THREE.Vector3(x + dx*s, bottom, z + dz*s));
  }
  return new THREE.CatmullRomCurve3(points);
}

/* Base slab of the TEO step. The columns themselves live one level up, in the
   whole reservoir group (see buildRankingColumns). */
export function buildTeoBase(group, physMaterials, bottom, top, width, depth){
  const material = new THREE.MeshStandardMaterial({ color:'#B9AE93', roughness:0.96, metalness:0.02, transparent:true });
  const slab = new THREE.Mesh(new THREE.BoxGeometry(width, (top - bottom) - 3, depth), material);
  slab.position.y = (bottom + top)/2;
  group.add(slab);
  physMaterials.push(material);
}

/* Two height bands instead of one common staircase.

   All eight columns used to rise in even 4-unit steps, and while rotating,
   neighbouring tops kept meeting at one screen point — a column hid behind
   another, which read as a build error rather than a ranking. Now horizontals
   take the upper band, directional wells the lower one, with a gap between
   and a doubled step inside the lower band. Height still tells the return;
   the scale is simply split by bore type: horizontal drilling is not "a bit
   better", it is a different decision.

   Anchored to the TEO step, not the whole layer. TEO is the top third of the
   reservoir (0.67–1.0 of its height) and the columns stand around it: the
   tallest pokes slightly above its top, the shortest dips slightly below its
   base. Earlier the columns rose far above the layer and, with the stack
   spread, climbed into the well zone; then they sank into the reservoir
   entirely.

   Fractions, not absolute units: if the model height changes, the anchoring holds. */
const HEIGHT_BANDS = {
  horizontal: { base:1.03, span:0.07 },   // upper band: just above the TEO top
  directional:{ base:0.67, span:0.28 },   // lower band: from the TEO base inward
};

/* Ranking columns. They live in the whole reservoir group, not in the TEO
   slab: they start in GGDM — where the saturation map shows the red and green
   zones — and run through all three steps. When the steps part, the columns
   stay put and pierce the stack, showing the link
   "reserves → measure → effect".

   Returns materials and nodes (driven by scene/frame.js) and anchors — column
   tops for the HTML labels (ui/labels.js). */
export function buildRankingColumns(group, layerBottom, layerTop, width, depth){
  const columns = { materials:[], nodes:[], anchors:[], visibility:0 };
  const third = (layerTop - layerBottom)/3;
  const bottom = layerBottom + third*0.28 - 8;     // inside GGDM (shifted down by 8), at the saturation zones

  // rank range per band, otherwise editing the data would shift the scale
  const bandOf = point => isHorizontal(point) ? 'horizontal' : 'directional';
  const ranges = {};
  for(const point of DRILL_POINTS){
    const range = ranges[bandOf(point)] ??= { min:point.rank, max:point.rank };
    range.min = Math.min(range.min, point.rank);
    range.max = Math.max(range.max, point.rank);
  }

  for(const point of DRILL_POINTS){
    const range = ranges[bandOf(point)], band = HEIGHT_BANDS[bandOf(point)];
    const share = 1 - (point.rank - range.min) / Math.max(1, range.max - range.min);   // 1 = best in band
    const top = layerBottom + (layerTop - layerBottom)*(band.base + band.span*share);  // return reads as height
    const color = new THREE.Color(wellboreColor(isHorizontal(point)));
    const x = point.x * width, z = point.z * depth;

    /* Each column is drawn twice. The solid pass uses normal depth: slabs
       occlude it, and in isometry it clearly enters the layer. On top goes a
       faint see-through copy so the path also reads inside the stack. A single
       always-on-top pass looked like a sticker.

       depthWrite must be off: transparent materials write depth by default,
       and a column at zero opacity kept writing it — black stripes of future
       columns showed through neighbouring slabs. */
    const solid = new THREE.MeshStandardMaterial({ color, roughness:0.3, metalness:0.3,
      transparent:true, opacity:0, emissive:color, emissiveIntensity:0.45, depthWrite:false });
    const seeThrough = new THREE.MeshBasicMaterial({ color, transparent:true, opacity:0,
      depthTest:false, depthWrite:false });

    /* A tube along a curve rather than a cylinder: horizontal bores are not
       straight, and one path must serve both passes. */
    const path = wellborePath(point, x, z, bottom, top);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(path, 64, 1.7, 10, false), solid);
    group.add(tube);
    // the see-through copy is slightly thinner — reads as a trace inside the rock
    const trace = new THREE.Mesh(new THREE.TubeGeometry(path, 64, 1.36, 10, false), seeThrough);
    trace.renderOrder = 5;
    group.add(trace);

    /* Shoe at the bottom and ball at the top, also in two passes. A single
       solid pass hides them: the top sits inside a step and the slab covers
       the ball completely. */
    const twoPass = (geometry, position, rotation) => {
      const meshes = [new THREE.Mesh(geometry, solid), new THREE.Mesh(geometry, seeThrough)];
      for(const mesh of meshes){
        mesh.position.copy(position);
        if(rotation) mesh.quaternion.copy(rotation);
        group.add(mesh);
      }
      meshes[1].renderOrder = 6;                   // after the tube, so the ends read on top of it
      return meshes;
    };
    const bottomPoint = path.getPoint(1), tangent = path.getTangent(1).normalize();
    const shoeRotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);
    const shoes = twoPass(new THREE.ConeGeometry(3.6, 7, 14), bottomPoint, shoeRotation);
    const balls = twoPass(new THREE.SphereGeometry(2.8, 14, 12), new THREE.Vector3(x, top, z), null);

    const anchor = new THREE.Object3D();
    anchor.position.set(x, top, z);
    group.add(anchor);

    columns.materials.push(solid, seeThrough);
    columns.nodes.push(tube, trace, ...shoes, ...balls);
    columns.anchors.push({ point, anchor });
  }
  return columns;
}
