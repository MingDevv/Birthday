import * as THREE from 'three';
import { createGlowTexture } from './galaxySkybox.js';

export function createPointerStarTrail(scene, camera, quality = { tier: 'high' }) {
  const count = 60;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const baseColors = new Float32Array(count * 3);
  const lives = new Float32Array(count);
  const velocities = new Float32Array(count * 3);
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const texture = createGlowTexture(64, 'rgba(255,255,255,1)', 'rgba(255,255,255,0)');
  const material = new THREE.PointsMaterial({
    map: texture,
    size: quality.tier === 'low' ? 1.25 : 1.8,
    vertexColors: true,
    transparent: true,
    opacity: 0.88,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const points = new THREE.Points(geometry, material);
  points.name = 'pointerStardustTrail';
  points.frustumCulled = false;
  scene.add(points);

  const ndc = new THREE.Vector3();
  const rayEnd = new THREE.Vector3();
  const direction = new THREE.Vector3();
  const position = new THREE.Vector3();
  const cameraPosition = new THREE.Vector3();
  const rose = new THREE.Color(0xf0abfc);
  const violet = new THREE.Color(0xc4b5fd);
  let nextSlot = 0;

  return {
    spawn(clientX, clientY, rect) {
      ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1, 0.5);
      rayEnd.copy(ndc).unproject(camera);
      cameraPosition.copy(camera.position);
      direction.subVectors(rayEnd, cameraPosition).normalize();
      if (Math.abs(direction.z) < 0.0001) return;
      const distance = -cameraPosition.z / direction.z;
      if (distance <= 0) return;
      position.copy(cameraPosition).addScaledVector(direction, distance);
      const index = nextSlot;
      nextSlot = (nextSlot + 1) % count;
      lives[index] = 0.6;
      positions[index * 3] = position.x;
      positions[index * 3 + 1] = position.y;
      positions[index * 3 + 2] = position.z;
      velocities[index * 3] = (Math.random() - 0.5) * 2.2;
      velocities[index * 3 + 1] = Math.random() * 2.4 + 0.5;
      velocities[index * 3 + 2] = (Math.random() - 0.5) * 1.2;
      const tint = Math.random() < 0.5 ? rose : violet;
      baseColors[index * 3] = tint.r;
      baseColors[index * 3 + 1] = tint.g;
      baseColors[index * 3 + 2] = tint.b;
    },
    update(delta) {
      for (let index = 0; index < count; index += 1) {
        if (lives[index] <= 0) continue;
        lives[index] = Math.max(0, lives[index] - delta);
        positions[index * 3] += velocities[index * 3] * delta;
        positions[index * 3 + 1] += velocities[index * 3 + 1] * delta;
        positions[index * 3 + 2] += velocities[index * 3 + 2] * delta;
        const fade = lives[index] / 0.6;
        colors[index * 3] = baseColors[index * 3] * fade;
        colors[index * 3 + 1] = baseColors[index * 3 + 1] * fade;
        colors[index * 3 + 2] = baseColors[index * 3 + 2] * fade;
      }
      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.color.needsUpdate = true;
    },
    setVisible(visible) {
      points.visible = visible;
    },
    dispose() {
      scene.remove(points);
      geometry.dispose();
      material.dispose();
      texture.dispose();
    }
  };
}

export function createHeartStreak(scene, quality = { tier: 'high' }) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const texture = createGlowTexture(64, 'rgba(255,255,255,0.9)', 'rgba(255,255,255,0)');
  const horizontalMaterial = new THREE.SpriteMaterial({ map: texture, color: 0xf0abfc, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const verticalMaterial = new THREE.SpriteMaterial({ map: texture, color: 0xc4b5fd, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const horizontal = new THREE.Sprite(horizontalMaterial);
  const vertical = new THREE.Sprite(verticalMaterial);
  const length = quality.tier === 'low' ? 34 : 54;
  horizontal.scale.set(length, 1.35, 1);
  vertical.scale.set(1.35, length * 0.58, 1);
  horizontal.position.set(0, 0, 3);
  vertical.position.set(0, 0, 3);
  horizontal.name = 'heartAnamorphicHorizontalStreak';
  vertical.name = 'heartAnamorphicVerticalStreak';
  scene.add(horizontal, vertical);
  return {
    setVisible(visible) {
      horizontal.visible = visible;
      vertical.visible = visible;
    },
    update(delta, bass) {
      if (reducedMotion) return;
      const target = THREE.MathUtils.clamp((bass - 0.2) * 2.8, 0, 0.48);
      const step = Math.min(1, delta * 5);
      horizontalMaterial.opacity += (target - horizontalMaterial.opacity) * step;
      verticalMaterial.opacity += (target * 0.68 - verticalMaterial.opacity) * step;
    },
    dispose() {
      scene.remove(horizontal, vertical);
      horizontalMaterial.dispose();
      verticalMaterial.dispose();
      texture.dispose();
    }
  };
}
