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
    ctx.strokeStyle = '#fca5a5';
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
  const plateMat = new THREE.MeshStandardMaterial({
    color: 0xdf9b92, // rose gold
    metalness: 0.72,
    roughness: 0.24
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
    color: 0xffaed7,
    transparent: true,
    opacity: 0.45
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
  const tiers = [
    { radius: 17, height: 8.0, y: -9.8, color: 0xb99af0, name: 'tier-bottom-lavender' },
    { radius: 13, height: 7.0, y: -2.3, color: 0xf7a8c8, name: 'tier-middle-pink' },
    { radius: 9,  height: 6.0, y: 4.2,  color: 0xfff0e0, name: 'tier-top-cream' }
  ];

  const goldTrimMat = new THREE.MeshStandardMaterial({
    color: 0xffd98e,
    metalness: 0.82,
    roughness: 0.22
  });
  materialsToDispose.push(goldTrimMat);

  const tierMeshes = [];
  tiers.forEach((tier) => {
    const tierMat = new THREE.MeshPhysicalMaterial({
      color: tier.color,
      roughness: 0.38,
      metalness: 0.08,
      clearcoat: 0.55,
      clearcoatRoughness: 0.12,
      sheen: 0.6,
      sheenColor: new THREE.Color(0xffe6f5),
      sheenRoughness: 0.25,
      transparent: false,
      transmission: 0,
      opacity: 1.0
    });
    materialsToDispose.push(tierMat);

    const tierGeo = new THREE.CylinderGeometry(tier.radius, tier.radius * 1.02, tier.height, 64);
    geometriesToDispose.push(tierGeo);
    const mesh = new THREE.Mesh(tierGeo, tierMat);
    mesh.position.y = tier.y;
    mesh.name = tier.name;
    group.add(mesh);
    tierMeshes.push(mesh);

    // Elegant gold trim rim at tier base
    const baseTrimGeo = new THREE.TorusGeometry(tier.radius * 1.01, 0.26, 8, 48);
    geometriesToDispose.push(baseTrimGeo);
    const baseTrim = new THREE.Mesh(baseTrimGeo, goldTrimMat);
    baseTrim.rotation.x = Math.PI / 2;
    baseTrim.position.y = tier.y - tier.height / 2 + 0.15;
    group.add(baseTrim);

    // Gold trim rim at tier top
    const topTrimGeo = new THREE.TorusGeometry(tier.radius * 0.99, 0.22, 8, 48);
    geometriesToDispose.push(topTrimGeo);
    const topTrim = new THREE.Mesh(topTrimGeo, goldTrimMat);
    topTrim.rotation.x = Math.PI / 2;
    topTrim.position.y = tier.y + tier.height / 2 - 0.15;
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
    { radius: 17.15, count: 32, y: -5.7 }, // bottom tier rim
    { radius: 13.15, count: 26, y: 1.25 }, // middle tier rim
    { radius: 9.15,  count: 20, y: 7.25 }  // top tier rim
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
  const dripCount = 12;
  for (let i = 0; i < dripCount; i++) {
    const angle = (i / dripCount) * Math.PI * 2;
    const length = 1.0 + ((i * 5) % 4) * 0.38;
    const dripGeo = new THREE.CapsuleGeometry(0.28, length, 6, 8);
    geometriesToDispose.push(dripGeo);
    const drip = new THREE.Mesh(dripGeo, dripMat);
    drip.position.set(
      Math.cos(angle) * 8.95,
      7.0 - length / 2,
      Math.sin(angle) * 8.95
    );
    group.add(drip);
  }

  // =========================================================================
  // 5. Floating Stars around the cake
  // =========================================================================
  const starGeo = new THREE.OctahedronGeometry(0.38, 0);
  geometriesToDispose.push(starGeo);
  const starMat = new THREE.MeshBasicMaterial({ color: 0xffecb3 });
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
      x: Math.cos(angle) * 11.5,
      z: Math.sin(angle) * 11.5,
      baseY: 2.8,
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
      x: Math.cos(angle) * 6.0,
      z: Math.sin(angle) * 6.0,
      baseY: 7.2,
      height,
      radius: 0.40,
      ring: 'tier3'
    });
  }

  const candles = [];
  const flames = [];

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
      baseY: flameBaseY,
      phase: (index / 16) * Math.PI * 2,
      flickerSpeed: 9 + ((index * 3) % 7) * 0.8,
      index
    };
    flame.name = `cakeFlame_${index + 1}`;
    group.add(flame);
    flames.push(flame);
  });

  // =========================================================================
  // 7. Warm Candle PointLight above Cake
  // =========================================================================
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
      context.font = '700 82px Mali, Prompt, sans-serif';
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

    blowOut(onComplete, onCandleOut) {
      if (!revealed || blown) return false;
      blown = true;
      if (reducedMotion) {
        flames.forEach((flame) => { flame.visible = false; });
        cakePointLight.intensity = 0;
        onComplete?.();
      } else {
        flames.forEach((flame, index) => {
          window.setTimeout(() => {
            flame.visible = false;
            onCandleOut?.(index);
            cakePointLight.intensity = THREE.MathUtils.lerp(1.15, 0.05, (index + 1) / flames.length);
            if (index === flames.length - 1) {
              cakePointLight.intensity = 0;
              onComplete?.();
            }
          }, index * 80);
        });
      }
      return true;
    },

    update(delta, time) {
      if (!revealed) return;

      revealProgress = (reducedMotion || isQaStatic) ? 1 : Math.min(1, revealProgress + delta / 1.4);
      if (cakeMessage) {
        cakeMessageReveal = (reducedMotion || isQaStatic) ? 1 : Math.min(1, cakeMessageReveal + delta / 0.85);
        cakeMessage.scale.x = Math.max(0.01, cakeMessageReveal);
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

      // Flame flicker & floating stars animation
      if (!blown) {
        flames.forEach((flame, index) => {
          flame.visible = reducedMotion || isQaStatic || index < Math.ceil(revealProgress * flames.length);
          const flicker = 1.0 + Math.sin(time * flame.userData.flickerSpeed + flame.userData.phase) * 0.08;
          const wobble = Math.cos(time * 6 + flame.userData.phase) * 0.04;
          flame.scale.set(1.8 * flicker, 2.9 * flicker, 1);
          flame.position.y = flame.userData.baseY + wobble;
        });
      }

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
      group.visible = false;
      group.position.set(0, -30, -5);
      group.scale.setScalar(1);
      revealed = false;
      blown = false;
      revealProgress = 0;
      cakeMessageReveal = 0;
      lastLitCandleCount = 0;
      group.userData.onCandleLit = null;
      flames.forEach((flame) => { flame.visible = true; });
      cakePointLight.intensity = quality.tier === 'low' ? 0.35 : 1.15;
      disposeCakeMessage();
    },

    dispose() {
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
