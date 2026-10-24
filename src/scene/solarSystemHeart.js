import * as THREE from 'three';
import { createGlowTexture } from './galaxySkybox.js';
import { MEMORIES_LIST } from '../config/memoriesData.js';

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
function createPlanetTexture(type) {
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
      const y = Math.random() * h;
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255, 255, 255, 0.32)' : 'rgba(244, 114, 182, 0.25)';
      ctx.ellipse(Math.random() * w, y, 140 + Math.random() * 180, 10 + Math.random() * 20, 0.04 * (Math.random() - 0.5), 0, Math.PI * 2);
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
      ctx.ellipse(Math.random() * w, Math.random() * h, 70 + Math.random() * 120, 10 + Math.random() * 16, 0.2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (type === 'moon') {
    // Moon: Silvery-gray cratered texture
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = 'rgba(100, 116, 139, 0.4)';
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h, 5 + Math.random() * 20, 0, Math.PI * 2);
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
      ctx.ellipse(Math.random() * w, 0.2 * h + Math.random() * (0.6 * h), 50 + Math.random() * 130, 10 + Math.random() * 20, 0.05, 0, Math.PI * 2);
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
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255, 255, 255, 0.25)' : 'rgba(120, 53, 15, 0.3)';
      ctx.ellipse(Math.random() * w, Math.random() * h, 70 + Math.random() * 150, 8 + Math.random() * 14, 0.02, 0, Math.PI * 2);
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
      ctx.fillRect(0, Math.random() * h, w, 4 + Math.random() * 10);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

// Saturn's crisp rings texture
function createSaturnRingTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(0.06, 'rgba(254, 240, 138, 0.25)');
  grad.addColorStop(0.2, 'rgba(234, 179, 8, 0.88)');
  grad.addColorStop(0.48, 'rgba(253, 224, 71, 0.95)');
  grad.addColorStop(0.54, 'rgba(0, 0, 0, 0.04)'); // Cassini Division
  grad.addColorStop(0.62, 'rgba(250, 204, 21, 0.85)');
  grad.addColorStop(0.9, 'rgba(245, 158, 11, 0.6)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
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

export function createSolarSystemHeart(scene) {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'solarSystemHeartMaster';
  scene.add(rootGroup);

  const glowTex = createGlowTexture(64);
  const sparkleTex = createSparkleTexture();
  const interactiveMeshes = [];
  const planetsList = [];
  const orbitalParticleSystems = [];

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
    emissiveIntensity: 0.62,     // Keep crystal color defined under the scene lights
    roughness: 0.12,             // Smooth crystal polish
    metalness: 0.08,
    clearcoat: 1.0,              // Lacquered crystal diamond shine
    clearcoatRoughness: 0.05,
    side: THREE.DoubleSide,      // Render both front and back cleanly from all angles
    transparent: false,
    reflectivity: 0.95
  });

  const heartMesh = new THREE.Mesh(heartGeo, heartMat);
  heartMesh.rotation.x = -0.34;
  heartMesh.castShadow = false;
  heartMesh.receiveShadow = false;
  heartGroup.add(heartMesh);

  // Soft romantic Point Light (gentle starlight, no blinding blowout)
  const heartLight = new THREE.PointLight(0xd946ef, 1.35, 42, 1.8);
  heartLight.position.set(0, 0, 0);
  heartGroup.add(heartLight);

  // Gentle Crystalline Aura Sprite (subtle romantic glow)
  const auraMat = new THREE.SpriteMaterial({
    map: glowTex,
    color: 0xd946ef,
    transparent: true,
    opacity: 0.16,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false
  });
  const auraSprite = new THREE.Sprite(auraMat);
  auraSprite.scale.set(15, 15, 1);
  heartGroup.add(auraSprite);

  // Floating Cosmic Purple Stardust Sparks (Round soft diamond glows, NO square pixels)
  const sparkCount = 90;
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
    size: 1.8,
    map: sparkleTex,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false
  });
  const sparkPoints = new THREE.Points(sparkGeo, sparkMat);
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
      orbitRadius: 28,
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
      orbitRadius: 42,
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
      orbitRadius: 56,
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
      orbitRadius: 72,
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
      orbitRadius: 92,
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

    // 1. Ethereal Luminous Orbit Path (Anti-aliased Line Loop with Stardust Glow)
    const curveSegments = 128;
    const pathPositions = new Float32Array((curveSegments + 1) * 3);
    for (let i = 0; i <= curveSegments; i++) {
      const a = (i / curveSegments) * Math.PI * 2;
      pathPositions[i * 3] = Math.cos(a) * pConfig.orbitRadius;
      pathPositions[i * 3 + 1] = Math.sin(a) * (pConfig.orbitRadius * pConfig.inclination);
      pathPositions[i * 3 + 2] = Math.sin(a) * pConfig.orbitRadius;
    }
    const pathGeo = new THREE.BufferGeometry();
    pathGeo.setAttribute('position', new THREE.BufferAttribute(pathPositions, 3));

    const pathMat = new THREE.LineBasicMaterial({
      color: 0xc084fc, // Radiant Lilac Violet
      transparent: true,
      opacity: 0.24
    });
    const pathLine = new THREE.Line(pathGeo, pathMat);
    rootGroup.add(pathLine);

    // 2. Orbital Stardust Sparkle Stream (อนุภาคดาวระยิบระยับวิ่งตามวงโคจร)
    const orbitSparkCount = 12;
    const orbitSparkGeo = new THREE.BufferGeometry();
    const orbitSparkPos = new Float32Array(orbitSparkCount * 3);
    const orbitSparkPhases = [];

    for (let i = 0; i < orbitSparkCount; i++) {
      const a = (i / orbitSparkCount) * Math.PI * 2;
      orbitSparkPos[i * 3] = Math.cos(a) * pConfig.orbitRadius;
      orbitSparkPos[i * 3 + 1] = Math.sin(a) * (pConfig.orbitRadius * pConfig.inclination);
      orbitSparkPos[i * 3 + 2] = Math.sin(a) * pConfig.orbitRadius;
      orbitSparkPhases.push((i / orbitSparkCount) * Math.PI * 2);
    }

    orbitSparkGeo.setAttribute('position', new THREE.BufferAttribute(orbitSparkPos, 3));
    const orbitSparkMat = new THREE.PointsMaterial({
      size: 0.95,
      map: glowTex,
      color: 0xe9d5ff,
      transparent: true,
      opacity: 0.48,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const orbitSparkPoints = new THREE.Points(orbitSparkGeo, orbitSparkMat);
    rootGroup.add(orbitSparkPoints);

    orbitalParticleSystems.push({
      points: orbitSparkPoints,
      radius: pConfig.orbitRadius,
      inclination: pConfig.inclination,
      speed: pConfig.orbitSpeed * 0.7,
      phases: orbitSparkPhases,
      count: orbitSparkCount
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
      roughness: 0.38,
      metalness: 0.08,
      emissive: new THREE.Color(pConfig.color),
      emissiveIntensity: 0.32
    });
    const planetMesh = new THREE.Mesh(sphereGeo, sphereMat);
    planetNode.add(planetMesh);

    // Subtle Atmospheric Rim Glow (Makes each planet pop out as a luminous celestial jewel)
    const planetGlowMat = new THREE.SpriteMaterial({
      map: glowTex,
      color: new THREE.Color(pConfig.color),
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const planetGlow = new THREE.Sprite(planetGlowMat);
    planetGlow.scale.set(pConfig.radius * 2.5, pConfig.radius * 2.5, 1);
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
        roughness: 0.72,
        metalness: 0.1,
        emissive: 0xd8b4fe,
        emissiveIntensity: 0.28
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
        opacity: 0.92,
        roughness: 0.35,
        metalness: 0.25,
        blending: THREE.NormalBlending
      });
      saturnRingMesh = new THREE.Mesh(ringGeo, ringMat);
      saturnRingMesh.rotation.x = Math.PI / 2 + 0.42;
      saturnRingMesh.rotation.y = 0.25;
      planetNode.add(saturnRingMesh);
    }

    // 6. Interactive Hitbox
    const hitGeo = new THREE.SphereGeometry(pConfig.radius * 1.45, 16, 16);
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

    planetsList.push({
      id: pConfig.id,
      config: pConfig,
      memory: memData,
      group: planetNode,
      mesh: planetMesh,
      moonNode: moonNode,
      saturnRing: saturnRingMesh,
      hitMesh: hitMesh
    });
  });

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

    update(delta, time) {
      // 1. Realistic Biomimetic Heartbeat Pulse
      const cycle = (time * 2.2) % (Math.PI * 2);
      let beat = 0;
      if (cycle < 0.6) {
        beat = Math.sin(cycle * (Math.PI / 0.6)) * 0.14;
      } else if (cycle > 0.8 && cycle < 1.4) {
        beat = Math.sin((cycle - 0.8) * (Math.PI / 0.6)) * 0.08;
      }

      const heartScale = 1.0 + beat;
      heartMesh.scale.set(heartScale, heartScale, heartScale);
      heartLight.intensity = 1.45 + beat * 1.2;
      auraSprite.scale.set(16 + beat * 2, 16 + beat * 2, 1);

      // Pulse spark particles gently
      const positions = sparkPoints.geometry.attributes.position.array;
      for (let i = 0; i < sparkCount; i++) {
        positions[i * 3] = baseSparkPositions[i * 3] + Math.sin(time * 0.7 + i) * 0.12;
        positions[i * 3 + 1] = baseSparkPositions[i * 3 + 1] + Math.sin(time * 1.5 + i) * 0.12;
        positions[i * 3 + 2] = baseSparkPositions[i * 3 + 2] + Math.cos(time * 0.7 + i) * 0.12;
      }
      sparkPoints.geometry.attributes.position.needsUpdate = true;
      sparkPoints.rotation.y += delta * 0.06;

      // 2. Planets Orbital Motion & Self-Spin
      planetsList.forEach(p => {
        const currentAngle = p.config.initialAngle + time * p.config.orbitSpeed;
        const r = p.config.orbitRadius;
        const incl = p.config.inclination;

        const x = Math.cos(currentAngle) * r;
        const z = Math.sin(currentAngle) * r;
        const y = Math.sin(currentAngle) * (r * incl);

        p.group.position.set(x, y, z);
        p.mesh.rotation.y += delta * p.config.spinSpeed;

        if (p.moonNode) {
          p.moonNode.rotation.y += delta * 2.4;
        }
      });

      // 3. Flowing Orbital Stardust Streams
      orbitalParticleSystems.forEach(ops => {
        const posArr = ops.points.geometry.attributes.position.array;
        for (let i = 0; i < ops.count; i++) {
          const a = ops.phases[i] + time * ops.speed;
          posArr[i * 3] = Math.cos(a) * ops.radius;
          posArr[i * 3 + 1] = Math.sin(a) * (ops.radius * ops.inclination);
          posArr[i * 3 + 2] = Math.sin(a) * ops.radius;
        }
        ops.points.geometry.attributes.position.needsUpdate = true;
        ops.points.material.opacity = 0.36 + Math.sin(time * 1.2 + ops.radius) * 0.08;
      });
    },

    setHover(hitMesh, isHovered, clientX, clientY) {
      if (!hitMesh || !hitMesh.userData) {
        if (tooltipEl) tooltipEl.classList.add('hidden');
        return;
      }

      const { planetMesh, planetConfig } = hitMesh.userData;
      if (planetMesh) {
        planetMesh.material.emissiveIntensity = isHovered ? 0.55 : 0.2;
      }

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

    markVisited(id) {
      const p = planetsList.find(item => item.id === id);
      if (p) {
        p.mesh.material.emissiveIntensity = 0.38;
      }
    }
  };
}
