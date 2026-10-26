import * as THREE from 'three';
import { createGlowTexture } from './galaxySkybox.js';
import { MEMORIES_LIST } from '../config/memoriesData.js';
import { createEnchantedRose } from './enchantedRose.js';

const PLANET_TEXTURE_URLS = {
  venus: `${import.meta.env.BASE_URL}textures/planets/2k_venus_atmosphere.jpg`,
  venusSurface: `${import.meta.env.BASE_URL}textures/planets/2k_venus_surface.jpg`,
  earth: `${import.meta.env.BASE_URL}textures/planets/2k_earth_daymap.jpg`,
  earthClouds: `${import.meta.env.BASE_URL}textures/planets/2k_earth_clouds.jpg`,
  moon: `${import.meta.env.BASE_URL}textures/planets/2k_moon.jpg`,
  mars: `${import.meta.env.BASE_URL}textures/planets/2k_mars.jpg`,
  jupiter: `${import.meta.env.BASE_URL}textures/planets/2k_jupiter.jpg`,
  saturn: `${import.meta.env.BASE_URL}textures/planets/2k_saturn.jpg`,
  saturnRing: `${import.meta.env.BASE_URL}textures/planets/2k_saturn_ring_alpha.png`
};

export async function loadPlanetTextures({ manager = THREE.DefaultLoadingManager, onProgress } = {}) {
  const loader = new THREE.TextureLoader(manager);
  if (onProgress) {
    manager.onProgress = (_url, loaded, total) => onProgress(total ? loaded / total : 1);
  }
  const entries = await Promise.all(Object.entries(PLANET_TEXTURE_URLS).map(async ([key, url]) => {
    try {
      const texture = await loader.loadAsync(url);
      texture.colorSpace = key === 'venusSurface' ? THREE.NoColorSpace : THREE.SRGBColorSpace;
      texture.anisotropy = 4;
      texture.generateMipmaps = true;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      return [key, texture];
    } catch (error) {
      console.warn(`Planet texture unavailable (${key}); using procedural fallback.`, error);
      return [key, null];
    }
  }));
  const textures = Object.fromEntries(entries);

  // Preload only owner-provided local memory images. Remote placeholder URLs
  // stay untouched and do not delay the opening experience.
  const localMemoryImages = MEMORIES_LIST.map((memory) => memory.image).filter((image) => {
    if (!image) return false;
    try {
      return new URL(image, window.location.href).origin === window.location.origin;
    } catch {
      return false;
    }
  });
  if (localMemoryImages.length) {
    const imageLoader = new THREE.ImageLoader(manager);
    await Promise.all(localMemoryImages.map((image) => imageLoader.loadAsync(image).catch((error) => {
      console.warn(`Local memory image unavailable (${image}); it will use the card fallback.`, error);
      return null;
    })));
  }

  // The local albedo maps carry useful relief, but sampling their RGB values
  // directly as bump data produces colored/noisy highlights. Build small
  // linear grayscale height maps once, off the render loop.
  const bumpSources = {
    venus: textures.venusSurface || textures.venus,
    earth: textures.earth,
    moon: textures.moon,
    mars: textures.mars,
    jupiter: textures.jupiter,
    saturn: textures.saturn
  };
  for (const [planet, source] of Object.entries(bumpSources)) {
    if (!source?.image) continue;
    try {
      const width = Math.min(1024, source.image.width || 1024);
      const height = Math.max(1, Math.round(width / 2));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.drawImage(source.image, 0, 0, width, height);
      const pixels = context.getImageData(0, 0, width, height);
      for (let i = 0; i < pixels.data.length; i += 4) {
        const luminance = pixels.data[i] * 0.2126 + pixels.data[i + 1] * 0.7152 + pixels.data[i + 2] * 0.0722;
        pixels.data[i] = luminance;
        pixels.data[i + 1] = luminance;
        pixels.data[i + 2] = luminance;
      }
      context.putImageData(pixels, 0, 0);
      const bumpMap = new THREE.CanvasTexture(canvas);
      bumpMap.colorSpace = THREE.NoColorSpace;
      bumpMap.anisotropy = 4;
      bumpMap.generateMipmaps = true;
      bumpMap.minFilter = THREE.LinearMipmapLinearFilter;
      textures[`${planet}Bump`] = bumpMap;
    } catch (error) {
      console.warn(`Planet relief map unavailable (${planet}); keeping smooth surface.`, error);
    }
  }
  return textures;
}

/**
 * =============================================================================
 * 💖 ระบบสุริยะแห่งความรัก (Solar System of Love) — Masterclass Edition
 * 1. ศูนย์กลาง: 3D Sculpted Crystal Heart (Cinema 4D / Blender Grade)
 * 2. เส้นทางวงโคจรละอองดาวระยิบระยับ (Luminous Stardust Flowing Orbits)
 * 3. ดาวเคราะห์ 5 ดวงกระจายตัวสมดุลรอบวงกลมแบบ Golden Ratio (72° Spacing)
 * 4. ดาวเคราะห์คมชัดระดับ PBR ไร้กรอบสี่เหลี่ยม ไร้แสงส้มฟุ้ง
 * =============================================================================
 */

// Procedural high-resolution planetary surface textures
function createSeededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function createPlanetTexture(type) {
  const seed = [...type].reduce((value, char) => (value * 31 + char.charCodeAt(0)) >>> 0, 0xB612);
  const random = createSeededRandom(seed);
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  if (type === 'venus') {
    // Venus: Smooth pearlescent peach-rose marble swirls
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#ffe4e6');
    grad.addColorStop(0.25, '#fbcfe8');
    grad.addColorStop(0.5, '#f472b6');
    grad.addColorStop(0.75, '#fed7aa');
    grad.addColorStop(1, '#ffe4e6');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 35; i++) {
      ctx.beginPath();
      const y = random() * h;
      ctx.fillStyle = random() > 0.5 ? 'rgba(255, 255, 255, 0.32)' : 'rgba(244, 114, 182, 0.25)';
      ctx.ellipse(random() * w, y, 140 + random() * 180, 10 + random() * 20, 0.04 * (random() - 0.5), 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (type === 'earth') {
    // Earth: Sapphire oceans, lush emerald continents, and crisp swirling clouds
    ctx.fillStyle = '#0a2540';
    ctx.fillRect(0, 0, w, h);

    const oceanGrad = ctx.createRadialGradient(w * 0.5, h * 0.5, 40, w * 0.5, h * 0.5, w * 0.55);
    oceanGrad.addColorStop(0, '#1d4ed8');
    oceanGrad.addColorStop(1, '#0c1e3d');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, w, h);

    // Continents
    ctx.fillStyle = '#15803d';
    const landBlobs = [
      { x: 0.22 * w, y: 0.35 * h, rx: 85, ry: 120 },
      { x: 0.32 * w, y: 0.45 * h, rx: 105, ry: 85 },
      { x: 0.28 * w, y: 0.68 * h, rx: 55, ry: 105 },
      { x: 0.72 * w, y: 0.38 * h, rx: 75, ry: 95 },
      { x: 0.78 * w, y: 0.65 * h, rx: 60, ry: 110 },
      { x: 0.48 * w, y: 0.72 * h, rx: 65, ry: 45 }
    ];

    landBlobs.forEach(b => {
      ctx.beginPath();
      ctx.ellipse(b.x, b.y, b.rx, b.ry, 0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.ellipse(b.x, b.y, b.rx * 0.6, b.ry * 0.6, 0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#15803d';
    });

    // Cloud swirls
    ctx.fillStyle = 'rgba(255, 255, 255, 0.58)';
    for (let c = 0; c < 45; c++) {
      ctx.beginPath();
      ctx.ellipse(random() * w, random() * h, 70 + random() * 120, 10 + random() * 16, 0.2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (type === 'moon') {
    // Moon: Silvery-gray cratered texture
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = 'rgba(100, 116, 139, 0.4)';
      ctx.beginPath();
      ctx.arc(random() * w, random() * h, 5 + random() * 20, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (type === 'mars') {
    // Mars: Terracotta rust with bright polar ice caps
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.09, '#dc2626');
    grad.addColorStop(0.4, '#ea580c');
    grad.addColorStop(0.65, '#9a3412');
    grad.addColorStop(0.91, '#dc2626');
    grad.addColorStop(1, '#ffffff');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = 'rgba(67, 20, 7, 0.55)';
    for (let i = 0; i < 35; i++) {
      ctx.beginPath();
      ctx.ellipse(random() * w, 0.2 * h + random() * (0.6 * h), 50 + random() * 130, 10 + random() * 20, 0.05, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (type === 'jupiter') {
    // Jupiter: Amber/cream/copper bands with Great Red Spot
    const bands = [
      '#d97706', '#fef3c7', '#92400e', '#fde68a',
      '#78350f', '#fef3c7', '#b45309', '#fde68a',
      '#d97706', '#fef3c7', '#92400e', '#fef3c7'
    ];
    const bandH = h / bands.length;
    bands.forEach((color, idx) => {
      ctx.fillStyle = color;
      ctx.fillRect(0, idx * bandH, w, bandH + 2);
    });

    for (let i = 0; i < 55; i++) {
      ctx.beginPath();
      ctx.fillStyle = random() > 0.5 ? 'rgba(255, 255, 255, 0.25)' : 'rgba(120, 53, 15, 0.3)';
      ctx.ellipse(random() * w, random() * h, 70 + random() * 150, 8 + random() * 14, 0.02, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.beginPath();
    ctx.fillStyle = '#b91c1c';
    ctx.ellipse(0.65 * w, 0.62 * h, 80, 42, 0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = '#ef4444';
    ctx.ellipse(0.65 * w, 0.62 * h, 48, 22, 0.05, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'saturn') {
    // Saturn: Golden champagne elegant bands
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#fef08a');
    grad.addColorStop(0.25, '#fde047');
    grad.addColorStop(0.5, '#eab308');
    grad.addColorStop(0.75, '#ca8a04');
    grad.addColorStop(1, '#fef08a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 20; i++) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.fillRect(0, random() * h, w, 4 + random() * 10);
    }
  }

  // Fine, seeded surface grain breaks up the flat vector look without adding
  // noisy high-contrast speckles at the planet's displayed size.
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  for (let i = 0; i < 18000; i++) {
    const shade = random() > 0.5 ? 255 : 8;
    const alpha = 0.025 + random() * 0.045;
    ctx.fillStyle = `rgba(${shade}, ${shade}, ${shade}, ${alpha})`;
    const dot = 0.6 + random() * 2.2;
    ctx.fillRect(random() * w, random() * h, dot, dot * 0.65);
  }
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;

  const heightCanvas = document.createElement('canvas');
  heightCanvas.width = w;
  heightCanvas.height = h;
  const heightCtx = heightCanvas.getContext('2d');
  heightCtx.drawImage(canvas, 0, 0);
  const heightImage = heightCtx.getImageData(0, 0, w, h);
  for (let i = 0; i < heightImage.data.length; i += 4) {
    const luminance = heightImage.data[i] * 0.2126 + heightImage.data[i + 1] * 0.7152 + heightImage.data[i + 2] * 0.0722;
    const relief = THREE.MathUtils.clamp(128 + (luminance - 128) * 0.42, 0, 255);
    heightImage.data[i] = relief;
    heightImage.data[i + 1] = relief;
    heightImage.data[i + 2] = relief;
    heightImage.data[i + 3] = 255;
  }
  heightCtx.putImageData(heightImage, 0, 0);
  const bumpMap = new THREE.CanvasTexture(heightCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.ClampToEdgeWrapping;
  bumpMap.generateMipmaps = true;
  bumpMap.minFilter = THREE.LinearMipmapLinearFilter;
  bumpMap.anisotropy = texture.anisotropy;
  texture.userData.bumpMap = bumpMap;
  return texture;
}

// Saturn's crisp rings texture
function createSaturnRingTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(0.07, 'rgba(232, 219, 193, 0.16)');
  grad.addColorStop(0.16, 'rgba(202, 177, 129, 0.68)');
  grad.addColorStop(0.32, 'rgba(235, 221, 185, 0.52)');
  grad.addColorStop(0.49, 'rgba(180, 151, 101, 0.46)');
  grad.addColorStop(0.535, 'rgba(24, 20, 29, 0.76)'); // Cassini Division
  grad.addColorStop(0.57, 'rgba(223, 201, 159, 0.64)');
  grad.addColorStop(0.78, 'rgba(197, 171, 125, 0.48)');
  grad.addColorStop(0.94, 'rgba(226, 210, 177, 0.24)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Thousands of low-contrast radial gaps give the rings layered structure.
  let seed = 0x5a7a9;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < 180; i++) {
    const x = random() * canvas.width;
    const alpha = 0.025 + random() * 0.13;
    ctx.fillStyle = random() > 0.5
      ? `rgba(255, 247, 225, ${alpha})`
      : `rgba(30, 23, 34, ${alpha})`;
    ctx.fillRect(x, 0, 1 + random() * 3, canvas.height);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  return texture;
}

/**
 * Creates 3D Smooth Parametric Sculpted Heart Geometry (Cinema 4D / Blender Grade)
 * Continuous curvature on all 3 dimensions (X, Y, Z) with rounded front, back, and cleft.
 */
function create3DHeartGeometry(scale = 0.52, nu = 120, nv = 80) {
  const positions = [];
  const uvs = [];
  const indices = [];

  for (let j = 0; j <= nv; j++) {
    const v = -Math.PI / 2 + (j / nv) * Math.PI;
    const cosV = Math.cos(v);
    const sinV = Math.sin(v);

    for (let i = 0; i <= nu; i++) {
      const u = (i / nu) * Math.PI * 2;

      const x0 = 16 * Math.pow(Math.sin(u), 3);
      const y0 = 13 * Math.cos(u) - 5 * Math.cos(2 * u) - 2 * Math.cos(3 * u) - Math.cos(4 * u);
      const yc = y0 + 6.0;

      const x = scale * x0 * cosV;
      const y = scale * yc * cosV;
      const thickness = 1.0 + 0.25 * (1.0 - Math.cos(u)) * (cosV * cosV);
      const z = scale * 7.2 * sinV * thickness;

      positions.push(x, y, z);
      uvs.push(i / nu, j / nv);
    }
  }

  for (let j = 0; j < nv; j++) {
    for (let i = 0; i < nu; i++) {
      const a = j * (nu + 1) + i;
      const b = (j + 1) * (nu + 1) + i;
      const c = (j + 1) * (nu + 1) + (i + 1);
      const d = j * (nu + 1) + (i + 1);

      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

// Soft glowing circular radial particle texture (Diamond Sparkle Stardust)
function createSparkleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const c = 32;

  const grad = ctx.createRadialGradient(c, c, 0, c, c, 32);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.25, 'rgba(245, 208, 254, 0.95)');
  grad.addColorStop(0.55, 'rgba(192, 132, 252, 0.4)');
  grad.addColorStop(0.85, 'rgba(147, 51, 234, 0.12)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export function createSolarSystemHeart(scene, quality = { tier: 'high' }, { effectsEnabled = true, camera = null } = {}) {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'solarSystemHeartMaster';
  scene.add(rootGroup);

  let activeCamera = camera;
  const glowTex = createGlowTexture(64);
  const sparkleTex = createSparkleTexture();
  const interactiveMeshes = [];
  const planetsList = [];
  const orbitalParticleSystems = [];
  const orbitPathMaterials = new Map();
  let hoveredPlanetId = null;
  const memoryLineRecords = [];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let finalHeartLine = null;
  let currentStage = 'explore';
  let finaleMode = false;
  let finaleBlend = 0;
  let finaleHeartEmphasis = false;
  let finaleHeartLineScale = 1;
  let currentHeartScale = 1.0;
  let targetHeartScale = 1.0;
  let beaconsVisible = true;
  const heartOriginPos = new THREE.Vector3(0, 0, 0);
  const currentHeartPos = new THREE.Vector3(0, 0, 0);
  const targetHeartPos = new THREE.Vector3(0, 0, 0);
  let cakeRef = null;
  const finalePlanetPositions = [
    new THREE.Vector3(-32, -2, -7), new THREE.Vector3(-24, 18, -7), new THREE.Vector3(0, 28, -7),
    new THREE.Vector3(24, 18, -7), new THREE.Vector3(32, -2, -7)
  ];
  let arrivalEffect = null;
  let inTransitMode = false;

  // ===========================================================================
  // 1. The Sculpted 3D Crystalline Heart at (0, 0, 0)
  // ===========================================================================
  const heartGroup = new THREE.Group();
  heartGroup.name = 'cosmicHeartCenter';
  heartGroup.position.set(0, 0, 0);
  rootGroup.add(heartGroup);

  const heartGeo = create3DHeartGeometry(0.55, 120, 80);

  const heartMat = new THREE.MeshPhysicalMaterial({
    color: 0xdb2777,             // Deep Radiant Cosmic Rose
    emissive: 0x9333ea,          // Deep Royal Cosmic Purple (Khao Hom's favorite color)
    emissiveIntensity: 0.2,      // Let the key light reveal facets instead of washing them out
    roughness: 0.2,              // Polished crystal with enough surface definition
    metalness: 0.08,
    clearcoat: 0.76,
    clearcoatRoughness: 0.12,
    transmission: quality.tier === 'high' || quality.tier === 'ultra' ? 0.35 : 0,
    thickness: 0.7,
    ior: 1.4,
    iridescence: quality.tier === 'high' || quality.tier === 'ultra' ? 0.6 : 0,
    iridescenceIOR: 1.3,
    side: THREE.DoubleSide,      // Render both front and back cleanly from all angles
    transparent: false,
    reflectivity: 0.78
  });

  const heartMesh = new THREE.Mesh(heartGeo, heartMat);
  heartMesh.rotation.x = -0.34;
  heartMesh.castShadow = false;
  heartMesh.receiveShadow = false;
  heartGroup.add(heartMesh);

  // Soft romantic Point Light (gentle starlight, no blinding blowout)
  const heartLight = new THREE.PointLight(0xd946ef, 1.05, 36, 1.8);
  heartLight.position.set(0, 0, 0);
  heartGroup.add(heartLight);

  function createMemoryLine(startObject, endObject, color, name, pointCount = 40) {
    const positions = new Float32Array(pointCount * 3);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setDrawRange(0, 1);
    const material = new THREE.LineBasicMaterial({
      color, transparent: true, opacity: 0.72, depthWrite: false, blending: THREE.AdditiveBlending
    });
    const line = new THREE.Line(geometry, material);
    line.name = name;
    line.frustumCulled = false;
    rootGroup.add(line);
    memoryLineRecords.push({ line, startObject, endObject, pointCount, progress: 0, targetProgress: 1 });
    return line;
  }

  function createFinalHeartLine() {
    const pointCount = quality.tier === 'low' ? 96 : quality.tier === 'medium' ? 128 : 176;
    const points = [];
    for (let index = 0; index <= pointCount; index += 1) {
      const angle = (index / pointCount) * Math.PI * 2;
      points.push(new THREE.Vector3(2 * 16 * Math.sin(angle) ** 3,
        2 * (13 * Math.cos(angle) - 5 * Math.cos(2 * angle) - 2 * Math.cos(3 * angle) - Math.cos(4 * angle)), -8));
    }
    const curve = new THREE.CatmullRomCurve3(points, true, 'centripetal');
    const geometry = new THREE.TubeGeometry(curve, pointCount * 3, 0.42, 8, true);
    geometry.setDrawRange(0, 0);
    const material = new THREE.MeshBasicMaterial({ color: 0xffa5da, transparent: true, opacity: 0.32, depthWrite: false });
    finalHeartLine = new THREE.Mesh(geometry, material);
    finalHeartLine.name = 'memoryConstellationFinalHeart';
    finalHeartLine.frustumCulled = false;
    rootGroup.add(finalHeartLine);
    memoryLineRecords.push({ line: finalHeartLine, pointCount: geometry.index.count, progress: 0, targetProgress: 1, tube: true });
  }

  // Gentle Crystalline Aura Sprite (subtle romantic glow)
  const auraMat = new THREE.SpriteMaterial({
    map: glowTex,
    color: 0xd946ef,
    transparent: true,
    opacity: 0.1,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false
  });
  const auraSprite = new THREE.Sprite(auraMat);
  auraSprite.scale.set(12, 12, 1);
  heartGroup.add(auraSprite);

  // Floating Cosmic Purple Stardust Sparks (Round soft diamond glows, NO square pixels)
  const sparkCount = 36;
  const sparkGeo = new THREE.BufferGeometry();
  const sparkPositions = new Float32Array(sparkCount * 3);
  const sparkColors = new Float32Array(sparkCount * 3);
  const sparkOffsets = [];

  const sparkPalette = [
    new THREE.Color(0xd8b4fe), // Lavender
    new THREE.Color(0xf472b6), // Soft Rose
    new THREE.Color(0xc084fc), // Radiant Lilac
    new THREE.Color(0xffffff)  // Diamond Starlight
  ];

  for (let i = 0; i < sparkCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    const rad = 6.0 + Math.random() * 7.5;

    sparkPositions[i * 3] = rad * Math.sin(phi) * Math.cos(theta);
    sparkPositions[i * 3 + 1] = rad * Math.sin(phi) * Math.sin(theta);
    sparkPositions[i * 3 + 2] = rad * Math.cos(phi);

    const c = sparkPalette[Math.floor(Math.random() * sparkPalette.length)];
    sparkColors[i * 3] = c.r;
    sparkColors[i * 3 + 1] = c.g;
    sparkColors[i * 3 + 2] = c.b;

    sparkOffsets.push({
      speed: 0.4 + Math.random() * 1.0,
      phase: Math.random() * Math.PI * 2
    });
  }

  const baseSparkPositions = sparkPositions.slice();

  sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
  sparkGeo.setAttribute('color', new THREE.BufferAttribute(sparkColors, 3));

  const sparkMat = new THREE.PointsMaterial({
    size: 1.1,
    map: sparkleTex,
    vertexColors: true,
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false
  });
  const sparkPoints = new THREE.Points(sparkGeo, sparkMat);
  sparkPoints.name = 'sparkPoints';
  heartGroup.add(sparkPoints);

  // ===========================================================================
  // 2. The 5 Solar System Planets & Luminous Stardust Orbits (Golden Ratio 72° Spacing)
  // ===========================================================================
  const solarPlanetsConfig = [
    {
      id: 1,
      name: 'ดาวศุกร์ (Venus)',
      badgeTitle: '♀️ ดาวศุกร์ (Venus)',
      badgeSub: 'The First Day 🌸',
      type: 'venus',
      radius: 3.2,
      orbitRadius: 25,
      orbitSpeed: 0.16,
      initialAngle: 0.0,            // 0° (Golden Ratio Star point 1)
      inclination: 0.03,
      color: 0xf472b6,
      spinSpeed: 0.8
    },
    {
      id: 2,
      name: 'โลก & ดวงจันทร์ (Earth & Moon)',
      badgeTitle: '🌍 โลก & ดวงจันทร์ (Earth & Moon)',
      badgeSub: 'Our Safe Zone ☕',
      type: 'earth',
      radius: 4.0,
      orbitRadius: 38,
      orbitSpeed: 0.12,
      initialAngle: 1.2566,         // 72° (Golden Ratio Star point 2)
      inclination: -0.02,
      color: 0x38bdf8,
      spinSpeed: 1.0,
      hasMoon: true
    },
    {
      id: 3,
      name: 'ดาวอังคาร (Mars)',
      badgeTitle: '♂️ ดาวอังคาร (Mars)',
      badgeSub: 'The Journey 🌊',
      type: 'mars',
      radius: 2.9,
      orbitRadius: 52,
      orbitSpeed: 0.095,
      initialAngle: 2.5133,         // 144° (Golden Ratio Star point 3)
      inclination: 0.04,
      color: 0xf97316,
      spinSpeed: 0.95
    },
    {
      id: 4,
      name: 'ดาวพฤหัสบดี (Jupiter)',
      badgeTitle: '♃ ดาวพฤหัสบดี (Jupiter)',
      badgeSub: 'Beside You Always 🧸',
      type: 'jupiter',
      radius: 6.8,
      orbitRadius: 66,
      orbitSpeed: 0.07,
      initialAngle: 3.7699,         // 216° (Golden Ratio Star point 4)
      inclination: -0.03,
      color: 0xfbbf24,
      spinSpeed: 1.4
    },
    {
      id: 5,
      name: 'ดาวเสาร์ (Saturn)',
      badgeTitle: '🪐 ดาวเสาร์ (Saturn)',
      badgeSub: 'Happy Birthday My Universe 👑',
      type: 'saturn',
      radius: 5.4,
      orbitRadius: 82,
      orbitSpeed: 0.052,
      initialAngle: 5.0265,         // 288° (Golden Ratio Star point 5)
      inclination: 0.05,
      color: 0xfef08a,
      spinSpeed: 1.2,
      hasRings: true
    }
  ];

  solarPlanetsConfig.forEach((pConfig, idx) => {
    const memData = MEMORIES_LIST[idx] || MEMORIES_LIST[0];
    const tilt = new THREE.Euler(
      THREE.MathUtils.degToRad((idx % 2 ? -1 : 1) * (6 + idx * 1.5)),
      0,
      THREE.MathUtils.degToRad((idx - 2) * 3.5)
    );
    const eccentricity = 0.015 + idx * 0.006;
    const orbitPoint = (angle) => {
      const radius = pConfig.orbitRadius * (1 + eccentricity * Math.cos(angle));
      return new THREE.Vector3(
        Math.cos(angle) * radius,
        Math.sin(angle) * (pConfig.orbitRadius * pConfig.inclination),
        Math.sin(angle) * radius
      ).applyEuler(tilt);
    };

    // A fine tube gives the orbit a stable, antialiased width on WebGL devices
    // where LineBasicMaterial linewidth is ignored (Plan Round 9: 0.24, Saturn 0.32).
    const curvePoints = Array.from({ length: 192 }, (_, i) => orbitPoint((i / 192) * Math.PI * 2));
    const orbitCurve = new THREE.CatmullRomCurve3(curvePoints, true, 'centripetal');
    const pathGeo = new THREE.TubeGeometry(orbitCurve, 384, idx === 4 ? 0.32 : 0.24, 6, true);

    const pathMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(pConfig.color).lerp(new THREE.Color(0xc084fc), 0.35),
      transparent: true,
      opacity: 0.20,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false
    });
    const orbitRibbon = new THREE.Mesh(pathGeo, pathMat);
    orbitRibbon.name = `orbitPath-${pConfig.id}`;
    rootGroup.add(orbitRibbon);
    orbitPathMaterials.set(pConfig.id, pathMat);

    // 2. Orbital Stardust Sparkle Stream (อนุภาคดาวระยิบระยับวิ่งตามวงโคจร)
    const orbitSparkCount = 1;
    const orbitSparkGeo = new THREE.BufferGeometry();
    const orbitSparkPos = new Float32Array(orbitSparkCount * 3);
    const orbitSparkPhases = [];

    for (let i = 0; i < orbitSparkCount; i++) {
      const a = pConfig.initialAngle - 1.2;
      const point = orbitPoint(a);
      orbitSparkPos[i * 3] = point.x;
      orbitSparkPos[i * 3 + 1] = point.y;
      orbitSparkPos[i * 3 + 2] = point.z;
      orbitSparkPhases.push((i / orbitSparkCount) * Math.PI * 2);
    }

    orbitSparkGeo.setAttribute('position', new THREE.BufferAttribute(orbitSparkPos, 3));
    const orbitSparkMat = new THREE.PointsMaterial({
      size: 1.25,
      map: glowTex,
      color: 0xe9d5ff,
      transparent: true,
      opacity: 0.36,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const orbitSparkPoints = new THREE.Points(orbitSparkGeo, orbitSparkMat);
    orbitSparkPoints.name = `orbitStream-${pConfig.id}`;
    rootGroup.add(orbitSparkPoints);

    orbitalParticleSystems.push({
      points: orbitSparkPoints,
      radius: pConfig.orbitRadius,
      inclination: pConfig.inclination,
      speed: pConfig.orbitSpeed * 0.55,
      phases: orbitSparkPhases,
      count: orbitSparkCount,
      tilt,
      eccentricity
    });

    // 3. Planet Moving Node
    const planetNode = new THREE.Group();
    planetNode.name = `planet_${pConfig.type}_${pConfig.id}`;
    rootGroup.add(planetNode);

    // Planet Sphere (Crisp, High-Detail PBR Material, Prominent and Distinct)
    const sphereGeo = new THREE.SphereGeometry(pConfig.radius, 64, 64);
    const texture = createPlanetTexture(pConfig.type);
    const sphereMat = new THREE.MeshStandardMaterial({
      map: texture,
      bumpMap: texture.userData.bumpMap,
      bumpScale: pConfig.type === 'mars' ? 0.12 : pConfig.type === 'jupiter' ? 0.08 : 0.035,
      roughness: pConfig.type === 'venus' ? 0.62 : pConfig.type === 'earth' ? 0.86 : 0.8,
      metalness: 0.015,
      emissive: new THREE.Color(pConfig.color),
      emissiveIntensity: 0.015
    });
    const planetMesh = new THREE.Mesh(sphereGeo, sphereMat);
    planetMesh.userData.baseEmissiveIntensity = sphereMat.emissiveIntensity;
    planetMesh.userData.visited = false;
    planetNode.add(planetMesh);

    let atmosphere = null;
    if (pConfig.type === 'earth' || pConfig.type === 'venus') {
      const atmosphereMaterial = new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color(pConfig.type === 'earth' ? 0x63caff : 0xffe6bd) },
          uOpacity: { value: pConfig.type === 'earth' ? 0.42 : 0.25 }
        },
        vertexShader: `varying vec3 vNormalView; varying vec3 vViewDirection; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.0); vNormalView=normalize(normalMatrix*normal); vViewDirection=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
        fragmentShader: `uniform vec3 uColor; uniform float uOpacity; varying vec3 vNormalView; varying vec3 vViewDirection; void main(){ float rim=pow(1.0-max(dot(normalize(vNormalView),normalize(vViewDirection)),0.0),2.6); gl_FragColor=vec4(uColor,rim*uOpacity); }`,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      atmosphere = new THREE.Mesh(new THREE.SphereGeometry(pConfig.radius * 1.055, 48, 48), atmosphereMaterial);
      atmosphere.name = `${pConfig.type}AtmosphereFresnel`;
      planetNode.add(atmosphere);
    }

    // Delicate rotating soft pink indicator ring for the Next Planet (Plan Round 9)
    const nextRingGeo = new THREE.RingGeometry(pConfig.radius * 1.55, pConfig.radius * 1.78, 48);
    const nextRingMat = new THREE.MeshBasicMaterial({
      color: 0xf472b6,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const nextRingMesh = new THREE.Mesh(nextRingGeo, nextRingMat);
    nextRingMesh.rotation.x = Math.PI / 2;
    nextRingMesh.visible = false;
    planetNode.add(nextRingMesh);

    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 640;
    labelCanvas.height = 128;
    const labelContext = labelCanvas.getContext('2d');
    const labelText = `${String(pConfig.id).padStart(2, '0')} · ${memData.planetThai}`;
    labelContext.textAlign = 'center';
    labelContext.textBaseline = 'middle';
    labelContext.font = '700 42px Prompt, sans-serif';
    labelContext.lineWidth = 8;
    labelContext.strokeStyle = 'rgba(12,5,24,.9)';
    labelContext.strokeText(labelText, 320, 64);
    labelContext.fillStyle = '#fff4fd';
    labelContext.fillText(labelText, 320, 64);
    const labelTexture = new THREE.CanvasTexture(labelCanvas);
    labelTexture.colorSpace = THREE.SRGBColorSpace;
    const labelSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTexture, transparent: true, opacity: 0, depthTest: false, depthWrite: false }));
    labelSprite.scale.set(pConfig.radius * 6.5, pConfig.radius * 1.3, 1);
    labelSprite.position.set(0, pConfig.radius * 1.65, 0);
    planetNode.add(labelSprite);

    const beaconCanvas = document.createElement('canvas');
    beaconCanvas.width = 512;
    beaconCanvas.height = 128;
    const beaconContext = beaconCanvas.getContext('2d');
    const beaconTexture = new THREE.CanvasTexture(beaconCanvas);
    beaconTexture.colorSpace = THREE.SRGBColorSpace;
    const beaconMaterial = new THREE.SpriteMaterial({ map: beaconTexture, transparent: true, opacity: 0.2, depthTest: true, depthWrite: false, toneMapped: false });
    const beaconSprite = new THREE.Sprite(beaconMaterial);
    beaconSprite.name = `beaconSprite-${pConfig.id}`;
    beaconSprite.scale.set(pConfig.radius * 5.2, pConfig.radius * 1.3, 1);
    beaconSprite.position.set(0, pConfig.radius * 2.45, 0);
    planetNode.add(beaconSprite);
    const beaconName = pConfig.name.split(' ')[0];
    let beaconStatus = null;
    let beaconHovered = null;

    const drawBeacon = (status, isHovered = false) => {
      if (beaconStatus === status && beaconHovered === isHovered) return;
      beaconStatus = status;
      beaconHovered = isHovered;
      const next = status === 'next';
      const visited = status === 'visited';
      beaconContext.clearRect(0, 0, beaconCanvas.width, beaconCanvas.height);

      if (visited && !isHovered) {
        // Compact circular badge with checkmark (Plan Round 9: never crowd the scene)
        beaconContext.beginPath();
        beaconContext.arc(256, 64, 44, 0, Math.PI * 2);
        beaconContext.fillStyle = 'rgba(38, 20, 56, 0.88)';
        beaconContext.fill();
        beaconContext.lineWidth = 4;
        beaconContext.strokeStyle = 'rgba(244, 114, 182, 0.92)';
        beaconContext.stroke();
        beaconContext.fillStyle = '#fbcfe8';
        beaconContext.textAlign = 'center';
        beaconContext.textBaseline = 'middle';
        beaconContext.font = '700 52px Prompt, sans-serif';
        beaconContext.fillText('✓', 256, 64);
      } else {
        // Banner for next planet or hovered planet (short, single-line)
        beaconContext.beginPath();
        beaconContext.roundRect(16, 12, 480, 104, 52);
        beaconContext.fillStyle = visited
          ? 'rgba(39, 25, 59, .90)'
          : next
            ? 'rgba(44, 18, 72, .95)'
            : 'rgba(24, 14, 40, .85)';
        beaconContext.fill();
        beaconContext.lineWidth = next ? 6 : 3;
        beaconContext.strokeStyle = visited
          ? 'rgba(255, 188, 226, .90)'
          : next
            ? 'rgba(244, 114, 182, 1.0)'
            : 'rgba(192, 132, 252, .65)';
        beaconContext.stroke();

        beaconContext.fillStyle = visited ? '#ffd2ec' : next ? '#fff0f8' : '#e6daf4';
        beaconContext.textAlign = 'center';
        beaconContext.textBaseline = 'middle';
        beaconContext.font = next ? '700 48px Prompt, sans-serif' : '600 44px Prompt, sans-serif';
        const prefix = visited ? '✓' : next ? '👉' : String(pConfig.id).padStart(2, '0');
        beaconContext.fillText(`${prefix} · ${beaconName}`, 256, 64, 440);
      }
      beaconTexture.needsUpdate = true;
    };
    drawBeacon('locked');

    // Subtle Atmospheric Rim Glow (Makes each planet pop out as a luminous celestial jewel)
    const planetGlowMat = new THREE.SpriteMaterial({
      map: glowTex,
      color: new THREE.Color(pConfig.color),
      transparent: true,
      opacity: 0.045,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const planetGlow = new THREE.Sprite(planetGlowMat);
    planetGlow.scale.set(pConfig.radius * 1.75, pConfig.radius * 1.75, 1);
    planetNode.add(planetGlow);

    // 4. Moon for Earth
    let moonNode = null;
    let moonMesh = null;
    if (pConfig.hasMoon) {
      moonNode = new THREE.Group();
      planetNode.add(moonNode);

      const moonGeo = new THREE.SphereGeometry(1.15, 32, 32);
      const moonTex = createPlanetTexture('moon');
      const moonMat = new THREE.MeshStandardMaterial({
        map: moonTex,
        bumpMap: moonTex.userData.bumpMap,
        bumpScale: 0.16,
        roughness: 0.92,
        metalness: 0.0,
        emissive: 0x6b5a8c,
        emissiveIntensity: 0.008
      });
      moonMesh = new THREE.Mesh(moonGeo, moonMat);
      moonMesh.position.set(7.0, 1.0, 0);
      moonNode.add(moonMesh);

      const moonOrbitGeo = new THREE.BufferGeometry();
      const mSegs = 48;
      const mPos = new Float32Array((mSegs + 1) * 3);
      for (let m = 0; m <= mSegs; m++) {
        const ma = (m / mSegs) * Math.PI * 2;
        mPos[m * 3] = Math.cos(ma) * 7.0;
        mPos[m * 3 + 1] = 0;
        mPos[m * 3 + 2] = Math.sin(ma) * 7.0;
      }
      moonOrbitGeo.setAttribute('position', new THREE.BufferAttribute(mPos, 3));
      const moonOrbitMat = new THREE.LineBasicMaterial({
        color: 0xc084fc,
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending
      });
      const moonOrbitLine = new THREE.Line(moonOrbitGeo, moonOrbitMat);
      moonNode.add(moonOrbitLine);
    }

    // 5. Saturn Rings
    let saturnRingMesh = null;
    if (pConfig.hasRings) {
      const ringGeo = new THREE.RingGeometry(pConfig.radius * 1.35, pConfig.radius * 2.45, 96);
      const pos = ringGeo.attributes.position;
      const uvs = ringGeo.attributes.uv;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const d = Math.sqrt(x * x + y * y);
        const u = (d - pConfig.radius * 1.35) / (pConfig.radius * 2.45 - pConfig.radius * 1.35);
        uvs.setXY(i, u, 0.5);
      }
      ringGeo.uvsNeedUpdate = true;

      const ringTex = createSaturnRingTexture();
      const ringMat = new THREE.MeshStandardMaterial({
        map: ringTex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.78,
        roughness: 0.72,
        metalness: 0.025,
        blending: THREE.NormalBlending
      });
      saturnRingMesh = new THREE.Mesh(ringGeo, ringMat);
      saturnRingMesh.rotation.x = Math.PI / 2 + 0.42;
      saturnRingMesh.rotation.y = 0.25;
      planetNode.add(saturnRingMesh);

      const shadowCanvas = document.createElement('canvas');
      shadowCanvas.width = 256;
      shadowCanvas.height = 64;
      const shadowContext = shadowCanvas.getContext('2d');
      const shadowGradient = shadowContext.createLinearGradient(0, 0, 256, 0);
      shadowGradient.addColorStop(0, 'rgba(8,5,18,0)');
      shadowGradient.addColorStop(0.35, 'rgba(8,5,18,0.1)');
      shadowGradient.addColorStop(0.5, 'rgba(8,5,18,0.72)');
      shadowGradient.addColorStop(0.65, 'rgba(8,5,18,0.1)');
      shadowGradient.addColorStop(1, 'rgba(8,5,18,0)');
      shadowContext.fillStyle = shadowGradient;
      shadowContext.fillRect(0, 0, 256, 64);
      const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
      const ringShadow = new THREE.Mesh(new THREE.PlaneGeometry(pConfig.radius * 2.1, pConfig.radius * 0.3), new THREE.MeshBasicMaterial({
        map: shadowTexture, transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide
      }));
      ringShadow.rotation.copy(saturnRingMesh.rotation);
      ringShadow.position.set(-pConfig.radius * 0.65, 0, 0.06);
      ringShadow.renderOrder = 2;
      planetNode.add(ringShadow);
    }

    // 6. Interactive Hitbox (Plan Round 9: Generous radius ensuring >= 44x44px tap target on mobile)
    const hitGeo = new THREE.SphereGeometry(pConfig.radius * 2.2, 16, 16);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });
    const hitMesh = new THREE.Mesh(hitGeo, hitMat);
    hitMesh.userData = {
      planetId: pConfig.id,
      memoryId: pConfig.id,
      planetConfig: pConfig,
      parentGroup: planetNode,
      planetMesh: planetMesh
    };
    planetNode.add(hitMesh);
    interactiveMeshes.push(hitMesh);

    let cloudLayer = null;
    if (pConfig.type === 'earth') {
      const cloudMaterial = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0.24,
        blending: THREE.NormalBlending,
        depthWrite: false,
        toneMapped: true
      });
      cloudLayer = new THREE.Mesh(new THREE.SphereGeometry(pConfig.radius * 1.012, 64, 64), cloudMaterial);
      cloudLayer.name = 'earthCloudLayer';
      planetMesh.add(cloudLayer);

      const cityCanvas = document.createElement('canvas');
      cityCanvas.width = 512;
      cityCanvas.height = 256;
      const cityContext = cityCanvas.getContext('2d');
      cityContext.clearRect(0, 0, 512, 256);
      const cityCenters = Array.from({ length: 15 }, () => [Math.random() * 512, 46 + Math.random() * 164]);
      cityCenters.forEach(([cx, cy]) => {
        const cities = 14 + Math.floor(Math.random() * 24);
        for (let city = 0; city < cities; city += 1) {
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * (4 + Math.random() * 20);
          cityContext.fillStyle = `rgba(255, 210, 128, ${0.2 + Math.random() * 0.7})`;
          cityContext.beginPath();
          cityContext.arc(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius, 0.4 + Math.random() * 0.8, 0, Math.PI * 2);
          cityContext.fill();
        }
      });
      const cityTexture = new THREE.CanvasTexture(cityCanvas);
      const cityLights = new THREE.Mesh(new THREE.SphereGeometry(pConfig.radius * 1.008, 48, 48), new THREE.ShaderMaterial({
        uniforms: { uMap: { value: cityTexture } },
        vertexShader: `varying vec2 vUv; varying vec3 vWorldPosition; varying vec3 vWorldNormal; void main(){ vUv=uv; vec4 world=modelMatrix*vec4(position,1.0); vWorldPosition=world.xyz; vWorldNormal=normalize(mat3(modelMatrix)*normal); gl_Position=projectionMatrix*viewMatrix*world; }`,
        fragmentShader: `uniform sampler2D uMap; varying vec2 vUv; varying vec3 vWorldPosition; varying vec3 vWorldNormal; void main(){ vec4 lights=texture2D(uMap,vUv); float lit=dot(normalize(vWorldNormal),normalize(-vWorldPosition)); float night=1.0-smoothstep(-0.18,0.12,lit); float alpha=lights.a*night*0.92; gl_FragColor=vec4(vec3(1.0,0.68,0.28),alpha); }`,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
      }));
      cityLights.name = 'proceduralEarthCityLights';
      planetMesh.add(cityLights);
    }

    planetsList.push({
      id: pConfig.id,
      config: pConfig,
      memory: memData,
      group: planetNode,
      mesh: planetMesh,
      atmosphere,
      nextRingMesh,
      cloudLayer,
      moonNode: moonNode,
      saturnRing: saturnRingMesh,
      labelSprite,
      beaconSprite,
      drawBeacon,
      hitMesh: hitMesh
    });
  });

  const enchantedRose = createEnchantedRose(scene);
  scene.remove(enchantedRose.group);
  const saturnPlanet = planetsList.find((planet) => planet.id === 5);
  if (saturnPlanet) {
    enchantedRose.group.position.set(0, saturnPlanet.config.radius * 1.35, 0);
    enchantedRose.group.scale.setScalar(0.22);
    enchantedRose.group.visible = false;
    saturnPlanet.group.add(enchantedRose.group);
  }

  // Screen Space HTML Tooltip
  let tooltipEl = document.getElementById('planet-hover-tooltip');
  if (!tooltipEl) {
    tooltipEl = document.createElement('div');
    tooltipEl.id = 'planet-hover-tooltip';
    tooltipEl.className = 'planet-tooltip hidden';
    document.body.appendChild(tooltipEl);
  }

  // ===========================================================================
  // 3. Update & Animation Loop
  // ===========================================================================
  return {
    group: rootGroup,
    heartGroup: heartGroup,
    interactiveMeshes: interactiveMeshes,
    planetsList: planetsList,

    setPlanetTextures(textures) {
      const assignMap = (material, texture, bumpMap, fallbackTexture) => {
        if (!texture) return;
        const previousMap = material.map;
        const previousBump = material.bumpMap;
        material.map = texture;
        material.bumpMap = bumpMap || null;
        material.bumpScale = 0.06;
        material.needsUpdate = true;
        if (previousMap && previousMap !== texture) previousMap.dispose();
        if (previousBump && previousBump !== bumpMap) previousBump.dispose();
        fallbackTexture?.userData?.bumpMap?.dispose();
      };
      planetsList.forEach((planet) => {
        const type = planet.config.type;
        const bumpScale = { venus: 0.025, earth: 0.045, moon: 0.14, mars: 0.16, jupiter: 0.035, saturn: 0.025 }[type] ?? 0.05;
        assignMap(planet.mesh.material, textures[type], textures[`${type}Bump`], planet.mesh.material.map);
        planet.mesh.material.bumpScale = bumpScale;
        if (planet.cloudLayer && textures.earthClouds) {
          planet.cloudLayer.material.map = textures.earthClouds;
          planet.cloudLayer.material.needsUpdate = true;
        }
        if (planet.config.hasMoon && textures.moon) {
          const moonMesh = planet.moonNode?.children.find((child) => child.isMesh);
          if (moonMesh) {
            assignMap(moonMesh.material, textures.moon, textures.moonBump, moonMesh.material.map);
            moonMesh.material.bumpScale = 0.14;
          }
        }
        if (planet.saturnRing && textures.saturnRing) {
          planet.saturnRing.material.map = textures.saturnRing;
          planet.saturnRing.material.needsUpdate = true;
        }
      });
    },

    setQuality(nextQuality) {
      const premiumTier = nextQuality.tier === 'high' || nextQuality.tier === 'ultra';
      heartMat.transmission = premiumTier ? 0.35 : 0;
      heartMat.iridescence = premiumTier ? 0.6 : 0;
      heartMat.needsUpdate = true;
    },

    setCakeRef(cakeInstance) {
      cakeRef = cakeInstance;
    },

    setStage(stageName) {
      currentStage = stageName;
      if (stageName === 'cake') {
        finaleMode = true;
        heartGroup.name = 'heartTopper';
        heartGroup.visible = true;
        targetHeartScale = 0.3;
        planetsList.forEach((planet) => { planet.group.visible = false; });
        for (const [id, material] of orbitPathMaterials.entries()) {
          material.opacity = 0;
          const ribbon = rootGroup.getObjectByName(`orbitPath-${id}`);
          if (ribbon) ribbon.visible = false;
        }
        orbitalParticleSystems.forEach((ops) => {
          ops.points.visible = false;
          ops.points.material.opacity = 0;
        });
        sparkPoints.visible = false;
        memoryLineRecords.forEach((record) => { record.line.visible = false; });
        if (finalHeartLine) finalHeartLine.visible = false;
        planetsList.forEach((planet) => {
          if (planet.beaconSprite) planet.beaconSprite.visible = false;
          if (planet.labelSprite) planet.labelSprite.visible = false;
        });
        if (enchantedRose?.group) enchantedRose.group.visible = false;
      } else if (stageName === 'finale-align') {
        finaleMode = true;
        finaleHeartEmphasis = false;
        heartGroup.name = 'cosmicHeartCenter';
        heartGroup.visible = true;
        targetHeartScale = 1.0;
        targetHeartPos.set(0, 0, 0);
        planetsList.forEach((planet) => { planet.group.visible = true; });
        for (const [id, material] of orbitPathMaterials.entries()) {
          material.opacity = 0.08;
          const ribbon = rootGroup.getObjectByName(`orbitPath-${id}`);
          if (ribbon) ribbon.visible = true;
        }
        orbitalParticleSystems.forEach((ops) => {
          ops.points.visible = true;
          ops.points.material.opacity = 0.12;
        });
        sparkPoints.visible = true;
        memoryLineRecords.forEach((record) => { record.line.visible = true; });
        if (!finalHeartLine && planetsList.every((planet) => planet.mesh.userData.visited)) createFinalHeartLine();
        if (finalHeartLine) finalHeartLine.visible = true;
        planetsList.forEach((planet) => {
          if (planet.beaconSprite) planet.beaconSprite.visible = false;
          if (planet.labelSprite) planet.labelSprite.visible = false;
        });
        if (enchantedRose?.group) enchantedRose.group.visible = false;
      } else if (stageName === 'finale-heart') {
        finaleMode = true;
        finaleHeartEmphasis = true;
        heartGroup.name = 'cosmicHeartCenter';
        heartGroup.visible = true;
        targetHeartScale = 1.0;
        targetHeartPos.set(0, 0, 0);
        planetsList.forEach((planet) => { planet.group.visible = true; });
        for (const [id, material] of orbitPathMaterials.entries()) {
          material.opacity = 0.08;
          const ribbon = rootGroup.getObjectByName(`orbitPath-${id}`);
          if (ribbon) ribbon.visible = true;
        }
        orbitalParticleSystems.forEach((ops) => {
          ops.points.visible = false;
          ops.points.material.opacity = 0;
        });
        sparkPoints.visible = true;
        memoryLineRecords.forEach((record) => { record.line.visible = true; });
        if (!finalHeartLine && planetsList.every((planet) => planet.mesh.userData.visited)) createFinalHeartLine();
        if (finalHeartLine) finalHeartLine.visible = true;
        planetsList.forEach((planet) => {
          if (planet.beaconSprite) planet.beaconSprite.visible = false;
          if (planet.labelSprite) planet.labelSprite.visible = false;
        });
        if (enchantedRose?.group) enchantedRose.group.visible = false;
      } else {
        // 'explore' or 'epilogue'
        finaleMode = false;
        finaleHeartEmphasis = false;
        heartGroup.name = 'cosmicHeartCenter';
        heartGroup.visible = true;
        targetHeartScale = 1.0;
        targetHeartPos.set(0, 0, 0);
        planetsList.forEach((planet) => { planet.group.visible = true; });
        for (const [id, material] of orbitPathMaterials.entries()) {
          const p = planetsList.find((planet) => planet.id === id);
          material.opacity = p?.mesh.userData.visited ? 0.28 : 0.13;
          const ribbon = rootGroup.getObjectByName(`orbitPath-${id}`);
          if (ribbon) ribbon.visible = true;
        }
        orbitalParticleSystems.forEach((ops) => {
          ops.points.visible = true;
          ops.points.material.opacity = 0.36;
        });
        sparkPoints.visible = true;
        memoryLineRecords.forEach((record) => { record.line.visible = true; });
        if (finalHeartLine) finalHeartLine.visible = true;
        planetsList.forEach((planet) => {
          if (planet.beaconSprite) planet.beaconSprite.visible = true;
        });
        if (enchantedRose?.group) enchantedRose.group.visible = true;
      }
    },

    setFinaleMode(enabled) {
      if (enabled) {
        if (currentStage !== 'cake' && currentStage !== 'finale-heart') this.setStage('finale-align');
      } else {
        this.setStage('explore');
      }
    },

    setFinaleHeart(enabled) {
      if (enabled) this.setStage('finale-heart');
      else if (currentStage === 'finale-heart') this.setStage('finale-align');
    },

    setCakeStage(enabled) {
      if (enabled) this.setStage('cake');
      else this.setStage('explore');
    },

    showFinalRose() {
      enchantedRose.group.visible = true;
    },

    setStageDimmed(dimmed) {
      if (heartGroup) {
        heartGroup.traverse((child) => {
          if (child.material) {
            if (child.userData.origOpacity === undefined) {
              child.userData.origOpacity = child.material.opacity ?? 1.0;
            }
            child.material.transparent = true;
            child.material.opacity = dimmed ? child.userData.origOpacity * 0.15 : child.userData.origOpacity;
          }
        });
      }
      for (const p of planetsList) {
        if (p.mesh?.material) {
          if (p.mesh.userData.origOpacity === undefined) {
            p.mesh.userData.origOpacity = p.mesh.material.opacity ?? 1.0;
          }
          p.mesh.material.transparent = true;
          p.mesh.material.opacity = dimmed ? p.mesh.userData.origOpacity * 0.15 : p.mesh.userData.origOpacity;
        }
      }
    },

    cancelArrivalEffect() {
      if (arrivalEffect) {
        rootGroup.remove(arrivalEffect.points);
        arrivalEffect.geometry.dispose();
        arrivalEffect.material.dispose();
        arrivalEffect = null;
      }
      this.setTransitMode(false);
    },

    startArrivalShape({ reducedMotion = false, onComplete, qaPreview = false, camera = activeCamera } = {}) {
      if (arrivalEffect) {
        arrivalEffect.onComplete = onComplete;
        return;
      }
      if (camera) activeCamera = camera;
      const cam = activeCamera;

      // 1. Stage Clearing: Completely hide orbits, planets, center heart and beacons during particle arrival
      rootGroup.visible = true;
      this.setBeaconsVisible(false);
      this.setOrbitsVisible(false);
      this.setOrbitsOpacity(0.0);
      heartGroup.visible = false;
      planetsList.forEach(p => { p.group.visible = false; });

      // 2. High-Resolution Canvas (800x280) for Heart and "ข้าวหอม"
      const shapeCanvas = document.createElement('canvas');
      shapeCanvas.width = 800;
      shapeCanvas.height = 280;
      const context = shapeCanvas.getContext('2d', { willReadFrequently: true });

      // Draw romantic Heart Shape centered at (400, 140)
      context.fillStyle = '#fff';
      context.beginPath();
      context.moveTo(400, 245);
      context.bezierCurveTo(340, 190, 200, 120, 200, 55);
      context.bezierCurveTo(200, 0, 300, -10, 400, 65);
      context.bezierCurveTo(500, -10, 600, 0, 600, 55);
      context.bezierCurveTo(600, 120, 460, 190, 400, 245);
      context.fill();

      const imgDataHeart = context.getImageData(0, 0, 800, 280);
      const heartCoords = [];
      for (let y = 0; y < 280; y += 2) {
        for (let x = 0; x < 800; x += 2) {
          if (imgDataHeart.data[(y * 800 + x) * 4 + 3] > 40) {
            heartCoords.push([x, y]);
          }
        }
      }

      // Draw "ข้าวหอม" with Thai typography
      context.clearRect(0, 0, 800, 280);
      context.fillStyle = '#fff';
      context.font = '900 144px "Prompt", "Kanit", "Noto Sans Thai", sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText('ข้าวหอม', 400, 140);

      const imgDataWord = context.getImageData(0, 0, 800, 280);
      const pix = imgDataWord.data;
      const bodyCoords = [];
      const edgeCoords = [];
      for (let y = 2; y < 278; y += 1) {
        for (let x = 2; x < 798; x += 1) {
          const idx = (y * 800 + x) * 4 + 3;
          const a = pix[idx];
          if (a > 45) {
            bodyCoords.push([x, y]);
            if (pix[idx - 4] < 30 || pix[idx + 4] < 30 || pix[idx - 800 * 4] < 30 || pix[idx + 800 * 4] < 30) {
              edgeCoords.push([x, y]);
            }
          }
        }
      }

      // Robust fallback if custom font failed to render
      if (bodyCoords.length < 50) {
        context.clearRect(0, 0, 800, 280);
        context.fillStyle = '#fff';
        context.font = 'bold 144px sans-serif';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText('ข้าวหอม', 400, 140);
        const fbPix = context.getImageData(0, 0, 800, 280).data;
        for (let y = 2; y < 278; y += 1) {
          for (let x = 2; x < 798; x += 1) {
            const idx = (y * 800 + x) * 4 + 3;
            if (fbPix[idx] > 45) {
              bodyCoords.push([x, y]);
              if (fbPix[idx - 4] < 30 || fbPix[idx + 4] < 30 || fbPix[idx - 800 * 4] < 30 || fbPix[idx + 800 * 4] < 30) {
                edgeCoords.push([x, y]);
              }
            }
          }
        }
      }

      // Keep the reduced-motion lettering dense enough to read while rendering no travel animation.
      // The static reduced-motion pass is cheaper than animating the full desktop particle field.
      const isMobile = typeof window !== 'undefined' && window.innerWidth <= 520;
      const count = reducedMotion
        ? 1400
        : quality.tier === 'low'
          ? 900
          : isMobile
            ? 1600
            : 2600;

      const starts = new Float32Array(count * 3);
      const heartTargets = new Float32Array(count * 3);
      const letterTargets = new Float32Array(count * 3);
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      const randoms = new Float32Array(count);

      const cPink = new THREE.Color(0xf9a8d4);
      const cLavender = new THREE.Color(0xc084fc);
      const cWhite = new THREE.Color(0xffffff);

      const bodyRatio = 0.65;
      const bodyCount = Math.floor(count * bodyRatio);
      const edgeCount = count - bodyCount;
      const bodyStride = bodyCoords.length / Math.max(1, bodyCount);
      const edgeList = edgeCoords.length ? edgeCoords : bodyCoords;
      const edgeStride = edgeList.length / Math.max(1, edgeCount);

      for (let i = 0; i < count; i += 1) {
        let lx, ly;
        if (i < bodyCount) {
          const idx = Math.floor(i * bodyStride) % bodyCoords.length;
          lx = bodyCoords[idx][0] + (Math.random() - 0.5) * 0.7;
          ly = bodyCoords[idx][1] + (Math.random() - 0.5) * 0.7;
        } else {
          const eIdx = (i - bodyCount);
          const idx = Math.floor(eIdx * edgeStride) % edgeList.length;
          lx = edgeList[idx][0] + (Math.random() - 0.5) * 0.4;
          ly = edgeList[idx][1] + (Math.random() - 0.4);
        }

        const hp = heartCoords.length ? heartCoords[Math.floor(Math.random() * heartCoords.length)] : [400, 140];

        // Sphere explosion start distribution
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const r = 120 + Math.random() * 110;
        const sinPhi = Math.sin(phi);
        const start = [
          r * sinPhi * Math.cos(theta),
          r * sinPhi * Math.sin(theta),
          r * Math.cos(phi)
        ];
        starts.set(start, i * 3);
        positions.set(start, i * 3);

        const zJitter = (Math.random() - 0.5) * 1.5;
        heartTargets.set([(hp[0] - 400) * 0.52, (140 - hp[1]) * 0.52, (Math.random() - 0.5) * 2.5], i * 3);
        letterTargets.set([(lx - 400) * 0.52, (140 - ly) * 0.52, zJitter], i * 3);

        const tColor = THREE.MathUtils.clamp((lx - 160) / 480, 0, 1);
        const col = new THREE.Color();
        if (Math.random() < 0.20) {
          col.copy(cWhite);
        } else if (tColor < 0.5) {
          col.lerpColors(cPink, cLavender, tColor * 2.0);
        } else {
          col.lerpColors(cLavender, cWhite, (tColor - 0.5) * 2.0);
        }
        col.toArray(colors, i * 3);
        randoms[i] = Math.random();
      }

      if (qaPreview || reducedMotion) {
        positions.set(letterTargets);
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const pointPx = Math.max(3.6, Math.min(window.devicePixelRatio || 1, 2) * 3.6);
      const material = new THREE.PointsMaterial({
        map: sparkleTex,
        vertexColors: true,
        size: pointPx,
        sizeAttenuation: false,
        transparent: true,
        opacity: qaPreview ? 1.0 : 0.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false
      });

      const points = new THREE.Points(geometry, material);
      points.name = 'arrivalHeartParticleReveal';
      points.position.copy(heartGroup.position);
      if (cam) points.quaternion.copy(cam.quaternion);

      const updateBillboardScale = () => {
        if (!cam) return;
        points.position.copy(heartGroup.position);
        points.quaternion.copy(cam.quaternion);
        const dist = cam.position.distanceTo(points.position);
        const fovRad = THREE.MathUtils.degToRad(cam.fov);
        const vHeight = 2 * dist * Math.tan(fovRad / 2);
        const vWidth = vHeight * cam.aspect;
        const isPortrait = cam.aspect < 1.0;
        const targetWidth = isPortrait ? vWidth * 0.82 : vWidth * 0.50;
        const s = targetWidth / 250;
        points.scale.set(s, s, s);
      };
      updateBillboardScale();
      rootGroup.add(points);

      arrivalEffect = {
        geometry,
        material,
        points,
        starts,
        heartTargets,
        letterTargets,
        randoms,
        updateBillboardScale,
        elapsed: qaPreview ? 2.6 : (reducedMotion ? 0.02 : 0),
        travel: reducedMotion ? 0.01 : 1.4,
        letterTravel: reducedMotion ? 0.01 : 0.8,
        hold: qaPreview ? 30 : (reducedMotion ? 1.5 : 2.5),
        burst: reducedMotion ? 0.08 : 0.6,
        fade: reducedMotion ? 0.12 : 0.35,
        onComplete: () => {
          this.setTransitMode(false);
          onComplete?.();
        }
      };
    },

    update(delta, orbitTime, realTime = orbitTime, musicBass = 0, camera = activeCamera) {
      if (camera) activeCamera = camera;
      if (enchantedRose.group.visible) enchantedRose.update(delta, realTime);
      if (arrivalEffect) {
        const effect = arrivalEffect;
        effect.elapsed += delta;
        effect.updateBillboardScale();
        const positions = effect.geometry.attributes.position.array;
        const letterStart = effect.travel;
        const holdStart = letterStart + effect.letterTravel;
        const burstStart = holdStart + effect.hold;
        const finishTime = burstStart + effect.burst;

        const count = effect.starts.length / 3;

        if (effect.elapsed < letterStart) {
          const p = THREE.MathUtils.clamp(effect.elapsed / effect.travel, 0, 1);
          const ease = p * p * (3 - 2 * p);
          for (let i = 0; i < count; i += 1) {
            const i3 = i * 3;
            const angle = (1 - ease) * 1.8;
            const cosA = Math.cos(angle);
            const sinA = Math.sin(angle);
            const sx = effect.starts[i3];
            const sy = effect.starts[i3 + 1];
            const sz = effect.starts[i3 + 2];
            const rotX = sx * cosA - sy * sinA;
            const rotY = sx * sinA + sy * cosA;
            positions[i3] = THREE.MathUtils.lerp(rotX, effect.heartTargets[i3], ease);
            positions[i3 + 1] = THREE.MathUtils.lerp(rotY, effect.heartTargets[i3 + 1], ease);
            positions[i3 + 2] = THREE.MathUtils.lerp(sz, effect.heartTargets[i3 + 2], ease);
          }
          effect.material.opacity = Math.min(1.0, p * 1.6);
        } else if (effect.elapsed < holdStart) {
          const p = THREE.MathUtils.clamp((effect.elapsed - letterStart) / effect.letterTravel, 0, 1);
          const ease = p * p * (3 - 2 * p);
          for (let i = 0; i < count; i += 1) {
            const i3 = i * 3;
            positions[i3] = THREE.MathUtils.lerp(effect.heartTargets[i3], effect.letterTargets[i3], ease);
            positions[i3 + 1] = THREE.MathUtils.lerp(effect.heartTargets[i3 + 1], effect.letterTargets[i3 + 1], ease);
            positions[i3 + 2] = THREE.MathUtils.lerp(effect.heartTargets[i3 + 2], effect.letterTargets[i3 + 2], ease);
          }
          effect.material.opacity = 1.0;
        } else if (effect.elapsed < burstStart) {
          for (let i = 0; i < count; i += 1) {
            const i3 = i * 3;
            const twinkle = reducedMotion ? 0 : Math.sin(realTime * 5.0 + effect.randoms[i] * 6.28) * 0.4;
            positions[i3] = effect.letterTargets[i3];
            positions[i3 + 1] = effect.letterTargets[i3 + 1];
            positions[i3 + 2] = effect.letterTargets[i3 + 2] + twinkle;
          }
          effect.material.opacity = 1.0;
        } else if (effect.elapsed < finishTime) {
          heartGroup.visible = true;
          const p = THREE.MathUtils.clamp((effect.elapsed - burstStart) / effect.burst, 0, 1);
          const ease = p * p;
          for (let i = 0; i < count; i += 1) {
            const i3 = i * 3;
            positions[i3] = THREE.MathUtils.lerp(effect.letterTargets[i3], 0, ease);
            positions[i3 + 1] = THREE.MathUtils.lerp(effect.letterTargets[i3 + 1], 0, ease);
            positions[i3 + 2] = THREE.MathUtils.lerp(effect.letterTargets[i3 + 2], 0, ease);
          }
          effect.material.opacity = THREE.MathUtils.clamp(1.0 - p * 1.5, 0, 1);
        } else {
          rootGroup.remove(effect.points);
          effect.geometry.dispose();
          effect.material.dispose();
          const doneFn = effect.onComplete;
          arrivalEffect = null;
          doneFn?.();
        }
        if (arrivalEffect) {
          effect.geometry.attributes.position.needsUpdate = true;
        }
      }
      if (currentStage === 'cake') {
        const cakeY = cakeRef?.group ? cakeRef.group.position.y : -3;
        targetHeartPos.set(0, cakeY + 24 * 2.05, -5);
      }
      currentHeartPos.lerp(targetHeartPos, reducedMotion ? 1 : Math.min(1, delta * 4.0));
      heartGroup.position.copy(currentHeartPos);
      currentHeartScale = THREE.MathUtils.damp(currentHeartScale, targetHeartScale, reducedMotion ? 8 : 3.5, delta);

      // 1. Realistic Biomimetic Heartbeat Pulse
      const cycle = (realTime * 2.2) % (Math.PI * 2);
      let beat = 0;
      if (cycle < 0.6) {
        beat = Math.sin(cycle * (Math.PI / 0.6)) * 0.14;
      } else if (cycle > 0.8 && cycle < 1.4) {
        beat = Math.sin((cycle - 0.8) * (Math.PI / 0.6)) * 0.08;
      }

      beat += Math.min(0.08, musicBass * 0.12);
      const heartScale = (1.0 + beat) * currentHeartScale;
      heartMesh.scale.set(heartScale, heartScale, heartScale);
      heartLight.intensity = (1.45 + beat * 1.2) * (currentStage === 'cake' ? 0.35 : 1.0);
      auraSprite.scale.set((16 + beat * 2) * currentHeartScale, (16 + beat * 2) * currentHeartScale, 1);

      // Pulse spark particles gently
      if (sparkPoints.visible) {
        const positions = sparkPoints.geometry.attributes.position.array;
        for (let i = 0; i < sparkCount; i++) {
          positions[i * 3] = baseSparkPositions[i * 3] + Math.sin(realTime * 0.7 + i) * 0.12;
          positions[i * 3 + 1] = baseSparkPositions[i * 3 + 1] + Math.sin(realTime * 1.5 + i) * 0.12;
          positions[i * 3 + 2] = baseSparkPositions[i * 3 + 2] + Math.cos(realTime * 0.7 + i) * 0.12;
        }
        sparkPoints.geometry.attributes.position.needsUpdate = true;
        sparkPoints.rotation.y += delta * 0.06;
      }

      const targetBlend = (currentStage === 'finale-align' || currentStage === 'finale-heart' || currentStage === 'cake') ? 1.0 : 0.0;
      finaleBlend = THREE.MathUtils.damp(finaleBlend, targetBlend, reducedMotion ? 8 : 1.8, delta);

      // 2. Planets Orbital Motion & Self-Spin
      const isPortrait = activeCamera && activeCamera.aspect < 1.0;
      const visualScale = isPortrait ? 1.5 : 1.3;
      const nextPlanet = planetsList.find((planet) => !planet.mesh.userData.visited);

      planetsList.forEach(p => {
        // Visual display scaling (Plan Round 9: x1.3 desktop, x1.5 portrait mobile)
        p.mesh.scale.setScalar(visualScale);
        if (p.atmosphere) p.atmosphere.scale.setScalar(visualScale);
        if (p.saturnRing) p.saturnRing.scale.setScalar(visualScale);

        const status = p.mesh.userData.visited ? 'visited' : p === nextPlanet ? 'next' : 'locked';
        const isHovered = (p.id === hoveredPlanetId);
        const isNext = (p === nextPlanet);
        const isVisited = p.mesh.userData.visited;

        // Show beacon only for next planet, visited planet badge, or hovered (Plan Round 9)
        const shouldShowBeacon = beaconsVisible && !finaleMode && currentStage !== 'cake' && (isNext || isVisited || isHovered);
        p.beaconSprite.visible = shouldShowBeacon;
        p.drawBeacon?.(status, isHovered);

        if (isVisited && !isHovered) {
          p.beaconSprite.scale.set(p.config.radius * 1.35, p.config.radius * 1.35, 1);
          p.beaconSprite.position.set(0, p.config.radius * (visualScale * 1.25), 0);
          p.beaconSprite.material.opacity = 0.85;
        } else {
          p.beaconSprite.scale.set(
            p.config.radius * (isNext ? 4.8 : 4.0),
            p.config.radius * (isNext ? 1.3 : 1.1),
            1
          );
          p.beaconSprite.position.set(0, p.config.radius * (visualScale * 1.6), 0);
          p.beaconSprite.material.opacity = isNext ? (effectsEnabled && !reducedMotion ? 0.90 + Math.sin(realTime * 2.5) * 0.10 : 0.95) : 0.80;
        }

        // Rotating soft pink ring for Next Planet (Plan Round 9)
        if (p.nextRingMesh) {
          if (isNext && beaconsVisible && !finaleMode && currentStage !== 'cake') {
            p.nextRingMesh.visible = true;
            p.nextRingMesh.rotation.z += delta * 0.85;
            p.nextRingMesh.material.opacity = (effectsEnabled && !reducedMotion) ? 0.62 + Math.sin(realTime * 3.0) * 0.16 : 0.72;
          } else {
            p.nextRingMesh.visible = false;
          }
        }

        // Dynamic orbit path opacity
        const orbitMat = orbitPathMaterials.get(p.id);
        if (orbitMat) {
          if (currentStage === 'cake' || currentStage.startsWith('finale')) {
            orbitMat.opacity = THREE.MathUtils.damp(orbitMat.opacity, 0.08, 4, delta);
          } else if (isHovered || isNext) {
            const pulse = (effectsEnabled && !reducedMotion) ? Math.sin(realTime * 2.8) * 0.08 : 0;
            orbitMat.opacity = 0.55 + pulse;
          } else if (isVisited) {
            orbitMat.opacity = 0.34;
          } else {
            orbitMat.opacity = 0.20;
          }
        }

        // Orbital particle system visibility (spark running on visited and next orbits)
        const ops = orbitalParticleSystems[p.id - 1];
        if (ops && ops.points) {
          ops.points.visible = isVisited || isNext;
        }

        const currentAngle = p.config.initialAngle + orbitTime * p.config.orbitSpeed;
        const r = p.config.orbitRadius;
        const incl = p.config.inclination;

        const x = Math.cos(currentAngle) * r;
        const z = Math.sin(currentAngle) * r;
        const y = Math.sin(currentAngle) * (r * incl);

        const radius = r * (1 + (0.015 + (p.id - 1) * 0.006) * Math.cos(currentAngle));
        const orbitPos = new THREE.Vector3(Math.cos(currentAngle) * radius, y, Math.sin(currentAngle) * radius);
        const orbitSystem = orbitalParticleSystems[p.id - 1];
        orbitPos.applyEuler(orbitSystem.tilt);

        const finalePos = finalePlanetPositions[p.id - 1];
        p.group.position.lerpVectors(orbitPos, finalePos, finaleBlend);

        p.mesh.material.emissiveIntensity = finaleBlend > 0.5
          ? (p.mesh.userData.visited ? 0.08 : 0.015)
          : (p.mesh.userData.visited ? 0.12 : p.mesh.userData.baseEmissiveIntensity);
        p.mesh.rotation.y += delta * p.config.spinSpeed;
        if (p.cloudLayer) p.cloudLayer.rotation.y -= delta * 0.24;

        if (p.moonNode) {
          p.moonNode.rotation.y += delta * 2.4;
        }
      });

      // 3. Flowing Orbital Stardust Streams
      if (currentStage !== 'cake') {
        orbitalParticleSystems.forEach(ops => {
          if (!ops.points.visible) return;
          const posArr = ops.points.geometry.attributes.position.array;
          for (let i = 0; i < ops.count; i++) {
            const a = ops.phases[i] + orbitTime * ops.speed;
            const radius = ops.radius * (1 + ops.eccentricity * Math.cos(a));
            const point = new THREE.Vector3(
              Math.cos(a) * radius,
              Math.sin(a) * (ops.radius * ops.inclination),
              Math.sin(a) * radius
            ).applyEuler(ops.tilt);
            posArr[i * 3] = point.x;
            posArr[i * 3 + 1] = point.y;
            posArr[i * 3 + 2] = point.z;
          }
          ops.points.geometry.attributes.position.needsUpdate = true;
          ops.points.material.opacity = currentStage.startsWith('finale')
            ? 0.12
            : 0.36 + Math.sin(realTime * 1.2 + ops.radius) * 0.08;
        });
      }

      memoryLineRecords.forEach((record) => {
        if (!record.line.visible) return;
        record.progress = reducedMotion ? record.targetProgress : Math.min(record.targetProgress, record.progress + delta * 0.9);
        if (record.tube) {
          record.line.geometry.setDrawRange(0, Math.ceil(record.pointCount * record.progress));
          record.line.material.opacity = finaleHeartEmphasis ? 0.96 : 0.32;
          record.line.material.color.set(finaleHeartEmphasis ? 0xffc2df : 0xc4a1ff);
          return;
        }
        if (record.startObject && record.endObject) {
          const start = record.startObject.position;
          const end = record.endObject.position;
          const positions = record.line.geometry.attributes.position;
          for (let index = 0; index < record.pointCount; index += 1) {
            const amount = index / (record.pointCount - 1);
            positions.setXYZ(index,
              THREE.MathUtils.lerp(start.x, end.x, amount),
              THREE.MathUtils.lerp(start.y, end.y, amount),
              THREE.MathUtils.lerp(start.z, end.z, amount) - (record.startObject === record.endObject ? 8 : 0));
          }
          positions.needsUpdate = true;
        }
        const max = record.line.geometry.attributes.position.count;
        record.line.geometry.setDrawRange(0, Math.max(1, Math.ceil(max * record.progress)));
        record.line.material.opacity = record.line === finalHeartLine
          ? 0.7 + Math.sin(realTime * 2.2) * 0.14
          : 0.64 + Math.sin(realTime * 2.2 + record.progress) * 0.1;
      });
      if (finalHeartLine && finalHeartLine.visible) {
        const scale = finalHeartLine.scale.x;
        const nextScale = THREE.MathUtils.lerp(scale, finaleHeartLineScale, reducedMotion ? 1 : Math.min(1, delta * 1.2));
        finalHeartLine.scale.setScalar(nextScale);
      }
    },

    setHover(hitMesh, isHovered, clientX, clientY) {
      if (inTransitMode || !hitMesh || !hitMesh.userData) {
        hoveredPlanetId = null;
        if (tooltipEl) tooltipEl.classList.add('hidden');
        return;
      }

      hoveredPlanetId = isHovered ? hitMesh.userData.planetId : null;
      const { planetMesh, planetConfig } = hitMesh.userData;
      if (planetMesh) {
        const baseIntensity = planetMesh.userData.visited ? 0.12 : planetMesh.userData.baseEmissiveIntensity;
        planetMesh.material.emissiveIntensity = isHovered ? baseIntensity + 0.16 : baseIntensity;
      }
      const selectedPlanet = planetsList.find((planet) => planet.id === planetConfig.id);
      if (selectedPlanet?.labelSprite) selectedPlanet.labelSprite.material.opacity = isHovered ? 1 : 0;

      if (tooltipEl) {
        if (isHovered && clientX !== undefined && clientY !== undefined) {
          tooltipEl.innerHTML = `
            <span class="tooltip-title">${planetConfig.badgeTitle}</span>
            <span class="tooltip-sub">${planetConfig.badgeSub}</span>
          `;
          tooltipEl.style.left = `${clientX + 16}px`;
          tooltipEl.style.top = `${clientY - 28}px`;
          tooltipEl.classList.remove('hidden');
        } else {
          tooltipEl.classList.add('hidden');
        }
      }
    },

    setTransitMode(enabled) {
      inTransitMode = Boolean(enabled);
      if (inTransitMode) {
        rootGroup.visible = false;
        heartGroup.visible = false;
        planetsList.forEach(p => {
          p.group.visible = false;
          if (p.beaconSprite) p.beaconSprite.visible = false;
          if (p.labelSprite) p.labelSprite.visible = false;
        });
        this.setOrbitsVisible(false);
        this.setOrbitsOpacity(0.0);
        this.setBeaconsVisible(false);
        if (enchantedRose?.group) enchantedRose.group.visible = false;
        memoryLineRecords.forEach(r => { if (r.line) r.line.visible = false; });
        if (finalHeartLine) finalHeartLine.visible = false;
        orbitalParticleSystems.forEach(ops => { if (ops.points) ops.points.visible = false; });
        if (tooltipEl) tooltipEl.classList.add('hidden');
      } else {
        rootGroup.visible = true;
        heartGroup.visible = true;
        planetsList.forEach(p => {
          p.group.visible = true;
        });
        this.setOrbitsVisible(true);
        this.setOrbitsOpacity(0.28);
        this.setBeaconsVisible(true);
        orbitalParticleSystems.forEach(ops => { if (ops.points) ops.points.visible = true; });
      }
    },

    isTransitMode() {
      return inTransitMode;
    },

    setBeaconsVisible(visible) {
      beaconsVisible = Boolean(visible) && !inTransitMode;
      planetsList.forEach(p => {
        if (p.beaconSprite) p.beaconSprite.visible = beaconsVisible && !finaleMode && currentStage !== 'cake';
      });
    },

    setCamera(cam) {
      if (cam) activeCamera = cam;
    },

    setOrbitsOpacity(opacity) {
      for (const material of orbitPathMaterials.values()) {
        material.opacity = inTransitMode ? 0.0 : opacity;
      }
    },

    setOrbitsVisible(visible) {
      for (const p of planetsList) {
        const ribbon = rootGroup.getObjectByName(`orbitPath-${p.id}`);
        if (ribbon) ribbon.visible = !!visible && !inTransitMode;
      }
    },

    markVisited(id) {
      const p = planetsList.find(item => item.id === id);
      if (p) {
        p.mesh.userData.visited = true;
        p.drawBeacon?.('visited');
        p.mesh.material.emissiveIntensity = 0.12;
        const orbitMaterial = orbitPathMaterials.get(p.id);
        if (orbitMaterial) orbitMaterial.opacity = 0.28;
        if (effectsEnabled) {
          if (!memoryLineRecords.some((record) => record.startObject === p.group)) {
            const linkSamples = quality.tier === 'low' ? 20 : quality.tier === 'medium' ? 32 : 40;
            createMemoryLine(p.group, heartGroup, 0xd8b4fe, `memoryLink-${id}`, linkSamples);
          }
          if (planetsList.filter((planet) => planet.mesh.userData.visited).length === planetsList.length && !finalHeartLine) {
            createFinalHeartLine();
          }
        }
      }
    }
  };
}
