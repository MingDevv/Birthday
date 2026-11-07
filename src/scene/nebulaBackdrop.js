import * as THREE from 'three';
import { createGlowTexture } from './galaxySkybox.js';

/**
 * =============================================================================
 * 🌌 Nebula Deep-Space Backdrop & Parallax Stardust (Plan Round 13)
 * 1. Inverted cosmic dome (r=1050) with domain-warped FBM nebula shader —
 *    cosmic purple / lavender / rose palette only (กติกา 8), drawn behind
 *    every star and planet so the sky is never an empty black void again.
 * 2. Near-field stardust shell (r 26–150) that lives between the camera and
 *    the solar system — orbiting the camera gives a 3-layer parallax depth:
 *    dust → planets → nebula.
 * 3. Motion is limited to an ultra-slow dome drift + dust swirl, both fully
 *    disabled for prefers-reduced-motion (กติกา 6) and ?fx=off stays static.
 * =============================================================================
 */

const DOME_RADIUS = 1050;

const NEBULA_FRAGMENT_OCTAVES = { low: 3, medium: 3, high: 4, ultra: 4 };

// Per-tier near-field dust counts — mobile tiers stay cheap (กติกา 9)
const DUST_COUNTS = { low: 260, medium: 520, high: 900, ultra: 1300 };

const dustPalette = [
  new THREE.Color(0xd8b4fe), // Lavender
  new THREE.Color(0xf472b6), // Soft Rose
  new THREE.Color(0xc084fc), // Radiant Lilac
  new THREE.Color(0xfff0fb)  // Diamond Starlight
];

export function createNebulaBackdrop(scene, quality = { tier: 'high' }, { reducedMotion = false, effectsEnabled = true } = {}) {
  const group = new THREE.Group();
  group.name = 'nebulaBackdropMaster';
  scene.add(group);

  // ---------------------------------------------------------------------------
  // 1. Nebula Dome — domain-warped FBM, tilted galactic band, tier-scaled octaves
  // ---------------------------------------------------------------------------
  const octaves = NEBULA_FRAGMENT_OCTAVES[quality.tier] ?? 4;
  const domeMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uIntensity: { value: (quality.tier === 'low' ? 0.8 : 1.0) },
      uRoseBoost: { value: 0.0 }, // Cake/finale mode warms the sky toward rose
      uBandNormal: { value: new THREE.Vector3(0.42, 0.86, 0.28).normalize() }
    },
    vertexShader: `
      varying vec3 vDir;
      void main() {
        vDir = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vDir;
      uniform float uIntensity;
      uniform float uRoseBoost;
      uniform vec3 uBandNormal;

      float hash(vec3 p) {
        p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
        p *= 17.0;
        return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
      }
      float noise(vec3 x) {
        vec3 i = floor(x);
        vec3 f = fract(x);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
              mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
          mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
              mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
          f.z);
      }
      float fbm(vec3 p) {
        float sum = 0.0;
        float amp = 0.52;
        for (int i = 0; i < ${octaves}; i++) {
          sum += amp * noise(p);
          p = p * 2.07 + vec3(11.3);
          amp *= 0.5;
        }
        return sum;
      }

      void main() {
        vec3 dir = normalize(vDir);

        // Domain-warped wisps: two nested fbm lookups give the silky smoke curl
        vec3 q = dir * 2.35;
        float warp = fbm(q * 1.6);
        float n1 = fbm(dir * 2.9 + warp * 1.45);
        float n2 = fbm(dir * 6.3 - warp * 0.9 + 4.7);

        // Tilted galactic band concentrates the clouds like a real Milky Way
        float band = exp(-pow(dot(dir, uBandNormal), 2.0) * 4.0);
        float clouds = smoothstep(0.44, 0.96, n1 * 0.72 + n2 * 0.40);
        clouds *= 0.62 + 0.38 * band;

        // Cosmic Purple Dream palette (กติกา 8) — a DEEP-space whisper: the sky
        // must stay darker than every planet and every text overlay on top of it.
        vec3 deep = vec3(0.010, 0.005, 0.030);
        vec3 purple = vec3(0.072, 0.026, 0.165);
        vec3 lavender = vec3(0.185, 0.100, 0.325);
        vec3 rose = vec3(0.290, 0.062, 0.190);

        vec3 col = deep;
        col = mix(col, purple, smoothstep(0.10, 0.75, clouds));
        col = mix(col, lavender, smoothstep(0.58, 1.0, clouds) * 0.45);
        col = mix(col, rose, smoothstep(0.64, 1.0, n2) * 0.16 * clouds);

        // Cake mode: warm the whole sky gently toward celebration rose
        col = mix(col, vec3(0.235, 0.075, 0.165), uRoseBoost * 0.30 * clouds);
        col += uRoseBoost * 0.006;

        gl_FragColor = vec4(col * uIntensity, 1.0);
      }
    `,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(DOME_RADIUS, 48, 32), domeMaterial);
  dome.name = 'nebulaDome';
  dome.renderOrder = -10;
  dome.frustumCulled = false;
  group.add(dome);

  // ---------------------------------------------------------------------------
  // 2. Parallax Stardust Shell (near camera, far from the solar plane)
  // ---------------------------------------------------------------------------
  const dustCount = DUST_COUNTS[quality.tier] ?? 700;
  const dustGeo = new THREE.BufferGeometry();
  const dustPos = new Float32Array(dustCount * 3);
  const dustCol = new Float32Array(dustCount * 3);
  const dustSize = new Float32Array(dustCount);
  const dustPhase = new Float32Array(dustCount);

  for (let i = 0; i < dustCount; i++) {
    const radius = 26 + Math.pow(Math.random(), 0.72) * 124;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    dustPos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    dustPos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.62; // Flattened toward the action plane
    dustPos[i * 3 + 2] = radius * Math.cos(phi);

    const c = dustPalette[Math.floor(Math.random() * dustPalette.length)];
    dustCol[i * 3] = c.r;
    dustCol[i * 3 + 1] = c.g;
    dustCol[i * 3 + 2] = c.b;

    dustSize[i] = 0.22 + Math.pow(Math.random(), 2.4) * 0.85;
    dustPhase[i] = Math.random() * Math.PI * 2;
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  dustGeo.setAttribute('color', new THREE.BufferAttribute(dustCol, 3));
  dustGeo.setAttribute('size', new THREE.BufferAttribute(dustSize, 1));
  dustGeo.setAttribute('phase', new THREE.BufferAttribute(dustPhase, 1));

  const dustMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 1.0 },
      uBreathe: { value: reducedMotion || !effectsEnabled ? 0.0 : 1.0 }
    },
    vertexShader: `
      attribute float size;
      attribute float phase;
      varying vec3 vColor;
      varying float vFade;
      uniform float uTime;
      uniform float uBreathe;

      void main() {
        vColor = color;
        // Gentle per-particle breathing — the dust feels alive, never static
        float breathe = 0.78 + 0.22 * sin(uTime * 0.9 + phase) * uBreathe;
        vFade = breathe;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = clamp(size * (340.0 / -mvPosition.z), 0.6, 9.0);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vFade;
      uniform float uOpacity;

      void main() {
        vec2 p = gl_PointCoord - 0.5;
        float d = length(p) * 2.0;
        float alpha = exp(-d * d * 3.2) * vFade * uOpacity * 0.5;
        if (alpha < 0.004) discard;
        gl_FragColor = vec4(vColor, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    vertexColors: true
  });
  const dustField = new THREE.Points(dustGeo, dustMaterial);
  dustField.name = 'parallaxStardust';
  dustField.frustumCulled = false;
  group.add(dustField);

  const domeDrift = reducedMotion || !effectsEnabled ? 0 : 0.0016;
  const dustSwirl = reducedMotion || !effectsEnabled ? 0 : 0.010;

  let roseTarget = 0;
  let roseCurrent = 0;

  return {
    group,
    setMode(mode) {
      roseTarget = mode === 'cake' ? 1.0 : 0.0;
    },
    setIntensity(value) {
      domeMaterial.uniforms.uIntensity.value = value;
    },
    update(delta, time) {
      if (domeDrift) dome.rotation.y += delta * domeDrift;
      if (dustSwirl) dustField.rotation.y -= delta * dustSwirl;
      dustMaterial.uniforms.uTime.value = time;
      roseCurrent += (roseTarget - roseCurrent) * Math.min(1, delta * 1.4);
      domeMaterial.uniforms.uRoseBoost.value = roseCurrent;
    }
  };
}
