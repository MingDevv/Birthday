import * as THREE from 'three';
import { createGlowTexture } from './galaxySkybox.js';
import { MEMORIES_LIST } from '../config/memoriesData.js';

/**
 * 5 Floating Celestial Memory Star Crystals in the Purple Galaxy:
 * Replaces the old earth-pinned checkpoints with ethereal, floating
 * celestial star jewels orbiting along the galaxy spiral arms.
 */
export function createFloatingMemories(scene) {
  const memoriesGroup = new THREE.Group();
  memoriesGroup.name = 'floatingMemoriesSystem';

  const glowTex = createGlowTexture(64, 'rgba(255,255,255,1)', 'rgba(255,180,220,0)');
  const interactiveMeshes = [];
  const memoryStarsList = [];

  // Orbital coordinates distributed across the spiral arms
  const orbitalConfigs = [
    { radius: 28, angle: 0.2,   height: 4.2,  speed: 0.12 },
    { radius: 38, angle: 1.45,  height: -3.6, speed: 0.09 },
    { radius: 48, angle: 2.7,   height: 5.8,  speed: 0.075 },
    { radius: 58, angle: 3.95,  height: -4.8, speed: 0.06 },
    { radius: 68, angle: 5.2,   height: 4.0,  speed: 0.05 }
  ];

  MEMORIES_LIST.forEach((mem, idx) => {
    const cfg = orbitalConfigs[idx] || orbitalConfigs[0];
    const nodeGroup = new THREE.Group();
    nodeGroup.name = `memoryStar_${mem.id}`;

    const x = Math.cos(cfg.angle) * cfg.radius;
    const z = Math.sin(cfg.angle) * cfg.radius;
    nodeGroup.position.set(x, cfg.height, z);

    // 1. Multifaceted Crystal Star Jewel
    const crystalGeo = new THREE.OctahedronGeometry(2.0, 0);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(mem.color),
      emissive: new THREE.Color(mem.color),
      emissiveIntensity: 0.45,
      roughness: 0.2,
      metalness: 0.85,
      wireframe: false
    });
    const crystalMesh = new THREE.Mesh(crystalGeo, crystalMat);
    nodeGroup.add(crystalMesh);

    // Inner Core Diamond
    const innerGeo = new THREE.TetrahedronGeometry(1.0, 0);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    nodeGroup.add(innerMesh);

    // 2. Gyroscopic Celestial Orbit Rings
    const ringGeo = new THREE.TorusGeometry(3.2, 0.08, 16, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(mem.color),
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });
    const ringMesh1 = new THREE.Mesh(ringGeo, ringMat);
    ringMesh1.rotation.x = Math.PI / 2.2;
    nodeGroup.add(ringMesh1);

    const ringMesh2 = new THREE.Mesh(new THREE.TorusGeometry(4.2, 0.06, 16, 48), ringMat);
    ringMesh2.rotation.y = Math.PI / 3;
    nodeGroup.add(ringMesh2);

    // 3. Volumetric Stardust Halo Sprite
    const haloMat = new THREE.SpriteMaterial({
      map: glowTex,
      color: new THREE.Color(mem.color),
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    const haloSprite = new THREE.Sprite(haloMat);
    haloSprite.scale.set(8.5, 8.5, 1);
    nodeGroup.add(haloSprite);

    // 4. Vertical Celestial Starlight Beam
    const beamGeo = new THREE.CylinderGeometry(0.12, 0.35, 14.0, 16, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(mem.color),
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const beamMesh = new THREE.Mesh(beamGeo, beamMat);
    nodeGroup.add(beamMesh);

    // 5. Interactive Raycast Hitbox
    const hitGeo = new THREE.SphereGeometry(4.5, 16, 16);
    const hitMat = new THREE.MeshBasicMaterial({
      visible: false
    });
    const hitMesh = new THREE.Mesh(hitGeo, hitMat);
    hitMesh.userData = {
      isMemoryStar: true,
      memoryId: mem.id,
      memory: mem,
      nodeGroup: nodeGroup
    };
    nodeGroup.add(hitMesh);
    interactiveMeshes.push(hitMesh);

    memoriesGroup.add(nodeGroup);

    memoryStarsList.push({
      id: mem.id,
      memory: mem,
      group: nodeGroup,
      crystalMesh,
      innerMesh,
      ring1: ringMesh1,
      ring2: ringMesh2,
      halo: haloSprite,
      beam: beamMesh,
      hitMesh,
      config: cfg,
      currentAngle: cfg.angle,
      isVisited: false,
      isHovered: false
    });
  });

  scene.add(memoriesGroup);

  // ---------------------------------------------------------------------------
  // Interactions & Animation
  // ---------------------------------------------------------------------------
  function setHover(mesh, isHover) {
    if (!mesh || !mesh.userData) return;
    const item = memoryStarsList.find(m => m.id === mesh.userData.memoryId);
    if (!item) return;

    item.isHovered = isHover;
    const targetScale = isHover ? 1.35 : (item.isVisited ? 1.15 : 1.0);
    item.group.scale.set(targetScale, targetScale, targetScale);
    item.halo.scale.set(targetScale * 9.5, targetScale * 9.5, 1);
  }

  function markVisited(id) {
    const item = memoryStarsList.find(m => m.id === id);
    if (!item) return;
    item.isVisited = true;
    item.crystalMesh.material.emissiveIntensity = 0.85;
    item.crystalMesh.material.color.setHex(0xffd700); // Turns radiant gold
    item.halo.material.color.setHex(0xffd700);
  }

  function update(delta, time) {
    memoryStarsList.forEach((item, idx) => {
      // Rotate crystal star
      item.crystalMesh.rotation.y = time * 1.5 + idx;
      item.crystalMesh.rotation.x = time * 0.8;
      item.innerMesh.rotation.y = -time * 2.0;

      // Gyroscopic rings rotation
      item.ring1.rotation.z = time * 1.2;
      item.ring2.rotation.x = time * 0.9;

      // Floating bobbing wave motion
      const wave = Math.sin(time * 2.0 + idx * 1.4) * 0.45;
      item.group.position.y = item.config.height + wave;

      // Pulse halo
      const pulse = Math.sin(time * 3.0 + idx) * 0.15 + 0.85;
      const baseScale = item.isHovered ? 1.35 : 1.0;
      item.halo.scale.set(8.5 * pulse * baseScale, 8.5 * pulse * baseScale, 1);
    });
  }

  return {
    group: memoriesGroup,
    interactiveMeshes,
    starsList: memoryStarsList,
    setHover,
    markVisited,
    update
  };
}
