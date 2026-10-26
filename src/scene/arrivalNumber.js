import * as THREE from 'three';

/**
 * Creates soft circular glow for the arrival 16 numeral
 */
function createNumberGlowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(128, 128, 6, 128, 128, 128);
  grad.addColorStop(0, 'rgba(244, 114, 182, 0.45)');  // soft rose-pink center
  grad.addColorStop(0.35, 'rgba(244, 114, 182, 0.25)'); // pink mid
  grad.addColorStop(0.7, 'rgba(192, 132, 252, 0.1)');  // lavender
  grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createArrivalNumber(scene, { quality = 'medium' } = {}) {
  const group = new THREE.Group();
  group.name = 'arrivalNumber16';
  group.visible = false;

  const material = new THREE.MeshPhysicalMaterial({
    color: 0xfff4ea, // warm cream
    emissive: 0xff6b9d, // vivid rose glow
    emissiveIntensity: 0.65,
    metalness: 0.35,
    roughness: 0.18,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
    transparent: true,
    opacity: 0
  });

  // Smooth CatmullRom curves for numerals "1" and "6"
  const curves = [
    // Numeral "1"
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(-5.2, -4.8, 0),
      new THREE.Vector3(-5.2, 4.2, 0),
      new THREE.Vector3(-7.4, 2.2, 0)
    ]),
    // Numeral "6"
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(4.5, 4.8, 0),
      new THREE.Vector3(1.6, 4.8, 0),
      new THREE.Vector3(-0.1, 2.7, 0),
      new THREE.Vector3(-0.9, 0.2, 0),
      new THREE.Vector3(-0.5, -3.0, 0),
      new THREE.Vector3(1.4, -4.6, 0),
      new THREE.Vector3(4.2, -4.0, 0),
      new THREE.Vector3(5.1, -2.0, 0),
      new THREE.Vector3(4.2, 0.4, 0),
      new THREE.Vector3(2.1, 1.1, 0),
      new THREE.Vector3(0.0, 0.0, 0)
    ])
  ];

  const tubeRadius = quality === 'low' ? 0.92 : 1.05;
  for (const curve of curves) {
    const geometry = new THREE.TubeGeometry(curve, quality === 'low' ? 40 : 72, tubeRadius, 14, false);
    group.add(new THREE.Mesh(geometry, material));
  }

  // Luminous backdrop glow
  const glowTexture = createNumberGlowTexture();
  const glowMat = new THREE.SpriteMaterial({
    map: glowTexture,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const glowSprite = new THREE.Sprite(glowMat);
  glowSprite.scale.set(48, 36, 1);
  glowSprite.position.set(0, 0, -2);
  group.add(glowSprite);

  group.position.set(0, 18, -8);
  group.scale.setScalar(1.15);
  scene.add(group);

  let mode = 'idle';
  let elapsed = 0;
  let duration = 0.6;

  const dispose = () => {
    scene.remove(group);
    group.traverse((object) => object.geometry?.dispose());
    material.dispose();
    glowMat.dispose();
    glowTexture.dispose();
    mode = 'disposed';
  };

  return {
    group,
    show(seconds = 0.6) {
      if (mode === 'disposed') return;
      group.visible = true;
      mode = 'in';
      elapsed = 0;
      duration = Math.max(0.01, seconds);
      material.opacity = 0;
      glowMat.opacity = 0;
      group.scale.setScalar(0.72);
    },
    update(delta, camera, reducedMotion = false) {
      if (mode === 'disposed' || mode === 'idle') return;
      group.quaternion.copy(camera.quaternion);
      elapsed += delta;
      const t = reducedMotion ? 1 : Math.min(1, elapsed / duration);
      if (mode === 'in') {
        material.opacity = t;
        glowMat.opacity = t * 0.45;
        group.scale.setScalar(THREE.MathUtils.lerp(0.72, 1, t));
        if (t >= 1) mode = 'shown';
      } else if (mode === 'out') {
        material.opacity = 1 - t;
        glowMat.opacity = (1 - t) * 0.45;
        group.scale.setScalar(THREE.MathUtils.lerp(1, 0.82, t));
        if (t >= 1) dispose();
      }
    },
    hide(seconds = 0.32) {
      if (mode === 'disposed' || mode === 'idle') { dispose(); return; }
      if (seconds <= 0) { dispose(); return; }
      mode = 'out';
      elapsed = 0;
      duration = seconds;
    },
    dispose,
    get disposed() { return mode === 'disposed'; }
  };
}
