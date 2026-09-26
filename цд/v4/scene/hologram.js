/* Layer hologram — a translucent box with a scrolling grid, edges and corner
   ticks. Every material starts fully transparent: the hologram shows only on
   the selected layer (see scene/frame.js). */
import * as THREE from 'three';

function gridTexture(color, cellsX, cellsY){
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6; ctx.globalAlpha = 0.85;
  for(let i = 0; i <= cellsX; i++){ const x = i/cellsX*254 + 1; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 256); ctx.stroke(); }
  for(let j = 0; j <= cellsY; j++){ const y = j/cellsY*254 + 1; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(256, y); ctx.stroke(); }
  ctx.lineWidth = 0.6; ctx.globalAlpha = 0.35;
  for(let i = 0; i <= cellsX*4; i++){ const x = i/(cellsX*4)*254 + 1; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 256); ctx.stroke(); }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/* Three short segments out of every box corner. */
function cornerTicks(w, h, d, color){
  const len = Math.min(w, d)*0.07, lenY = Math.min(len, h*0.45);
  const points = [];
  for(const a of [1,-1]) for(const b of [1,-1]) for(const c of [1,-1]){
    const x = a*w/2, y = b*h/2, z = c*d/2;
    points.push(x,y,z, x-a*len,y,z,  x,y,z, x,y-b*lenY,z,  x,y,z, x,y,z-c*len);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  return new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color, transparent:true, opacity:0 }));
}

/**
 * @param w, h, d    box size
 * @param centerY    box centre height
 * @param color      grid and edge colour (zone colour)
 * @param cells      grid cells across the width
 * @param fillColor  box fill colour
 * Parts are in `group.userData.parts`; scene/frame.js drives their opacity.
 */
export function createHologram(w, h, d, centerY, color, cells = 8, fillColor = 0x0A2E3E){
  const group = new THREE.Group();
  const fill = new THREE.Mesh(new THREE.BoxGeometry(w, h, d),
    new THREE.MeshBasicMaterial({ color:fillColor, transparent:true, opacity:0, depthWrite:false }));
  const grid = new THREE.Mesh(new THREE.BoxGeometry(w+0.4, h+0.4, d+0.4),
    new THREE.MeshBasicMaterial({ map:gridTexture(color, cells, Math.max(2, Math.round(cells*h/w))),
      transparent:true, opacity:0, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide }));
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w+0.6, h+0.6, d+0.6)),
    new THREE.LineBasicMaterial({ color, transparent:true, opacity:0 }));
  const corners = cornerTicks(w+3.5, h+3.5, d+3.5, '#FFFFFF');
  group.add(fill, grid, edges, corners);
  group.position.y = centerY;
  group.userData.parts = { fill, grid, edges, corners };
  return group;
}
