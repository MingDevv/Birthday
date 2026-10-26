import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import gsap from 'gsap';

/**
 * =============================================================================
 * 🌸 3D Name "ข้าวหอม" (Cosmic Rose Gold & Vivid Pink Monument)
 * Shared between:
 * 1. Arrival Name Reveal (Hero central moment at t=1.6s, large and crisp)
 * 2. Deep Galaxy Space mode (prominent in overview behind solar system)
 * =============================================================================
 */

const TEXT = 'ข้าวหอม';
const TEXT_WIDTH = 280;
const TEXT_HEIGHT = 128;

// Cache shared extruded geometries across instances
let cachedGlyphGeometries = null;
let svgLoadPromise = null;

function loadGlyphGeometries() {
  if (cachedGlyphGeometries) return Promise.resolve(cachedGlyphGeometries);
  if (svgLoadPromise) return svgLoadPromise;

  svgLoadPromise = new Promise((resolve) => {
    const svgLoader = new SVGLoader();
    svgLoader.load(
      `${import.meta.env.BASE_URL}models/khaohom.svg`,
      (svgData) => {
        try {
          const glyphGeometries = svgData.paths.flatMap((path) =>
            SVGLoader.createShapes(path).map((shape) => {
              try {
                if (!shape || !shape.curves || shape.curves.length === 0) return null;
                const points = shape.getPoints(12);
                if (!points || points.length < 3) return null;
                for (let i = 0; i < points.length; i++) {
                  if (isNaN(points[i].x) || isNaN(points[i].y)) return null;
                }

                const geo = new THREE.ExtrudeGeometry(shape, {
                  depth: 8,
                  steps: 1,
                  bevelEnabled: true,
                  bevelSegments: 4,
                  bevelSize: 2.4,
                  bevelThickness: 1.2,
                  curveSegments: 10
                });

                const posAttr = geo.attributes.position;
                if (!posAttr || !posAttr.array || posAttr.count < 3) {
                  geo.dispose();
                  return null;
                }
                const pos = posAttr.array;
                for (let i = 0; i < pos.length; i++) {
                  if (isNaN(pos[i])) {
                    geo.dispose();
                    return null;
                  }
                }

                geo.computeBoundingBox();
                if (!geo.boundingBox || isNaN(geo.boundingBox.min.x)) {
                  geo.dispose();
                  return null;
                }
                geo.computeBoundingSphere();
                if (!geo.boundingSphere || isNaN(geo.boundingSphere.radius)) {
                  geo.dispose();
                  return null;
                }
                return geo;
              } catch {
                return null;
              }
            })
          ).filter(Boolean);
          if (!glyphGeometries.length) throw new Error('No paths in Thai SVG');

          const bounds = new THREE.Box3();
          glyphGeometries.forEach((geo) => {
            geo.computeBoundingBox();
            if (geo.boundingBox && !isNaN(geo.boundingBox.min.x)) {
              bounds.union(geo.boundingBox);
            }
          });
          const size = bounds.getSize(new THREE.Vector3());
          const scale = TEXT_WIDTH / Math.max(1, size.x);
          const center = bounds.getCenter(new THREE.Vector3());

          glyphGeometries.forEach((geo) => {
            geo.scale(scale, scale, 1);
            geo.translate(-center.x * scale, -center.y * scale, -4);
            geo.computeVertexNormals();
            geo.computeBoundingBox();
            geo.computeBoundingSphere();
          });

          cachedGlyphGeometries = glyphGeometries;
          resolve(glyphGeometries);
        } catch (error) {
          console.warn('Extruding Thai SVG failed; using fallback planes.', error);
          resolve(null);
        }
      },
      undefined,
      (err) => {
        console.warn('Loading Thai SVG failed; using fallback planes.', err);
        resolve(null);
      }
    );
  });
  return svgLoadPromise;
}

/**
 * Creates canvas texture for the fallback plane stack:
 * Warm cream front face with rose gold gradient, and vivid pink extrusion sides.
 */
function createTextTexture(isExtrusion = false) {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  const x = canvas.width / 2;
  const y = canvas.height / 2 + 25;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 360px "Prompt", "Kanit", "Noto Sans Thai", "Thonburi", sans-serif';
  ctx.lineJoin = 'round';

  if (isExtrusion) {
    ctx.lineWidth = 36;
    ctx.strokeStyle = '#831843'; // deep vivid magenta edge
    ctx.strokeText(TEXT, x, y);
    ctx.fillStyle = '#db2777'; // vivid pink body
    ctx.fillText(TEXT, x, y);
  } else {
    // Outer halo
    ctx.shadowColor = 'rgba(244, 114, 182, 0.6)';
    ctx.shadowBlur = 24;

    // Edge border: vivid rose
    ctx.lineWidth = 32;
    ctx.strokeStyle = '#e11d48';
    ctx.strokeText(TEXT, x, y);

    // Fine gold rim
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#fde68a';
    ctx.strokeText(TEXT, x, y);

    // Front Warm Cream to Rose Gold Gradient
    const grad = ctx.createLinearGradient(0, y - 180, 0, y + 180);
    grad.addColorStop(0, '#ffffff');      // bright white apex
    grad.addColorStop(0.25, '#fff1e6');   // warm cream
    grad.addColorStop(0.65, '#fbcfe8');   // soft pastel pink
    grad.addColorStop(1.0, '#f472b6');    // rose gold base
    ctx.fillStyle = grad;
    ctx.fillText(TEXT, x, y);

    // Top highlight specular line
    ctx.shadowBlur = 0;
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.strokeText(TEXT, x, y);

    // Celestial crown
    ctx.font = '110px sans-serif';
    ctx.fillText('👑', x, y - 215);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Soft Circular Celestial Purple/Pink Glow (No harsh square corners!)
 */
function createCircularGlowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(256, 256, 12, 256, 256, 256);
  grad.addColorStop(0, 'rgba(192, 132, 252, 0.42)');  // vibrant lavender core
  grad.addColorStop(0.35, 'rgba(244, 114, 182, 0.22)'); // soft rose-pink
  grad.addColorStop(0.7, 'rgba(126, 34, 206, 0.08)');  // deep cosmic violet
  grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Builds reusable 3D Name Mesh Group with:
 * - Extruded Prompt Thai glyphs with Dual Materials (Warm Cream face + Vivid Pink extrusion)
 * - Fallback layered planes while SVG is ready
 * - Circular backdrop glow for contrast on black space
 * - Dedicated key & rim lights
 * - Orbiting stardust embers
 */
export function buildNameMesh({ isArrival = false } = {}) {
  const group = new THREE.Group();
  group.name = isArrival ? 'arrival3DNameText' : 'giant3DNameText';

  // Front Material: Warm Cream + Rose Gold, balanced emissive without blowout
  const frontMat = new THREE.MeshPhysicalMaterial({
    color: 0xfff4ea,
    emissive: 0xffc4da,
    emissiveIntensity: isArrival ? 0.38 : 0.40,
    roughness: 0.18,
    metalness: 0.25,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
    side: THREE.FrontSide
  });

  // Side/Extrusion Material: Vivid Pink with luminous edge
  const sideMat = new THREE.MeshPhysicalMaterial({
    color: 0xff4f8c,
    emissive: 0xdb2777,
    emissiveIntensity: isArrival ? 0.68 : 0.60,
    roughness: 0.25,
    metalness: 0.18,
    clearcoat: 0.85,
    clearcoatRoughness: 0.1,
    side: THREE.DoubleSide
  });

  // Plane fallback stack
  const extrusionTexture = createTextTexture(true);
  const frontTexture = createTextTexture(false);
  const planeExtrusionMat = new THREE.MeshBasicMaterial({
    map: extrusionTexture,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    depthTest: true,
    side: THREE.DoubleSide
  });
  const planeFrontMat = new THREE.MeshBasicMaterial({
    map: frontTexture,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    depthTest: true,
    side: THREE.DoubleSide
  });

  const textPlane = new THREE.PlaneGeometry(TEXT_WIDTH, TEXT_HEIGHT);
  const layerCount = 10;
  const layerSpacing = 0.65;
  const fallbackPlanes = [];
  for (let i = 0; i < layerCount; i++) {
    const isFront = i === layerCount - 1;
    const mesh = new THREE.Mesh(textPlane, isFront ? planeFrontMat : planeExtrusionMat);
    mesh.userData.nameFallback = true;
    mesh.position.z = (i - (layerCount - 1) / 2) * layerSpacing;
    group.add(mesh);
    fallbackPlanes.push(mesh);
  }

  // Circular Soft Glow
  const glowTexture = createCircularGlowTexture();
  const glowMat = new THREE.SpriteMaterial({
    map: glowTexture,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: true
  });
  const glowSprite = new THREE.Sprite(glowMat);
  glowSprite.scale.set(TEXT_WIDTH * 1.35, TEXT_HEIGHT * 1.85, 1);
  glowSprite.position.set(0, 0, -6);
  group.add(glowSprite);

  // Dedicated Front Key Light + Soft Purple Backlight tuned to avoid bloom hotspots
  const keyLight = new THREE.DirectionalLight(0xfffaed, isArrival ? 1.15 : 1.05);
  keyLight.position.set(0, 40, 80);
  group.add(keyLight);

  const backLight = new THREE.PointLight(0xc084fc, isArrival ? 0.95 : 0.8, 180);
  backLight.position.set(0, -10, -25);
  group.add(backLight);

  // Orbiting Stardust Sparkles (up to 48 embers)
  const emberCount = 48;
  const emberPositions = new Float32Array(emberCount * 3);
  const emberColors = new Float32Array(emberCount * 3);
  const emberData = [];
  const emberPalette = [
    new THREE.Color(0xff4f8c), // Vivid Pink
    new THREE.Color(0xfde68a), // Soft Gold
    new THREE.Color(0xffffff), // White Star
    new THREE.Color(0xc084fc)  // Lavender
  ];
  for (let i = 0; i < emberCount; i++) {
    const x = (Math.random() - 0.5) * TEXT_WIDTH * 1.15;
    const y = (Math.random() - 0.5) * TEXT_HEIGHT * 1.2;
    const z = (Math.random() - 0.5) * 22;
    emberPositions.set([x, y, z], i * 3);
    const col = emberPalette[i % emberPalette.length];
    emberColors.set([col.r, col.g, col.b], i * 3);
    emberData.push({ x, y, z, phase: Math.random() * Math.PI * 2, speed: 0.8 + Math.random() * 0.8 });
  }

  const emberGeo = new THREE.BufferGeometry();
  emberGeo.setAttribute('position', new THREE.BufferAttribute(emberPositions, 3));
  emberGeo.setAttribute('color', new THREE.BufferAttribute(emberColors, 3));
  emberGeo.computeBoundingBox();
  emberGeo.computeBoundingSphere();
  const emberMat = new THREE.PointsMaterial({
    size: isArrival ? 2.8 : 2.2,
    vertexColors: true,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const emberPoints = new THREE.Points(emberGeo, emberMat);
  group.add(emberPoints);

  const vectorGlyphMeshes = [];
  let vectorLoaded = false;

  // Load vector glyphs
  loadGlyphGeometries().then((glyphGeometries) => {
    if (!glyphGeometries) return;
    glyphGeometries.forEach((geo, idx) => {
      // Mesh with dual materials: [front, side/bevel]
      const mesh = new THREE.Mesh(geo, [frontMat, sideMat]);
      mesh.visible = false;
      mesh.userData = { glyphIndex: idx, baseScale: 1 };
      group.add(mesh);
      vectorGlyphMeshes.push(mesh);
    });
    vectorLoaded = true;
    fallbackPlanes.forEach((p) => { p.visible = false; });
  });

  return {
    group,
    frontMat,
    sideMat,
    planeFrontMat,
    planeExtrusionMat,
    glowMat,
    glowSprite,
    emberMat,
    emberGeo,
    emberData,
    emberPositions,
    emberPoints,
    vectorGlyphMeshes,
    keyLight,
    backLight,
    get vectorLoaded() { return vectorLoaded; },
    dispose() {
      group.traverse((obj) => {
        obj.geometry?.dispose();
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m?.dispose());
        else obj.material?.dispose();
      });
      extrusionTexture.dispose();
      frontTexture.dispose();
      glowTexture.dispose();
    }
  };
}

/**
 * Giant 3D Name for Deep Galaxy Space Mode
 */
export function createGiant3DNameText(scene) {
  const meshData = buildNameMesh({ isArrival: false });
  const { group, vectorGlyphMeshes, emberMat, glowMat, planeFrontMat, planeExtrusionMat, emberGeo, emberData } = meshData;

  // Positioned in deep space closer than before (z = -150) and scaled 1.25x for clear prominence
  const basePos = new THREE.Vector3(0, 32, -150);
  group.position.copy(basePos);
  group.scale.setScalar(1.25);
  group.rotation.x = -0.12;
  group.visible = false;
  scene.add(group);

  let isVisible = false;
  let currentTween = null;

  return {
    group,

    show() {
      if (isVisible) return;
      isVisible = true;
      group.visible = true;
      currentTween?.kill();

      const targets = [emberMat, glowMat, planeFrontMat, planeExtrusionMat];
      currentTween = gsap.to(targets, {
        opacity: (_idx, target) => {
          if (target === glowMat) return 0.35;
          if (target === emberMat) return 0.85;
          return meshData.vectorLoaded ? 0 : 1.0;
        },
        duration: 1.4,
        ease: 'power2.out'
      });

      if (meshData.vectorLoaded) {
        vectorGlyphMeshes.forEach((mesh, index) => {
          mesh.visible = true;
          mesh.scale.setScalar(0.85);
          gsap.to(mesh.scale, { x: 1, y: 1, z: 1, duration: 0.4, delay: index * 0.08, ease: 'back.out(1.6)' });
        });
      }
    },

    hide() {
      if (!isVisible) return;
      isVisible = false;
      currentTween?.kill();
      currentTween = gsap.to([emberMat, glowMat, planeFrontMat, planeExtrusionMat], {
        opacity: 0,
        duration: 0.8,
        ease: 'power2.in',
        onComplete: () => {
          group.visible = false;
          vectorGlyphMeshes.forEach((m) => { m.visible = false; });
        }
      });
    },

    update(_delta, time) {
      if (!group.visible) return;
      group.position.y = basePos.y + Math.sin(time * 0.7) * 2.5;

      const positions = emberGeo.attributes.position.array;
      for (let i = 0; i < emberData.length; i++) {
        const item = emberData[i];
        positions[i * 3 + 1] = item.y + Math.sin(time * item.speed + item.phase) * 4.0;
        positions[i * 3 + 2] = item.z + Math.cos(time * item.speed + item.phase) * 3.0;
      }
      emberGeo.attributes.position.needsUpdate = true;
    },

    dispose() {
      meshData.dispose();
      scene.remove(group);
    }
  };
}

/**
 * Arrival Name Reveal 3D Object:
 * Center stage during Arrival (t=1.6s - 4.2s), huge and luminous,
 * holding for >= 2.2 seconds to guarantee unmistakable legibility!
 */
export function createArrivalNameReveal(scene, camera, { reducedMotion = false } = {}) {
  const meshData = buildNameMesh({ isArrival: true });
  const { group, vectorGlyphMeshes, emberMat, glowMat, planeFrontMat, planeExtrusionMat, frontMat, sideMat, emberGeo, emberData } = meshData;

  group.name = 'arrival3DNameText';
  group.visible = false;
  scene.add(group);

  let isRevealed = false;
  let isDisposed = false;

  // Calculates screen-relative sizing ensuring:
  // - desktop width ≈ 55% of screen, portrait width ≈ 82%
  // - height >= 14% of screen height
  function updateTransform() {
    if (!camera) return;
    const isPortrait = camera.aspect < 1.0;
    const distance = isPortrait ? 95 : 85;

    // Position in front of camera
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const targetPos = camera.position.clone().add(forward.multiplyScalar(distance));
    targetPos.y += isPortrait ? 6 : 4;
    group.position.copy(targetPos);
    group.quaternion.copy(camera.quaternion);

    // Compute visible frustum at distance
    const fovRad = THREE.MathUtils.degToRad(camera.fov);
    const vHeight = 2 * distance * Math.tan(fovRad / 2);
    const vWidth = vHeight * camera.aspect;

    const targetWidth = vWidth * (isPortrait ? 0.82 : 0.55);
    const targetHeight = vHeight * 0.16; // guaranteed >= 14%
    const scaleFromWidth = targetWidth / TEXT_WIDTH;
    const scaleFromHeight = targetHeight / TEXT_HEIGHT;
    const finalScale = Math.max(scaleFromWidth, scaleFromHeight);

    group.scale.setScalar(finalScale);
  }

    let holdDelayedCall = null;

    return {
      group,
      get revealed() { return isRevealed; },
      get disposed() { return isDisposed; },

      show(onComplete) {
        if (isRevealed || isDisposed) return;
        isRevealed = true;
        group.visible = true;
        updateTransform();

        glowMat.opacity = reducedMotion ? 0.45 : 0;
        emberMat.opacity = reducedMotion ? 0.9 : 0;

        if (!reducedMotion) {
          gsap.to(glowMat, { opacity: 0.48, duration: 0.8, ease: 'power2.out' });
          gsap.to(emberMat, { opacity: 0.95, duration: 1.0, ease: 'power2.out' });
        }

        // Staggered character wipe sweep
        const revealGlyphs = () => {
          if (meshData.vectorLoaded && vectorGlyphMeshes.length) {
            vectorGlyphMeshes.forEach((mesh, index) => {
              mesh.visible = true;
              if (reducedMotion) {
                mesh.scale.setScalar(1);
              } else {
                mesh.scale.setScalar(0.7);
                gsap.to(mesh.scale, {
                  x: 1, y: 1, z: 1,
                  duration: 0.45,
                  delay: index * 0.08,
                  ease: 'back.out(1.7)'
                });
              }
            });
          } else {
            // Fallback planes fade in
            gsap.to([planeFrontMat, planeExtrusionMat], {
              opacity: reducedMotion ? 1 : 1,
              duration: reducedMotion ? 0.1 : 0.6,
              ease: 'power2.out'
            });
          }
        };

        if (meshData.vectorLoaded) {
          revealGlyphs();
        } else {
          loadGlyphGeometries().then(() => {
            if (!isDisposed && isRevealed) revealGlyphs();
          });
        }

        // Flash specular highlight sweep
        if (!reducedMotion) {
          gsap.to(frontMat, { emissiveIntensity: 0.9, duration: 0.4, yoyo: true, repeat: 1, delay: 0.6 });
        }

        // Hold for at least 2.4 seconds, then trigger onComplete
        const holdTime = reducedMotion ? 1600 : 2500;
        if (holdDelayedCall) {
          holdDelayedCall.kill();
        }
        holdDelayedCall = gsap.delayedCall(holdTime / 1000, () => {
          holdDelayedCall = null;
          onComplete?.();
        });
      },

      hide(seconds = 0.5) {
        if (!isRevealed || isDisposed) return;
        if (holdDelayedCall) {
          holdDelayedCall.kill();
          holdDelayedCall = null;
        }
        const dur = reducedMotion ? 0.1 : Math.max(0.1, seconds);

        gsap.to(group.scale, {
          x: group.scale.x * 0.4,
          y: group.scale.y * 0.4,
          z: group.scale.z * 0.4,
          duration: dur,
          ease: 'power2.in'
        });
        gsap.to([glowMat, emberMat, planeFrontMat, planeExtrusionMat], {
          opacity: 0,
          duration: dur,
          ease: 'power2.in',
          onComplete: () => {
            this.dispose();
          }
        });
      },

      update(delta, time) {
        if (isDisposed || !group.visible) return;
        updateTransform();

        // Gentle floating embers
        const positions = emberGeo.attributes.position.array;
        for (let i = 0; i < emberData.length; i++) {
          const item = emberData[i];
          positions[i * 3 + 1] = item.y + Math.sin(time * item.speed + item.phase) * 3.5;
          positions[i * 3 + 2] = item.z + Math.cos(time * item.speed + item.phase) * 2.5;
        }
        emberGeo.attributes.position.needsUpdate = true;
      },

      dispose() {
        if (isDisposed) return;
        isDisposed = true;
        if (holdDelayedCall) {
          holdDelayedCall.kill();
          holdDelayedCall = null;
        }
        group.visible = false;
        meshData.dispose();
        scene.remove(group);
      }
    };
}
