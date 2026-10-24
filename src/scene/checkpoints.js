import * as THREE from 'three';
import { MEMORIES_LIST } from '../config/memoriesData.js';
import { createGlowTexture } from './galaxySkybox.js';

/**
 * Creates Frosted Glass Number Badge with Heart icon:
 * displays "01", "02", "03", "04", "05" with a delicate pink/gold heart
 */
function createBeaconBadgeSprite(badgeText, color = '#ff9a9e') {
  const canvas = document.createElement('canvas');
  canvas.width = 160;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');

  // Outer ambient glow
  const glow = ctx.createRadialGradient(80, 80, 36, 80, 80, 78);
  glow.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
  glow.addColorStop(0.4, color);
  glow.addColorStop(0.85, 'rgba(255, 154, 162, 0.25)');
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(80, 80, 78, 0, Math.PI * 2);
  ctx.fill();

  // Frosted glass inner circle
  ctx.fillStyle = 'rgba(24, 20, 42, 0.88)';
  ctx.beginPath();
  ctx.arc(80, 80, 48, 0, Math.PI * 2);
  ctx.fill();

  // Glass rim
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.stroke();

  // Secondary delicate white rim
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(80, 80, 44, 0, Math.PI * 2);
  ctx.stroke();

  // Little heart icon on top
  ctx.fillStyle = '#ff6b81';
  ctx.font = '22px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('♥', 80, 60);

  // Badge Number text (e.g. 01, 02)
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px "Outfit", "Prompt", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(badgeText, 80, 94);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const spriteMat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: true,
    depthWrite: false
  });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(1.8, 1.8, 1.8);
  return sprite;
}

/**
 * Creates Hover Title Label Sprite
 */
function createTitleLabelSprite(title, thaiSub, color = '#ff9a9e') {
  const canvas = document.createElement('canvas');
  canvas.width = 440;
  canvas.height = 110;
  const ctx = canvas.getContext('2d');

  // Pill backdrop
  ctx.fillStyle = 'rgba(16, 14, 34, 0.92)';
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;

  const r = 26;
  const x = 10, y = 10, w = 420, h = 90;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px "Outfit", "Prompt", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, 220, 42);

  // Thai subtitle
  ctx.fillStyle = '#ffd1dc';
  ctx.font = '400 20px "Prompt", sans-serif';
  ctx.fillText(thaiSub, 220, 74);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const spriteMat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false
  });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(3.4, 0.85, 1);
  return sprite;
}

/**
 * Creates 5 Interactive Memory Beacons for Give Love Studio Planet
 */
export function createCheckpoints(scene, planetRadius) {
  const beaconsGroup = new THREE.Group();
  beaconsGroup.name = 'memoryBeacons';

  const checkpointsList = [];
  const interactiveMeshes = [];

  const glowTex = createGlowTexture(64);

  // 5 Balanced Spherical Coordinates (Latitude, Longitude in degrees)
  const beaconCoords = [
    { lat: 25,  lon: 30 },   // 01 The First Day
    { lat: 42,  lon: 155 },  // 02 Our Favorite Cafe
    { lat: -22, lon: 95 },   // 03 First Trip Together
    { lat: -32, lon: -45 },  // 04 Little Moments, Big Love
    { lat: 14,  lon: -135 }  // 05 Happy Birthday, My Universe
  ];

  MEMORIES_LIST.forEach((memory, idx) => {
    const coords = beaconCoords[idx];
    const phi = (90 - coords.lat) * (Math.PI / 180);
    const theta = (coords.lon + 180) * (Math.PI / 180);

    const normDir = new THREE.Vector3(
      -Math.sin(phi) * Math.cos(theta),
      Math.cos(phi),
      Math.sin(phi) * Math.sin(theta)
    ).normalize();

    // Position on planet surface
    const surfacePos = normDir.clone().multiplyScalar(planetRadius);

    const beaconRoot = new THREE.Group();
    beaconRoot.position.copy(surfacePos);

    // Orient upwards along surface normal
    beaconRoot.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normDir);

    const beaconColor = new THREE.Color(memory.color || 0xff9a9e);

    // 1. Light Beacon (Glowing Beam shooting up into space)
    const beamHeight = 4.2;
    const beamGeo = new THREE.CylinderGeometry(0.08, 0.22, beamHeight, 16, 1, true);
    beamGeo.translate(0, beamHeight / 2, 0);

    const beamMat = new THREE.MeshBasicMaterial({
      color: beaconColor,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const beamMesh = new THREE.Mesh(beamGeo, beamMat);
    beaconRoot.add(beamMesh);

    // Inner bright core
    const coreGeo = new THREE.CylinderGeometry(0.03, 0.08, beamHeight, 12, 1, true);
    coreGeo.translate(0, beamHeight / 2, 0);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    beaconRoot.add(coreMesh);

    // 2. Pulsing Ripple Rings at Base (Expanding waves)
    const rippleCount = 2;
    const ripples = [];
    for (let r = 0; r < rippleCount; r++) {
      const ripGeo = new THREE.RingGeometry(0.3, 0.45, 32);
      const ripMat = new THREE.MeshBasicMaterial({
        color: beaconColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6,
        depthWrite: false
      });
      const ripMesh = new THREE.Mesh(ripGeo, ripMat);
      ripMesh.rotation.x = Math.PI / 2;
      ripMesh.position.y = 0.05;
      beaconRoot.add(ripMesh);
      ripples.push({
        mesh: ripMesh,
        phase: r * 0.5
      });
    }

    // 3. Glowing Crystal Diamond at Beacon Top
    const crystalGeo = new THREE.OctahedronGeometry(0.42, 0);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: beaconColor,
      emissive: beaconColor,
      emissiveIntensity: 0.7,
      metalness: 0.85,
      roughness: 0.15,
      flatShading: true
    });
    const crystalMesh = new THREE.Mesh(crystalGeo, crystalMat);
    crystalMesh.position.y = beamHeight + 0.3;
    beaconRoot.add(crystalMesh);

    // Crystal Halo
    const haloMat = new THREE.SpriteMaterial({
      map: glowTex,
      color: beaconColor,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const halo = new THREE.Sprite(haloMat);
    halo.scale.set(1.8, 1.8, 1.8);
    halo.position.y = beamHeight + 0.3;
    beaconRoot.add(halo);

    // 4. Floating Frosted Glass Number Badge ("01" - "05" with heart)
    const badgeSprite = createBeaconBadgeSprite(memory.badge, memory.color);
    badgeSprite.position.set(0, beamHeight + 1.35, 0);
    beaconRoot.add(badgeSprite);

    // 5. Hover Title Label
    const labelSprite = createTitleLabelSprite(memory.title, memory.thaiSubtitle, memory.color);
    labelSprite.position.set(0, beamHeight + 2.45, 0);
    labelSprite.scale.set(0, 0, 0); // hidden initially
    beaconRoot.add(labelSprite);

    // 6. Raycast hit target (Invisible sphere around beacon top)
    const hitGeo = new THREE.SphereGeometry(1.6, 12, 12);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });
    const hitMesh = new THREE.Mesh(hitGeo, hitMat);
    hitMesh.position.y = beamHeight + 0.8;
    hitMesh.userData = { memoryId: memory.id, memoryData: memory, parentRoot: beaconRoot };
    beaconRoot.add(hitMesh);
    interactiveMeshes.push(hitMesh);

    beaconsGroup.add(beaconRoot);

    checkpointsList.push({
      id: memory.id,
      memory,
      root: beaconRoot,
      crystalMesh,
      halo,
      badgeSprite,
      labelSprite,
      ripples,
      hitMesh,
      dir: normDir,
      surfacePos,
      isHovered: false,
      isVisited: false,
      currentScale: 1.0,
      targetScale: 1.0,
      phaseOffset: idx * 0.6
    });
  });

  scene.add(beaconsGroup);

  // Update Animation
  function update(delta, time) {
    checkpointsList.forEach(bp => {
      // Gentle floating hover of crystal and badge
      const floatY = Math.sin(time * 2.5 + bp.phaseOffset) * 0.12;
      bp.crystalMesh.position.y = 4.5 + floatY;
      bp.crystalMesh.rotation.y += 0.03;
      bp.crystalMesh.rotation.x += 0.015;

      bp.halo.position.y = 4.5 + floatY;
      bp.badgeSprite.position.y = 5.55 + floatY * 1.3;

      // Pulsing ripples expanding at base
      bp.ripples.forEach(rip => {
        const prog = ((time * 0.7 + rip.phase) % 1.0);
        const ripScale = 0.8 + prog * 2.4;
        rip.mesh.scale.set(ripScale, ripScale, 1);
        rip.mesh.material.opacity = Math.max(0, (1 - prog) * 0.65);
      });

      // Smooth hover scale
      bp.currentScale += (bp.targetScale - bp.currentScale) * 0.18;
      bp.badgeSprite.scale.setScalar(1.8 * bp.currentScale);
    });
  }

  function setHover(hitMesh, isHovered) {
    if (!hitMesh) return;
    const bp = checkpointsList.find(c => c.id === hitMesh.userData.memoryId);
    if (!bp) return;

    bp.isHovered = isHovered;
    bp.targetScale = isHovered ? 1.35 : (bp.isVisited ? 1.1 : 1.0);

    if (isHovered) {
      bp.labelSprite.scale.set(3.4, 0.85, 1);
      bp.halo.material.opacity = 0.9;
    } else {
      bp.labelSprite.scale.set(0, 0, 0);
      bp.halo.material.opacity = bp.isVisited ? 0.65 : 0.45;
    }
  }

  function markVisited(memoryId) {
    const bp = checkpointsList.find(c => c.id === memoryId);
    if (!bp) return;
    bp.isVisited = true;
    bp.crystalMesh.material.emissiveIntensity = 1.0;
  }

  return {
    group: beaconsGroup,
    checkpointsList,
    interactiveMeshes,
    setHover,
    markVisited,
    update
  };
}
