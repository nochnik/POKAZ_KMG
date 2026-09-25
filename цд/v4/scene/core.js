/* Scene, camera, renderer, lights and orbit — everything the frame has from
   the first second, before any model is loaded. */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SHORT_SHOW } from '../params.js';

export const scene = new THREE.Scene();

export const camera = new THREE.PerspectiveCamera(36, innerWidth/innerHeight, 1, 4000);
camera.position.set(385, 278, 385);   // with margin, so the stack fits the corridor between panels
/* 18.09: in the short show the stack is spread and taller — camera farther
   back, otherwise the top and bottom leave the frame. */
if(SHORT_SHOW) camera.position.multiplyScalar(1.22);

export const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.35;
document.getElementById('scene').appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xC6D6EA, 0x5A4A34, 1.25));
const keyLight = new THREE.DirectionalLight(0xF6ECDA, 2.1);
keyLight.position.set(300, 420, 220);
scene.add(keyLight);
const rimLight = new THREE.DirectionalLight(0x6E86C8, 0.6);
rimLight.position.set(-260, 120, -300);
scene.add(rimLight);

export const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.enablePan = false;
controls.minDistance = 240;
controls.maxDistance = 760;
controls.minPolarAngle = 0.5;
controls.maxPolarAngle = 1.35;
controls.target.set(0, -40, 0);
/* One rotation speed for every state: it used to be 1.7 idle and 0.55 with a
   zone selected — the model visibly braked on hover. */
controls.autoRotate = true;
controls.autoRotateSpeed = 0.55;

/* The whole layer stack. Shifted vertically so its centre sits at the camera
   target (see scene/build.js). */
export const world = new THREE.Group();
scene.add(world);

/* Pixel density can't be set once on load: the slide starts in a hidden
   iframe or in a window that later moves to another monitor or zooms —
   devicePixelRatio changes while the renderer keeps the old density, and the
   picture goes soft. Re-checked on every resize and on wake-up. */
export function syncPixelRatio(){
  const wanted = Math.min(devicePixelRatio || 1, 1.6);
  if(Math.abs(renderer.getPixelRatio() - wanted) > 0.01) renderer.setPixelRatio(wanted);
}

export const cameraAzimuth = () =>
  Math.atan2(camera.position.x - controls.target.x, camera.position.z - controls.target.z);

/* Screen point of a scene object, or null when it is behind the camera. */
const projected = new THREE.Vector3();
export function toScreen(object){
  object.getWorldPosition(projected);
  projected.project(camera);
  if(projected.z > 1) return null;
  return { x:(projected.x*0.5 + 0.5)*innerWidth, y:(-projected.y*0.5 + 0.5)*innerHeight };
}
