/**
 * @fileoverview 3D Digital Twin Oilfield Visualizer using Three.js
 *
 * Implements 5 distinct geological and engineering layers:
 *   - Layer 1 (v4-3d-layer-1.glb): Geological grid & oil saturation map (GGDM)
 *   - Layer 2 (v4-3d-layer-2.glb): Reservoir strategy & waterflooding contours
 *   - Layer 3 (v4-3d-layer-3.glb): Base reservoir slab / economic evaluation
 *   - Layer 4 (v4-3d-layer-4.glb): Production & injection well trajectories
 *   - Layer 5 (v4-3d-layer-5.glb): Surface infrastructure & animated pumping jacks
 *
 * Dynamic 3D interactive engineering components:
 *   - Surface gathering pipeline network with active crude oil flow pulses (fades in on surface hover)
 *   - Amber targeting accent rings around pump stations and tank farm (fades in on surface hover)
 *   - Wellbore casing sleeves and collar rings under pumping stations (fades in on wells hover)
 *   - Vertical well extension pipe and active rotating 3-cone drill bit with cuttings dust (fades in on wells hover)
 *   - Horizontal curved wellbore string and active rotating drill bit with cuttings dust (fades in on wells hover)
 *   - Ambient floating digital data particles inside strata (fades in on wells hover)
 *   - 8 reservoir ranking well columns (red & green) with wellhead spheres and drill shoes (fades in on reservoir hover)
 *   - Smooth layer separation and scale highlight on hover
 *   - Compact monolithic resting state matching original slide design
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/**
 * ============================================================================
 * CORE CONFIGURATION & TUNING CONSTANTS
 * Edit these parameters to customize layer spacing, scaling, offsets, and timing.
 * ============================================================================
 */
export const CONFIG_3D = {
  // ── 1. Расстояния между слоями и геометрия ──────────────────────────────────
  UNIFORM_SEAM_GAP: 1.0,          // Зазор между соседними слоями в состоянии покоя
  EXPLODED_GAP: 22.0,             // Расстояние между слоями при раскрытии (клавиша Пробел)
  RESERVOIR_SLICE_HEIGHT: 18.0,   // Высота каждого среза пласта (слои 1, 2, 3)
  WELLS_LAYER_HEIGHT: 56.0,       // Высота слоя геологии и стволов скважин (слой 4)
  FOOTPRINT_WIDTH: 250,           // Ширина блока модели (X)
  FOOTPRINT_DEPTH: 190,           // Глубина блока модели (Z)

  // ── 2. Масштабирование при наведении (приближение к камере) ──────────────────
  HOVER_SCALE_SINGLE: 1.18,       // Масштаб активного слоя (становится шире и ближе)
  HOVER_SCALE_MULTI: 1.12,        // Масштаб при групповом выделении пласта (слои 1, 2, 3)
  HOVER_SCALE_INACTIVE: 0.92,     // Масштаб неактивных слоев в фоне (слегка отдаляются)

  // ── 3. Вертикальное расхождение слоев при наведении ─────────────────────────
  HOVER_OFFSET_ABOVE: 52.0,       // Подъем верхних слоев (сдвигаются вверх единым блоком)
  HOVER_OFFSET_BELOW: 52.0,       // Опускание нижних слоев (сдвигаются вниз единым блоком)
  HOVER_MULTI_SPREAD: 0.0,        // Микро-расхождение внутри группы пластов (0 = монолит)

  // ── 4. Прозрачность и цифровые эффекты ──────────────────────────────────────
  HOVER_UPPER_OPACITY: 0.28,      // Прозрачность слоев НАД активным (рентген-обзор)
  HOVER_LOWER_OPACITY: 0.92,      // Прозрачность слоев ПОД активным
  WIREFRAME_OPACITY: 0.95,        // Яркость белой цифровой сетки активного слоя

  // ── 5. Камера и авто-вращение ──────────────────────────────────────────────
  AUTO_ROTATE: true,              // Фоновое автоматическое вращение сцены
  AUTO_ROTATE_SPEED: 0.55,        // Скорость фонового вращения
  CAMERA_MIN_DISTANCE: 220,       // Минимальное приближение камеры (зум)
  CAMERA_MAX_DISTANCE: 880        // Максимальное отдаление камеры (зум)
};

export class DigitalTwin3D {
  /**
   * @param {HTMLElement} container - DOM container element for WebGL canvas
   * @param {Object} [options] - Configuration options
   * @param {number} [options.initialGap=0] - Starting vertical gap between layers
   * @param {boolean} [options.autoRotate=true] - OrbitControls auto-rotation
   * @param {Function} [options.onReady] - Callback when all GLB models are loaded
   * @param {Function} [options.onError] - Error handler callback
   * @param {Function} [options.onLayerHover] - Callback when active layer changes
   */
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      initialGap: 0,
      autoRotate: CONFIG_3D.AUTO_ROTATE,
      onReady: null,
      onError: null,
      onLayerHover: null,
      ...options
    };

    this.currentGap = this.options.initialGap;
    this.targetGap = this.options.initialGap;

    this.hoveredLayerId = null;
    this.manualHoverIds = [];
    this.pointerInside = false;

    // Layer state storage
    this.layers = new Map();
    this.hitMeshes = [];

    // Animation & visibility alphas
    this.surfaceAlpha = 0.0;
    this.wellsAlpha = 0.0;
    this.rankingAlpha = 0.0;

    // Sub-object groups and materials
    this.surfacePipelineGroup = null;
    this.wellboreGroup = null;
    this.rankingColumnsGroup = null;
    this.dataParticles = null;

    this.surfaceMaterials = [];
    this.wellboreMaterials = [];
    this.rankingMaterials = [];
    this.pipelineFlowTextures = [];
    this.activeDrillBits = [];

    this.animationMixer = null;
    this.isReady = false;
    this.isDestroyed = false;

    // Dimensional footprint constants matching original slide
    this.FOOTPRINT_WIDTH = CONFIG_3D.FOOTPRINT_WIDTH;
    this.FOOTPRINT_DEPTH = CONFIG_3D.FOOTPRINT_DEPTH;
    this.RESERVOIR_HEIGHT = CONFIG_3D.RESERVOIR_SLICE_HEIGHT * 3 + CONFIG_3D.UNIFORM_SEAM_GAP * 2;
    this.TARGET_HEIGHTS = { 4: CONFIG_3D.WELLS_LAYER_HEIGHT };

    this.GLB_FILENAMES = {
      1: 'v4-3d-layer-1.glb',
      2: 'v4-3d-layer-2.glb',
      3: 'v4-3d-layer-3.glb',
      4: 'v4-3d-layer-4.glb',
      5: 'v4-3d-layer-5.glb'
    };

    this.raycaster = new THREE.Raycaster();
    this.pointerPosition = new THREE.Vector2(-1000, -1000);
    this.clock = new THREE.Clock();

    this._initScene();
    this._initLighting();
    this._initCameraAndControls();
    this._loadModelLayers();
    this._bindEventListeners();
    this._startRenderLoop();
  }

  /**
   * Initializes the Three.js scene, root groups, and WebGL renderer.
   * @private
   */
  _initScene() {
    this.scene = new THREE.Scene();

    this.rootGroup = new THREE.Group();
    this.rootGroup.name = 'digital_twin_root';
    this.scene.add(this.rootGroup);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;
    this.container.appendChild(this.renderer.domElement);
  }

  /**
   * Configures hemisphere and directional key/rim light sources.
   * @private
   */
  _initLighting() {
    this.ambientLight = new THREE.HemisphereLight(0xC6D6EA, 0x5A4A34, 1.25);
    this.scene.add(this.ambientLight);

    this.primaryLight = new THREE.DirectionalLight(0xF6ECDA, 2.1);
    this.primaryLight.position.set(300, 420, 220);
    this.scene.add(this.primaryLight);

    this.secondaryLight = new THREE.DirectionalLight(0x6E86C8, 0.6);
    this.secondaryLight.position.set(-260, 120, -300);
    this.scene.add(this.secondaryLight);
  }

  /**
   * Sets up perspective camera and OrbitControls with bounded pitch and distance.
   * @private
   */
  _initCameraAndControls() {
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(36, aspect, 1, 4000);
    this.camera.position.set(385, 278, 385);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.07;
    this.controls.enablePan = false;
    this.controls.minDistance = CONFIG_3D.CAMERA_MIN_DISTANCE;
    this.controls.maxDistance = CONFIG_3D.CAMERA_MAX_DISTANCE;
    this.controls.minPolarAngle = 0.45;
    this.controls.maxPolarAngle = 1.40;
    this.controls.target.set(0, -35, 0);
    this.controls.autoRotate = this.options.autoRotate;
    this.controls.autoRotateSpeed = CONFIG_3D.AUTO_ROTATE_SPEED;
  }

  /**
   * Computes base vertical offsets for 5 layers relative to current gap.
   * @param {number} gap
   * @returns {Record<number, number>}
   * @private
   */
  _computeLayerOffsets(gap) {
    return {
      1: -2 * gap,
      2: -1 * gap,
      3:  0 * gap,
      4: +1 * gap,
      5: +2 * gap
    };
  }

  /**
   * Generates a 3D wellbore trajectory curve.
   * @private
   */
  _createWellboreCurve(x, z, bottomY, topY, radius = 28, horizontalLength = 34, azimuth) {
    if (azimuth === undefined) {
      return new THREE.LineCurve3(
        new THREE.Vector3(x, topY, z),
        new THREE.Vector3(x, bottomY, z)
      );
    }

    const points = [new THREE.Vector3(x, topY, z)];
    const dx = Math.cos(azimuth);
    const dz = Math.sin(azimuth);
    const kickoffY = bottomY + radius;
    points.push(new THREE.Vector3(x, kickoffY, z));

    for (let i = 1; i <= 16; i++) {
      const angle = (Math.PI / 2) * (i / 16);
      points.push(new THREE.Vector3(
        x + dx * radius * (1 - Math.cos(angle)),
        kickoffY - radius * Math.sin(angle),
        z + dz * radius * (1 - Math.cos(angle))
      ));
    }

    for (let i = 1; i <= 4; i++) {
      const dist = radius + (horizontalLength * i) / 4;
      points.push(new THREE.Vector3(x + dx * dist, bottomY, z + dz * dist));
    }

    return new THREE.CatmullRomCurve3(points);
  }

  /**
   * Attaches white digital wireframe meshes directly onto model equipment surfaces.
   * Excludes ground, dirt, and foundation slabs so only equipment glows.
   * @private
   */
  _attachDigitalWireframes(root) {
    const wireMaterials = [];
    const meshes = [];

    root.traverse((node) => {
      if (node.isMesh) {
        const mat = node.material;
        const matList = Array.isArray(mat) ? mat : [mat];
        // Exclude only the bottom flat terrain slab so the ground box doesn't have an outline frame
        const isTerrainSlab = matList.some((m) => (m?.name || '').toLowerCase() === 'terrain_lod0') ||
          (node.name || '').toLowerCase() === 'terrain_lod0';

        if (!isTerrainSlab) {
          meshes.push(node);
        }
      }
    });

    for (const mesh of meshes) {
      const wireMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFFFFF,
        wireframe: true,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      const wireMesh = new THREE.Mesh(mesh.geometry, wireMaterial);
      wireMesh.renderOrder = 4;
      mesh.add(wireMesh);
      wireMaterials.push(wireMaterial);
    }

    return wireMaterials;
  }

  /**
   * Constructs the 3D surface gathering pipeline network with active flowing crude pulses.
   * Hidden by default; smoothly fades in on surface hover.
   * @private
   */
  _buildSurfacePipeline(parentPivot, surfaceGroundYRel) {
    const SEGMENTS = [
      [[-74.8, 40], [-74.8, -2]],
      [[  2.5, 40], [  2.5, -2]],
      [[ 74.4, 40], [ 74.4, -2]],
      [[-74.8, -2], [ 54,   -2]],
      [[ 74.4, -2], [ 54,   -2]],
      [[ 54,   -2], [ 54,  -24]],
    ];
    const DASH_LENGTH = 20;
    const pipeY = surfaceGroundYRel;

    const casingMaterial = new THREE.MeshStandardMaterial({
      color: 0x1A1006,
      roughness: 0.6,
      metalness: 0.5,
      transparent: true,
      opacity: 0
    });

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(6, 0, 78, 0);
    grad.addColorStop(0, 'rgba(255, 176, 32, 0)');
    grad.addColorStop(0.55, 'rgba(255, 178, 32, 0.9)');
    grad.addColorStop(0.9, '#FFD87A');
    grad.addColorStop(1, '#FFF4D6');
    ctx.fillStyle = grad;
    ctx.fillRect(6, 2, 72, 12);

    const pipelineGroup = new THREE.Group();
    pipelineGroup.name = 'surface_pipeline_network';
    pipelineGroup.visible = false;

    const flowMaterials = [];

    for (const [[x1, z1], [x2, z2]] of SEGMENTS) {
      const length = Math.hypot(x2 - x1, z2 - z1);
      const curve = new THREE.LineCurve3(
        new THREE.Vector3(x1, pipeY, z1),
        new THREE.Vector3(x2, pipeY, z2)
      );

      const casing = new THREE.Mesh(new THREE.TubeGeometry(curve, 1, 1.8, 10, false), casingMaterial);
      casing.renderOrder = 7;
      pipelineGroup.add(casing);

      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(Math.max(1, Math.round(length / DASH_LENGTH)), 1);
      this.pipelineFlowTextures.push(texture);

      const flowMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        depthWrite: false
      });

      const flowMesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 1, 2.1, 10, false), flowMaterial);
      flowMesh.renderOrder = 8;
      pipelineGroup.add(flowMesh);

      flowMaterials.push(flowMaterial);
    }

    parentPivot.add(pipelineGroup);
    this.surfacePipelineGroup = pipelineGroup;
    this.surfaceMaterials.push(casingMaterial, ...flowMaterials);
  }

  /**
   * Creates an active 3D roller cone drill bit matching original slide proportions.
   * @private
   */
  _createRollerConeDrillBit(x, y, z, radius, dustHeight, direction, hasStem = true) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    if (direction) {
      group.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), direction.clone().normalize());
    }

    const steelMaterial = new THREE.MeshStandardMaterial({
      color: 0xAEB8C6,
      roughness: 0.45,
      metalness: 0.25,
      transparent: true,
      opacity: 0,
      emissive: new THREE.Color(0x3A4658),
      emissiveIntensity: 0.5,
      depthTest: false,
      depthWrite: false
    });

    const toothMaterial = new THREE.MeshStandardMaterial({
      color: 0xE8C87A,
      roughness: 0.3,
      metalness: 0.7,
      transparent: true,
      opacity: 0,
      emissive: new THREE.Color(0x8A6A20),
      emissiveIntensity: 0.35,
      depthTest: false,
      depthWrite: false
    });

    // Main bit body
    const bodyMesh = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.86, radius * 0.98, radius * 1.5, 16), steelMaterial);
    bodyMesh.position.y = radius * 1.5;
    bodyMesh.renderOrder = 6;
    group.add(bodyMesh);

    // Drill stem extending upwards into casing
    if (hasStem) {
      const stemMesh = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.34, radius * 0.34, radius * 7, 12), steelMaterial);
      stemMesh.position.y = radius * 5.5;
      stemMesh.renderOrder = 6;
      group.add(stemMesh);
    }

    // Rotating 3-cone cutter assembly
    const cutterAssembly = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const cone = new THREE.Mesh(new THREE.ConeGeometry(radius * 0.54, radius * 1.15, 14), steelMaterial);
      cone.position.set(Math.cos(angle) * radius * 0.52, radius * 0.55, Math.sin(angle) * radius * 0.52);
      cone.rotation.set(Math.cos(angle) * 0.45, 0, -Math.sin(angle) * 0.45);
      cone.renderOrder = 6;
      cutterAssembly.add(cone);

      for (let k = 0; k < 7; k++) {
        const toothAngle = (k / 7) * Math.PI * 2;
        const tooth = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.11, 6, 5), toothMaterial);
        tooth.position.set(
          cone.position.x + Math.cos(toothAngle) * radius * 0.29,
          radius * 0.38 + (k % 2) * radius * 0.22,
          cone.position.z + Math.sin(toothAngle) * radius * 0.29
        );
        cutterAssembly.add(tooth);
      }
    }
    group.add(cutterAssembly);

    // Circulating cuttings dust particles
    const particleCount = 90;
    const positions = new Float32Array(particleCount * 3);
    const seeds = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = radius * (0.18 + Math.random() * 0.55);
      positions[i * 3]     = Math.cos(a) * r;
      positions[i * 3 + 1] = Math.random() * dustHeight;
      positions[i * 3 + 2] = Math.sin(a) * r;
      seeds[i] = Math.random() * dustHeight;
    }
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const dustMaterial = new THREE.PointsMaterial({
      color: 0xC7B48A,
      size: 2.2,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false
    });
    const particles = new THREE.Points(particleGeometry, dustMaterial);
    particles.renderOrder = 6;
    group.add(particles);

    const bitObj = {
      group,
      cutterAssembly,
      particles,
      particleGeometry,
      seeds,
      dustHeight,
      particleCount,
      materials: [steelMaterial, toothMaterial, dustMaterial]
    };
    this.activeDrillBits.push(bitObj);
    return bitObj;
  }

  /**
   * Constructs wellbore casing sleeves, extensions, and horizontal drill string in Layer 4.
   * Hidden by default; smoothly fades in on well layer hover.
   * @private
   */
  _buildWellboreTubesAndDrillBits(parentPivot, layerHeight) {
    const WELLS_DATA = [
      { x: -77.5, z: 92.3, rx: 4.87, rz: 2.68, isDrilling: false, isHorizontal: false },
      { x:   0.2, z: 92.3, rx: 4.87, rz: 2.68, isDrilling: true,  isHorizontal: false },
      { x:  78.0, z: 92.3, rx: 4.87, rz: 2.68, isDrilling: false, isHorizontal: true }
    ];

    const wellGroup = new THREE.Group();
    wellGroup.name = 'wellbore_tubes_and_drillbits';
    wellGroup.visible = false;

    const pipeMaterial = new THREE.MeshStandardMaterial({
      color: 0x9B7BE8,
      roughness: 0.35,
      metalness: 0.2,
      emissive: new THREE.Color(0x9B7BE8),
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0,
      depthTest: false,
      depthWrite: false
    });

    const drillingMaterial = new THREE.MeshStandardMaterial({
      color: 0x9AA5B4,
      roughness: 0.5,
      metalness: 0.25,
      emissive: new THREE.Color(0x38414F),
      emissiveIntensity: 0.45,
      transparent: true,
      opacity: 0,
      depthTest: false,
      depthWrite: false
    });

    this.wellboreMaterials.push(pipeMaterial, drillingMaterial);

    for (let i = 0; i < WELLS_DATA.length; i++) {
      const well = WELLS_DATA[i];
      const mat = (well.isDrilling || well.isHorizontal) ? drillingMaterial : pipeMaterial;

      // Vertical casing sleeve overlay
      const casing = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, layerHeight, 20), mat);
      casing.scale.set(well.rx * 1.18, 1, well.rz * 1.18);
      casing.position.set(well.x, 0, well.z);
      casing.renderOrder = 6;
      wellGroup.add(casing);

      // Wellhead rings
      for (const fraction of [0.25, 0.60]) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(well.rx * 1.28, Math.max(0.55, well.rx * 0.13), 8, 22), mat);
        ring.rotation.x = Math.PI / 2;
        ring.scale.z = well.rz / well.rx;
        ring.position.set(well.x, (fraction - 0.5) * layerHeight, well.z);
        ring.renderOrder = 6;
        wellGroup.add(ring);
      }

      // Center well: vertical extension pipe & active drill bit
      if (well.isDrilling) {
        const EXT_LENGTH = 22;
        const extPipe = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, EXT_LENGTH, 20), drillingMaterial);
        extPipe.scale.set(well.rx * 1.18, 1, well.rz * 1.18);
        extPipe.position.set(well.x, -layerHeight / 2 - EXT_LENGTH / 2, well.z);
        extPipe.renderOrder = 6;
        wellGroup.add(extPipe);

        const bitRadius = 9.2;
        const bitY = -layerHeight / 2 - EXT_LENGTH - bitRadius * 2.25 + 1;
        const drillBit = this._createRollerConeDrillBit(well.x, bitY, well.z, bitRadius, layerHeight + 14, null, true);
        wellGroup.add(drillBit.group);
      }

      // Right well: curved horizontal wellbore string & active horizontal drill bit
      if (well.isHorizontal) {
        const curveBottomY = -layerHeight / 2 - 28;
        const curveTopY = -layerHeight / 2;
        const horizontalCurve = this._createWellboreCurve(well.x, well.z, curveBottomY, curveTopY, 28, 32, Math.PI);

        const horizontalTube = new THREE.Mesh(
          new THREE.TubeGeometry(horizontalCurve, 96, 4.2 * 1.18, 12, false),
          drillingMaterial
        );
        horizontalTube.renderOrder = 6;
        wellGroup.add(horizontalTube);

        const bitRadius = 8.6;
        const endPoint = horizontalCurve.getPoint(1);
        const tangent = horizontalCurve.getTangent(1).normalize();
        const horizontalBit = this._createRollerConeDrillBit(
          endPoint.x, endPoint.y, endPoint.z,
          bitRadius, 46, tangent, false
        );
        wellGroup.add(horizontalBit.group);
      }
    }

    parentPivot.add(wellGroup);
    this.wellboreGroup = wellGroup;
  }

  /**
   * Generates floating ambient digital data points inside the wellbore strata.
   * @private
   */
  _buildDataParticles(parentPivot, layerHeight) {
    const N = 120;
    const positions = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * this.FOOTPRINT_WIDTH * 0.94;
      positions[i * 3 + 1] = (Math.random() - 0.5) * layerHeight;
      positions[i * 3 + 2] = (Math.random() - 0.5) * this.FOOTPRINT_DEPTH * 0.94;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0x9B7BE8,
      size: 2.5,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false
    });
    const points = new THREE.Points(geometry, material);
    points.renderOrder = 8;
    points.visible = false;
    parentPivot.add(points);
    this.dataParticles = points;
  }

  /**
   * Constructs the 8 reservoir ranking well columns (red & green) bridging across reservoir strata.
   * Hidden by default; smoothly fades in on reservoir hover.
   * @private
   */
  _buildRankingColumns(parentGroup, reservoirBottom, reservoirTop) {
    const TARGETS = [
      { name: 'VMB_2783', x: -0.28, z: -0.18, rank: 1, azimuth: -0.35 },
      { name: 'VMB_2787', x: -0.06, z:  0.28, rank: 2, azimuth: -1.90 },
      { name: 'VMB_2746', x: -0.34, z:  0.24, rank: 3 },
      { name: 'VMB_2768', x:  0.02, z: -0.06, rank: 4 },
      { name: 'VMB_418',  x:  0.18, z: -0.02, rank: 5 },
      { name: 'VMB_615',  x: -0.12, z:  0.10, rank: 6 },
      { name: 'VMB_202',  x:  0.24, z:  0.20, rank: 7 },
      { name: 'VMB_2793', x:  0.31, z:  0.06, rank: 8 },
    ];

    const columnsGroup = new THREE.Group();
    columnsGroup.name = 'reservoir_ranking_columns';
    columnsGroup.visible = false;

    const reservoirHeight = reservoirTop - reservoirBottom;
    const baseY = reservoirBottom + 6;

    for (const target of TARGETS) {
      const isHorizontal = target.azimuth !== undefined;
      const color = isHorizontal ? 0x2FBF5B : 0xF03A2E;

      const colX = target.x * this.FOOTPRINT_WIDTH;
      const colZ = target.z * this.FOOTPRINT_DEPTH;

      const rankFraction = 1 - (target.rank - 1) / 7;
      const colTopY = reservoirBottom + reservoirHeight * (isHorizontal ? (0.92 + 0.12 * rankFraction) : (0.65 + 0.28 * rankFraction));

      const curve = this._createWellboreCurve(colX, colZ, baseY, colTopY, 28, 38, target.azimuth);

      const seeThroughMaterial = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        depthWrite: false
      });
      this.rankingMaterials.push(seeThroughMaterial);

      const tubeMesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 32, 1.4, 10, false), seeThroughMaterial);
      tubeMesh.renderOrder = 8;
      columnsGroup.add(tubeMesh);

      const sphereMesh = new THREE.Mesh(new THREE.SphereGeometry(2.8, 14, 12), seeThroughMaterial);
      sphereMesh.position.set(colX, colTopY, colZ);
      sphereMesh.renderOrder = 9;
      columnsGroup.add(sphereMesh);

      const endPoint = curve.getPoint(1);
      const tangent = curve.getTangent(1).normalize();
      const shoeMesh = new THREE.Mesh(new THREE.ConeGeometry(3.2, 6.5, 12), seeThroughMaterial);
      shoeMesh.position.copy(endPoint);
      shoeMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);
      shoeMesh.renderOrder = 9;
      columnsGroup.add(shoeMesh);
    }

    parentGroup.add(columnsGroup);
    this.rankingColumnsGroup = columnsGroup;
  }

  /**
   * Loads all 5 GLB models and configures layer hierarchies and 3D sub-objects.
   * @private
   */
  async _loadModelLayers() {
    const loader = new GLTFLoader();
    const loadGLB = (filename) => {
      return new Promise((resolve, reject) => {
        loader.load(encodeURIComponent(filename), resolve, undefined, reject);
      });
    };

    try {
      const [gltf1, gltf2, gltf3, gltf4, gltf5] = await Promise.all([
        loadGLB(this.GLB_FILENAMES[1]),
        loadGLB(this.GLB_FILENAMES[2]),
        loadGLB(this.GLB_FILENAMES[3]),
        loadGLB(this.GLB_FILENAMES[4]),
        loadGLB(this.GLB_FILENAMES[5])
      ]);

      const gltfMap = { 1: gltf1, 2: gltf2, 3: gltf3, 4: gltf4, 5: gltf5 };
      const metadata = {};

      for (let id = 1; id <= 5; id++) {
        const root = gltfMap[id].scene;
        root.updateMatrixWorld(true);

        const box = new THREE.Box3().setFromObject(root);
        const size = box.getSize(new THREE.Vector3());

        const scaleX = this.FOOTPRINT_WIDTH / size.x;
        const scaleZ = this.FOOTPRINT_DEPTH / size.z;
        const scaleY = (id === 5)
          ? (scaleX + scaleZ) / 2
          : (this.TARGET_HEIGHTS[id] ? this.TARGET_HEIGHTS[id] / size.y : 1);

        metadata[id] = {
          root,
          box,
          size,
          scaleX,
          scaleZ,
          scaleY,
          height: id === 5 ? size.y * scaleY : (this.TARGET_HEIGHTS[id] || 0)
        };
      }

      // Uniform distance between all consecutive layers (5-4, 4-3, 3-2, 2-1)
      const UNIFORM_SEAM_GAP = CONFIG_3D.UNIFORM_SEAM_GAP;

      const layer4Top = 0;
      const layer4Bottom = -metadata[4].height;

      // Layer 5 (Surface infrastructure) sits above Layer 4 with UNIFORM_SEAM_GAP
      const layer5Bottom = layer4Top + UNIFORM_SEAM_GAP;
      const layer5Top = layer5Bottom + metadata[5].height;

      // Three reservoir sublayers (Layers 3, 2, 1) each with equal height and UNIFORM_SEAM_GAP between them
      const sliceHeight = CONFIG_3D.RESERVOIR_SLICE_HEIGHT;

      // Layer 3 (Economic evaluation base) sits below Layer 4 with UNIFORM_SEAM_GAP
      const layer3Top = layer4Bottom - UNIFORM_SEAM_GAP;
      const layer3Bottom = layer3Top - sliceHeight;

      // Layer 2 (Waterflooding strategy) sits below Layer 3 with UNIFORM_SEAM_GAP
      const layer2Top = layer3Bottom - UNIFORM_SEAM_GAP;
      const layer2Bottom = layer2Top - sliceHeight;

      // Layer 1 (Geological grid / saturation map) sits below Layer 2 with UNIFORM_SEAM_GAP
      const layer1Top = layer2Bottom - UNIFORM_SEAM_GAP;
      const layer1Bottom = layer1Top - sliceHeight;

      const elevationBands = {
        5: [layer5Bottom, layer5Top],
        4: [layer4Bottom, layer4Top],
        3: [layer3Bottom, layer3Top],
        2: [layer2Bottom, layer2Top],
        1: [layer1Bottom, layer1Top],
        reservoir: [layer1Bottom, layer3Top]
      };

      const initialOffsets = this._computeLayerOffsets(this.targetGap);

      // Helper to register an interactive layer
      const registerLayer = (layerId, contentObject, layerHeight, centerY, debugName) => {
        const group = new THREE.Group();
        group.name = debugName;

        const pivot = new THREE.Group();
        pivot.name = `${debugName}_pivot`;
        pivot.position.set(0, centerY, 0);

        contentObject.position.y -= centerY;
        pivot.add(contentObject);

        // Collect and clone physical materials for dynamic transparency control
        const physMaterials = [];
        contentObject.traverse((node) => {
          if (node.isMesh) {
            const mats = Array.isArray(node.material) ? node.material : [node.material];
            const cloned = mats.map((m) => {
              const copy = m.clone();
              copy.transparent = true;
              copy.opacity = 1.0;
              return copy;
            });
            node.material = Array.isArray(node.material) ? cloned : cloned[0];
            physMaterials.push(...cloned);
          }
        });

        const wireMaterials = this._attachDigitalWireframes(contentObject);
        group.add(pivot);

        // Hitbox for raycasting
        const hitGeometry = new THREE.BoxGeometry(
          this.FOOTPRINT_WIDTH * 1.05,
          Math.max(layerHeight, 16),
          this.FOOTPRINT_DEPTH * 1.05
        );
        const hitMaterial = new THREE.MeshBasicMaterial({ visible: false });
        const hitMesh = new THREE.Mesh(hitGeometry, hitMaterial);
        hitMesh.position.set(0, centerY, 0);
        hitMesh.userData.layerId = layerId;
        group.add(hitMesh);
        this.hitMeshes.push(hitMesh);

        group.position.y = initialOffsets[layerId] || 0;
        this.rootGroup.add(group);

        this.layers.set(layerId, {
          id: layerId,
          group,
          pivot,
          hitMesh,
          wireMaterials,
          physMaterials,
          centerY,
          baseY: initialOffsets[layerId] || 0,
          currentY: initialOffsets[layerId] || 0,
          targetY: initialOffsets[layerId] || 0,
          currentScale: 1.0,
          targetScale: 1.0,
          currentOpacity: 1.0,
          targetOpacity: 1.0,
          effectOpacity: 0.0,
          targetEffectOpacity: 0.0
        });

        return pivot;
      };

      // ── 1. Layer 5: Surface Infrastructure ──────────────────────────
      const surfaceCenter = metadata[5].box.getCenter(new THREE.Vector3());
      metadata[5].root.scale.set(metadata[5].scaleX, metadata[5].scaleY, metadata[5].scaleZ);
      metadata[5].root.position.set(
        -surfaceCenter.x * metadata[5].scaleX,
        elevationBands[5][0] - metadata[5].box.min.y * metadata[5].scaleY,
        -surfaceCenter.z * metadata[5].scaleZ
      );
      const surfaceCenterY = (elevationBands[5][0] + elevationBands[5][1]) / 2;

      const layer5Pivot = registerLayer(5, metadata[5].root, metadata[5].height, surfaceCenterY, 'layer_5_surface');

      const groundYRel = (elevationBands[5][0] + (elevationBands[5][1] - elevationBands[5][0]) * 0.32 - 4) - surfaceCenterY;
      this._buildSurfacePipeline(layer5Pivot, groundYRel);

      if (gltf5.animations && gltf5.animations.length > 0) {
        this.animationMixer = new THREE.AnimationMixer(metadata[5].root);
        gltf5.animations.forEach((clip) => {
          this.animationMixer.clipAction(clip).play();
        });
      }

      // ── 2. Layer 4: Well Trajectories ───────────────────────────────
      const wellsCenter = metadata[4].box.getCenter(new THREE.Vector3());
      const wellsInnerPivot = new THREE.Group();
      wellsInnerPivot.position.set(-wellsCenter.x, 0, -wellsCenter.z);

      while (metadata[4].root.children.length > 0) {
        wellsInnerPivot.add(metadata[4].root.children[0]);
      }

      const wellsRotationPivot = new THREE.Group();
      wellsRotationPivot.rotation.y = -Math.PI / 2;
      wellsRotationPivot.add(wellsInnerPivot);

      const wellsOuterPivot = new THREE.Group();
      wellsOuterPivot.add(wellsRotationPivot);
      wellsOuterPivot.scale.set(
        this.FOOTPRINT_WIDTH / metadata[4].size.z,
        metadata[4].scaleY,
        this.FOOTPRINT_DEPTH / metadata[4].size.x
      );
      wellsOuterPivot.position.set(0, elevationBands[4][0] - metadata[4].box.min.y * metadata[4].scaleY, 0);

      const wellsCenterY = (elevationBands[4][0] + elevationBands[4][1]) / 2;

      const layer4Pivot = registerLayer(4, wellsOuterPivot, metadata[4].height, wellsCenterY, 'layer_4_wells');

      this._buildWellboreTubesAndDrillBits(layer4Pivot, metadata[4].height);
      this._buildDataParticles(layer4Pivot, metadata[4].height);

      // ── 3. Reservoir Layers 1, 2, 3 ─────────────────────────────────
      const buildReservoirSlice = (layerIndex, debugName) => {
        const sliceGroup = new THREE.Group();
        const meta = metadata[layerIndex];
        const center = meta.box.getCenter(new THREE.Vector3());
        const sX = this.FOOTPRINT_WIDTH / meta.size.x;
        const sZ = this.FOOTPRINT_DEPTH / meta.size.z;
        const sY = sliceHeight / meta.size.y;

        const baseElevation = elevationBands[layerIndex][0];
        meta.root.scale.set(sX, sY, sZ);
        meta.root.position.set(-center.x * sX, baseElevation - meta.box.min.y * sY, -center.z * sZ);
        sliceGroup.add(meta.root);

        const centerY = (elevationBands[layerIndex][0] + elevationBands[layerIndex][1]) / 2;
        registerLayer(layerIndex, sliceGroup, sliceHeight, centerY, debugName);
      };

      // Layer 3: Economic evaluation base
      buildReservoirSlice(3, 'layer_3_reservoir_base');

      // Layer 2: Waterflooding strategy
      buildReservoirSlice(2, 'layer_2_strategy');

      // Layer 1: Geological grid / saturation map
      buildReservoirSlice(1, 'layer_1_geology');

      // Add the 8 reservoir ranking columns bridging across strata
      this._buildRankingColumns(this.rootGroup, elevationBands.reservoir[0], elevationBands.reservoir[1]);

      this.isReady = true;

      if (typeof this.options.onReady === 'function') {
        this.options.onReady(this);
      }
    } catch (error) {
      console.error('Failed to load digital twin 3D layers:', error);
      if (typeof this.options.onError === 'function') {
        this.options.onError(error);
      }
    }
  }

  /**
   * Sets the target expansion gap between layers.
   * @param {number} gap
   */
  setGap(gap) {
    this.targetGap = gap;
  }

  /**
   * Toggles between expanded (22) and collapsed (0) layer states.
   * @returns {number} The updated target gap
   */
  toggleGap() {
    this.targetGap = this.targetGap === CONFIG_3D.EXPLODED_GAP ? 0 : CONFIG_3D.EXPLODED_GAP;
    return this.targetGap;
  }

  /**
   * Sets manual hover state (e.g. from UI cards or sidebar).
   * @param {number|number[]|null} layerIds
   */
  setHoveredLayer(layerIds) {
    if (layerIds === null || layerIds === undefined) {
      this.manualHoverIds = [];
    } else if (Array.isArray(layerIds)) {
      this.manualHoverIds = layerIds;
    } else {
      this.manualHoverIds = [layerIds];
    }
  }

  /**
   * Returns current interpolated gap value.
   * @returns {number}
   */
  getGap() {
    return this.currentGap;
  }

  /**
   * Subscribes to pointer and window events.
   * @private
   */
  _bindEventListeners() {
    this._handleWindowResize = () => {
      if (!this.container || this.isDestroyed) return;
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    };

    this._handlePointerMove = (event) => {
      const rect = this.container.getBoundingClientRect();
      this.pointerPosition.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointerPosition.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      this.pointerInside = true;
    };

    this._handlePointerLeave = () => {
      this.pointerPosition.set(-1000, -1000);
      this.pointerInside = false;
      this.hoveredLayerId = null;
    };

    window.addEventListener('resize', this._handleWindowResize);
    this.container.addEventListener('pointermove', this._handlePointerMove);
    this.container.addEventListener('pointerleave', this._handlePointerLeave);
  }

  /**
   * Updates raycaster and determines active hovered layer.
   * @private
   */
  _updateRaycaster() {
    let activeLayer = null;

    if (this.pointerInside) {
      this.raycaster.setFromCamera(this.pointerPosition, this.camera);
      const intersections = this.raycaster.intersectObjects(this.hitMeshes, false);

      if (intersections.length > 0) {
        activeLayer = intersections[0].object.userData.layerId;
        this.container.style.cursor = 'pointer';
      } else {
        this.container.style.cursor = 'grab';
      }
    }

    const previousHover = this.hoveredLayerId;
    this.hoveredLayerId = activeLayer;

    if (previousHover !== this.hoveredLayerId && typeof this.options.onLayerHover === 'function') {
      this.options.onLayerHover(this.hoveredLayerId);
    }
  }

  /**
   * Core requestAnimationFrame animation loop.
   * @private
   */
  _startRenderLoop() {
    if (this.isDestroyed) return;
    requestAnimationFrame(() => this._startRenderLoop());

    const delta = Math.min(this.clock.getDelta(), 0.1);
    const elapsedTime = this.clock.getElapsedTime();

    if (this.animationMixer) {
      this.animationMixer.update(delta);
    }

    if (this.controls) {
      this.controls.update();
    }

    this._updateRaycaster();

    // 1. Determine active hover targets
    const hoverIds = this.manualHoverIds.length > 0
      ? this.manualHoverIds
      : (this.hoveredLayerId !== null ? [this.hoveredLayerId] : []);

    const isSurfaceActive = hoverIds.includes(5);
    const isWellsActive   = hoverIds.includes(4);
    const isPlastActive   = hoverIds.some(id => id === 1 || id === 2 || id === 3);

    // 2. Smooth exponential interpolation for alphas
    const kAlpha = 1 - Math.exp(-delta * 8.0);
    this.surfaceAlpha += ((isSurfaceActive ? 1.0 : 0.0) - this.surfaceAlpha) * kAlpha;
    this.wellsAlpha   += ((isWellsActive   ? 1.0 : 0.0) - this.wellsAlpha)   * kAlpha;
    this.rankingAlpha += ((isPlastActive   ? 1.0 : 0.0) - this.rankingAlpha) * kAlpha;

    // 3. Update surface pipeline visibility
    const showSurface = this.surfaceAlpha > 0.01;
    if (this.surfacePipelineGroup) {
      this.surfacePipelineGroup.visible = showSurface;
    }
    for (const m of this.surfaceMaterials) {
      m.opacity = this.surfaceAlpha * 0.9;
    }

    if (showSurface) {
      for (const texture of this.pipelineFlowTextures) {
        texture.offset.x = (texture.offset.x - delta * 0.5) % 1;
      }
    }

    // 4. Update wells tubes, drill bits, and data particles
    const showWells = this.wellsAlpha > 0.01;
    if (this.wellboreGroup) {
      this.wellboreGroup.visible = showWells;
    }
    if (this.dataParticles) {
      this.dataParticles.visible = showWells;
      this.dataParticles.material.opacity = this.wellsAlpha * 0.75;
    }
    for (const m of this.wellboreMaterials) {
      m.opacity = this.wellsAlpha * 0.85;
    }

    if (showWells) {
      for (const bit of this.activeDrillBits) {
        bit.group.visible = true;
        for (const m of bit.materials) {
          m.opacity = this.wellsAlpha * 0.8;
        }
        bit.cutterAssembly.rotation.y = elapsedTime * 2.6;

        const positions = bit.particleGeometry.attributes.position;
        for (let i = 0; i < bit.particleCount; i++) {
          const y = (bit.seeds[i] + elapsedTime * 18) % bit.dustHeight;
          positions.setY(i, y);
        }
        positions.needsUpdate = true;
      }
    } else {
      for (const bit of this.activeDrillBits) {
        bit.group.visible = false;
      }
    }

    // 5. Update ranking columns
    const showRanking = this.rankingAlpha > 0.01;
    if (this.rankingColumnsGroup) {
      this.rankingColumnsGroup.visible = showRanking;
    }
    for (const m of this.rankingMaterials) {
      m.opacity = this.rankingAlpha * 0.85;
    }

    // 6. Smooth gap interpolation & dynamic hover physics
    if (this.isReady) {
      this.currentGap += (this.targetGap - this.currentGap) * (1 - Math.exp(-delta * 6));
      const baseOffsets = this._computeLayerOffsets(this.currentGap);

      // Compute dynamic hover separation offsets, scale & upper-layer transparency
      const hasHover = hoverIds.length > 0;
      const maxActiveLayer = hasHover ? Math.max(...hoverIds) : -1;
      const minActiveLayer = hasHover ? Math.min(...hoverIds) : 999;

      const hoverOffsets = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      const hoverScales   = { 1: 1.0, 2: 1.0, 3: 1.0, 4: 1.0, 5: 1.0 };
      const hoverOpacities = { 1: 1.0, 2: 1.0, 3: 1.0, 4: 1.0, 5: 1.0 };

      if (hasHover) {
        for (let id = 1; id <= 5; id++) {
          if (hoverIds.includes(id)) {
            // Active layer approaches camera significantly wider and closer
            hoverScales[id] = hoverIds.length > 1 ? CONFIG_3D.HOVER_SCALE_MULTI : CONFIG_3D.HOVER_SCALE_SINGLE;
            hoverOpacities[id] = 1.0;

            if (hoverIds.length > 1) {
              if (id === maxActiveLayer) hoverOffsets[id] = +CONFIG_3D.HOVER_MULTI_SPREAD;
              else if (id === minActiveLayer) hoverOffsets[id] = -CONFIG_3D.HOVER_MULTI_SPREAD;
              else hoverOffsets[id] = 0;
            } else {
              hoverOffsets[id] = 0;
            }
          } else if (id > maxActiveLayer) {
            // Layers ABOVE active layer: shift upward as a single block.
            // Distance increases only between active layer and its neighbor; gaps between non-active layers (e.g. 4 and 5) remain unchanged.
            hoverOffsets[id] = +CONFIG_3D.HOVER_OFFSET_ABOVE;
            hoverScales[id] = CONFIG_3D.HOVER_SCALE_INACTIVE;
            hoverOpacities[id] = CONFIG_3D.HOVER_UPPER_OPACITY;
          } else if (id < minActiveLayer) {
            // Layers BELOW active layer: shift downward as a single block.
            // Distance increases only between active layer and its neighbor; gaps between non-active layers (e.g. 1 and 2) remain unchanged.
            hoverOffsets[id] = -CONFIG_3D.HOVER_OFFSET_BELOW;
            hoverScales[id] = CONFIG_3D.HOVER_SCALE_INACTIVE;
            hoverOpacities[id] = CONFIG_3D.HOVER_LOWER_OPACITY;
          }
        }
      }

      const pulseFactor = 0.75 + 0.25 * Math.sin(elapsedTime * 3.5);

      for (const [id, layer] of this.layers.entries()) {
        const isThisLayerActive = hoverIds.includes(id);

        // Target Y position combines spacebar gap offset and hover separation
        const targetY = (baseOffsets[id] || 0) + (hoverOffsets[id] || 0);
        layer.currentY += (targetY - layer.currentY) * (1 - Math.exp(-delta * 8));
        layer.group.position.y = layer.currentY;

        // Target scale: active layer approaches, other layers shrink
        layer.targetScale = hoverScales[id] || 1.0;
        layer.currentScale += (layer.targetScale - layer.currentScale) * (1 - Math.exp(-delta * 9));
        layer.pivot.scale.setScalar(layer.currentScale);

        // Physical materials opacity (upper layer becomes translucent on hover)
        layer.targetOpacity = hoverOpacities[id] || 1.0;
        layer.currentOpacity += (layer.targetOpacity - layer.currentOpacity) * (1 - Math.exp(-delta * 8));
        if (layer.physMaterials && layer.physMaterials.length > 0) {
          const depthWrite = layer.currentOpacity > 0.90;
          for (const pm of layer.physMaterials) {
            pm.opacity = layer.currentOpacity;
            pm.depthWrite = depthWrite;
          }
        }

        // Digital wireframe intensity: bright white glow on hover
        layer.targetEffectOpacity = isThisLayerActive ? 1.0 : 0.0;
        layer.effectOpacity += (layer.targetEffectOpacity - layer.effectOpacity) * (1 - Math.exp(-delta * 10));

        const wireIntensity = layer.effectOpacity * CONFIG_3D.WIREFRAME_OPACITY * pulseFactor;
        for (const wm of layer.wireMaterials) {
          wm.opacity = wireIntensity;
        }
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Cleans up Three.js resources and detaches event listeners.
   */
  dispose() {
    this.isDestroyed = true;
    window.removeEventListener('resize', this._handleWindowResize);
    this.container.removeEventListener('pointermove', this._handlePointerMove);
    this.container.removeEventListener('pointerleave', this._handlePointerLeave);

    if (this.controls) {
      this.controls.dispose();
    }

    if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      this.renderer.dispose();
    }
  }
}
