import * as THREE from 'three';
import { createGlowTexture } from './galaxySkybox.js';

export function createCosmicCake(scene, quality = { tier: 'high' }, { enabled = true } = {}) {
  const group = new THREE.Group();
  group.name = 'cosmicBirthdayCake';
  group.visible = false;
  group.position.set(0, -30, -5);
  scene.add(group);

  const tiers = [
    { radius: 17, height: 8, y: -10, color: 0x9b5de5 },
    { radius: 13, height: 7, y: -2.5, color: 0xd66ba0 },
    { radius: 9, height: 6, y: 4, color: 0xf1c27d }
  ];
  const tierMaterials = [];
  tiers.forEach((tier) => {
    const material = new THREE.MeshPhysicalMaterial({
      color: tier.color,
      metalness: 0.22,
      roughness: 0.24,
      transmission: quality.tier === 'low' ? 0 : 0.22,
      thickness: 0.7,
      clearcoat: 0.8,
      iridescence: quality.tier === 'low' ? 0 : 0.35,
      transparent: true,
      opacity: 0.88
    });
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(tier.radius, tier.radius * 1.04, tier.height, 48), material);
    mesh.position.y = tier.y;
    group.add(mesh);
    tierMaterials.push(material);
    const trim = new THREE.Mesh(
      new THREE.TorusGeometry(tier.radius * 0.98, 0.28, 6, 64),
      new THREE.MeshBasicMaterial({ color: 0xffd6f3, transparent: true, opacity: 0.72 })
    );
    trim.rotation.x = Math.PI / 2;
    trim.position.y = tier.y + tier.height / 2 - 0.35;
    group.add(trim);
  });

  const candleMaterial = new THREE.MeshStandardMaterial({ color: 0xffe7c4, emissive: 0x6f255d, emissiveIntensity: 0.18, roughness: 0.42 });
  const flameTexture = createGlowTexture(64, 'rgba(255,248,215,1)', 'rgba(255,94,173,0)');
  const flames = [];
  const candleCount = 16;
  for (let index = 0; index < candleCount; index += 1) {
    const angle = (index / candleCount) * Math.PI * 2;
    const x = Math.cos(angle) * 6.8;
    const z = Math.sin(angle) * 6.8;
    const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 5.2, 8), candleMaterial);
    candle.position.set(x, 10.3, z);
    group.add(candle);
    const flame = new THREE.Sprite(new THREE.SpriteMaterial({
      map: flameTexture,
      color: index % 3 === 0 ? 0xffd28c : 0xff8bc7,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    flame.position.set(x, 13.3, z);
    flame.scale.set(2.4, 3.2, 1);
    flame.userData.phase = Math.random() * Math.PI * 2;
    group.add(flame);
    flames.push(flame);
  }

  let revealProgress = 0;
  let revealed = false;
  let blown = false;
  let cakeMessage = null;
  let cakeMessageReveal = 0;
  let lastLitCandleCount = 0;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
    reveal(onCandleLit) {
      if (!enabled || revealed) return false;
      revealed = true;
      blown = false;
      revealProgress = 0;
      lastLitCandleCount = 0;
      group.userData.onCandleLit = onCandleLit;
      flames.forEach((flame) => { flame.visible = reducedMotion; });
      group.scale.setScalar(2.05);
      group.position.set(0, -30, -5);
      group.visible = true;
      return true;
    },
    setMessage(message) {
      disposeCakeMessage();
      if (!message) return;
      const canvas = document.createElement('canvas');
      canvas.width = 1600;
      canvas.height = 180;
      const context = canvas.getContext('2d');
      context.font = '700 74px Mali, Prompt, sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.lineWidth = 9;
      context.strokeStyle = 'rgba(28, 10, 38, .92)';
      context.strokeText(message, 800, 90);
      context.fillStyle = '#fff0f9';
      context.fillText(message, 800, 90);
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      const geometry = new THREE.PlaneGeometry(45, 5.1, 64, 1);
      const positions = geometry.attributes.position;
      for (let index = 0; index < positions.count; index += 1) {
        const x = positions.getX(index);
        positions.setY(index, positions.getY(index) - Math.pow(x / 45, 2) * 1.5);
        positions.setZ(index, -Math.pow(x / 45, 2) * 4.2);
      }
      geometry.computeVertexNormals();
      const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthTest: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
      cakeMessage = new THREE.Mesh(geometry, material);
      cakeMessage.name = 'cakeSecretMessage';
      cakeMessageReveal = 0;
      // Keep the note in front of the cake's opaque geometry so depth testing
      // preserves real occlusion without burying the text inside the tiers.
      cakeMessage.position.set(0, -6, 40);
      cakeMessage.scale.x = 0.01;
      group.add(cakeMessage);
    },
    blowOut(onComplete, onCandleOut) {
      if (!revealed || blown) return false;
      blown = true;
      if (reducedMotion) {
        flames.forEach((flame) => { flame.visible = false; });
        onComplete?.();
      } else {
        flames.forEach((flame, index) => {
          window.setTimeout(() => {
            flame.visible = false;
            onCandleOut?.(index);
            if (index === flames.length - 1) onComplete?.();
          }, index * 85);
        });
      }
      return true;
    },
    update(delta, time) {
      if (!revealed) return;
      revealProgress = reducedMotion ? 1 : Math.min(1, revealProgress + delta / 1.4);
      if (cakeMessage) {
        cakeMessageReveal = reducedMotion ? 1 : Math.min(1, cakeMessageReveal + delta / 0.85);
        cakeMessage.scale.x = Math.max(0.01, cakeMessageReveal);
      }
      group.position.y = THREE.MathUtils.lerp(-30, -3, revealProgress * revealProgress * (3 - 2 * revealProgress));
      const litCandleCount = Math.ceil(revealProgress * flames.length);
      if (!blown && litCandleCount > lastLitCandleCount) {
        for (let index = lastLitCandleCount; index < litCandleCount; index += 1) group.userData.onCandleLit?.(index);
        lastLitCandleCount = litCandleCount;
      }
      if (!blown) flames.forEach((flame, index) => {
        flame.visible = reducedMotion || index < Math.ceil(revealProgress * flames.length);
        const flicker = 1 + Math.sin(time * 12 + flame.userData.phase) * 0.08;
        flame.scale.set(2.4 * flicker, 3.2 * flicker, 1);
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
      disposeCakeMessage();
    },
    dispose() {
      disposeCakeMessage();
      group.traverse((object) => {
        object.geometry?.dispose();
        if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
        else object.material?.dispose();
      });
      tierMaterials.forEach((material) => material.dispose());
      flameTexture.dispose();
      scene.remove(group);
    }
  };
}
