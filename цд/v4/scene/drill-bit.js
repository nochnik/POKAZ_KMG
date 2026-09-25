/* Tricone drill bit at the bottom of a bore: shows that drilling is happening
   right now. Built from primitives rather than a model so it spins and sits
   exactly on the bore axis. Materials start transparent; scene/frame.js fades
   them in with the well layer highlight. */
import * as THREE from 'three';

/**
 * @param group        parent group
 * @param x, y, z      bit position
 * @param radius       body radius
 * @param cuttingsHeight how high the cuttings rise
 * @param direction    drilling direction. Down by default; on a horizontal bore
 *   the tangent at the bottom is passed and the whole bit turns with it.
 *   Cuttings then travel back along the bore, not "up" — as in the field,
 *   where drilled rock is carried back to the wellhead.
 * @param noStem       skip the drill stem
 */
export function buildDrillBit(group, x, y, z, radius, cuttingsHeight, direction, noStem){
  const R = radius;
  const bit = new THREE.Group();
  bit.position.set(x, y, z);
  if(direction) bit.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), direction.clone().normalize());
  group.add(bit);

  /* Drawn over the slabs (depthTest off): the bottom hole is hidden inside
     the stack, yet that is exactly what must be shown. Low metalness: the
     scene has no environment map, so high-metalness steel has nothing to
     reflect and turns into a black silhouette. */
  const steel = new THREE.MeshStandardMaterial({ color:'#AEB8C6', roughness:0.45, metalness:0.25,
    transparent:true, opacity:0, emissive:new THREE.Color('#3A4658'), emissiveIntensity:0.5,
    depthTest:false, depthWrite:false });
  const toothMaterial = new THREE.MeshStandardMaterial({ color:'#E8C87A', roughness:0.3, metalness:0.7,
    transparent:true, opacity:0, emissive:new THREE.Color('#8A6A20'), emissiveIntensity:0.35,
    depthTest:false, depthWrite:false });

  const body = new THREE.Mesh(new THREE.CylinderGeometry(R*0.86, R*0.98, R*1.5, 16), steel);
  body.position.y = R*1.5;
  body.renderOrder = 6;
  bit.add(body);

  /* Drill stem up the bore — shows the bit is at the end of a string. Both
     current bits go without it: on the lateral the bore tube already plays the
     string, and a stem longer than the lateral stuck out into empty space; on
     the vertical a long stem poked above the layer, so a short casing
     extension continues the string there (see wells.js). */
  if(!noStem){
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(R*0.34, R*0.34, R*7, 12), steel);
    stem.position.y = R*5.5;
    stem.renderOrder = 6;
    bit.add(stem);
  }

  // three cones around the axis — the recognisable tricone silhouette
  const cones = new THREE.Group();
  bit.add(cones);
  for(let i = 0; i < 3; i++){
    const a = i/3*Math.PI*2;
    const cone = new THREE.Mesh(new THREE.ConeGeometry(R*0.5, R*1.15, 12), steel);
    cone.position.set(Math.cos(a)*R*0.52, R*0.55, Math.sin(a)*R*0.52);
    cone.rotation.set(Math.cos(a)*0.42, 0, -Math.sin(a)*0.42);
    cone.renderOrder = 6;
    cones.add(cone);
    for(let k = 0; k < 7; k++){                   // teeth around the cone
      const tooth = new THREE.Mesh(new THREE.SphereGeometry(R*0.11, 6, 5), toothMaterial);
      const angle = k/7*Math.PI*2, r = R*0.3;
      tooth.position.set(cone.position.x + Math.cos(angle)*r, R*0.34 + (k%2)*R*0.22, cone.position.z + Math.sin(angle)*r);
      cones.add(tooth);
    }
  }

  /* Cuttings rise from the bit over the whole layer height — rock is carried
     to the surface rather than swirling at the bit. Particle height per frame
     is (seed + t·7) mod H, see scene/frame.js. */
  const H = cuttingsHeight || R*3;
  const dustMaterial = new THREE.PointsMaterial({ color:'#C7B48A', size:2.4, transparent:true,
    opacity:0, depthWrite:false, depthTest:false });
  const dustGeometry = new THREE.BufferGeometry();
  const count = 90, positions = new Float32Array(count*3), seeds = new Float32Array(count);
  for(let i = 0; i < count; i++){
    const a = Math.random()*Math.PI*2, r = R*(0.18 + Math.random()*0.55);
    positions[i*3] = Math.cos(a)*r; positions[i*3+2] = Math.sin(a)*r; positions[i*3+1] = Math.random()*H;
    seeds[i] = Math.random()*H;
  }
  dustGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const dust = new THREE.Points(dustGeometry, dustMaterial);
  dust.renderOrder = 6;
  bit.add(dust);

  // anchor of the "идёт бурение" label
  const anchor = new THREE.Object3D();
  anchor.position.y = R*2.4;
  bit.add(anchor);

  return { cones, materials:[steel, toothMaterial], dust:{ geometry:dustGeometry, material:dustMaterial, seeds, count, height:H }, anchor };
}
