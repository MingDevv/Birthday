import * as THREE from 'three';
import gsap from 'gsap';

/**
 * =============================================================================
 * 🔴 Giant 3D Red Text "ข้าวหอม" (Cosmic Ruby Monument in Deep Galaxy Space)
 * Placed in deep space BEHIND the solar system, resting in the galaxy backdrop.
 * - Position: (0, 36, -220) — Well behind Saturn's orbit (R=92)
 * - 10-Layer Volumetric 3D Extrusion with deep crimson bevels and ruby front face
 * - Subtle gold rim and stardust embers
 * - Natural 3D world-space object (NOT glued to camera screen)
 * =============================================================================
 */

const TEXT = 'ข้าวหอม';
const TEXT_WIDTH = 220;
const TEXT_HEIGHT = 100;

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
    // Bevel & Extrusion Layers: Deep dark wine-red
    ctx.lineWidth = 26;
    ctx.strokeStyle = '#4c0519';
    ctx.strokeText(TEXT, x, y);
    ctx.fillStyle = '#881337';
    ctx.fillText(TEXT, x, y);
  } else {
    // Front Face: Brilliant Ruby Red with Gold Rim and Neon Crimson Glow
    ctx.shadowColor = 'rgba(239, 68, 68, 0.9)';
    ctx.shadowBlur = 35;

    // Outer Crimson Glow
    ctx.lineWidth = 28;
    ctx.strokeStyle = '#be123c';
    ctx.strokeText(TEXT, x, y);

    // Gold Bevel Edge
    ctx.lineWidth = 12;
    ctx.strokeStyle = '#fef08a';
    ctx.strokeText(TEXT, x, y);

    // Front Ruby-to-Crimson Gradient
    const grad = ctx.createLinearGradient(0, y - 180, 0, y + 180);
    grad.addColorStop(0, '#fda4af');  // Rose Diamond Highlight
    grad.addColorStop(0.22, '#f43f5e'); // Vivid Ruby
    grad.addColorStop(0.65, '#e11d48'); // Rich Crimson
    grad.addColorStop(1, '#9f1239');   // Deep Wine Red
    ctx.fillStyle = grad;
    ctx.fillText(TEXT, x, y);

    // Upper Specular Highlight
    ctx.shadowBlur = 0;
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.strokeText(TEXT, x, y);

    // Celestial Crown above name
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

export function createGiant3DNameText(scene) {
  const nameGroup = new THREE.Group();
  nameGroup.name = 'giant3DNameText';

  // Positioned in deep space BEHIND the solar system (Saturn is at R=92, text is at Z=-220)
  const basePos = new THREE.Vector3(0, 36, -220);
  nameGroup.position.copy(basePos);
  nameGroup.rotation.x = -0.15; // Natural slight upward tilt facing overview camera
  nameGroup.visible = false;
  scene.add(nameGroup);

  const extrusionTexture = createTextTexture(true);
  const frontTexture = createTextTexture(false);

  const extrusionMaterial = new THREE.MeshBasicMaterial({
    map: extrusionTexture,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    depthTest: true,
    side: THREE.DoubleSide
  });

  const frontMaterial = new THREE.MeshBasicMaterial({
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

  for (let i = 0; i < layerCount; i++) {
    const isFront = i === layerCount - 1;
    const mesh = new THREE.Mesh(textPlane, isFront ? frontMaterial : extrusionMaterial);
    mesh.position.z = (i - (layerCount - 1) / 2) * layerSpacing;
    nameGroup.add(mesh);
  }

  // Soft Ruby Celestial Glow Backdrop
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = 256;
  glowCanvas.height = 128;
  const glowCtx = glowCanvas.getContext('2d');
  const glow = glowCtx.createRadialGradient(128, 64, 10, 128, 64, 128);
  glow.addColorStop(0, 'rgba(244, 63, 94, 0.45)');
  glow.addColorStop(0.5, 'rgba(190, 18, 60, 0.15)');
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  glowCtx.fillStyle = glow;
  glowCtx.fillRect(0, 0, 256, 128);

  const glowTexture = new THREE.CanvasTexture(glowCanvas);
  const glowMaterial = new THREE.SpriteMaterial({
    map: glowTexture,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: true
  });
  const glowSprite = new THREE.Sprite(glowMaterial);
  glowSprite.scale.set(TEXT_WIDTH * 1.5, TEXT_HEIGHT * 1.5, 1);
  glowSprite.position.set(0, 0, -4);
  nameGroup.add(glowSprite);

  // Orbiting Stardust Embers
  const emberCount = 140;
  const emberPositions = new Float32Array(emberCount * 3);
  const emberColors = new Float32Array(emberCount * 3);
  const emberData = [];
  const emberPalette = [
    new THREE.Color(0xf43f5e), // Ruby Rose
    new THREE.Color(0xfef08a), // 24k Gold
    new THREE.Color(0xfca5a5), // Rose Diamond
    new THREE.Color(0xffffff)  // White Spark
  ];

  for (let i = 0; i < emberCount; i++) {
    const x = (Math.random() - 0.5) * TEXT_WIDTH * 1.1;
    const y = (Math.random() - 0.5) * TEXT_HEIGHT * 1.1;
    const z = (Math.random() - 0.5) * 20;
    emberPositions.set([x, y, z], i * 3);
    const col = emberPalette[i % emberPalette.length];
    emberColors.set([col.r, col.g, col.b], i * 3);
    emberData.push({ x, y, z, phase: Math.random() * Math.PI * 2, speed: 0.8 + Math.random() });
  }

  const emberGeometry = new THREE.BufferGeometry();
  emberGeometry.setAttribute('position', new THREE.BufferAttribute(emberPositions, 3));
  emberGeometry.setAttribute('color', new THREE.BufferAttribute(emberColors, 3));

  const emberMaterial = new THREE.PointsMaterial({
    size: 2.2,
    vertexColors: true,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: true
  });
  const emberPoints = new THREE.Points(emberGeometry, emberMaterial);
  nameGroup.add(emberPoints);

  const fadeMaterials = [frontMaterial, extrusionMaterial, glowMaterial, emberMaterial];
  let isVisible = false;
  let currentTween = null;

  return {
    group: nameGroup,

    show() {
      if (isVisible) return;
      isVisible = true;
      nameGroup.visible = true;
      currentTween?.kill();
      currentTween = gsap.to(fadeMaterials, {
        opacity: (_idx, target) => {
          if (target === frontMaterial) return 1.0;
          if (target === extrusionMaterial) return 0.75;
          if (target === glowMaterial) return 0.5;
          return 0.9;
        },
        duration: 1.5,
        ease: 'power2.out'
      });
    },

    hide() {
      if (!isVisible) return;
      isVisible = false;
      currentTween?.kill();
      currentTween = gsap.to(fadeMaterials, {
        opacity: 0,
        duration: 0.8,
        ease: 'power2.in',
        onComplete: () => {
          nameGroup.visible = false;
        }
      });
    },

    update(_delta, time) {
      if (!nameGroup.visible) return;

      // Gentle floating breathing animation in deep space
      nameGroup.position.y = basePos.y + Math.sin(time * 0.7) * 2.5;

      // Animate orbiting embers
      const positions = emberGeometry.attributes.position.array;
      for (let i = 0; i < emberCount; i++) {
        const item = emberData[i];
        positions[i * 3 + 1] = item.y + Math.sin(time * item.speed + item.phase) * 4.0;
        positions[i * 3 + 2] = item.z + Math.cos(time * item.speed + item.phase) * 3.0;
      }
      emberGeometry.attributes.position.needsUpdate = true;
    }
  };
}
