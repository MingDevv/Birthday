import * as THREE from 'three';
import { createDiamondCrossTexture } from './galaxySkybox.js';

/**
 * =============================================================================
 * 🌌 Deep Space Astrophotography Galaxy (Hubble & James Webb Grade)
 * - Clear, open central zone (R=0 to R=90) so the Crystal Heart and 5 Planets
 *   stand out prominently without any blinding white flare or occlusion!
 * - Rich, luminous outer spiral arms and ethereal nebula gas (R=92 to R=360)
 * - 300+ Hubble 4-Point Cross-Diffraction Lens Flare Stars (✨)
 * - Smooth Gaussian nebula clouds (Zero discrete bubble artifacts)
 * =============================================================================
 */

// Procedural ultra-smooth Gaussian cosmic gas cloud texture
function createSmoothNebulaTexture(colorA = '#38bdf8', colorB = '#a855f7') {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const c = 128;

  // Multi-stop smooth exponential radial falloff
  const grad = ctx.createRadialGradient(c, c, 0, c, c, 124);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.65)');
  grad.addColorStop(0.2, colorA);
  grad.addColorStop(0.55, colorB);
  grad.addColorStop(0.85, 'rgba(70, 20, 120, 0.08)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  // Break the circular sprite silhouette into uneven gas filaments. This is a
  // lightweight procedural fallback for a volume texture, not an opaque blob.
  const image = ctx.getImageData(0, 0, 256, 256);
  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 256; x++) {
      const index = (y * 256 + x) * 4;
      const broad = Math.sin(x * 0.032 + Math.sin(y * 0.024) * 3.2)
        + Math.cos(y * 0.041 + Math.sin(x * 0.028) * 2.6);
      const filament = Math.sin(x * 0.13 + y * 0.047 + Math.sin(y * 0.075) * 1.5);
      const density = THREE.MathUtils.clamp(0.68 + broad * 0.09 + filament * 0.13, 0.18, 1.0);
      image.data[index + 3] = Math.round(image.data[index + 3] * density);
    }
  }
  ctx.putImageData(image, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export function createSpiralGalaxy(scene, quality = {}) {
  const galaxyGroup = new THREE.Group();
  galaxyGroup.name = 'milkyWayGalaxyMaster';
  scene.add(galaxyGroup);

  // Natural tilt of the galactic disk plane
  galaxyGroup.rotation.x = THREE.MathUtils.degToRad(10);
  galaxyGroup.rotation.z = THREE.MathUtils.degToRad(-4);

  const parameters = {
    count: ({ low: 32000, medium: 72000, high: 135000, ultra: 180000 }[quality.tier])
      ?? quality.galaxyStars
      ?? 130000,
    innerRadius: 92.0,    // Clear open center! Solar system (R=0-90) is completely unobstructed
    outerRadius: 360.0,
    branches: 5,          // 5 Major Logarithmic Spiral Arms
    spin: 1.55,
    randomness: 0.35,
    power: 1.35
  };

  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(parameters.count * 3);
  const colors = new Float32Array(parameters.count * 3);
  const scales = new Float32Array(parameters.count);
  const angles = new Float32Array(parameters.count);
  const distances = new Float32Array(parameters.count);
  const randomness = new Float32Array(parameters.count * 3);
  const phases = new Float32Array(parameters.count);
  const speeds = new Float32Array(parameters.count);

  // Hubble Astrophotography Palette
  const colorCoreLilac = new THREE.Color(0xf5d0fe);   // Lilac Inner Arm
  const colorSapphire = new THREE.Color(0x38bdf8);    // Electric Sapphire Blue
  const colorCyanBright = new THREE.Color(0x0ea5e9);  // Vivid Cyan Starburst
  const colorCosmicRose = new THREE.Color(0xf472b6);  // H-II Emission Rose
  const colorUltraviolet = new THREE.Color(0xc084fc); // Ultraviolet Lilac
  const colorDeepIndigo = new THREE.Color(0x6366f1);  // Midnight Indigo
  const colorAmber = new THREE.Color(0xfbbf24);       // Warm Amber Starlight
  const colorWhite = new THREE.Color(0xffffff);       // Pure Diamond Starlight

  for (let i = 0; i < parameters.count; i++) {
    const i3 = i * 3;

    // Distribute along the 5 spiral arms starting OUTSIDE the solar system
    const rRatio = Math.pow(Math.random(), parameters.power);
    const radius = parameters.innerRadius + rRatio * (parameters.outerRadius - parameters.innerRadius);

    const armIndex = i % parameters.branches;
    const branchAngle = (armIndex / parameters.branches) * Math.PI * 2;

    distances[i] = radius;

    // Logarithmic pitch calculation: theta = branchAngle + spin * ln(r/r0)
    const spinAngle = Math.log(Math.max(1.0, radius / 30.0)) * parameters.spin * 1.8;
    const initialAngle = branchAngle + spinAngle;
    angles[i] = initialAngle;

    // 3D Disk Scale Height (thicker near inner arm, tapering outwards)
    const normDist = (radius - parameters.innerRadius) / (parameters.outerRadius - parameters.innerRadius);
    const diskThickness = Math.max(0.1, 1.0 - normDist * 0.7);

    // Dark rift modulation
    const riftNoise = Math.sin(radius * 0.12 + initialAngle * 3.0);
    const riftFactor = 0.55 + 0.45 * Math.abs(riftNoise);

    const spreadX = Math.pow(Math.random(), 2.0) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * radius * 0.35 * riftFactor;
    const spreadY = Math.pow(Math.random(), 1.6) * (Math.random() < 0.5 ? 1 : -1) * (14.0 * diskThickness + Math.random() * 2.5);
    const spreadZ = Math.pow(Math.random(), 2.0) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * radius * 0.35 * riftFactor;

    randomness[i3] = spreadX;
    randomness[i3 + 1] = spreadY;
    randomness[i3 + 2] = spreadZ;

    positions[i3] = Math.cos(initialAngle) * radius + spreadX;
    positions[i3 + 1] = spreadY;
    positions[i3 + 2] = Math.sin(initialAngle) * radius + spreadZ;

    // Multi-gradient Hubble Color Mapping
    const mixedColor = new THREE.Color();
    if (normDist < 0.22) {
      mixedColor.copy(colorCoreLilac).lerp(colorSapphire, normDist / 0.22);
    } else if (normDist < 0.48) {
      mixedColor.copy(colorSapphire).lerp(colorCosmicRose, (normDist - 0.22) / 0.26);
    } else if (normDist < 0.75) {
      mixedColor.copy(colorCosmicRose).lerp(colorUltraviolet, (normDist - 0.48) / 0.27);
    } else {
      mixedColor.copy(colorUltraviolet).lerp(colorDeepIndigo, (normDist - 0.75) / 0.25);
    }

    // Occasional bright diamond & amber star jewels
    if (Math.random() < 0.08) {
      mixedColor.lerp(colorWhite, 0.75);
    } else if (Math.random() < 0.05) {
      mixedColor.lerp(colorAmber, 0.6);
    }

    const variance = (Math.random() - 0.5) * 0.04;
    colors[i3] = Math.min(1.0, Math.max(0.0, mixedColor.r + variance));
    colors[i3 + 1] = Math.min(1.0, Math.max(0.0, mixedColor.g + variance));
    colors[i3 + 2] = Math.min(1.0, Math.max(0.0, mixedColor.b + variance));

    const isJewel = Math.random() < 0.04;
    scales[i] = isJewel ? (Math.random() * 2.2 + 1.5) : (Math.random() * 0.95 + 0.55);
    phases[i] = Math.random() * Math.PI * 2;
    speeds[i] = 1.0 + (Math.random() - 0.5) * 0.25;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
  geometry.setAttribute('aAngle', new THREE.BufferAttribute(angles, 1));
  geometry.setAttribute('aDistance', new THREE.BufferAttribute(distances, 1));
  geometry.setAttribute('aRandomness', new THREE.BufferAttribute(randomness, 3));
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
  geometry.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
  geometry.setDrawRange(0, Math.min(quality.galaxyStars ?? 130000, parameters.count));

  const galaxyShaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 }
    },
    vertexShader: `
      uniform float uTime;
      attribute float aScale;
      attribute float aAngle;
      attribute float aDistance;
      attribute vec3 aRandomness;
      attribute float aPhase;
      attribute float aSpeed;

      varying vec3 vColor;
      varying float vAlpha;

      void main() {
        vColor = color;

        // Differential Keplerian rotation
        float speed = (0.048 / (0.9 + aDistance * 0.005)) * aSpeed;
        float currentAngle = aAngle + uTime * speed;

        float x = cos(currentAngle) * aDistance + aRandomness.x;
        float z = sin(currentAngle) * aDistance + aRandomness.z;

        float wave = sin(aDistance * 0.024 - uTime * 0.3 + aPhase) * 1.4;
        float y = aRandomness.y + wave;

        vec4 mvPosition = modelViewMatrix * vec4(x, y, z, 1.0);
        gl_Position = projectionMatrix * mvPosition;

        float twinkle = sin(uTime * 2.2 + aPhase) * 0.25 + 0.75;
        float pSize = aScale * (380.0 / -mvPosition.z) * twinkle;
        gl_PointSize = clamp(pSize, 0.8, 10.0);

        // Smooth distance fade at outer galaxy rim
        float distFade = clamp(1.0 - (aDistance / 360.0) * 0.35, 0.4, 0.95);
        float cameraFade = smoothstep(8.0, 45.0, -mvPosition.z);
        vAlpha = distFade * cameraFade;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vAlpha;

      void main() {
        vec2 p = (gl_PointCoord - 0.5) * 2.0;
        float d = length(p);
        float core = exp(-d * d * 24.0);
        float halo = exp(-d * d * 4.0) * 0.05;
        float alpha = (core + halo) * vAlpha * 0.42;
        if (alpha < 0.003) discard;
        gl_FragColor = vec4(vColor, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    vertexColors: true
  });

  const galaxyPoints = new THREE.Points(geometry, galaxyShaderMaterial);
  galaxyGroup.add(galaxyPoints);

  const coreCanvas = document.createElement('canvas');
  coreCanvas.width = 256;
  coreCanvas.height = 256;
  const coreContext = coreCanvas.getContext('2d');
  const coreGradient = coreContext.createRadialGradient(128, 128, 0, 128, 128, 128);
  coreGradient.addColorStop(0, 'rgba(255, 220, 248, 0.42)');
  coreGradient.addColorStop(0.18, 'rgba(235, 145, 218, 0.2)');
  coreGradient.addColorStop(0.55, 'rgba(168, 85, 247, 0.06)');
  coreGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  coreContext.fillStyle = coreGradient;
  coreContext.fillRect(0, 0, 256, 256);
  const coreTexture = new THREE.CanvasTexture(coreCanvas);
  const coreMaterial = new THREE.SpriteMaterial({
    map: coreTexture,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const coreSprite = new THREE.Sprite(coreMaterial);
  coreSprite.scale.set(56, 56, 1);
  galaxyGroup.add(coreSprite);

  // ===========================================================================
  // 2. Volumetric Glowing Nebula Gas Clouds (Smooth Gaussian, Outside Solar System)
  // ===========================================================================
  const gasTexBlue = createSmoothNebulaTexture('rgba(56, 189, 248, 0.75)', 'rgba(168, 85, 247, 0.35)');
  const gasTexRose = createSmoothNebulaTexture('rgba(244, 114, 182, 0.75)', 'rgba(217, 70, 239, 0.35)');
  const gasTexGold = createSmoothNebulaTexture('rgba(254, 240, 138, 0.75)', 'rgba(245, 158, 11, 0.35)');

  const gasSprites = [];
  const cloudCount = 12;

  for (let c = 0; c < cloudCount; c++) {
    // Only spawn clouds OUTSIDE the solar system (radius 105 to 290)
    const r = 105 + Math.random() * 185;
    const armIdx = c % parameters.branches;
    const branchA = (armIdx / parameters.branches) * Math.PI * 2;
    const spinA = Math.log(Math.max(1.0, r / 30.0)) * parameters.spin * 1.8;
    const ang = branchA + spinA + (Math.random() - 0.5) * 0.35;

    const x = Math.cos(ang) * r;
    const y = (Math.random() - 0.5) * 18;
    const z = Math.sin(ang) * r;

    let chosenTex = gasTexBlue;
    if (c % 3 === 1) chosenTex = gasTexRose;
    if (c % 4 === 0) chosenTex = gasTexGold;

    const spriteMat = new THREE.SpriteMaterial({
      map: chosenTex,
      transparent: true,
      opacity: 0.016,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const sprite = new THREE.Sprite(spriteMat);
    const spriteScale = 28 + Math.random() * 18;
    sprite.scale.set(spriteScale, spriteScale, 1);
    sprite.position.set(x, y, z);
    galaxyGroup.add(sprite);

    gasSprites.push({
      sprite,
      baseScale: spriteScale,
      phase: Math.random() * Math.PI * 2
    });
  }

  // ===========================================================================
  // 3. Hubble 4-Point Cross-Diffraction Lens Flare Stars (✨ 300 Jewels)
  // ===========================================================================
  const crossTex = createDiamondCrossTexture(128);
  const crossCount = 140;
  const crossGeo = new THREE.BufferGeometry();
  const crossPos = new Float32Array(crossCount * 3);
  const crossColors = new Float32Array(crossCount * 3);
  const crossSizes = new Float32Array(crossCount);
  const crossPhases = new Float32Array(crossCount);

  const crossPalette = [
    new THREE.Color(0xffffff), // Diamond White
    new THREE.Color(0x38bdf8), // Electric Sapphire
    new THREE.Color(0xfef08a), // Warm Gold
    new THREE.Color(0xf472b6), // Soft Rose
    new THREE.Color(0xf5d0fe)  // Lilac Glint
  ];

  for (let k = 0; k < crossCount; k++) {
    // Only spawn cross stars OUTSIDE the solar system (r >= 95)
    const r = 95 + Math.pow(Math.random(), 1.4) * (parameters.outerRadius - 95);
    const theta = Math.random() * Math.PI * 2;
    const y = (Math.random() - 0.5) * 20;

    crossPos[k * 3] = Math.cos(theta) * r;
    crossPos[k * 3 + 1] = y;
    crossPos[k * 3 + 2] = Math.sin(theta) * r;

    const col = crossPalette[Math.floor(Math.random() * crossPalette.length)];
    crossColors[k * 3] = col.r;
    crossColors[k * 3 + 1] = col.g;
    crossColors[k * 3 + 2] = col.b;

    crossSizes[k] = Math.random() * 1.6 + 1.0;
    crossPhases[k] = Math.random() * Math.PI * 2;
  }

  crossGeo.setAttribute('position', new THREE.BufferAttribute(crossPos, 3));
  crossGeo.setAttribute('color', new THREE.BufferAttribute(crossColors, 3));
  crossGeo.setAttribute('size', new THREE.BufferAttribute(crossSizes, 1));
  crossGeo.setAttribute('phase', new THREE.BufferAttribute(crossPhases, 1));

  const crossMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uTexture: { value: crossTex }
    },
    vertexShader: `
      attribute float size;
      attribute float phase;
      varying vec3 vColor;
      varying float vTwinkle;
      uniform float uTime;

      void main() {
        vColor = color;
        float twinkle = sin(uTime * 2.5 + phase) * 0.35 + 0.65;
        vTwinkle = twinkle;

        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = clamp(size * (360.0 / -mvPosition.z) * (0.9 + 0.15 * twinkle), 0.7, 16.0);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D uTexture;
      varying vec3 vColor;
      varying float vTwinkle;

      void main() {
        vec4 tex = texture2D(uTexture, gl_PointCoord);
        if (tex.a < 0.05) discard;
        gl_FragColor = vec4(vColor * 1.04, tex.a * vTwinkle * 0.7);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    vertexColors: true
  });

  const crossPoints = new THREE.Points(crossGeo, crossMat);
  galaxyGroup.add(crossPoints);

  return {
    group: galaxyGroup,
    points: galaxyPoints,
    setQuality(starCount) {
      geometry.setDrawRange(0, Math.min(starCount, parameters.count));
    },

    update(delta, time, camera) {
      galaxyShaderMaterial.uniforms.uTime.value = time;
      crossMat.uniforms.uTime.value = time;
      const cameraDistance = camera ? camera.position.length() : 120;
      coreMaterial.opacity = THREE.MathUtils.smoothstep(cameraDistance, 90, 220) * 0.18;

      // Ultra-slow cosmic rotation
      galaxyGroup.rotation.y += delta * 0.005;

      // Gentle breathing of nebula clouds
      for (let i = 0; i < gasSprites.length; i++) {
        const item = gasSprites[i];
        const pulse = Math.sin(time * 0.7 + item.phase) * 0.06 + 1.0;
        item.sprite.scale.set(item.baseScale * pulse, item.baseScale * pulse, 1);
      }
    }
  };
}
