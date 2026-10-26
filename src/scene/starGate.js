import * as THREE from 'three';

/**
 * =============================================================================
 * 🌌 Star Gate Arrival System (ประตูดาวลูกหมู — Plan Round 8)
 * - Beautiful, clean cosmic portal at (0, 0, 0) during INTRO.
 * - High-speed peripheral warp streaks & milestone rings during FLIGHT.
 * - Central corridor kept 100% clean & sharp; zero solar system clutter.
 * =============================================================================
 */
export function createStarGate(scene) {
  const root = new THREE.Group();
  root.name = 'starGateSystem';
  scene.add(root);

  // Palette: Cosmic Rose Gold, Violet, Cyan & Diamond White
  const colors = {
    magenta: new THREE.Color(0xd946ef),
    violet: new THREE.Color(0xa855f7),
    gold: new THREE.Color(0xfde047),
    cyan: new THREE.Color(0x38bdf8),
    white: new THREE.Color(0xffffff)
  };

  // ---------------------------------------------------------------------------
  // 1. Celestial Portal Rings at (0, 0, 0) for INTRO & Entry
  // ---------------------------------------------------------------------------
  const portalGroup = new THREE.Group();
  portalGroup.name = 'portalGateRings';
  portalGroup.position.set(0, 0, 0);
  root.add(portalGroup);

  // 1a. Outer Rose-Gold Arch Ring
  const outerRingGeo = new THREE.TorusGeometry(18, 0.42, 24, 72);
  const outerRingMat = new THREE.MeshStandardMaterial({
    color: 0xec4899,
    emissive: 0x9333ea,
    emissiveIntensity: 0.65,
    roughness: 0.22,
    metalness: 0.85
  });
  const outerRingMesh = new THREE.Mesh(outerRingGeo, outerRingMat);
  portalGroup.add(outerRingMesh);

  // 1b. Inner Stardust Gold Resonator Ring
  const innerRingGeo = new THREE.TorusGeometry(14.8, 0.22, 16, 64);
  const innerRingMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xd946ef,
    emissiveIntensity: 0.75,
    roughness: 0.18,
    metalness: 0.9
  });
  const innerRingMesh = new THREE.Mesh(innerRingGeo, innerRingMat);
  portalGroup.add(innerRingMesh);

  // 1c. 8 Starlight Gate Runes / Nodes around perimeter
  const nodeCount = 8;
  const nodeGeo = new THREE.IcosahedronGeometry(0.48, 1);
  const nodeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const nodeNodes = [];
  for (let i = 0; i < nodeCount; i++) {
    const angle = (i / nodeCount) * Math.PI * 2;
    const node = new THREE.Mesh(nodeGeo, nodeMat);
    node.position.set(Math.cos(angle) * 18, Math.sin(angle) * 18, 0);
    portalGroup.add(node);
    nodeNodes.push(node);
  }

  // 1d. Subtle Cosmic Shimmer Iris in Center
  const irisGeo = new THREE.RingGeometry(0.6, 14.5, 64);
  const irisMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 0.22 }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform float uTime;
      uniform float uOpacity;
      void main() {
        vec2 p = vUv - 0.5;
        float r = length(p) * 2.0;
        float angle = atan(p.y, p.x);
        float shimmer = sin(angle * 6.0 + uTime * 2.0 - r * 8.0) * 0.5 + 0.5;
        vec3 col = mix(vec3(0.65, 0.2, 0.9), vec3(0.95, 0.7, 0.3), shimmer);
        float alpha = (1.0 - smoothstep(0.7, 1.0, r)) * smoothstep(0.02, 0.18, r) * uOpacity;
        if (alpha < 0.005) discard;
        gl_FragColor = vec4(col, alpha);
      }
    `,
    side: THREE.DoubleSide,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const irisMesh = new THREE.Mesh(irisGeo, irisMat);
  portalGroup.add(irisMesh);

  // ---------------------------------------------------------------------------
  // 2. Peripheral Speed Streaks (Active only during FLIGHT)
  // - Radii 19 to 68; Center r < 19 kept completely empty and pristine!
  // ---------------------------------------------------------------------------
  const streakCount = 420;
  const streakGeo = new THREE.BufferGeometry();
  const streakPositions = new Float32Array(streakCount * 6);
  const streakColors = new Float32Array(streakCount * 6);
  const streakData = [];

  const streakPalette = [colors.magenta, colors.violet, colors.gold, colors.cyan, colors.white];

  for (let i = 0; i < streakCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const rad = 19 + Math.random() * 48; // empty inside 0..19
    const z = (Math.random() - 0.5) * 400;
    const speed = 280 + Math.random() * 320;
    const len = 20 + Math.random() * 40;
    const col = streakPalette[Math.floor(Math.random() * streakPalette.length)];

    streakData.push({ rad, theta, z, speed, len });

    const x = Math.cos(theta) * rad;
    const y = Math.sin(theta) * rad;
    const idx = i * 6;

    streakPositions[idx] = x;
    streakPositions[idx + 1] = y;
    streakPositions[idx + 2] = z;
    streakPositions[idx + 3] = x;
    streakPositions[idx + 4] = y;
    streakPositions[idx + 5] = z - len;

    streakColors[idx] = col.r;
    streakColors[idx + 1] = col.g;
    streakColors[idx + 2] = col.b;
    streakColors[idx + 3] = col.r * 0.1;
    streakColors[idx + 4] = col.g * 0.1;
    streakColors[idx + 5] = col.b * 0.1;
  }

  streakGeo.setAttribute('position', new THREE.BufferAttribute(streakPositions, 3));
  streakGeo.setAttribute('color', new THREE.BufferAttribute(streakColors, 3));

  const streakMat = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const streakMesh = new THREE.LineSegments(streakGeo, streakMat);
  streakMesh.visible = false;
  root.add(streakMesh);

  // ---------------------------------------------------------------------------
  // 3. Milestone Gate Rings (4 sleek neon rings passing by during warp)
  // ---------------------------------------------------------------------------
  const milestoneGroup = new THREE.Group();
  milestoneGroup.visible = false;
  root.add(milestoneGroup);

  const milestoneRings = [];
  const milestoneCount = 4;
  for (let m = 0; m < milestoneCount; m++) {
    const rGeo = new THREE.RingGeometry(22 + m * 2, 23.4 + m * 2, 48);
    const rMat = new THREE.MeshBasicMaterial({
      color: m % 2 === 0 ? colors.magenta : colors.gold,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const rMesh = new THREE.Mesh(rGeo, rMat);
    milestoneGroup.add(rMesh);
    milestoneRings.push({
      mesh: rMesh,
      mat: rMat,
      baseZ: -80 - m * 80,
      speed: 180 + m * 20
    });
  }

  // ---------------------------------------------------------------------------
  // 4. Outer Cosmic Warp Tunnel Cylinder
  // ---------------------------------------------------------------------------
  const tunnelGeo = new THREE.CylinderGeometry(36, 36, 900, 36, 64, true);
  tunnelGeo.rotateX(Math.PI / 2);

  const tunnelMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uStrength: { value: 0 }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform float uTime;
      uniform float uStrength;
      void main() {
        float angle = vUv.x * 6.2831853;
        float filament = sin(angle * 4.0 + vUv.y * 18.0 - uTime * 2.0);
        float glow = smoothstep(0.70, 0.98, filament) * 0.35;
        vec3 violet = vec3(0.28, 0.06, 0.78);
        vec3 magenta = vec3(0.76, 0.12, 0.60);
        vec3 color = mix(violet, magenta, smoothstep(0.1, 0.9, vUv.y));
        float endFade = smoothstep(0.0, 0.12, vUv.y) * (1.0 - smoothstep(0.88, 1.0, vUv.y));
        float alpha = glow * endFade * uStrength;
        if (alpha < 0.01) discard;
        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending
  });

  const tunnelMesh = new THREE.Mesh(tunnelGeo, tunnelMat);
  tunnelMesh.name = 'starGateTunnel';
  tunnelMesh.visible = false;
  root.add(tunnelMesh);

  // State
  let isIntroActive = false;
  let isWarpActive = false;
  let gateOpening = false;
  let gateOpenProgress = 0;

  return {
    group: root,
    portalGroup,

    setIntroMode(active) {
      isIntroActive = Boolean(active);
      portalGroup.visible = isIntroActive;
      portalGroup.scale.set(1, 1, 1);
      portalGroup.position.set(0, 0, 0);
      outerRingMat.emissiveIntensity = 0.65;
      innerRingMat.emissiveIntensity = 0.75;
      irisMat.uniforms.uOpacity.value = 0.22;
      gateOpening = false;
      gateOpenProgress = 0;
      if (!isIntroActive && !isWarpActive) {
        portalGroup.visible = false;
      }
    },

    triggerGateOpen() {
      gateOpening = true;
      gateOpenProgress = 0;
      portalGroup.visible = true;
    },

    setWarpActive(active) {
      isWarpActive = Boolean(active);
      streakMesh.visible = isWarpActive;
      milestoneGroup.visible = isWarpActive;
      tunnelMesh.visible = isWarpActive;
      if (!isWarpActive) {
        streakMat.opacity = 0;
        tunnelMat.uniforms.uStrength.value = 0;
        milestoneRings.forEach(r => { r.mat.opacity = 0; });
        portalGroup.visible = false;
        gateOpening = false;
      } else {
        streakMat.opacity = 0.58;
        tunnelMat.uniforms.uStrength.value = 0.18;
        milestoneRings.forEach(r => { r.mat.opacity = 0.35; });
      }
    },

    setOpacity(opacity) {
      streakMat.opacity = opacity * 0.58;
      tunnelMat.uniforms.uStrength.value = opacity * 0.18;
      milestoneRings.forEach(r => { r.mat.opacity = opacity * 0.35; });
    },

    update(delta, time, camera, flightProgress = 0) {
      // 1. Idle rotation in INTRO
      if (portalGroup.visible) {
        outerRingMesh.rotation.z += delta * 0.18;
        innerRingMesh.rotation.z -= delta * 0.24;
        irisMesh.rotation.z += delta * 0.12;
        irisMat.uniforms.uTime.value = time;

        if (gateOpening) {
          gateOpenProgress = Math.min(1.0, gateOpenProgress + delta * 0.85);
          const s = 1.0 + gateOpenProgress * 2.2;
          portalGroup.scale.set(s, s, s);
          outerRingMat.emissiveIntensity = 0.65 + gateOpenProgress * 1.5;
          innerRingMat.emissiveIntensity = 0.75 + gateOpenProgress * 1.5;
          irisMat.uniforms.uOpacity.value = Math.max(0, 0.22 * (1.0 - gateOpenProgress));
        } else if (isIntroActive) {
          const breath = 1.0 + Math.sin(time * 1.8) * 0.025;
          portalGroup.scale.set(breath, breath, breath);
        }
      }

      // 2. Warp Speed Streaks
      if (isWarpActive && camera) {
        streakMesh.position.copy(camera.position);
        streakMesh.quaternion.copy(camera.quaternion);

        tunnelMesh.position.copy(camera.position);
        tunnelMesh.quaternion.copy(camera.quaternion);
        tunnelMat.uniforms.uTime.value = time;

        const pos = streakGeo.attributes.position.array;
        for (let i = 0; i < streakCount; i++) {
          const s = streakData[i];
          s.z += s.speed * delta;
          if (s.z > 220) s.z -= 400;
          const idx = i * 6;
          pos[idx + 2] = s.z;
          pos[idx + 5] = s.z - s.len;
        }
        streakGeo.attributes.position.needsUpdate = true;

        // Milestone rings
        milestoneGroup.position.copy(camera.position);
        milestoneGroup.quaternion.copy(camera.quaternion);
        milestoneRings.forEach((r, idx) => {
          r.mesh.rotation.z += delta * (0.3 + idx * 0.1);
          r.mesh.position.z += r.speed * delta;
          if (r.mesh.position.z > 50) r.mesh.position.z = -320;
        });
      }
    },

    dispose() {
      root.remove(portalGroup);
      root.remove(streakMesh);
      root.remove(milestoneGroup);
      root.remove(tunnelMesh);
      scene.remove(root);

      outerRingGeo.dispose();
      outerRingMat.dispose();
      innerRingGeo.dispose();
      innerRingMat.dispose();
      nodeGeo.dispose();
      nodeMat.dispose();
      irisGeo.dispose();
      irisMat.dispose();
      streakGeo.dispose();
      streakMat.dispose();
      tunnelGeo.dispose();
      tunnelMat.dispose();
      milestoneRings.forEach(r => {
        r.mesh.geometry.dispose();
        r.mat.dispose();
      });
    }
  };
}
