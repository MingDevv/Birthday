import * as THREE from 'three';
import { createGlowTexture } from './galaxySkybox.js';

/**
 * The Sacred Centerpiece of the Purple Galaxy:
 * "The Little Prince's Enchanted Crystal Rose" (ดอกกุหลาบแก้วคริสตัลเรืองแสงแห่งเจ้าชายน้อย)
 * - Sculpted 3D Crimson Velvet Blooming Rose with floating fallen petals & stem
 * - High-Gloss Crystalline Glass Dome with refractive highlights
 * - 3 Golden Celestial Gyroscopic Rings orbiting at varying angles
 * - Radiating golden stardust spores & floating fairy particles
 * - Crystalline floating pedestal with glowing amethyst runes
 */
export function createEnchantedRose(scene) {
  const centerGroup = new THREE.Group();
  centerGroup.name = 'enchantedRoseCenterpiece';
  centerGroup.position.set(0, 0, 0);

  const glowTex = createGlowTexture(64, 'rgba(255,255,255,1)', 'rgba(255,180,220,0)');

  // ---------------------------------------------------------------------------
  // 1. Floating Crystalline Pedestal
  // ---------------------------------------------------------------------------
  const pedestalGeo = new THREE.CylinderGeometry(5.2, 6.8, 1.4, 8);
  const pedestalMat = new THREE.MeshStandardMaterial({
    color: 0x1f1135,
    roughness: 0.35,
    metalness: 0.85,
    emissive: 0x3b0764,
    emissiveIntensity: 0.4
  });
  const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
  pedestal.position.y = -5.8;
  pedestal.castShadow = true;
  pedestal.receiveShadow = true;
  centerGroup.add(pedestal);

  // Pedestal rim starlight ring
  const pedRingGeo = new THREE.TorusGeometry(6.2, 0.15, 16, 64);
  const pedRingMat = new THREE.MeshBasicMaterial({
    color: 0xffd700,
    transparent: true,
    opacity: 0.85
  });
  const pedRing = new THREE.Mesh(pedRingGeo, pedRingMat);
  pedRing.rotation.x = Math.PI / 2;
  pedRing.position.y = -5.8;
  centerGroup.add(pedRing);

  // ---------------------------------------------------------------------------
  // 2. Sculpted 3D Velvet Red Rose & Stem
  // ---------------------------------------------------------------------------
  const roseGroup = new THREE.Group();
  roseGroup.position.set(0, -1.8, 0);

  // Curved Stem
  const stemCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -3.2, 0),
    new THREE.Vector3(0.25, -1.8, -0.15),
    new THREE.Vector3(-0.18, -0.6, 0.12),
    new THREE.Vector3(0, 0.6, 0)
  ]);
  const stemGeo = new THREE.TubeGeometry(stemCurve, 24, 0.22, 12, false);
  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x059669, // Emerald vine
    roughness: 0.5,
    metalness: 0.1,
    emissive: 0x064e3b,
    emissiveIntensity: 0.2
  });
  const stem = new THREE.Mesh(stemGeo, stemMat);
  roseGroup.add(stem);

  // Leaves
  function createLeaf(x, y, z, rotX, rotY, rotZ) {
    const leafGeo = new THREE.ConeGeometry(0.75, 1.8, 5);
    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      roughness: 0.4,
      metalness: 0.1
    });
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.scale.set(1, 0.25, 0.6);
    leaf.position.set(x, y, z);
    leaf.rotation.set(rotX, rotY, rotZ);
    return leaf;
  }
  roseGroup.add(createLeaf(0.55, -1.4, 0.1, 0.3, 0.2, -Math.PI / 3));
  roseGroup.add(createLeaf(-0.5, -0.8, -0.15, -0.3, -0.2, Math.PI / 3.2));

  // Layered Rose Petals (Bud & Blooming Coronas)
  const petalGroup = new THREE.Group();
  petalGroup.position.set(0, 0.9, 0);

  const petalMat = new THREE.MeshStandardMaterial({
    color: 0xe11d48, // Crimson Velvet
    roughness: 0.38,
    metalness: 0.15,
    emissive: 0x9f1239,
    emissiveIntensity: 0.38,
    side: THREE.DoubleSide
  });

  const innerBudGeo = new THREE.SphereGeometry(0.75, 16, 16);
  innerBudGeo.scale(1, 1.4, 0.85);
  const innerBud = new THREE.Mesh(innerBudGeo, petalMat);
  petalGroup.add(innerBud);

  // Outer Petals Shells (Spiral Petal Geometry)
  const petalLayers = [
    { count: 5, radius: 0.95, scaleY: 1.3, tilt: 0.35, rotOffset: 0 },
    { count: 7, radius: 1.45, scaleY: 1.15, tilt: 0.65, rotOffset: 0.5 },
    { count: 9, radius: 1.95, scaleY: 0.95, tilt: 0.95, rotOffset: 1.1 }
  ];

  petalLayers.forEach(layer => {
    for (let p = 0; p < layer.count; p++) {
      const angle = (p / layer.count) * Math.PI * 2 + layer.rotOffset;
      const pGeo = new THREE.SphereGeometry(0.7, 12, 12, 0, Math.PI);
      pGeo.scale(1.0, layer.scaleY, 0.35);

      const petalMesh = new THREE.Mesh(pGeo, petalMat);
      petalMesh.position.set(
        Math.cos(angle) * layer.radius * 0.75,
        -0.2 + (Math.random() - 0.5) * 0.15,
        Math.sin(angle) * layer.radius * 0.75
      );
      petalMesh.rotation.y = angle + Math.PI / 2;
      petalMesh.rotation.x = layer.tilt;
      petalGroup.add(petalMesh);
    }
  });

  // Fallen Petals on base
  for (let f = 0; f < 4; f++) {
    const fAngle = f * 1.5 + 0.3;
    const fGeo = new THREE.SphereGeometry(0.45, 8, 8, 0, Math.PI);
    fGeo.scale(1, 0.15, 0.6);
    const fallenPetal = new THREE.Mesh(fGeo, petalMat);
    fallenPetal.position.set(Math.cos(fAngle) * 1.8, -3.2, Math.sin(fAngle) * 1.8);
    fallenPetal.rotation.set(0.15, fAngle, 0.2);
    roseGroup.add(fallenPetal);
  }

  roseGroup.add(petalGroup);
  centerGroup.add(roseGroup);

  // ---------------------------------------------------------------------------
  // 3. High-Gloss Crystalline Glass Bell Jar (โดมแก้วคริสตัล)
  // ---------------------------------------------------------------------------
  const domeRadius = 3.6;
  const domeHeight = 7.4;

  const domeGeo = new THREE.CylinderGeometry(domeRadius, domeRadius, domeHeight, 48, 1, true);
  // Cap sphere
  const domeCapGeo = new THREE.SphereGeometry(domeRadius, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2);
  domeCapGeo.translate(0, domeHeight / 2, 0);

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.35,
    roughness: 0.05,
    metalness: 0.1,
    transmission: 0.92,
    ior: 1.52,
    reflectivity: 0.9,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    side: THREE.DoubleSide,
    depthWrite: false
  });

  const domeCylinder = new THREE.Mesh(domeGeo, glassMat);
  domeCylinder.position.y = -1.2;
  const domeCap = new THREE.Mesh(domeCapGeo, glassMat);
  domeCap.position.y = -1.2;

  centerGroup.add(domeCylinder);
  centerGroup.add(domeCap);

  // Glass Knob on top
  const knobGeo = new THREE.SphereGeometry(0.55, 24, 24);
  const knob = new THREE.Mesh(knobGeo, glassMat);
  knob.position.y = -1.2 + domeHeight / 2 + domeRadius;
  centerGroup.add(knob);

  // Soft inner rose glow sprite
  const roseGlowMat = new THREE.SpriteMaterial({
    map: glowTex,
    color: 0xff4d6d,
    transparent: true,
    opacity: 0.45,
    blending: THREE.AdditiveBlending
  });
  const roseGlow = new THREE.Sprite(roseGlowMat);
  roseGlow.scale.set(10.5, 10.5, 1);
  roseGlow.position.set(0, -0.6, 0);
  centerGroup.add(roseGlow);

  // ---------------------------------------------------------------------------
  // 4. Stardust Spores Floating Inside Glass Dome
  // ---------------------------------------------------------------------------
  const sporeCount = 45;
  const sporeGeo = new THREE.BufferGeometry();
  const sporePos = new Float32Array(sporeCount * 3);
  const sporeSpeeds = new Float32Array(sporeCount);

  for (let i = 0; i < sporeCount; i++) {
    const sRadius = Math.random() * (domeRadius - 0.7);
    const sAngle = Math.random() * Math.PI * 2;
    sporePos[i * 3] = Math.cos(sAngle) * sRadius;
    sporePos[i * 3 + 1] = -4.0 + Math.random() * 8.5;
    sporePos[i * 3 + 2] = Math.sin(sAngle) * sRadius;
    sporeSpeeds[i] = 0.005 + Math.random() * 0.012;
  }

  sporeGeo.setAttribute('position', new THREE.BufferAttribute(sporePos, 3));

  const sporeMat = new THREE.PointsMaterial({
    size: 0.65,
    map: glowTex,
    color: 0xffd700,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const spores = new THREE.Points(sporeGeo, sporeMat);
  centerGroup.add(spores);

  // ---------------------------------------------------------------------------
  // 5. 3 Gyroscopic Celestial Golden Rings (วงแหวนสวรรค์โคจร 3 ชั้น)
  // ---------------------------------------------------------------------------
  const ringMaterials = [
    new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0xffaa00,
      emissiveIntensity: 0.3
    }),
    new THREE.MeshStandardMaterial({
      color: 0xf472b6, // Rose Gold
      metalness: 0.85,
      roughness: 0.25,
      emissive: 0xdb2777,
      emissiveIntensity: 0.25
    }),
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8, // Celestial Cyan
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0x0284c7,
      emissiveIntensity: 0.3
    })
  ];

  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(8.5, 0.12, 16, 96), ringMaterials[0]);
  ring1.rotation.x = Math.PI / 4;
  ring1.rotation.y = Math.PI / 6;
  centerGroup.add(ring1);

  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(12.5, 0.14, 16, 96), ringMaterials[1]);
  ring2.rotation.x = -Math.PI / 3;
  ring2.rotation.z = Math.PI / 4;
  centerGroup.add(ring2);

  const ring3 = new THREE.Mesh(new THREE.TorusGeometry(17.0, 0.16, 16, 96), ringMaterials[2]);
  ring3.rotation.x = Math.PI / 2.2;
  ring3.rotation.y = -Math.PI / 5;
  centerGroup.add(ring3);

  // Star nodes attached to outer ring
  const ringStarCount = 18;
  const ringStarGeo = new THREE.BufferGeometry();
  const ringStarPos = new Float32Array(ringStarCount * 3);
  for (let s = 0; s < ringStarCount; s++) {
    const sAng = (s / ringStarCount) * Math.PI * 2;
    ringStarPos[s * 3] = Math.cos(sAng) * 17.0;
    ringStarPos[s * 3 + 1] = 0;
    ringStarPos[s * 3 + 2] = Math.sin(sAng) * 17.0;
  }
  ringStarGeo.setAttribute('position', new THREE.BufferAttribute(ringStarPos, 3));
  const ringStarMat = new THREE.PointsMaterial({
    size: 1.2,
    map: glowTex,
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending
  });
  const ringStars = new THREE.Points(ringStarGeo, ringStarMat);
  ring3.add(ringStars);

  scene.add(centerGroup);

  // ---------------------------------------------------------------------------
  // 6. Animation Update Loop
  // ---------------------------------------------------------------------------
  function update(delta, time) {
    // Gentle floating bob
    roseGroup.position.y = -1.8 + Math.sin(time * 1.5) * 0.22;
    petalGroup.rotation.y = time * 0.18;

    // Pulse rose glow
    const glowPulse = Math.sin(time * 2.5) * 0.15 + 0.85;
    roseGlow.scale.set(10.5 * glowPulse, 10.5 * glowPulse, 1);

    // Gyroscopic Celestial Rings rotation
    ring1.rotation.y += delta * 0.35;
    ring1.rotation.x += delta * 0.18;

    ring2.rotation.z -= delta * 0.28;
    ring2.rotation.y += delta * 0.22;

    ring3.rotation.x += delta * 0.15;
    ring3.rotation.y -= delta * 0.20;

    // Spores floating upwards and looping
    const positions = sporeGeo.attributes.position.array;
    for (let i = 0; i < sporeCount; i++) {
      positions[i * 3 + 1] += sporeSpeeds[i];
      if (positions[i * 3 + 1] > 4.5) {
        positions[i * 3 + 1] = -4.0;
      }
    }
    sporeGeo.attributes.position.needsUpdate = true;
  }

  return {
    group: centerGroup,
    roseGroup,
    glassDome: domeCylinder,
    radius: 17.0,
    update
  };
}
