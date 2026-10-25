import * as THREE from 'three';
import { createGlowTexture } from './galaxySkybox.js';

/**
 * Creates high-detail procedural Planetary Surface Maps:
 * 1. Color (Albedo) Map: Continents, oceans, coastal turquoise, mountains, and polar frost
 * 2. Bump Map: Elevation depth for mountains, crater ridges, and continental shelves
 */
function createPlanetSurfaceTextures() {
  const width = 2048;
  const height = 1024;

  // 1. Color Map Canvas
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = width;
  colorCanvas.height = height;
  const cCtx = colorCanvas.getContext('2d');

  // 2. Bump Map Canvas
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = width;
  bumpCanvas.height = height;
  const bCtx = bumpCanvas.getContext('2d');

  const imgData = cCtx.createImageData(width, height);
  const bumpData = bCtx.createImageData(width, height);
  const cData = imgData.data;
  const bData = bumpData.data;

  for (let y = 0; y < height; y++) {
    const v = y / height;
    const lat = (v - 0.5) * Math.PI; // -PI/2 to PI/2
    const cosLat = Math.cos(lat);

    for (let x = 0; x < width; x++) {
      const u = x / width;
      const lon = u * Math.PI * 2; // 0 to 2PI

      // 3D Cartesian coordinates on unit sphere
      const nx = Math.cos(lon) * cosLat;
      const ny = Math.sin(lat);
      const nz = Math.sin(lon) * cosLat;

      // Multi-octave procedural terrain noise
      let elevation = 
        Math.sin(nx * 3.5 + ny * 2.2) * Math.cos(nz * 3.5 + nx * 1.5) * 0.45 +
        Math.sin(nx * 7.0 - nz * 6.0) * Math.cos(ny * 7.0) * 0.25 +
        Math.sin(nz * 14.0 + nx * 12.0) * Math.cos(ny * 12.0) * 0.12 +
        Math.sin(nx * 28.0) * Math.sin(ny * 28.0) * 0.06;

      // Polar caps elevation bias
      const polar = Math.abs(ny);
      if (polar > 0.82) {
        elevation += (polar - 0.82) * 2.5;
      }

      const pixelIdx = (y * width + x) * 4;

      let r = 0, g = 0, b = 0;
      let bumpVal = 0;

      // Sea vs Land threshold (Sea level = 0.08)
      if (elevation < 0.08) {
        // Ocean depths to coastal shelves
        const depth = Math.max(0, (0.08 - elevation) / 0.7);
        if (depth > 0.25) {
          // Deep ocean navy
          r = 12; g = 32; b = 64;
          bumpVal = 20;
        } else {
          // Shallow coastal turquoise/cyan
          const t = depth / 0.25;
          r = Math.floor(12 + (38 - 12) * (1 - t));
          g = Math.floor(45 + (135 - 45) * (1 - t));
          b = Math.floor(85 + (165 - 85) * (1 - t));
          bumpVal = 45;
        }
      } else {
        // Landmass / Continents
        const landHeight = (elevation - 0.08);

        if (polar > 0.85 || landHeight > 0.55) {
          // Polar ice / snow mountain peaks
          r = 235; g = 245; b = 255;
          bumpVal = 255;
        } else if (landHeight > 0.35) {
          // Mountain ridges / warm rock plateaus
          r = 158; g = 118; b = 88;
          bumpVal = 190;
        } else if (landHeight > 0.18) {
          // Lowland hills & warm green savanna
          r = 108; g = 145; b = 85;
          bumpVal = 130;
        } else {
          // Lush moss & coastal green plain
          r = 65; g = 125; b = 80;
          bumpVal = 85;
        }
      }

      cData[pixelIdx] = r;
      cData[pixelIdx + 1] = g;
      cData[pixelIdx + 2] = b;
      cData[pixelIdx + 3] = 255;

      bData[pixelIdx] = bumpVal;
      bData[pixelIdx + 1] = bumpVal;
      bData[pixelIdx + 2] = bumpVal;
      bData[pixelIdx + 3] = 255;
    }
  }

  cCtx.putImageData(imgData, 0, 0);
  bCtx.putImageData(bumpData, 0, 0);

  const colorTexture = new THREE.CanvasTexture(colorCanvas);
  colorTexture.wrapS = THREE.RepeatWrapping;
  colorTexture.needsUpdate = true;

  const bumpTexture = new THREE.CanvasTexture(bumpCanvas);
  bumpTexture.wrapS = THREE.RepeatWrapping;
  bumpTexture.needsUpdate = true;

  return { colorTexture, bumpTexture };
}

/**
 * Creates Procedural Realistic Cloud Texture (Parallax atmosphere layer)
 */
function createCloudTexture() {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  for (let y = 0; y < height; y++) {
    const v = y / height;
    const lat = (v - 0.5) * Math.PI;
    const cosLat = Math.cos(lat);

    for (let x = 0; x < width; x++) {
      const u = x / width;
      const lon = u * Math.PI * 2;

      const nx = Math.cos(lon) * cosLat;
      const ny = Math.sin(lat);
      const nz = Math.sin(lon) * cosLat;

      // Swirling atmospheric turbulence
      const swirl = Math.sin(nx * 4.0 + ny * 2.0) * Math.cos(nz * 4.0);
      const noise =
        Math.sin(nx * 8.0 + swirl) * Math.cos(ny * 8.0) * 0.45 +
        Math.sin(nz * 16.0) * Math.cos(nx * 16.0) * 0.3 +
        Math.sin(ny * 32.0 + nx * 24.0) * 0.25;

      const pixelIdx = (y * width + x) * 4;

      // Cloud density threshold: Wispy, delicate cloud trails allowing continents & oceans to shine
      if (noise > 0.36) {
        const cloudFactor = Math.min(1.0, (noise - 0.36) / 0.52);
        const alpha = Math.floor(cloudFactor * 150);
        data[pixelIdx] = 255;
        data[pixelIdx + 1] = 255;
        data[pixelIdx + 2] = 255;
        data[pixelIdx + 3] = alpha;
      } else {
        data[pixelIdx] = 0;
        data[pixelIdx + 1] = 0;
        data[pixelIdx + 2] = 0;
        data[pixelIdx + 3] = 0;
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Creates "ดาวลูกหมู-001" (Realistic Planet):
 * - Detailed Color + Bump texture
 * - Independent rotating Parallax Cloud Layer
 * - Fresnel Atmosphere with Day/Night rim scattering
 * - Tilted fine dust ring
 */
export function createPlanetB612(scene) {
  const planetGroup = new THREE.Group();
  planetGroup.name = 'daoLookMoo001';

  const PLANET_RADIUS = 13.5;

  // 1. Planet Surface Mesh
  const { colorTexture, bumpTexture } = createPlanetSurfaceTextures();
  const sphereGeo = new THREE.SphereGeometry(PLANET_RADIUS, 64, 64);

  const planetMat = new THREE.MeshStandardMaterial({
    map: colorTexture,
    bumpMap: bumpTexture,
    bumpScale: 0.35,
    roughness: 0.65,
    metalness: 0.1
  });

  const planetMesh = new THREE.Mesh(sphereGeo, planetMat);
  planetMesh.castShadow = true;
  planetMesh.receiveShadow = true;
  planetGroup.add(planetMesh);

  // 2. Parallax Cloud Layer (Rotates independently, soft translucent coverage)
  const cloudTexture = createCloudTexture();
  const cloudGeo = new THREE.SphereGeometry(PLANET_RADIUS * 1.018, 64, 64);
  const cloudMat = new THREE.MeshStandardMaterial({
    map: cloudTexture,
    transparent: true,
    opacity: 0.42,
    blending: THREE.NormalBlending,
    depthWrite: false,
    roughness: 0.9,
    metalness: 0.05
  });
  const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
  planetGroup.add(cloudMesh);

  // 3. Realistic Atmosphere Fresnel Shader (Day / Night scattering)
  const atmosGeo = new THREE.SphereGeometry(PLANET_RADIUS * 1.055, 48, 48);
  const sunDir = new THREE.Vector3(45, 60, 45).normalize();

  const atmosMat = new THREE.ShaderMaterial({
    uniforms: {
      uSunDir: { value: sunDir }
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vWorldNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uSunDir;
      varying vec3 vNormal;
      varying vec3 vWorldNormal;
      void main() {
        // Fresnel rim
        float fresnel = pow(0.72 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.6);

        // Day vs Night side of planet relative to sun
        float sunDot = dot(vWorldNormal, uSunDir);
        float dayFactor = clamp(sunDot * 0.5 + 0.5, 0.0, 1.0);

        // Day rim: Radiant sky blue & gold; Night rim: Deep violet indigo
        vec3 dayColor = vec3(0.45, 0.75, 1.0);
        vec3 nightColor = vec3(0.25, 0.15, 0.55);

        vec3 rimColor = mix(nightColor, dayColor, dayFactor);
        gl_FragColor = vec4(rimColor, fresnel * 0.45);
      }
    `,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false
  });
  const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
  planetGroup.add(atmosMesh);

  // 4. Delicate Tilted Dust Ring
  const ringGroup = new THREE.Group();
  ringGroup.rotation.x = Math.PI * 0.36;
  ringGroup.rotation.y = Math.PI * 0.12;

  const ringCount = 750;
  const ringPositions = new Float32Array(ringCount * 3);
  const ringColors = new Float32Array(ringCount * 3);

  const ringPalette = [
    new THREE.Color(0xb5e2fa),
    new THREE.Color(0xffd1dc),
    new THREE.Color(0xffffff),
    new THREE.Color(0xdceefb)
  ];

  for (let i = 0; i < ringCount; i++) {
    const rad = 17.5 + Math.random() * 5.2;
    const angle = Math.random() * Math.PI * 2;
    const yDisp = (Math.random() - 0.5) * 0.7;

    ringPositions[i * 3] = Math.cos(angle) * rad;
    ringPositions[i * 3 + 1] = yDisp;
    ringPositions[i * 3 + 2] = Math.sin(angle) * rad;

    const col = ringPalette[Math.floor(Math.random() * ringPalette.length)];
    ringColors[i * 3] = col.r;
    ringColors[i * 3 + 1] = col.g;
    ringColors[i * 3 + 2] = col.b;
  }

  const ringGeo = new THREE.BufferGeometry();
  ringGeo.setAttribute('position', new THREE.BufferAttribute(ringPositions, 3));
  ringGeo.setAttribute('color', new THREE.BufferAttribute(ringColors, 3));

  const dustTex = createGlowTexture(48);
  const ringMat = new THREE.PointsMaterial({
    size: 0.85,
    map: dustTex,
    vertexColors: true,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const ringPoints = new THREE.Points(ringGeo, ringMat);
  ringGroup.add(ringPoints);
  planetGroup.add(ringGroup);

  scene.add(planetGroup);

  // Update loop: slow surface spin and independent cloud parallax
  function update(delta, time) {
    planetMesh.rotation.y = time * 0.008;
    cloudMesh.rotation.y = time * 0.016; // Parallax cloud speed
    ringGroup.rotation.z = time * 0.03;
  }

  return {
    group: planetGroup,
    planetMesh,
    cloudMesh,
    radius: PLANET_RADIUS,
    update
  };
}
