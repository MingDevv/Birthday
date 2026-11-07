import * as THREE from 'three';

/**
 * Creates a high-fidelity teardrop flame texture on canvas.
 * Colors: White-gold core -> vibrant yellow -> warm orange fire -> transparent edge.
 * (No pink tint; reads immediately as real birthday candlelight).
 */
function createTeardropFlameTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createRadialGradient(64, 160, 4, 64, 150, 64);
  grad.addColorStop(0, 'rgba(255, 255, 245, 1.0)');     // pure white-gold core
  grad.addColorStop(0.22, 'rgba(255, 235, 120, 0.96)'); // luminous yellow
  grad.addColorStop(0.52, 'rgba(255, 150, 35, 0.82)');  // warm orange fire
  grad.addColorStop(0.82, 'rgba(255, 75, 15, 0.38)');   // outer amber flame
  grad.addColorStop(1.0, 'rgba(255, 40, 0, 0)');        // transparent boundary

  ctx.fillStyle = grad;
  ctx.beginPath();
  // Teardrop path: pointed apex at top, full round belly at bottom
  ctx.moveTo(64, 28);
  ctx.bezierCurveTo(96, 95, 116, 145, 116, 178);
  ctx.bezierCurveTo(116, 222, 86, 242, 64, 242);
  ctx.bezierCurveTo(42, 242, 12, 222, 12, 178);
  ctx.bezierCurveTo(12, 145, 32, 95, 64, 28);
  ctx.closePath();
  ctx.fill();

  // Subtle inner hot spark core
  const innerGrad = ctx.createRadialGradient(64, 165, 1, 64, 160, 24);
  innerGrad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
  innerGrad.addColorStop(0.6, 'rgba(255, 250, 200, 0.75)');
  innerGrad.addColorStop(1, 'rgba(255, 230, 100, 0)');
  ctx.fillStyle = innerGrad;
  ctx.beginPath();
  ctx.ellipse(64, 165, 16, 32, 0, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Creates spiral-striped texture for candles:
 * Crisp white base with soft pastel pink & warm gold diagonal spiral bands.
 */
function createCandleSpiralTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // White pearlescent base
  ctx.fillStyle = '#fffdf9';
  ctx.fillRect(0, 0, 128, 256);

  // Diagonal spiral ribbons
  ctx.lineWidth = 14;
  for (let offset = -256; offset < 512; offset += 42) {
    // Pink stripe
    ctx.strokeStyle = '#c9b3ff';
    ctx.beginPath();
    ctx.moveTo(-20, offset);
    ctx.lineTo(148, offset + 128);
    ctx.stroke();

    // Gold accent pin-stripe
    ctx.strokeStyle = '#fde68a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-20, offset + 18);
    ctx.lineTo(148, offset + 146);
    ctx.stroke();
    ctx.lineWidth = 14;
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 4);
  return texture;
}

/**
 * Creates soft ethereal lavender smoke texture for extinguished candles.
 */
function createLavenderSmokeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(216, 180, 254, 0.85)');
  grad.addColorStop(0.35, 'rgba(192, 132, 252, 0.40)');
  grad.addColorStop(0.7, 'rgba(168, 85, 247, 0.15)');
  grad.addColorStop(1.0, 'rgba(168, 85, 247, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

export function createCosmicCake(scene, quality = { tier: 'high' }, { enabled = true } = {}) {
  const group = new THREE.Group();
  group.name = 'cosmicBirthdayCake';
  group.visible = false;
  group.position.set(0, -30, -5);
  scene.add(group);

  const materialsToDispose = [];
  const geometriesToDispose = [];
  const texturesToDispose = [];

  // =========================================================================
  // 1. Rose Gold Presentation Plate / Base
  // =========================================================================
  const plateGeo = new THREE.CylinderGeometry(21.5, 20.8, 1.4, 64);
  geometriesToDispose.push(plateGeo);
  const plateMat = new THREE.MeshPhysicalMaterial({
    color: 0xb4aec4, // porcelain
    metalness: 0.04,
    roughness: 0.22,
    clearcoat: 0.8,
    clearcoatRoughness: 0.08,
    envMapIntensity: 0.35
  });
  materialsToDispose.push(plateMat);
  const plate = new THREE.Mesh(plateGeo, plateMat);
  plate.position.y = -14.2;
  plate.name = 'cakePresentationPlate';
  group.add(plate);

  // Soft pink glow halo under plate
  const plateGlowGeo = new THREE.TorusGeometry(22.2, 0.42, 8, 64);
  geometriesToDispose.push(plateGlowGeo);
  const plateGlowMat = new THREE.MeshBasicMaterial({
    color: 0xb98cff,
    transparent: true,
    opacity: 0.06
  });
  materialsToDispose.push(plateGlowMat);
  const plateGlow = new THREE.Mesh(plateGlowGeo, plateGlowMat);
  plateGlow.rotation.x = Math.PI / 2;
  plateGlow.position.y = -14.9;
  plateGlow.name = 'cakePlateGlow';
  group.add(plateGlow);

  // =========================================================================
  // 2. Three Opaque Pastel Cake Tiers (Lavender, Pink, Warm Cream)
  // Transparent/transmission is 0 to completely eliminate sorting artifacts!
  // =========================================================================
  // Rounded shoulder on every tier so light rolls over the edge (Round 14)
  function createRoundedTierGeometry(radius, height) {
    const bevel = Math.min(1.1, height * 0.16);
    const pts = [new THREE.Vector2(0, height / 2), new THREE.Vector2(radius - bevel, height / 2)];
    for (let i = 1; i <= 10; i++) {
      const a = (i / 10) * Math.PI / 2;
      pts.push(new THREE.Vector2(radius - bevel + Math.sin(a) * bevel, height / 2 - bevel + Math.cos(a) * bevel));
    }
    pts.push(new THREE.Vector2(radius * 1.004, -height / 2 + 0.25), new THREE.Vector2(radius * 0.99, -height / 2), new THREE.Vector2(0.001, -height / 2));
    pts.reverse(); // bottom -> top so the faces point outward (Round 16 fix)
    const geo = new THREE.LatheGeometry(pts, 128);
    geo.computeVertexNormals();
    return geo;
  }
  const frostingCanvas = document.createElement('canvas');
  frostingCanvas.width = 512;
  frostingCanvas.height = 128;
  const fctx = frostingCanvas.getContext('2d');
  fctx.fillStyle = '#808080';
  fctx.fillRect(0, 0, 512, 128);
  for (let i = 0; i < 900; i++) {
    const x = Math.random() * 512, y = Math.random() * 128;
    const shade = 110 + Math.floor(Math.random() * 40);
    fctx.strokeStyle = `rgba(${shade},${shade},${shade},0.35)`;
    fctx.lineWidth = 1 + Math.random() * 3;
    fctx.beginPath();
    fctx.moveTo(x, y);
    fctx.lineTo(x + 18 + Math.random() * 40, y + (Math.random() - 0.5) * 3);
    fctx.stroke();
  }
  const frostingBump = new THREE.CanvasTexture(frostingCanvas);
  frostingBump.wrapS = frostingBump.wrapT = THREE.RepeatWrapping;
  frostingBump.repeat.set(3, 1);

  const tiers = [
    { radius: 17, height: 8.0, y: -9.8, color: 0x8f72d4, name: 'tier-bottom-lavender' },
    { radius: 13, height: 7.0, y: -2.3, color: 0xcdb8f2, name: 'tier-middle-pink' },
    { radius: 9,  height: 6.0, y: 4.2,  color: 0xf6ecdf, name: 'tier-top-cream' }
  ];

  const goldTrimMat = new THREE.MeshStandardMaterial({
    color: 0xffd98e,
    metalness: 0.82,
    roughness: 0.22
  });
  materialsToDispose.push(goldTrimMat);

  const tierMeshes = [];
  tiers.forEach((tier) => {
    // Buttercream: matte, soft sheen, combed texture in the bump map
    const tierMat = new THREE.MeshPhysicalMaterial({
      color: tier.color,
      roughness: 0.62,
      metalness: 0,
      clearcoat: 0.12,
      clearcoatRoughness: 0.4,
      sheen: 0.35,
      sheenColor: new THREE.Color(0xf1e8ff),
      sheenRoughness: 0.45,
      bumpMap: frostingBump,
      bumpScale: 0.9,
      envMapIntensity: 0.22,
      transparent: false,
      transmission: 0,
      opacity: 1.0
    });
    materialsToDispose.push(tierMat);

    const tierGeo = createRoundedTierGeometry(tier.radius, tier.height);
    geometriesToDispose.push(tierGeo);
    const mesh = new THREE.Mesh(tierGeo, tierMat);
    mesh.position.y = tier.y;
    mesh.name = tier.name;
    group.add(mesh);
    tierMeshes.push(mesh);

    // Elegant gold trim rim at tier base
    const baseTrimGeo = new THREE.TorusGeometry(tier.radius * 1.005, 0.17, 10, 96);
    geometriesToDispose.push(baseTrimGeo);
    const baseTrim = new THREE.Mesh(baseTrimGeo, goldTrimMat);
    baseTrim.rotation.x = Math.PI / 2;
    baseTrim.position.y = tier.y - tier.height / 2 + 0.15;
    group.add(baseTrim);

    // Gold trim rim at tier top
    const topTrimGeo = new THREE.TorusGeometry(tier.radius * 0.97, 0.12, 10, 96);
    geometriesToDispose.push(topTrimGeo);
    const topTrim = new THREE.Mesh(topTrimGeo, goldTrimMat);
    topTrim.rotation.x = Math.PI / 2;
    topTrim.position.y = tier.y + tier.height / 2 - 0.62;
    group.add(topTrim);
  });

  // =========================================================================
  // 3. Decorative Edible Pearls (InstancedMesh along tier rims)
  // =========================================================================
  const pearlGeo = new THREE.SphereGeometry(0.36, 12, 10);
  geometriesToDispose.push(pearlGeo);
  const pearlMat = new THREE.MeshPhysicalMaterial({
    color: 0xfffcf5,
    roughness: 0.16,
    metalness: 0.06,
    clearcoat: 0.95,
    clearcoatRoughness: 0.06,
    iridescence: 0.35
  });
  materialsToDispose.push(pearlMat);

  const pearlRims = [
    { radius: 17.2, count: 64, y: -13.45 }, // bottom tier base
    { radius: 13.2, count: 50, y: -5.45 },  // middle tier base
    { radius: 9.2,  count: 36, y: 1.55 }    // top tier base
  ];
  const totalPearls = pearlRims.reduce((sum, r) => sum + r.count, 0);
  const pearlsMesh = new THREE.InstancedMesh(pearlGeo, pearlMat, totalPearls);
  pearlsMesh.name = 'cakeDecorativePearls';
  group.add(pearlsMesh);

  let pearlIndex = 0;
  const dummyMatrix = new THREE.Matrix4();
  const dummyPos = new THREE.Vector3();
  const dummyScale = new THREE.Vector3(1, 1, 1);
  const dummyRot = new THREE.Quaternion();

  pearlRims.forEach((rim) => {
    for (let i = 0; i < rim.count; i++) {
      const angle = (i / rim.count) * Math.PI * 2;
      dummyPos.set(Math.cos(angle) * rim.radius, rim.y, Math.sin(angle) * rim.radius);
      dummyMatrix.compose(dummyPos, dummyRot, dummyScale);
      pearlsMesh.setMatrixAt(pearlIndex++, dummyMatrix);
    }
  });
  pearlsMesh.instanceMatrix.needsUpdate = true;

  // =========================================================================
  // 4. Cream Drips around Top Tier
  // =========================================================================
  const dripMat = new THREE.MeshPhysicalMaterial({
    color: 0xfff3e5, // cream
    roughness: 0.32,
    clearcoat: 0.85,
    clearcoatRoughness: 0.1
  });
  materialsToDispose.push(dripMat);
  // Round 16: poured ganache with real drips over each tier, whipped cream kisses on top
  function createDripCollar(radius, topY, color, drips, seed) {
    const segs = 256;
    const r = radius * 1.012;
    const mat = new THREE.MeshPhysicalMaterial({ color, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 0.5 });
    materialsToDispose.push(mat);
    const dropAt = (a) => {
      let d = 0.55 + 0.25 * Math.sin(a * 3 + seed);
      for (let k = 0; k < drips; k++) {
        const center = (k / drips) * Math.PI * 2 + Math.sin(k * 12.9898 + seed) * 0.12;
        const len = 1.2 + Math.abs(Math.sin(k * 78.233 + seed)) * 2.6;
        const w = 0.075 + Math.abs(Math.sin(k * 3.1 + seed)) * 0.05;
        let diff = Math.atan2(Math.sin(a - center), Math.cos(a - center));
        d = Math.max(d, len * Math.exp(-(diff * diff) / (2 * w * w)));
      }
      return d;
    };
    // side skin: top edge at topY, bottom edge follows the drips
    const positions = [];
    const index = [];
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      const c = Math.cos(a), sn = Math.sin(a);
      positions.push(c * r, topY, sn * r, c * r, topY - dropAt(a), sn * r);
    }
    for (let i = 0; i < segs; i++) {
      const a0 = i * 2, b0 = a0 + 1, a1 = a0 + 2, b1 = a0 + 3;
      index.push(a0, a1, b0, b0, a1, b1);
    }
    const sideGeo = new THREE.BufferGeometry();
    sideGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    sideGeo.setIndex(index);
    sideGeo.computeVertexNormals();
    geometriesToDispose.push(sideGeo);
    const side = new THREE.Mesh(sideGeo, mat);
    side.material.side = THREE.DoubleSide;
    group.add(side);
    // rounded lip where the ganache rolls over the edge
    const lipGeo = new THREE.TorusGeometry(r - 0.12, 0.3, 12, 160);
    geometriesToDispose.push(lipGeo);
    const lip = new THREE.Mesh(lipGeo, mat);
    lip.rotation.x = Math.PI / 2;
    lip.position.y = topY - 0.05;
    group.add(lip);
    // pooled top
    const capGeo = new THREE.CircleGeometry(r - 0.1, 128);
    geometriesToDispose.push(capGeo);
    const cap = new THREE.Mesh(capGeo, mat);
    cap.rotation.x = -Math.PI / 2;
    cap.position.y = topY + 0.22;
    group.add(cap);
    // round drop at the end of every drip
    const tipGeo = new THREE.SphereGeometry(0.28, 12, 10);
    geometriesToDispose.push(tipGeo);
    for (let k = 0; k < drips; k++) {
      const center = (k / drips) * Math.PI * 2 + Math.sin(k * 12.9898 + seed) * 0.12;
      const tip = new THREE.Mesh(tipGeo, mat);
      tip.position.set(Math.cos(center) * (r + 0.05), topY - dropAt(center) + 0.12, Math.sin(center) * (r + 0.05));
      tip.scale.set(1.15, 1.25, 0.8);
      tip.lookAt(0, tip.position.y, 0);
      group.add(tip);
    }
  }
  createDripCollar(17, -5.8, 0xfbf6f0, 18, 1.3);   // white chocolate over lilac
  createDripCollar(13, 1.2, 0xfbf6f0, 14, 4.1);    // white chocolate over lavender
  createDripCollar(9, 7.2, 0xa98ee8, 11, 7.7);     // violet over cream

  // whipped cream kisses around each top edge
  const kissPts = [];
  for (let i = 0; i <= 14; i++) {
    const t = i / 14;
    const rr = 0.85 * Math.pow(1 - t, 0.85) * (1 + 0.12 * Math.sin(t * Math.PI * 6));
    kissPts.push(new THREE.Vector2(Math.max(0.001, rr), t * 1.4));
  }
  const kissGeo = new THREE.LatheGeometry(kissPts, 24);
  geometriesToDispose.push(kissGeo);
  const kissMat = new THREE.MeshPhysicalMaterial({ color: 0xfffaf4, roughness: 0.55, sheen: 0.6, sheenColor: new THREE.Color(0xffffff), envMapIntensity: 0.35 });
  materialsToDispose.push(kissMat);
  const kissRings = [{ r: 15.4, y: -5.5, n: 30 }, { r: 12.0, y: 1.5, n: 22 }, { r: 7.9, y: 7.5, n: 16 }];
  const kissTotal = kissRings.reduce((a, k) => a + k.n, 0);
  const kisses = new THREE.InstancedMesh(kissGeo, kissMat, kissTotal);
  kisses.name = 'cakeWhippedKisses';
  let kissIndex = 0;
  const km = new THREE.Matrix4();
  const kq = new THREE.Quaternion();
  for (const ring of kissRings) {
    for (let i = 0; i < ring.n; i++) {
      const a = (i / ring.n) * Math.PI * 2 + 0.11;
      kq.setFromAxisAngle(new THREE.Vector3(0, 1, 0), a * 3.7);
      km.compose(new THREE.Vector3(Math.cos(a) * ring.r, ring.y, Math.sin(a) * ring.r), kq, new THREE.Vector3(1, 1, 1));
      kisses.setMatrixAt(kissIndex++, km);
    }
  }
  kisses.instanceMatrix.needsUpdate = true;
  group.add(kisses);

  // =========================================================================
  // 5. Floating Stars around the cake
  // =========================================================================
  const starGeo = new THREE.OctahedronGeometry(0.38, 0);
  geometriesToDispose.push(starGeo);
  const starMat = new THREE.MeshBasicMaterial({ color: 0xe9e2ff });
  materialsToDispose.push(starMat);
  const floatingStars = [];
  const starCount = 10;
  for (let i = 0; i < starCount; i++) {
    const star = new THREE.Mesh(starGeo, starMat);
    const angle = (i / starCount) * Math.PI * 2;
    const r = 24.0 + (i % 3) * 2.5;
    const y = -8.0 + (i * 2.5);
    star.position.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
    star.userData = { angle, radius: r, baseHeight: y, speed: 0.25 + (i % 4) * 0.12 };
    group.add(star);
    floatingStars.push(star);
  }

  // =========================================================================
  // 6. 16 Candles in 2 Concentric Rings with Half-Phase Offset
  // Outer: 10 candles (r = 7.5), Inner: 6 candles (r = 3.8)
  // Seeded height variation (5.0 - 5.8) so candles never form a flat wall!
  // =========================================================================
  const candleSpiralTexture = createCandleSpiralTexture();
  texturesToDispose.push(candleSpiralTexture);
  const candleMat = new THREE.MeshStandardMaterial({
    map: candleSpiralTexture,
    roughness: 0.35,
    metalness: 0.1
  });
  materialsToDispose.push(candleMat);

  const wickMat = new THREE.MeshStandardMaterial({ color: 0x24121a, roughness: 0.8 });
  materialsToDispose.push(wickMat);

  const flameTexture = createTeardropFlameTexture();
  texturesToDispose.push(flameTexture);

  const candlePositions = [];
  // 10 candles on middle pink tier (r ≈ 11.5, surface y ≈ 2.8)
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2 + 4.9;
    const height = 4.8 + ((i * 7) % 5) * 0.12;
    candlePositions.push({
      x: Math.cos(angle) * 10.6,
      z: Math.sin(angle) * 10.6,
      baseY: 1.4,
      height,
      radius: 0.42,
      ring: 'tier2'
    });
  }
  // 6 candles on top warm cream tier (r ≈ 6.0, surface y ≈ 7.2)
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + 4.0;
    const height = 5.2 + ((i * 3) % 4) * 0.14;
    candlePositions.push({
      x: Math.cos(angle) * 5.2,
      z: Math.sin(angle) * 5.2,
      baseY: 7.4,
      height,
      radius: 0.40,
      ring: 'tier3'
    });
  }

  const candles = [];
  const flames = [];
  const smokeTexture = createLavenderSmokeTexture();
  texturesToDispose.push(smokeTexture);
  const smokePuffs = [];

  candlePositions.forEach((cp, index) => {
    const candleGeo = new THREE.CylinderGeometry(cp.radius * 0.95, cp.radius, cp.height, 16);
    geometriesToDispose.push(candleGeo);
    const candle = new THREE.Mesh(candleGeo, candleMat);
    const centerY = cp.baseY + cp.height / 2;
    candle.position.set(cp.x, centerY, cp.z);
    candle.name = `cakeCandle_${index + 1}`;
    group.add(candle);
    candles.push(candle);

    // Candle wick
    const wickGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.5, 6);
    geometriesToDispose.push(wickGeo);
    const wick = new THREE.Mesh(wickGeo, wickMat);
    wick.position.set(cp.x, cp.baseY + cp.height + 0.25, cp.z);
    group.add(wick);

    // Teardrop Flame Sprite
    const flameMat = new THREE.SpriteMaterial({
      map: flameTexture,
      color: 0xffffff, // true flame colors from canvas texture!
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    materialsToDispose.push(flameMat);
    const flame = new THREE.Sprite(flameMat);
    const flameBaseY = cp.baseY + cp.height + 1.45;
    flame.position.set(cp.x, flameBaseY, cp.z);
    flame.scale.set(1.8, 2.9, 1);
    flame.userData = {
      baseX: cp.x,
      baseY: flameBaseY,
      baseZ: cp.z,
      phase: (index / 16) * Math.PI * 2,
      flickerSpeed: 9 + ((index * 3) % 7) * 0.8,
      index
    };
    flame.name = `cakeFlame_${index + 1}`;
    group.add(flame);
    flames.push(flame);

    // Ethereal Lavender Smoke Puff
    const smokeMat = new THREE.SpriteMaterial({
      map: smokeTexture,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    materialsToDispose.push(smokeMat);
    const smoke = new THREE.Sprite(smokeMat);
    smoke.position.set(cp.x, flameBaseY, cp.z);
    smoke.scale.set(1.4, 1.4, 1);
    smoke.visible = false;
    smoke.userData = { baseX: cp.x, baseY: flameBaseY, baseZ: cp.z, age: 0, active: false };
    smoke.name = `cakeSmoke_${index + 1}`;
    group.add(smoke);
    smokePuffs.push(smoke);
  });

  // =========================================================================
  // 7. Warm Candle PointLight above Cake
  // =========================================================================
  // Studio lighting so the tiers read round: warm key, violet rim, soft contact shadow
  const keyLight = new THREE.DirectionalLight(0xfff1e2, 0.55);
  keyLight.position.set(26, 34, 38);
  const rimLight = new THREE.DirectionalLight(0xb9a4ff, 2.2);
  rimLight.position.set(-30, 18, -42);
  group.add(keyLight, keyLight.target, rimLight, rimLight.target);
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = shadowCanvas.height = 256;
  const sctx = shadowCanvas.getContext('2d');
  const sg = sctx.createRadialGradient(128, 128, 30, 128, 128, 128);
  sg.addColorStop(0, 'rgba(0,0,0,0.75)');
  sg.addColorStop(0.6, 'rgba(0,0,0,0.3)');
  sg.addColorStop(1, 'rgba(0,0,0,0)');
  sctx.fillStyle = sg;
  sctx.fillRect(0, 0, 256, 256);
  const shadowTex = new THREE.CanvasTexture(shadowCanvas);
  const contactShadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false });
  materialsToDispose.push(contactShadowMat);
  const contactShadow = new THREE.Mesh(new THREE.PlaneGeometry(58, 58), contactShadowMat);
  geometriesToDispose.push(contactShadow.geometry);
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = -15.05;
  contactShadow.name = 'cakeContactShadow';
  group.add(contactShadow);

  const cakePointLight = new THREE.PointLight(0xffb066, quality.tier === 'low' ? 0.35 : 1.15, 65);
  cakePointLight.position.set(0, 14.5, 0);
  cakePointLight.name = 'cakeWarmCandleLight';
  group.add(cakePointLight);

  // =========================================================================
  // 8. Secret Message under the plate base
  // =========================================================================
  let cakeMessage = null;
  let cakeMessageReveal = 0;
  let revealProgress = 0;
  let revealed = false;
  let blown = false;
  let blowingOut = false;
  let blowTimeouts = [];
  let blowGeneration = 0;
  let breathStrength = 0;
  let lastLitCandleCount = 0;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isQaStatic = /qa=cake-(front|lit|top)/.test(window.location.search);

  const disposeCakeMessage = () => {
    if (!cakeMessage) return;
    group.remove(cakeMessage);
    cakeMessage.material.map?.dispose();
    cakeMessage.material.dispose();
    cakeMessage.geometry.dispose();
    cakeMessage = null;
    cakeMessageReveal = 0;
  };

  return {
    group,
    get revealed() { return revealed; },
    get blown() { return blown; },
    get candlePositions() { return candlePositions; },
    get flames() { return flames; },

    reveal(onCandleLit) {
      if (!enabled || revealed) return false;
      revealed = true;
      blown = false;
      const isQaStatic = /qa=cake-(front|lit|top)/.test(window.location.search);
      revealProgress = (reducedMotion || isQaStatic) ? 1 : 0;
      lastLitCandleCount = (reducedMotion || isQaStatic) ? flames.length : 0;
      group.userData.onCandleLit = onCandleLit;
      flames.forEach((flame) => { flame.visible = reducedMotion || isQaStatic; });
      cakePointLight.intensity = quality.tier === 'low' ? 0.35 : 1.15;
      group.scale.setScalar(2.05);
      group.position.set(0, isQaStatic ? -3 : -30, -5);
      group.visible = true;
      return true;
    },

    setMessage(message) {
      disposeCakeMessage();
      if (!message) return;

      const canvas = document.createElement('canvas');
      canvas.width = 1600;
      canvas.height = 200;
      const context = canvas.getContext('2d');

      // Soft radial dark shadow behind the secret message to prevent rim clash
      const bgGrad = context.createRadialGradient(800, 100, 0, 800, 100, 720);
      bgGrad.addColorStop(0, 'rgba(12, 5, 20, 0.88)');
      bgGrad.addColorStop(0.55, 'rgba(12, 5, 20, 0.52)');
      bgGrad.addColorStop(1, 'rgba(12, 5, 20, 0)');
      context.fillStyle = bgGrad;
      context.fillRect(0, 0, 1600, 200);

      // 15% larger font size (from 70px to 82px)
      context.font = '700 82px Mali, sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.lineWidth = 12;
      context.strokeStyle = 'rgba(24, 8, 34, 0.95)';
      context.strokeText(message, 800, 100);
      context.fillStyle = '#fff4fa';
      context.fillText(message, 800, 100);

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;

      // Plane placed safely under plate base with slight curve
      const geometry = new THREE.PlaneGeometry(46, 5.6, 48, 1);
      const positions = geometry.attributes.position;
      for (let index = 0; index < positions.count; index += 1) {
        const x = positions.getX(index);
        positions.setY(index, positions.getY(index) - Math.pow(x / 46, 2) * 1.2);
        positions.setZ(index, -Math.pow(x / 46, 2) * 3.6);
      }
      geometry.computeVertexNormals();

      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthTest: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false
      });

      cakeMessage = new THREE.Mesh(geometry, material);
      cakeMessage.name = 'cakeSecretMessage';
      cakeMessageReveal = 0;
      // Positioned underneath presentation plate with comfortable clearance from action buttons
      cakeMessage.position.set(0, -15.4, 23.5);
      cakeMessage.scale.x = 0.01;
      group.add(cakeMessage);
    },

    setBreathStrength(val) {
      breathStrength = Math.max(0, Math.min(1.0, val));
    },

    cancelBlowOut() {
      blowGeneration++;
      blowTimeouts.forEach(id => clearTimeout(id));
      blowTimeouts = [];
      blowingOut = false;
      breathStrength = 0;
    },

    blowOut(onComplete, onCandleOut) {
      if (!revealed || blown) return false;
      blown = true;
      blowingOut = true;
      const currentGen = ++blowGeneration;
      blowTimeouts.forEach(id => clearTimeout(id));
      blowTimeouts = [];

      if (reducedMotion) {
        flames.forEach((flame) => { flame.visible = false; });
        cakePointLight.intensity = 0;
        const rmId = window.setTimeout(() => {
          if (currentGen !== blowGeneration) return;
          blowingOut = false;
          onComplete?.();
        }, 600);
        blowTimeouts.push(rmId);
      } else {
        // Phase D2: 0.0s - 0.6s: Flame flutter & wind response
        // 0.6s onwards: sequential extinguishing at 220ms per candle (15 intervals * 220ms = 3300ms + 600ms prelude + 500ms pause = 4.4s)
        const START_DELAY = 600;
        const INTERVAL = 220;
        flames.forEach((flame, index) => {
          const timeoutId = window.setTimeout(() => {
            if (currentGen !== blowGeneration) return;
            flame.visible = false;
            // Trigger lavender smoke puff
            const smoke = smokePuffs[index];
            if (smoke) {
              smoke.visible = true;
              smoke.userData.active = true;
              smoke.userData.age = 0;
              smoke.material.opacity = 0.65;
              smoke.position.set(flame.userData.baseX, flame.userData.baseY, flame.userData.baseZ);
            }
            onCandleOut?.(index);
            cakePointLight.intensity = THREE.MathUtils.lerp(1.15, 0.05, (index + 1) / flames.length);

            if (index === flames.length - 1) {
              cakePointLight.intensity = 0;
              // 0.5s pause in serene darkness before celebration
              const finalTimeout = window.setTimeout(() => {
                if (currentGen !== blowGeneration) return;
                blowingOut = false;
                onComplete?.();
              }, 500);
              blowTimeouts.push(finalTimeout);
            }
          }, START_DELAY + index * INTERVAL);
          blowTimeouts.push(timeoutId);
        });
      }
      return true;
    },

    update(delta, time) {
      if (!revealed) return;

      revealProgress = (reducedMotion || isQaStatic) ? 1 : Math.min(1, revealProgress + delta / 1.4);
      if (cakeMessage) {
        // Round 17: the secret message appears only after the candles are out, so it
        // never sits under the blow buttons
        const messageTarget = blown ? 1 : 0;
        cakeMessageReveal = (reducedMotion || isQaStatic) ? messageTarget
          : THREE.MathUtils.clamp(cakeMessageReveal + Math.sign(messageTarget - cakeMessageReveal) * delta / 0.85, 0, 1);
        cakeMessage.scale.x = Math.max(0.01, cakeMessageReveal);
        cakeMessage.visible = cakeMessageReveal > 0.02;
      }

      // Smooth rise of the cake group from -30 to -3
      group.position.y = isQaStatic ? -3 : THREE.MathUtils.lerp(-30, -3, revealProgress * revealProgress * (3 - 2 * revealProgress));

      // Sequential lighting of candles during reveal
      const litCandleCount = Math.ceil(revealProgress * flames.length);
      if (!blown && litCandleCount > lastLitCandleCount) {
        for (let index = lastLitCandleCount; index < litCandleCount; index += 1) {
          group.userData.onCandleLit?.(index);
        }
        lastLitCandleCount = litCandleCount;
      }

      // Flame flicker, breath wind tilt & floating stars animation
      if (!blown || blowingOut) {
        flames.forEach((flame, index) => {
          if (!flame.visible && blown) return;
          flame.visible = reducedMotion || isQaStatic || index < Math.ceil(revealProgress * flames.length);
          const windTilt = breathStrength * 0.35 + (blowingOut ? 0.38 : 0);
          const flicker = 1.0 + Math.sin(time * (flame.userData.flickerSpeed + (breathStrength + (blowingOut ? 1 : 0)) * 14) + flame.userData.phase) * (0.08 + breathStrength * 0.15);
          const wobble = Math.cos(time * 6 + flame.userData.phase) * 0.04;
          flame.scale.set(1.8 * flicker, Math.max(1.2, (2.9 - windTilt * 0.8) * flicker), 1);
          flame.position.x = flame.userData.baseX + windTilt * 1.2;
          flame.position.y = flame.userData.baseY + wobble - windTilt * 0.4;
        });
      }

      // Update lavender smoke puffs
      smokePuffs.forEach((smoke) => {
        if (!smoke.userData.active) return;
        smoke.userData.age += delta;
        const progress = smoke.userData.age / 1.4;
        if (progress >= 1.0) {
          smoke.userData.active = false;
          smoke.visible = false;
          smoke.material.opacity = 0;
        } else {
          smoke.position.y = smoke.userData.baseY + progress * 4.2;
          smoke.scale.set(1.4 + progress * 2.2, 1.4 + progress * 2.2, 1);
          smoke.material.opacity = Math.max(0, (1.0 - progress) * 0.65);
        }
      });

      // Orbit floating stars around cake
      floatingStars.forEach((star) => {
        star.userData.angle += delta * star.userData.speed;
        star.position.x = Math.cos(star.userData.angle) * star.userData.radius;
        star.position.z = Math.sin(star.userData.angle) * star.userData.radius;
        star.position.y = star.userData.baseHeight + Math.sin(time * 1.5 + star.userData.angle) * 1.2;
        star.rotation.x += delta * 1.2;
        star.rotation.y += delta * 1.6;
      });
    },

    hide() {
      blowGeneration++;
      group.visible = false;
      group.position.set(0, -30, -5);
      group.scale.setScalar(1);
      revealed = false;
      blown = false;
      blowingOut = false;
      breathStrength = 0;
      blowTimeouts.forEach(id => clearTimeout(id));
      blowTimeouts = [];
      revealProgress = 0;
      cakeMessageReveal = 0;
      lastLitCandleCount = 0;
      group.userData.onCandleLit = null;
      flames.forEach((flame) => {
        flame.visible = true;
        flame.position.x = flame.userData.baseX;
        flame.position.y = flame.userData.baseY;
      });
      smokePuffs.forEach((smoke) => {
        smoke.visible = false;
        smoke.userData.active = false;
        smoke.material.opacity = 0;
      });
      cakePointLight.intensity = quality.tier === 'low' ? 0.35 : 1.15;
      disposeCakeMessage();
    },

    reset() {
      this.hide();
      group.visible = true;
      revealed = true;
      revealProgress = 1;
      group.position.set(0, -3, -5);
      group.scale.setScalar(2.05);
      blown = false;
      blowingOut = false;
      flames.forEach((flame) => {
        flame.visible = true;
        flame.position.x = flame.userData.baseX;
        flame.position.y = flame.userData.baseY;
      });
      cakePointLight.intensity = quality.tier === 'low' ? 0.35 : 1.15;
    },

    dispose() {
      blowGeneration++;
      blowTimeouts.forEach(id => clearTimeout(id));
      blowTimeouts = [];
      blowingOut = false;
      breathStrength = 0;
      disposeCakeMessage();
      materialsToDispose.forEach((m) => m.dispose());
      geometriesToDispose.forEach((g) => g.dispose());
      texturesToDispose.forEach((t) => t.dispose());
      group.traverse((object) => {
        object.geometry?.dispose();
        if (Array.isArray(object.material)) object.material.forEach((m) => m.dispose());
        else object.material?.dispose();
      });
      scene.remove(group);
    }
  };
}
