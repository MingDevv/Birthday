import * as THREE from 'three';

/**
 * =============================================================================
 * ✨ Masterclass Cosmic Skybox & Twinkling Diamond Stars
 * 1. 14,000 Micro Diamond Pinpricks with GPU-accelerated twinkle shader
 * 2. 220 restrained 4-Point Diamond Cross Sparkle Stars (✨)
 * 3. Cosmic Purple Shooting Star / Comet System
 * 4. Zero blurry color blobs / Zero camera lens smudges
 * =============================================================================
 */

// Helper to create circular soft glow texture dynamically
export function createGlowTexture(size = 64, innerColor = 'rgba(255,255,255,1)', outerColor = 'rgba(0,0,0,0)') {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(
    size / 2, size / 2, 0,
    size / 2, size / 2, size / 2
  );
  gradient.addColorStop(0, innerColor);
  gradient.addColorStop(0.35, 'rgba(255, 255, 255, 0.28)');
  gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.05)');
  gradient.addColorStop(1, outerColor);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Helper to create a true 4-Point Diamond Cross Flare Star Texture (✨)
export function createDiamondCrossTexture(size = 128) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const c = size / 2;

  // Central glowing core
  const rad = ctx.createRadialGradient(c, c, 0, c, c, c * 0.4);
  rad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  rad.addColorStop(0.3, 'rgba(240, 210, 255, 0.9)');
  rad.addColorStop(0.7, 'rgba(192, 132, 252, 0.3)');
  rad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = rad;
  ctx.fillRect(0, 0, size, size);

  // Horizontal Diamond Diffraction Spike
  const hGrad = ctx.createLinearGradient(0, c, size, c);
  hGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
  hGrad.addColorStop(0.45, 'rgba(240, 210, 255, 0.85)');
  hGrad.addColorStop(0.5, 'rgba(255, 255, 255, 1)');
  hGrad.addColorStop(0.55, 'rgba(240, 210, 255, 0.85)');
  hGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = hGrad;
  ctx.beginPath();
  ctx.moveTo(2, c);
  ctx.lineTo(c, c - 2.5);
  ctx.lineTo(size - 2, c);
  ctx.lineTo(c, c + 2.5);
  ctx.closePath();
  ctx.fill();

  // Vertical Diamond Diffraction Spike
  const vGrad = ctx.createLinearGradient(c, 0, c, size);
  vGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
  vGrad.addColorStop(0.45, 'rgba(240, 210, 255, 0.85)');
  vGrad.addColorStop(0.5, 'rgba(255, 255, 255, 1)');
  vGrad.addColorStop(0.55, 'rgba(240, 210, 255, 0.85)');
  vGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = vGrad;
  ctx.beginPath();
  ctx.moveTo(c, 2);
  ctx.lineTo(c + 2.5, c);
  ctx.lineTo(c, size - 2);
  ctx.lineTo(c - 2.5, c);
  ctx.closePath();
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function kelvinToLinearColor(kelvin) {
  const temperature = kelvin / 100;
  let red;
  let green;
  let blue;
  if (temperature <= 66) {
    red = 255;
    green = 99.4708025861 * Math.log(temperature) - 161.1195681661;
    blue = temperature <= 19 ? 0 : 138.5177312231 * Math.log(temperature - 10) - 305.0447927307;
  } else {
    red = 329.698727446 * Math.pow(temperature - 60, -0.1332047592);
    green = 288.1221695283 * Math.pow(temperature - 60, -0.0755148492);
    blue = 255;
  }
  const color = new THREE.Color();
  color.setRGB(
    THREE.MathUtils.clamp(red / 255, 0, 1),
    THREE.MathUtils.clamp(green / 255, 0, 1),
    THREE.MathUtils.clamp(blue / 255, 0, 1),
    THREE.SRGBColorSpace
  );
  return color;
}

export function createGalaxySkybox(scene, quality = {}) {
  const galaxyGroup = new THREE.Group();
  galaxyGroup.name = 'galaxySkyboxMaster';
  scene.add(galaxyGroup);

  const diamondTex = createDiamondCrossTexture(128);

  // ---------------------------------------------------------------------------
  // 1. Temperature-colored pin-sharp starfield with a very restrained halo.
  // ---------------------------------------------------------------------------
  const starCount = ({ low: 8500, medium: 17000, high: 25500, ultra: 25500 }[quality.tier])
    ?? Math.max(14000, quality.backgroundStars ?? 14000);
  const starGeo = new THREE.BufferGeometry();
  const starPos = new Float32Array(starCount * 3);
  const starColors = new Float32Array(starCount * 3);
  const starSizes = new Float32Array(starCount);
  const starPhases = new Float32Array(starCount);
  const starFreqs = new Float32Array(starCount);

  // Elegant Hubble Multi-Color Starlight Palette (Diamond, Sapphire, Gold, Rose)
  const diamondPalette = [
    new THREE.Color(0xffffff), // Pure Diamond White
    new THREE.Color(0x38bdf8), // Electric Sapphire Blue
    new THREE.Color(0x0ea5e9), // Vibrant Sky Cyan
    new THREE.Color(0xfef08a), // Warm 24k Gold
    new THREE.Color(0xf59e0b), // Radiant Amber
    new THREE.Color(0xfbcfe8), // Soft Rose Crystal
    new THREE.Color(0xc084fc), // Radiant Lilac
    new THREE.Color(0xa855f7)  // Deep Cosmic Purple
  ];

  for (let i = 0; i < starCount; i++) {
    const radius = 760 + Math.random() * 80;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);

    starPos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    starPos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    starPos[i * 3 + 2] = radius * Math.cos(phi);

    const roll = Math.random();
    const kelvin = roll < 0.75
      ? 3000 + Math.random() * 2000
      : roll < 0.90
        ? 5500 + Math.random() * 2000
        : roll < 0.97
          ? 8000 + Math.random() * 2000
          : 15000 + Math.random() * 15000;
    const c = kelvinToLinearColor(kelvin);
    starColors[i * 3] = c.r;
    starColors[i * 3 + 1] = c.g;
    starColors[i * 3 + 2] = c.b;

    // A power-law distribution gives many faint points and very few bright stars.
    starSizes[i] = 0.05 + 0.95 * Math.pow(Math.random(), 6);
    starPhases[i] = Math.random() * Math.PI * 2;
    starFreqs[i] = 1.5 + Math.random() * 3.5;
  }

  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
  starGeo.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
  starGeo.setAttribute('phase', new THREE.BufferAttribute(starPhases, 1));
  starGeo.setAttribute('freq', new THREE.BufferAttribute(starFreqs, 1));

  const starShaderMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: quality.pixelRatio ?? 1 }
    },
    vertexShader: `
      attribute float size;
      attribute float phase;
      attribute float freq;
      varying vec3 vColor;
      varying float vIntensity;
      varying float vSpike;
      uniform float uTime;
      uniform float uPixelRatio;

      void main() {
        vColor = color;
        float twinkle = 1.0 + 0.10 * sin(uTime * freq + phase);
        float px = (1.0 + 3.5 * size) * uPixelRatio;
        float minPx = 1.6 * uPixelRatio;
        float energy = min(1.0, (px * px) / (minPx * minPx));
        vIntensity = (0.2 + 1.8 * size) * energy * twinkle;
        vSpike = step(0.985, size);

        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = max(px, minPx);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vIntensity;
      varying float vSpike;

      void main() {
        vec2 p = (gl_PointCoord - 0.5) * 2.0;
        float d = length(p);
        float core = exp(-d * d * 22.0);
        float halo = exp(-d * d * 4.0) * 0.08;
        vec2 a = abs(p);
        float spike = vSpike * 0.45 * (exp(-a.x * 40.0) * exp(-a.y * 3.0) + exp(-a.y * 40.0) * exp(-a.x * 3.0));
        float alpha = (core + halo + spike) * vIntensity;
        if (alpha < 0.003) discard;
        gl_FragColor = vec4(vColor, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    vertexColors: true
  });

  const starField = new THREE.Points(starGeo, starShaderMat);
  starGeo.setDrawRange(0, Math.min(quality.backgroundStars ?? 14000, starCount));
  galaxyGroup.add(starField);

  // ---------------------------------------------------------------------------
  // 2. Brilliant 4-Point Diamond Flare Stars (✨ 650 Cross-Flare Jewels)
  // ---------------------------------------------------------------------------
  const flareCount = 90;
  const flareGeo = new THREE.BufferGeometry();
  const flarePos = new Float32Array(flareCount * 3);
  const flareColors = new Float32Array(flareCount * 3);
  const flareSizes = new Float32Array(flareCount);
  const flarePhases = new Float32Array(flareCount);

  for (let i = 0; i < flareCount; i++) {
    const radius = 540 + Math.random() * 300;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);

    flarePos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    flarePos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    flarePos[i * 3 + 2] = radius * Math.cos(phi);

    const c = diamondPalette[Math.floor(Math.random() * diamondPalette.length)];
    flareColors[i * 3] = c.r;
    flareColors[i * 3 + 1] = c.g;
    flareColors[i * 3 + 2] = c.b;

    flareSizes[i] = Math.random() * 1.8 + 1.2;
    flarePhases[i] = Math.random() * Math.PI * 2;
  }

  flareGeo.setAttribute('position', new THREE.BufferAttribute(flarePos, 3));
  flareGeo.setAttribute('color', new THREE.BufferAttribute(flareColors, 3));
  flareGeo.setAttribute('size', new THREE.BufferAttribute(flareSizes, 1));
  flareGeo.setAttribute('phase', new THREE.BufferAttribute(flarePhases, 1));

  let isArrivalMode = false;

  const flareShaderMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uTexture: { value: diamondTex },
      uArrivalDim: { value: 1.0 }
    },
    vertexShader: `
      attribute float size;
      attribute float phase;
      varying vec3 vColor;
      varying float vTwinkle;
      uniform float uTime;

      void main() {
        vColor = color;
        float twinkle = sin(uTime * 2.4 + phase) * 0.4 + 0.6;
        vTwinkle = twinkle;

        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        float pSize = size * (460.0 / -mvPosition.z) * (0.85 + 0.45 * twinkle);
        gl_PointSize = clamp(pSize, 0.8, 18.0);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D uTexture;
      uniform float uArrivalDim;
      varying vec3 vColor;
      varying float vTwinkle;

      void main() {
        vec4 tex = texture2D(uTexture, gl_PointCoord);
        if (tex.a < 0.04) discard;
        gl_FragColor = vec4(vColor * 1.05, tex.a * vTwinkle * 0.72 * uArrivalDim);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    vertexColors: true
  });

  const flareField = new THREE.Points(flareGeo, flareShaderMat);
  galaxyGroup.add(flareField);

  // ===========================================================================
  // 3. Cosmic Shooting Star & Meteor Shower System (Perseid Starlight Pool)
  // ===========================================================================
  const METEOR_POOL_SIZE = 14;
  const TRAIL_SEGMENTS = 28;
  const meteorPool = [];
  const meteorGroup = new THREE.Group();
  meteorGroup.name = 'galaxySkyboxMeteorShower';
  galaxyGroup.add(meteorGroup);

  const meteorColors = [
    new THREE.Color(0xc084fc), // Cosmic Lavender (Khao Hom's signature purple)
    new THREE.Color(0xf472b6), // Starlight Rose
    new THREE.Color(0x38bdf8), // Electric Sapphire Blue
    new THREE.Color(0xfef08a), // Champagne Gold
    new THREE.Color(0xd8b4fe)  // Diamond Lilac
  ];

  const whiteColor = new THREE.Color(0xffffff);

  for (let i = 0; i < METEOR_POOL_SIZE; i++) {
    // 1. Trail BufferGeometry with vertex positions and colors
    const trailGeo = new THREE.BufferGeometry();
    const trailPositions = new Float32Array(TRAIL_SEGMENTS * 3);
    const trailColors = new Float32Array(TRAIL_SEGMENTS * 3);

    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    trailGeo.setAttribute('color', new THREE.BufferAttribute(trailColors, 3));

    const trailMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const trailLine = new THREE.Line(trailGeo, trailMat);
    meteorGroup.add(trailLine);

    // 2. Glowing Diamond Head Sprite
    const headMat = new THREE.SpriteMaterial({
      map: diamondTex,
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const headSprite = new THREE.Sprite(headMat);
    headSprite.scale.set(3.2, 3.2, 1);
    meteorGroup.add(headSprite);

    meteorPool.push({
      line: trailLine,
      geo: trailGeo,
      mat: trailMat,
      head: headSprite,
      headMat: headMat,
      active: false,
      progress: 0,
      speed: 1.4,
      start: new THREE.Vector3(),
      end: new THREE.Vector3(),
      tailLength: 45,
      headBaseScale: 3.2,
      color: new THREE.Color(0xc084fc),
      type: 'ambient',
      dist: 160
    });
  }

  function spawnMeteor({ type = 'ambient', radiantDir = null, customColor = null, speedMult = 1.0, delay = 0 } = {}) {
    // Find an inactive meteor slot
    const slot = meteorPool.find(m => !m.active);
    if (!slot) return;

    slot.active = true;
    slot.progress = -delay; // Allows staggered cluster entry
    slot.type = type;

    // Pick color
    const col = customColor || meteorColors[Math.floor(Math.random() * meteorColors.length)];
    slot.color.copy(col);

    // Spawn location: Deep Celestial Sphere (R = 260 to 420) — FAR outside solar system (R <= 92)
    const r = 260 + Math.random() * 160;
    const theta = Math.random() * Math.PI * 2;
    const phi = 0.25 + Math.random() * 0.45; // Upper celestial dome

    const startX = Math.cos(theta) * Math.sin(phi) * r;
    const startY = Math.cos(phi) * r * 0.75 + 50;
    const startZ = Math.sin(theta) * Math.sin(phi) * r;
    slot.start.set(startX, startY, startZ);

    if (radiantDir) {
      // Parallel cluster trajectory
      const travelDist = 160 + Math.random() * 80;
      slot.end.copy(slot.start).addScaledVector(radiantDir, travelDist);
    } else {
      // Natural diagonal downward trajectory
      const dx = (Math.random() - 0.5) * 160;
      const dy = -110 - Math.random() * 70;
      const dz = (Math.random() - 0.5) * 160;
      slot.end.set(startX + dx, startY + dy, startZ + dz);
    }

    if (type === 'fireball') {
      slot.speed = 0.7 * speedMult;
      slot.tailLength = 80;
      slot.headBaseScale = 5.5;
    } else if (type === 'cluster') {
      slot.speed = (1.5 + Math.random() * 0.5) * speedMult;
      slot.tailLength = 48;
      slot.headBaseScale = 3.6;
    } else {
      // ambient
      slot.speed = (1.3 + Math.random() * 0.6) * speedMult;
      slot.tailLength = 42;
      slot.headBaseScale = 3.0;
    }

    slot.dist = slot.start.distanceTo(slot.end);

    // Set vertex colors: Head is brilliant white, fading to meteor color, then dark
    const colArr = slot.geo.attributes.color.array;
    for (let s = 0; s < TRAIL_SEGMENTS; s++) {
      const t = s / (TRAIL_SEGMENTS - 1); // 0 at head, 1 at tail
      const vertexCol = new THREE.Color();
      if (t < 0.25) {
        vertexCol.copy(whiteColor).lerp(slot.color, t / 0.25);
      } else {
        const fade = 1.0 - (t - 0.25) / 0.75;
        vertexCol.copy(slot.color).multiplyScalar(fade);
      }
      colArr[s * 3] = vertexCol.r;
      colArr[s * 3 + 1] = vertexCol.g;
      colArr[s * 3 + 2] = vertexCol.b;
    }
    slot.geo.attributes.color.needsUpdate = true;
  }

  function triggerCluster(count = 4) {
    const radiantAngle = Math.random() * Math.PI * 2;
    const radiantDir = new THREE.Vector3(
      Math.cos(radiantAngle) * 0.8,
      -0.9,
      Math.sin(radiantAngle) * 0.8
    ).normalize();

    const clusterColor = meteorColors[Math.floor(Math.random() * meteorColors.length)];

    for (let c = 0; c < count; c++) {
      spawnMeteor({
        type: 'cluster',
        radiantDir,
        customColor: clusterColor,
        delay: c * 0.18
      });
    }
  }

  function triggerGrandShower(count = 10) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const radiantDir = new THREE.Vector3(
        Math.cos(angle) * 0.7,
        -0.85,
        Math.sin(angle) * 0.7
      ).normalize();
      spawnMeteor({
        type: 'cluster',
        radiantDir,
        delay: Math.random() * 0.45,
        speedMult: 1.2
      });
    }
  }

  let ambientTimer = 1.0;
  let clusterTimer = 15.0;
  let fireballTimer = 35.0;

  return {
    group: galaxyGroup,
    starField,
    pickMeteor(raycaster) {
      const activeHeads = meteorPool.filter((slot) => slot.active && slot.progress >= 0 && slot.progress < 1).map((slot) => slot.head);
      const hit = raycaster.intersectObjects(activeHeads, false)[0];
      if (!hit) return false;
      const slot = meteorPool.find((entry) => entry.head === hit.object);
      if (slot) {
        slot.active = false;
        slot.mat.opacity = 0;
        slot.headMat.opacity = 0;
      }
      return Boolean(slot);
    },
    setQuality(backgroundStars) {
      starGeo.setDrawRange(0, Math.min(backgroundStars, starCount));
    },
    setArrivalMode(enabled) {
      isArrivalMode = !!enabled;
      if (flareShaderMat?.uniforms?.uArrivalDim) {
        flareShaderMat.uniforms.uArrivalDim.value = enabled ? 0.25 : 1.0;
      }
    },
    triggerGrandShower,

    update(delta, time) {
      starShaderMat.uniforms.uTime.value = time;
      flareShaderMat.uniforms.uTime.value = time;

      // Slow majestic sky rotation
      galaxyGroup.rotation.y = 0;

      if (!isArrivalMode) {
        // 1. Ambient Meteor timer (every 1.2 - 2.4s)
        ambientTimer -= delta;
        if (ambientTimer <= 0) {
          spawnMeteor({ type: 'ambient' });
          ambientTimer = 1.2 + Math.random() * 1.2;
        }

        // 2. Periodic Cluster timer (every 16 - 22s)
        clusterTimer -= delta;
        if (clusterTimer <= 0) {
          triggerCluster(3 + Math.floor(Math.random() * 3));
          clusterTimer = 16.0 + Math.random() * 6.0;
        }

        // 3. Fireball timer (every 35 - 45s)
        fireballTimer -= delta;
        if (fireballTimer <= 0) {
          spawnMeteor({ type: 'fireball' });
          fireballTimer = 35.0 + Math.random() * 10.0;
        }
      }

      // 4. Update all active meteors in pool (Zero GC allocation: pure in-place scalar arithmetic)
      for (let i = 0; i < METEOR_POOL_SIZE; i++) {
        const slot = meteorPool[i];
        if (!slot.active) continue;

        slot.progress += delta * slot.speed;

        if (slot.progress < 0) {
          slot.mat.opacity = 0;
          slot.headMat.opacity = 0;
          continue;
        }

        if (slot.progress >= 1.0) {
          slot.active = false;
          slot.mat.opacity = 0;
          slot.headMat.opacity = 0;
          continue;
        }

        // Smooth bell curve fade for opacity
        const alpha = Math.sin(slot.progress * Math.PI);
        slot.mat.opacity = alpha * 0.95;
        slot.headMat.opacity = alpha * 0.98;

        const pProg = slot.progress;
        const startX = slot.start.x, startY = slot.start.y, startZ = slot.start.z;
        const endX = slot.end.x, endY = slot.end.y, endZ = slot.end.z;

        const headX = startX + (endX - startX) * pProg;
        const headY = startY + (endY - startY) * pProg;
        const headZ = startZ + (endZ - startZ) * pProg;

        const tailFraction = slot.tailLength / (slot.dist || 1);
        const tailProg = Math.max(0, pProg - tailFraction);
        const tailX = startX + (endX - startX) * tailProg;
        const tailY = startY + (endY - startY) * tailProg;
        const tailZ = startZ + (endZ - startZ) * tailProg;

        // Update head sprite position
        slot.head.position.set(headX, headY, headZ);
        const pulse = 1.0 + Math.sin(time * 8.0) * 0.15;
        slot.head.scale.set(slot.headBaseScale * pulse, slot.headBaseScale * pulse, 1);

        // Update trail line vertex positions in-place (Zero GC)
        const posArr = slot.geo.attributes.position.array;
        for (let s = 0; s < TRAIL_SEGMENTS; s++) {
          const t = s / (TRAIL_SEGMENTS - 1);
          posArr[s * 3]     = headX + (tailX - headX) * t;
          posArr[s * 3 + 1] = headY + (tailY - headY) * t;
          posArr[s * 3 + 2] = headZ + (tailZ - headZ) * t;
        }
        slot.geo.attributes.position.needsUpdate = true;
      }
    }
  };
}
