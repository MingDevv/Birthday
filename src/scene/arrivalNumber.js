import * as THREE from 'three';

// Extruded, front-facing numeral strokes keep the arrival number crisp without
// introducing a font dependency or changing any of the owner's Thai copy.
export function createArrivalNumber(scene, { quality = 'medium' } = {}) {
  const group = new THREE.Group();
  group.name = 'arrivalNumber16';
  group.visible = false;
  const material = new THREE.MeshPhysicalMaterial({
    color: 0xffd38e,
    emissive: 0xa94d8f,
    emissiveIntensity: 0.28,
    metalness: 0.45,
    roughness: 0.23,
    clearcoat: 0.9,
    transparent: true,
    opacity: 0
  });
  const curves = [
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(-5.3, -4.8, 0), new THREE.Vector3(-5.3, 3.7, 0), new THREE.Vector3(-7.2, 1.8, 0)
    ]),
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(4.4, 4.8, 0), new THREE.Vector3(1.4, 4.8, 0), new THREE.Vector3(-0.1, 2.7, 0),
      new THREE.Vector3(-1.0, 0.2, 0), new THREE.Vector3(-0.5, -3.0, 0), new THREE.Vector3(1.4, -4.5, 0),
      new THREE.Vector3(4.1, -4.0, 0), new THREE.Vector3(5.0, -2.0, 0), new THREE.Vector3(4.2, 0.3, 0),
      new THREE.Vector3(2.1, 1.0, 0), new THREE.Vector3(0.1, 0.0, 0)
    ])
  ];
  for (const curve of curves) {
    const geometry = new THREE.TubeGeometry(curve, quality === 'low' ? 36 : 64, 0.48, 10, false);
    group.add(new THREE.Mesh(geometry, material));
  }
  group.position.set(0, 18, -8);
  group.scale.setScalar(0.72);
  scene.add(group);
  let mode = 'idle';
  let elapsed = 0;
  let duration = 0.6;
  const dispose = () => {
    scene.remove(group);
    group.traverse((object) => object.geometry?.dispose());
    material.dispose();
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
      group.scale.setScalar(0.72);
    },
    update(delta, camera, reducedMotion = false) {
      if (mode === 'disposed' || mode === 'idle') return;
      group.quaternion.copy(camera.quaternion);
      elapsed += delta;
      const t = reducedMotion ? 1 : Math.min(1, elapsed / duration);
      if (mode === 'in') {
        material.opacity = t;
        group.scale.setScalar(THREE.MathUtils.lerp(0.72, 1, t));
        if (t >= 1) mode = 'shown';
      } else if (mode === 'out') {
        material.opacity = 1 - t;
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
