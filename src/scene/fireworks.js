import * as THREE from 'three';
import confetti from 'canvas-confetti';
import { createGlowTexture } from './galaxySkybox.js';

/**
 * Grand Cosmic Supernova & Birthday Wish Phenomenon (Give Love Studio Style):
 * 1. Triple Starlight Rockets shooting from planet with luminous particle tails
 * 2. Blinding Supernova Core Flash & Expanding Double 3D Shockwaves
 * 3. Giant Radiant 3D Heart Constellation with pulsating stardust (1,200 particles)
 * 4. Cascading Fairy Stardust Rain (800+ diamond sparks floating slowly around planet)
 * 5. Floating Glowing 3D Romantic Wish Banner in space
 * 6. Multi-stage canvas stardust hearts shower & automatic GPU resource disposal
 */
export function createFireworksSystem(scene, soundManager) {
  const fireworksGroup = new THREE.Group();
  fireworksGroup.name = 'starBurstSystem';

  const particleTexture = createGlowTexture(64, 'rgba(255,255,255,1)', 'rgba(255,255,255,0)');
  const activeRockets = [];
  const activeExplosions = [];
  const activeShockwaves = [];
  const activeStardustRain = [];

  // ---------------------------------------------------------------------------
  // 1. Starlight Rocket with Shimmering Particle Trail
  // ---------------------------------------------------------------------------
  function launchBurstRocket(startPos, targetPos, colorHex = 0xffe066, onDetonate) {
    const trailCount = 28;
    const trailGeo = new THREE.BufferGeometry();
    const trailPositions = new Float32Array(trailCount * 3);
    const trailAlphas = new Float32Array(trailCount);

    for (let i = 0; i < trailCount; i++) {
      trailPositions[i * 3] = startPos.x;
      trailPositions[i * 3 + 1] = startPos.y;
      trailPositions[i * 3 + 2] = startPos.z;
      trailAlphas[i] = (1.0 - i / trailCount);
    }

    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));

    const trailMat = new THREE.PointsMaterial({
      color: colorHex,
      size: 2.8,
      map: particleTexture,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const mesh = new THREE.Points(trailGeo, trailMat);
    fireworksGroup.add(mesh);

    if (soundManager) {
      soundManager.playLaunchSound();
    }

    const history = [];
    for (let i = 0; i < trailCount; i++) history.push(startPos.clone());

    activeRockets.push({
      mesh,
      geo: trailGeo,
      mat: trailMat,
      start: startPos.clone(),
      target: targetPos.clone(),
      current: startPos.clone(),
      history,
      progress: 0,
      speed: 0.024,
      onDetonate
    });
  }

  // ---------------------------------------------------------------------------
  // 2. Double Concentric Expanding 3D Shockwave Rings
  // ---------------------------------------------------------------------------
  function createShockwaveRing(center, colorHex, maxScale = 22.0, duration = 1.6) {
    const ringGeo = new THREE.RingGeometry(0.6, 1.2, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.copy(center);
    ringMesh.rotation.x = Math.PI / 3.5;
    fireworksGroup.add(ringMesh);

    activeShockwaves.push({
      mesh: ringMesh,
      geo: ringGeo,
      mat: ringMat,
      scale: 1.0,
      maxScale,
      age: 0,
      maxAge: duration
    });
  }

  // ---------------------------------------------------------------------------
  // 3. Supernova Flash & 3D Giant Heart Constellation Detonation
  // ---------------------------------------------------------------------------
  function detonateStarBurst(center) {
    if (soundManager) {
      soundManager.playStarBurstSound();
    }

    // 1. Double Shockwaves (Gold & Rose Magenta)
    createShockwaveRing(center, 0xffd700, 26.0, 1.6);
    setTimeout(() => {
      createShockwaveRing(center, 0xff6b8b, 34.0, 1.8);
    }, 180);

    // 2. Radiant Supernova Core Flash Sprite
    const flashTex = createGlowTexture(128, 'rgba(255,255,255,1)', 'rgba(255,200,240,0)');
    const flashMat = new THREE.SpriteMaterial({
      map: flashTex,
      color: 0xfff9e6,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending
    });
    const flashSprite = new THREE.Sprite(flashMat);
    flashSprite.position.copy(center);
    flashSprite.scale.set(38, 38, 1);
    fireworksGroup.add(flashSprite);

    // Fade out flash sprite
    let flashAge = 0;
    const flashInterval = setInterval(() => {
      flashAge += 0.05;
      flashSprite.scale.multiplyScalar(1.05);
      flashMat.opacity = Math.max(0, 1.0 - flashAge / 0.5);
      if (flashAge >= 0.5) {
        clearInterval(flashInterval);
        fireworksGroup.remove(flashSprite);
        flashMat.dispose();
      }
    }, 30);

    // 3. Multi-tier Particle Explosion (Heart Constellation + Radial Blast)
    const count = 1200;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const velocities = [];
    const isHeartParticle = [];

    const palette = [
      new THREE.Color(0xffd700), // Stardust Gold
      new THREE.Color(0xff6b8b), // Romantic Rose
      new THREE.Color(0xff477e), // Vivid Magenta
      new THREE.Color(0x00f2fe), // Electric Cyan
      new THREE.Color(0xffffff), // Starlight Diamond White
      new THREE.Color(0xdda0dd)  // Lavender Stardust
    ];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = center.x;
      positions[i * 3 + 1] = center.y;
      positions[i * 3 + 2] = center.z;

      const col = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;

      const vel = new THREE.Vector3();

      if (i < 580) {
        // Grand 3D Parametric Heart Constellation
        isHeartParticle.push(true);
        const t = (i / 580) * Math.PI * 2;
        // Heart curve formula
        const hx = 16 * Math.pow(Math.sin(t), 3) * 0.088;
        const hy = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * 0.088;
        const hz = (Math.random() - 0.5) * 0.35;
        vel.set(hx, hy, hz).multiplyScalar(1.05 + Math.random() * 0.3);
      } else {
        // Outer Radial Sparkle Blast & Stardust Rain
        isHeartParticle.push(false);
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        const speed = (Math.random() < 0.3 ? 0.35 : 0.85) + Math.random() * 0.55;
        vel.set(
          speed * Math.sin(phi) * Math.cos(theta),
          speed * Math.sin(phi) * Math.sin(theta),
          speed * Math.cos(phi)
        );
      }

      velocities.push(vel);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 2.2,
      map: particleTexture,
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const mesh = new THREE.Points(geo, mat);
    fireworksGroup.add(mesh);

    activeExplosions.push({
      mesh,
      geo,
      mat,
      positions,
      velocities,
      isHeartParticle,
      count,
      age: 0,
      maxAge: 4.8
    });

    // 4. Cascading Fairy Stardust Rain (800 Falling Diamond Sparks)
    setTimeout(() => {
      createCascadingStardustRain(center);
    }, 700);

    // 5. Canvas Confetti Heart Shower
    try {
      const heartShape = confetti.shapeFromPath({
        path: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'
      });

      // Triple burst
      confetti({
        particleCount: 85,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FF6B8B', '#00f2fe', '#FFAAA6', '#FFFFFF'],
        shapes: [heartShape, 'circle']
      });

      setTimeout(() => {
        confetti({
          particleCount: 65,
          spread: 120,
          origin: { y: 0.55 },
          colors: ['#FFD700', '#FF6B8B', '#00f2fe']
        });
      }, 800);
    } catch (e) {
      console.warn('Canvas confetti error:', e);
    }
  }

  // ---------------------------------------------------------------------------
  // 4. Cascading Fairy Stardust Rain (ฝนดาวตกประกายเพชรโปรยปรายทั่วจอ)
  // ---------------------------------------------------------------------------
  function createCascadingStardustRain(origin) {
    const count = 750;
    const rainPositions = new Float32Array(count * 3);
    const rainColors = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    const sways = new Float32Array(count);

    const rainPalette = [
      new THREE.Color(0xffd700),
      new THREE.Color(0xff70a6),
      new THREE.Color(0xffffff),
      new THREE.Color(0x00f2fe)
    ];

    for (let i = 0; i < count; i++) {
      // Disperse in wide dome above planet
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 45;
      rainPositions[i * 3] = origin.x + Math.cos(angle) * dist;
      rainPositions[i * 3 + 1] = origin.y + Math.random() * 15 + 8;
      rainPositions[i * 3 + 2] = origin.z + Math.sin(angle) * dist;

      const col = rainPalette[Math.floor(Math.random() * rainPalette.length)];
      rainColors[i * 3] = col.r;
      rainColors[i * 3 + 1] = col.g;
      rainColors[i * 3 + 2] = col.b;

      speeds[i] = 0.08 + Math.random() * 0.14;
      sways[i] = Math.random() * Math.PI * 2;
    }

    const rainGeo = new THREE.BufferGeometry();
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
    rainGeo.setAttribute('color', new THREE.BufferAttribute(rainColors, 3));

    const rainMat = new THREE.PointsMaterial({
      size: 1.6,
      map: particleTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const rainMesh = new THREE.Points(rainGeo, rainMat);
    fireworksGroup.add(rainMesh);

    activeStardustRain.push({
      mesh: rainMesh,
      geo: rainGeo,
      mat: rainMat,
      positions: rainPositions,
      speeds,
      sways,
      count,
      age: 0,
      maxAge: 6.5
    });
  }

  // ---------------------------------------------------------------------------
  // 5. Floating Glowing 3D Romantic Wish Banner in Space
  // ---------------------------------------------------------------------------
  function showFloatingWishBanner() {
    let existingBanner = document.getElementById('cosmic-wish-banner');
    if (existingBanner) existingBanner.remove();

    const banner = document.createElement('div');
    banner.id = 'cosmic-wish-banner';
    banner.className = 'cosmic-wish-banner';
    banner.innerHTML = `
      <div class="wish-banner-glow"></div>
      <div class="wish-banner-content">
        <div class="wish-banner-sparkle">✨ 🌠 ✨</div>
        <h2 class="wish-banner-title">สุขสันต์วันเกิดนะข้าวหอม 🎂</h2>
        <p class="wish-banner-text">“ขอให้ทุกความปรารถนาและทุกความฝันในกาแล็กซี่นี้ จงเปล่งประกายและเป็นจริงเสมอไปนะ” 💖</p>
      </div>
    `;
    document.body.appendChild(banner);

    // Auto remove after 7.5 seconds
    setTimeout(() => {
      banner.classList.add('fade-out');
      setTimeout(() => banner.remove(), 1200);
    }, 7500);
  }

  // ---------------------------------------------------------------------------
  // 6. Public Trigger "อธิษฐานขอพรดวงดาว"
  // ---------------------------------------------------------------------------
  function triggerMakeAWish() {
    // Show romantic banner
    showFloatingWishBanner();

    // Sound chime crescendo
    if (soundManager) {
      soundManager.playChimeSound();
    }

    // Launch Triple Shooting Star Rockets
    // Rocket 1 (Center Main)
    const start1 = new THREE.Vector3(0, 14, 0);
    const target1 = new THREE.Vector3(0, 36, 0);
    launchBurstRocket(start1, target1, 0xffd700, () => {
      detonateStarBurst(target1);
    });

    // Rocket 2 (Left Rose Comet, +0.45s)
    setTimeout(() => {
      const start2 = new THREE.Vector3(-10, 13, 5);
      const target2 = new THREE.Vector3(-16, 32, 10);
      launchBurstRocket(start2, target2, 0xff70a6, () => {
        detonateStarBurst(target2);
      });
    }, 450);

    // Rocket 3 (Right Cyan Comet, +0.9s)
    setTimeout(() => {
      const start3 = new THREE.Vector3(10, 13, -5);
      const target3 = new THREE.Vector3(16, 33, -10);
      launchBurstRocket(start3, target3, 0x00f2fe, () => {
        detonateStarBurst(target3);
      });
    }, 900);
  }

  // ---------------------------------------------------------------------------
  // 7. 60 FPS Animation Update Loop
  // ---------------------------------------------------------------------------
  function update(delta) {
    // 1. Update Rockets & Trails
    for (let i = activeRockets.length - 1; i >= 0; i--) {
      const r = activeRockets[i];
      r.progress += r.speed;
      r.current.lerpVectors(r.start, r.target, r.progress);

      // Shift trail history
      r.history.unshift(r.current.clone());
      if (r.history.length > 28) r.history.pop();

      const posAttr = r.geo.attributes.position;
      for (let h = 0; h < r.history.length; h++) {
        posAttr.setXYZ(h, r.history[h].x, r.history[h].y, r.history[h].z);
      }
      posAttr.needsUpdate = true;

      if (r.progress >= 1.0) {
        if (r.onDetonate) r.onDetonate();
        fireworksGroup.remove(r.mesh);
        r.geo.dispose();
        r.mat.dispose();
        activeRockets.splice(i, 1);
      }
    }

    // 2. Update Shockwaves
    for (let s = activeShockwaves.length - 1; s >= 0; s--) {
      const sw = activeShockwaves[s];
      sw.age += delta;
      const prog = sw.age / sw.maxAge;
      const curScale = 1.0 + prog * sw.maxScale;
      sw.mesh.scale.set(curScale, curScale, 1.0);
      sw.mat.opacity = Math.max(0, (1.0 - prog) * 0.9);

      if (sw.age >= sw.maxAge) {
        fireworksGroup.remove(sw.mesh);
        sw.geo.dispose();
        sw.mat.dispose();
        activeShockwaves.splice(s, 1);
      }
    }

    // 3. Update Explosions & Heart Constellation
    for (let e = activeExplosions.length - 1; e >= 0; e--) {
      const ex = activeExplosions[e];
      ex.age += delta;
      const prog = ex.age / ex.maxAge;

      const posAttr = ex.geo.attributes.position;
      const posArray = ex.positions;

      for (let p = 0; p < ex.count; p++) {
        const p3 = p * 3;
        const vel = ex.velocities[p];

        if (ex.isHeartParticle[p]) {
          // Heart particles expand with gentle orbital pulsation
          const drag = Math.max(0.08, 1.0 - prog * 0.45);
          posArray[p3] += vel.x * drag * 0.95;
          posArray[p3 + 1] += vel.y * drag * 0.95;
          posArray[p3 + 2] += vel.z * drag * 0.95;

          // Subtle pulse
          const pulse = Math.sin(ex.age * 5.0 + p * 0.1) * 0.04;
          posArray[p3] += pulse;
          posArray[p3 + 1] += pulse;
        } else {
          // Radial blast with slow gravity drift
          posArray[p3] += vel.x * 0.92;
          posArray[p3 + 1] += vel.y * 0.92 - 0.025; // Gentle downward drift
          posArray[p3 + 2] += vel.z * 0.92;
        }
      }

      posAttr.needsUpdate = true;
      ex.mat.opacity = Math.max(0, (1.0 - Math.pow(prog, 1.5)));

      if (ex.age >= ex.maxAge) {
        fireworksGroup.remove(ex.mesh);
        ex.geo.dispose();
        ex.mat.dispose();
        activeExplosions.splice(e, 1);
      }
    }

    // 4. Update Cascading Fairy Stardust Rain
    for (let r = activeStardustRain.length - 1; r >= 0; r--) {
      const rain = activeStardustRain[r];
      rain.age += delta;
      const prog = rain.age / rain.maxAge;

      const posAttr = rain.geo.attributes.position;
      const arr = rain.positions;

      for (let p = 0; p < rain.count; p++) {
        const p3 = p * 3;
        arr[p3 + 1] -= rain.speeds[p];
        arr[p3] += Math.sin(rain.age * 1.5 + rain.sways[p]) * 0.04; // Gentle floating sway
        arr[p3 + 2] += Math.cos(rain.age * 1.5 + rain.sways[p]) * 0.04;
      }

      posAttr.needsUpdate = true;
      rain.mat.opacity = Math.max(0, (1.0 - prog) * 0.95);

      if (rain.age >= rain.maxAge) {
        fireworksGroup.remove(rain.mesh);
        rain.geo.dispose();
        rain.mat.dispose();
        activeStardustRain.splice(r, 1);
      }
    }
  }

  scene.add(fireworksGroup);

  return {
    group: fireworksGroup,
    triggerMakeAWish,
    update
  };
}
