import * as THREE from 'three';

/**
 * Creates distant celestial bodies around B-612:
 * - A miniature Saturn with glowing rings in pastel lavender/rose
 * - A golden moon
 * - A cluster of gentle floating cosmic crystals/asteroids
 */
export function createDistantPlanets(scene) {
  const group = new THREE.Group();
  group.name = 'distantPlanets';

  // 1. Mini Pastel Saturn
  const saturnGroup = new THREE.Group();
  saturnGroup.position.set(-65, 38, -90);

  // Saturn Sphere
  const saturnGeo = new THREE.SphereGeometry(6.5, 32, 32);
  const saturnMat = new THREE.MeshStandardMaterial({
    color: 0xe0c3fc, // Lavender pastel
    roughness: 0.65,
    metalness: 0.15,
    emissive: 0x4a2869,
    emissiveIntensity: 0.25
  });
  const saturnMesh = new THREE.Mesh(saturnGeo, saturnMat);
  saturnGroup.add(saturnMesh);

  // Saturn Rings
  const ringGeo = new THREE.RingGeometry(8.5, 14, 64);
  // Modify UV mapping for ring texture feel
  const pos = ringGeo.attributes.position;
  const v3 = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v3.fromBufferAttribute(pos, i);
    ringGeo.attributes.uv.setXY(i, v3.length() < 11 ? 0 : 1, 1);
  }

  const ringMat = new THREE.MeshStandardMaterial({
    color: 0xffd1dc, // Rose pink
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.78,
    roughness: 0.4,
    metalness: 0.2
  });
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  ringMesh.rotation.x = Math.PI / 2.3;
  ringMesh.rotation.y = Math.PI / 8;
  saturnGroup.add(ringMesh);

  group.add(saturnGroup);

  // 2. Mini Golden Moon
  const moonGroup = new THREE.Group();
  moonGroup.position.set(75, 45, -70);

  const moonGeo = new THREE.SphereGeometry(4.2, 32, 32);
  const moonMat = new THREE.MeshStandardMaterial({
    color: 0xffeaa7, // Golden cream
    roughness: 0.5,
    metalness: 0.1,
    emissive: 0xfdcb6e,
    emissiveIntensity: 0.35
  });
  const moonMesh = new THREE.Mesh(moonGeo, moonMat);
  moonGroup.add(moonMesh);

  // Small halo around moon
  const moonHaloGeo = new THREE.SphereGeometry(4.7, 16, 16);
  const moonHaloMat = new THREE.MeshBasicMaterial({
    color: 0xffeaa7,
    transparent: true,
    opacity: 0.15,
    wireframe: false
  });
  moonGroup.add(new THREE.Mesh(moonHaloGeo, moonHaloMat));

  group.add(moonGroup);

  // 3. Mini Floating Pastel Asteroids / Crystals
  const asteroids = [];
  const asteroidCount = 12;
  const crystalMat = new THREE.MeshStandardMaterial({
    color: 0xa8e6cf, // Pastel mint
    roughness: 0.3,
    metalness: 0.4,
    emissive: 0x3d7b68,
    emissiveIntensity: 0.2,
    flatShading: true
  });

  for (let i = 0; i < asteroidCount; i++) {
    const size = Math.random() * 1.5 + 0.8;
    const geom = new THREE.DodecahedronGeometry(size, 0);
    const mat = crystalMat.clone();

    // Randomize pastel color
    const colors = [0xa8e6cf, 0xdcedc1, 0xffd3b6, 0xffaaa5, 0xc5cae9];
    mat.color.setHex(colors[i % colors.length]);

    const mesh = new THREE.Mesh(geom, mat);

    const orbitRadius = 45 + Math.random() * 55;
    const orbitSpeed = (Math.random() * 0.08 + 0.04) * (Math.random() > 0.5 ? 1 : -1);
    const orbitAngle = Math.random() * Math.PI * 2;
    const yOffset = (Math.random() - 0.5) * 35;

    mesh.position.set(
      Math.cos(orbitAngle) * orbitRadius,
      yOffset,
      Math.sin(orbitAngle) * orbitRadius
    );

    group.add(mesh);
    asteroids.push({
      mesh,
      orbitRadius,
      orbitSpeed,
      orbitAngle,
      yOffset,
      rotSpeedX: Math.random() * 0.02,
      rotSpeedY: Math.random() * 0.02
    });
  }

  scene.add(group);

  function update(delta, time) {
    // Slow orbit and spin of Saturn
    saturnGroup.rotation.y = time * 0.03;
    moonGroup.rotation.y = time * 0.02;

    // Orbiting mini crystals
    asteroids.forEach(ast => {
      ast.orbitAngle += ast.orbitSpeed * delta;
      ast.mesh.position.x = Math.cos(ast.orbitAngle) * ast.orbitRadius;
      ast.mesh.position.z = Math.sin(ast.orbitAngle) * ast.orbitRadius;
      ast.mesh.position.y = ast.yOffset + Math.sin(time + ast.orbitRadius) * 2;
      ast.mesh.rotation.x += ast.rotSpeedX;
      ast.mesh.rotation.y += ast.rotSpeedY;
    });
  }

  return { group, update };
}
