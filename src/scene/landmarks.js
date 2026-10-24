import * as THREE from 'three';
import { createGlowTexture } from './galaxySkybox.js';

/**
 * Builds the signature landmarks of The Little Prince on Planet B-612:
 * 1. The Rose in a glowing Glass Cloche 🌹
 * 2. The Vintage Street Lamp with warm 2700K amber glow 🕯️
 * 3. The Star-gazing Wooden Bench 🪑
 * 4. The Mini Brass Telescope on a hill 🔭
 */
export function createLandmarks(scene, planetRadius) {
  const landmarksGroup = new THREE.Group();
  landmarksGroup.name = 'landmarks';

  // Helper to place an object on sphere surface oriented upwards along normal
  function placeOnPlanet(obj, latDeg, lonDeg, heightOffset = 0) {
    const phi = (90 - latDeg) * (Math.PI / 180);
    const theta = (lonDeg + 180) * (Math.PI / 180);
    const r = planetRadius + heightOffset;

    const x = -r * Math.sin(phi) * Math.cos(theta);
    const z = r * Math.sin(phi) * Math.sin(theta);
    const y = r * Math.cos(phi);

    obj.position.set(x, y, z);
    const normal = new THREE.Vector3(x, y, z).normalize();
    obj.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
    landmarksGroup.add(obj);
    return { position: obj.position, normal };
  }

  // -------------------------------------------------------------------------
  // 1. 🌹 The Rose in Glass Dome
  // -------------------------------------------------------------------------
  const roseGroup = new THREE.Group();
  roseGroup.name = 'roseInDome';

  // Wooden / Stone Pedestal
  const pedestalGeo = new THREE.CylinderGeometry(0.7, 0.85, 0.25, 20);
  const pedestalMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37, // Golden rim base
    metalness: 0.7,
    roughness: 0.3
  });
  const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
  pedestal.position.y = 0.12;
  roseGroup.add(pedestal);

  // Rose Stem & Leaves
  const stemCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.25, 0),
    new THREE.Vector3(0.08, 0.7, 0.05),
    new THREE.Vector3(-0.04, 1.1, 0.02),
    new THREE.Vector3(0, 1.45, 0)
  ]);
  const stemGeo = new THREE.TubeGeometry(stemCurve, 16, 0.04, 8, false);
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.6 });
  const stem = new THREE.Mesh(stemGeo, stemMat);
  roseGroup.add(stem);

  // Tiny leaves
  const leafGeo = new THREE.ConeGeometry(0.12, 0.32, 5);
  const leaf1 = new THREE.Mesh(leafGeo, stemMat);
  leaf1.position.set(0.12, 0.75, 0.05);
  leaf1.rotation.z = -Math.PI / 3;
  roseGroup.add(leaf1);

  const leaf2 = new THREE.Mesh(leafGeo, stemMat);
  leaf2.position.set(-0.1, 0.95, -0.02);
  leaf2.rotation.z = Math.PI / 3;
  roseGroup.add(leaf2);

  // Rose Blossom (Layered stylized petals)
  const petalGroup = new THREE.Group();
  petalGroup.position.set(0, 1.5, 0);

  const roseMat = new THREE.MeshStandardMaterial({
    color: 0xff1744,
    emissive: 0xd50000,
    emissiveIntensity: 0.55,
    roughness: 0.3,
    metalness: 0.1
  });

  // Inner core
  const coreGeo = new THREE.SphereGeometry(0.2, 16, 16);
  petalGroup.add(new THREE.Mesh(coreGeo, roseMat));

  // Petal layers
  for (let i = 0; i < 9; i++) {
    const pGeo = new THREE.SphereGeometry(0.16, 8, 8);
    pGeo.scale(1.2, 1.6, 0.4);
    const petal = new THREE.Mesh(pGeo, roseMat);
    const angle = (i * Math.PI * 2) / 4.5;
    petal.position.set(Math.cos(angle) * 0.16, (i * 0.02), Math.sin(angle) * 0.16);
    petal.rotation.y = angle + Math.PI / 2;
    petal.rotation.x = 0.25;
    petalGroup.add(petal);
  }
  roseGroup.add(petalGroup);

  // Rose Glowing Light
  const roseLight = new THREE.PointLight(0xff3366, 2.2, 5.5, 1.8);
  roseLight.position.set(0, 1.5, 0);
  roseGroup.add(roseLight);

  // Glass Dome (Cloche)
  const domeGeo = new THREE.CylinderGeometry(0.65, 0.65, 1.7, 32, 1, true);
  const domeCapGeo = new THREE.SphereGeometry(0.65, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  domeCapGeo.translate(0, 0.85, 0);

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.32,
    roughness: 0.05,
    metalness: 0.1,
    transmission: 0.92,
    ior: 1.45,
    reflectivity: 0.8,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    side: THREE.DoubleSide
  });

  const domeCylinder = new THREE.Mesh(domeGeo, glassMat);
  domeCylinder.position.y = 0.85;
  roseGroup.add(domeCylinder);

  const domeCap = new THREE.Mesh(domeCapGeo, glassMat);
  roseGroup.add(domeCap);

  // Golden knob on top of dome
  const knobGeo = new THREE.SphereGeometry(0.12, 16, 16);
  const knob = new THREE.Mesh(knobGeo, pedestalMat);
  knob.position.y = 1.78;
  roseGroup.add(knob);

  // Swirling Golden Pollen inside glass dome
  const pollenCount = 45;
  const pollenGeo = new THREE.BufferGeometry();
  const pollenPositions = new Float32Array(pollenCount * 3);
  const pollenSpeeds = [];

  for (let i = 0; i < pollenCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * 0.45;
    const py = 0.4 + Math.random() * 1.1;

    pollenPositions[i * 3] = Math.cos(angle) * r;
    pollenPositions[i * 3 + 1] = py;
    pollenPositions[i * 3 + 2] = Math.sin(angle) * r;

    pollenSpeeds.push({
      angle,
      r,
      baseY: py,
      speedY: 0.4 + Math.random() * 0.5,
      speedAngle: 0.8 + Math.random() * 0.8
    });
  }

  pollenGeo.setAttribute('position', new THREE.BufferAttribute(pollenPositions, 3));
  const pollenTex = createGlowTexture(32, 'rgba(255,230,120,1)', 'rgba(255,180,50,0)');
  const pollenMat = new THREE.PointsMaterial({
    size: 0.22,
    map: pollenTex,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const pollenField = new THREE.Points(pollenGeo, pollenMat);
  roseGroup.add(pollenField);

  // Place Rose on B-612 (Near North Top Hill)
  placeOnPlanet(roseGroup, 65, 20);

  // -------------------------------------------------------------------------
  // 2. 🕯️ Vintage Street Lamp (โคมไฟถนนโบราณ)
  // -------------------------------------------------------------------------
  const lampGroup = new THREE.Group();
  lampGroup.name = 'streetLamp';

  const ironMat = new THREE.MeshStandardMaterial({
    color: 0x22252a,
    metalness: 0.85,
    roughness: 0.35
  });

  // Base
  const baseGeo = new THREE.CylinderGeometry(0.28, 0.4, 0.4, 12);
  const lampBase = new THREE.Mesh(baseGeo, ironMat);
  lampBase.position.y = 0.2;
  lampGroup.add(lampBase);

  // Pole
  const poleGeo = new THREE.CylinderGeometry(0.08, 0.12, 3.2, 12);
  const lampPole = new THREE.Mesh(poleGeo, ironMat);
  lampPole.position.y = 1.8;
  lampGroup.add(lampPole);

  // Lantern Housing
  const housingGeo = new THREE.CylinderGeometry(0.35, 0.22, 0.6, 6);
  const lampHousing = new THREE.Mesh(housingGeo, ironMat);
  lampHousing.position.y = 3.4;
  lampGroup.add(lampHousing);

  // Lantern Glass & Bulb
  const bulbGeo = new THREE.SphereGeometry(0.16, 16, 16);
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffea9f });
  const bulb = new THREE.Mesh(bulbGeo, bulbMat);
  bulb.position.y = 3.35;
  lampGroup.add(bulb);

  // Warm Amber 2700K Point Light
  const lampLight = new THREE.PointLight(0xffa834, 3.2, 9.0, 1.6);
  lampLight.position.set(0, 3.35, 0);
  lampLight.castShadow = true;
  lampGroup.add(lampLight);

  // Lamp Cap
  const capGeo = new THREE.ConeGeometry(0.48, 0.35, 6);
  const lampCap = new THREE.Mesh(capGeo, ironMat);
  lampCap.position.y = 3.8;
  lampGroup.add(lampCap);

  // Place Street Lamp near the Rose & Bench
  placeOnPlanet(lampGroup, 58, 45);

  // -------------------------------------------------------------------------
  // 3. 🪑 Star-gazing Wooden Bench (ม้านั่งไม้ชมดาว)
  // -------------------------------------------------------------------------
  const benchGroup = new THREE.Group();
  benchGroup.name = 'woodenBench';

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x8b5a2b, // Warm oak wood
    roughness: 0.75,
    metalness: 0.05
  });
  const ironLegMat = new THREE.MeshStandardMaterial({
    color: 0x1f2421,
    roughness: 0.4,
    metalness: 0.8
  });

  // Bench seat slats
  for (let s = 0; s < 3; s++) {
    const slatGeo = new THREE.BoxGeometry(1.4, 0.05, 0.16);
    const slat = new THREE.Mesh(slatGeo, woodMat);
    slat.position.set(0, 0.45, -0.15 + s * 0.18);
    benchGroup.add(slat);
  }

  // Bench backrest slats
  for (let b = 0; b < 2; b++) {
    const bGeo = new THREE.BoxGeometry(1.4, 0.15, 0.04);
    const bSlat = new THREE.Mesh(bGeo, woodMat);
    bSlat.position.set(0, 0.65 + b * 0.2, -0.25);
    bSlat.rotation.x = -0.12;
    benchGroup.add(bSlat);
  }

  // Bench legs
  const legPositions = [
    [-0.55, 0.22, -0.2],
    [0.55, 0.22, -0.2],
    [-0.55, 0.22, 0.2],
    [0.55, 0.22, 0.2]
  ];
  legPositions.forEach(([lx, ly, lz]) => {
    const legGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.44, 8);
    const leg = new THREE.Mesh(legGeo, ironLegMat);
    leg.position.set(lx, ly, lz);
    benchGroup.add(leg);
  });

  // Place Bench looking out towards space
  placeOnPlanet(benchGroup, 52, 32);

  // -------------------------------------------------------------------------
  // 4. 🔭 Mini Brass Telescope (กล้องดูดาวทองเหลือง)
  // -------------------------------------------------------------------------
  const telescopeGroup = new THREE.Group();
  telescopeGroup.name = 'brassTelescope';

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xe6b800, // Shiny polished brass
    metalness: 0.9,
    roughness: 0.2
  });

  // Tripod Legs
  for (let t = 0; t < 3; t++) {
    const tripGeo = new THREE.CylinderGeometry(0.03, 0.02, 1.4, 8);
    const leg = new THREE.Mesh(tripGeo, brassMat);
    const legAngle = (t * Math.PI * 2) / 3;
    leg.position.set(Math.cos(legAngle) * 0.35, 0.65, Math.sin(legAngle) * 0.35);
    leg.rotation.z = Math.cos(legAngle) * 0.28;
    leg.rotation.x = -Math.sin(legAngle) * 0.28;
    telescopeGroup.add(leg);
  }

  // Telescope Mount & Barrel
  const barrelGroup = new THREE.Group();
  barrelGroup.position.set(0, 1.35, 0);

  const mainTubeGeo = new THREE.CylinderGeometry(0.12, 0.08, 1.2, 16);
  const mainTube = new THREE.Mesh(mainTubeGeo, brassMat);
  mainTube.rotation.z = Math.PI / 4; // Pointed towards sky
  barrelGroup.add(mainTube);

  const lensCapGeo = new THREE.CylinderGeometry(0.14, 0.12, 0.15, 16);
  const lensCap = new THREE.Mesh(lensCapGeo, brassMat);
  lensCap.position.set(0.45, 0.45, 0);
  lensCap.rotation.z = Math.PI / 4;
  barrelGroup.add(lensCap);

  telescopeGroup.add(barrelGroup);

  // Place Telescope on high elevation
  placeOnPlanet(telescopeGroup, 68, 65);

  scene.add(landmarksGroup);

  // Landmark animation update
  function update(delta, time) {
    // 1. Swirling Rose Pollen animation
    const posArr = pollenGeo.attributes.position.array;
    for (let i = 0; i < pollenCount; i++) {
      const p = pollenSpeeds[i];
      p.angle += p.speedAngle * delta;
      p.baseY += Math.sin(time * p.speedY + i) * 0.003;

      posArr[i * 3] = Math.cos(p.angle) * p.r;
      posArr[i * 3 + 1] = p.baseY;
      posArr[i * 3 + 2] = Math.sin(p.angle) * p.r;
    }
    pollenGeo.attributes.position.needsUpdate = true;

    // 2. Subtle rose light pulsation
    roseLight.intensity = 2.0 + Math.sin(time * 3.0) * 0.45;

    // 3. Vintage street lamp subtle flicker
    lampLight.intensity = 3.0 + Math.sin(time * 8.0) * 0.15 + (Math.random() - 0.5) * 0.1;
  }

  return {
    group: landmarksGroup,
    roseGroup,
    lampGroup,
    benchGroup,
    telescopeGroup,
    update
  };
}
