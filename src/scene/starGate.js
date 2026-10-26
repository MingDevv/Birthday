import * as THREE from 'three';

/**
 * =============================================================================
 * 🌌 Star Gate Arrival System (ประตูดาวลูกหมู — Plan Round 9)
 * - True "Through the Gate" Flythrough: Portal at (0, 0, 0).
 * - Instanced Quad Ribbons (White Head -> Pink Mid -> Violet Tail, soft cross glow).
 * - Central corridor r < 19 kept 100% clean & sharp; zero solar system clutter.
 * - Dynamic responsive scaling for mobile portrait & desktop.
 * - Glowing milestone rings passing during warp tunnel cruise.
 * =============================================================================
 */
export function createStarGate(scene, qualityConfig = null) {
  const root = new THREE.Group();
  root.name = 'starGateSystem';
  scene.add(root);

  // Palette: Cosmic Rose Gold, Violet, Lavender & Diamond White
  const colors = {
    violet: new THREE.Color(0xa855f7),
    pink: new THREE.Color(0xf472b6),
    lavender: new THREE.Color(0xc084fc),
    roseGold: new THREE.Color(0xfda4af),
    white: new THREE.Color(0xffffff)
  };

  // ---------------------------------------------------------------------------
  // 1. Celestial Portal Gate at (0, 0, 0)
  // ---------------------------------------------------------------------------
  const portalGroup = new THREE.Group();
  portalGroup.name = 'portalGateRings';
  portalGroup.position.set(0, 0, 0);
  root.add(portalGroup);

  // 1a. Outer Rose-Violet Arch Ring (Thicker & luminous)
  const outerRingGeo = new THREE.TorusGeometry(18, 0.65, 24, 80);
  const outerRingMat = new THREE.MeshStandardMaterial({
    color: 0xec4899,
    emissive: 0xa855f7,
    emissiveIntensity: 0.85,
    roughness: 0.18,
    metalness: 0.85
  });
  const outerRingMesh = new THREE.Mesh(outerRingGeo, outerRingMat);
  portalGroup.add(outerRingMesh);

  // 1b. Inner Rose Gold Resonator Ring
  const innerRingGeo = new THREE.TorusGeometry(14.8, 0.38, 18, 72);
  const innerRingMat = new THREE.MeshStandardMaterial({
    color: 0xfda4af,
    emissive: 0xf472b6,
    emissiveIntensity: 0.95,
    roughness: 0.15,
    metalness: 0.9
  });
  const innerRingMesh = new THREE.Mesh(innerRingGeo, innerRingMat);
  portalGroup.add(innerRingMesh);

  // 1c. 8 Starlight Gate Runes / Nodes around perimeter
  const nodeCount = 8;
  const nodeGeo = new THREE.IcosahedronGeometry(0.55, 1);
  const nodeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const nodeNodes = [];
  for (let i = 0; i < nodeCount; i++) {
    const angle = (i / nodeCount) * Math.PI * 2;
    const node = new THREE.Mesh(nodeGeo, nodeMat);
    node.position.set(Math.cos(angle) * 18, Math.sin(angle) * 18, 0);
    portalGroup.add(node);
    nodeNodes.push(node);
  }

  // 1d. Subtle Spiral Shimmer Iris in Center (soft glow gradient, no hard blade bands)
  const irisGeo = new THREE.RingGeometry(0.5, 14.6, 64);
  const irisMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 0.28 }
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
        float shimmer = sin(angle * 5.0 + uTime * 2.2 - r * 6.0) * 0.5 + 0.5;
        vec3 violet = vec3(0.66, 0.33, 0.97);
        vec3 rose = vec3(0.96, 0.45, 0.71);
        vec3 col = mix(violet, rose, shimmer);
        float alpha = (1.0 - smoothstep(0.65, 1.0, r)) * smoothstep(0.02, 0.22, r) * uOpacity;
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
  // 2. Instanced Quad Light Ribbons (White Head -> Pink Mid -> Violet Tail)
  // ---------------------------------------------------------------------------
  const tier = qualityConfig?.tier || 'high';
  const ribbonCount = tier === 'low' ? 120 : tier === 'medium' ? 240 : 380;

  // Base quad geometry: plane from -0.5 to 0.5 (X: width) and 0 to 1 (Y: length along flight axis)
  const ribbonBaseGeo = new THREE.PlaneGeometry(1, 1);
  const ribbonGeo = new THREE.InstancedBufferGeometry();
  ribbonGeo.index = ribbonBaseGeo.index;
  ribbonGeo.attributes.position = ribbonBaseGeo.attributes.position;
  ribbonGeo.attributes.uv = ribbonBaseGeo.attributes.uv;

  const aBaseRadius = new Float32Array(ribbonCount);
  const aBaseTheta = new Float32Array(ribbonCount);
  const aBaseZ = new Float32Array(ribbonCount);
  const aSpeed = new Float32Array(ribbonCount);
  const aScale = new Float32Array(ribbonCount * 2); // width, length
  const aColorType = new Float32Array(ribbonCount); // 0 = violet, 1 = pink, 2 = lavender

  for (let i = 0; i < ribbonCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const rad = 19 + Math.random() * 52; // Keep center r < 19 completely empty!
    const z = (Math.random() - 0.5) * 500;
    const speed = 260 + Math.random() * 220;
    const width = 0.45 + Math.random() * 0.45;
    const length = 28 + Math.random() * 36;
    const colType = Math.floor(Math.random() * 3);

    aBaseRadius[i] = rad;
    aBaseTheta[i] = theta;
    aBaseZ[i] = z;
    aSpeed[i] = speed;
    aScale[i * 2] = width;
    aScale[i * 2 + 1] = length;
    aColorType[i] = colType;
  }

  ribbonGeo.setAttribute('aBaseRadius', new THREE.InstancedBufferAttribute(aBaseRadius, 1));
  ribbonGeo.setAttribute('aBaseTheta', new THREE.InstancedBufferAttribute(aBaseTheta, 1));
  ribbonGeo.setAttribute('aBaseZ', new THREE.InstancedBufferAttribute(aBaseZ, 1));
  ribbonGeo.setAttribute('aSpeed', new THREE.InstancedBufferAttribute(aSpeed, 1));
  ribbonGeo.setAttribute('aScale', new THREE.InstancedBufferAttribute(aScale, 2));
  ribbonGeo.setAttribute('aColorType', new THREE.InstancedBufferAttribute(aColorType, 1));

  const ribbonMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 0.0 }
    },
    vertexShader: `
      attribute float aBaseRadius;
      attribute float aBaseTheta;
      attribute float aBaseZ;
      attribute float aSpeed;
      attribute vec2 aScale;
      attribute float aColorType;

      uniform float uTime;
      varying vec2 vUv;
      varying float vColorType;

      void main() {
        vUv = uv;
        vColorType = aColorType;

        // Animate Z continuously streaming backwards along the corridor
        float z = mod(aBaseZ + aSpeed * uTime, 500.0) - 250.0;

        // Position on the perimeter of the cylinder
        vec3 centerPos = vec3(cos(aBaseTheta) * aBaseRadius, sin(aBaseTheta) * aBaseRadius, z);

        // Tangent vector perpendicular to radius (tangential to cylinder)
        vec3 tangent = vec3(-sin(aBaseTheta), cos(aBaseTheta), 0.0);

        // Ribbon quad oriented along flight direction (Z axis)
        vec3 pos = centerPos;
        pos += tangent * (position.x * aScale.x);
        pos.z += (position.y - 0.5) * aScale.y;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      varying float vColorType;
      uniform float uOpacity;

      void main() {
        // Soft cross-section glow across ribbon width
        float crossEdge = sin(vUv.x * 3.14159265);
        crossEdge = pow(crossEdge, 1.5);

        // Head (vUv.y = 1.0) is bright white; body is pink/rose; tail (vUv.y = 0.0) is violet
        float headToTail = vUv.y;

        vec3 violet = vec3(0.66, 0.33, 0.97);   // #a855f7
        vec3 rosePink = vec3(0.96, 0.45, 0.71); // #f472b6
        vec3 lavender = vec3(0.75, 0.52, 0.99); // #c084fc
        vec3 white = vec3(1.0, 1.0, 1.0);

        vec3 baseCol = vColorType > 1.5 ? lavender : (vColorType > 0.5 ? rosePink : violet);
        vec3 color = mix(baseCol, rosePink, smoothstep(0.1, 0.65, headToTail));
        color = mix(color, white, smoothstep(0.75, 1.0, headToTail));

        // Soft tail fade
        float alpha = smoothstep(0.0, 0.28, headToTail) * crossEdge * uOpacity;
        if (alpha < 0.005) discard;

        gl_FragColor = vec4(color, alpha);
      }
    `,
    side: THREE.DoubleSide,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const ribbonMesh = new THREE.Mesh(ribbonGeo, ribbonMat);
  ribbonMesh.name = 'starGateRibbons';
  ribbonMesh.frustumCulled = false;
  ribbonMesh.visible = false;
  root.add(ribbonMesh);

  // ---------------------------------------------------------------------------
  // 3. Milestone Gate Rings (Pass by during warp tunnel cruise)
  // ---------------------------------------------------------------------------
  const milestoneGroup = new THREE.Group();
  milestoneGroup.name = 'warpMilestones';
  milestoneGroup.visible = false;
  root.add(milestoneGroup);

  const milestoneRings = [];
  const milestoneCount = 5;
  for (let m = 0; m < milestoneCount; m++) {
    const rGeo = new THREE.RingGeometry(21 + m * 1.5, 22.8 + m * 1.5, 64);
    const rMat = new THREE.MeshBasicMaterial({
      color: m % 2 === 0 ? colors.pink : colors.lavender,
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
      baseZ: -45 - m * 55,
      speed: 160 + m * 15
    });
  }

  // State
  let isIntroActive = false;
  let isWarpActive = false;
  let gateOpening = false;
  let gateOpenProgress = 0;

  function updateGateResponsiveScale() {
    const minDim = Math.min(window.innerWidth, window.innerHeight);
    const responsiveScale = Math.min(1.0, Math.max(0.65, minDim / 760));
    portalGroup.scale.set(responsiveScale, responsiveScale, responsiveScale);
  }

  return {
    group: root,
    portalGroup,

    setIntroMode(active) {
      isIntroActive = Boolean(active);
      portalGroup.visible = isIntroActive;
      portalGroup.position.set(0, 0, 0);
      updateGateResponsiveScale();
      outerRingMat.emissiveIntensity = 0.85;
      innerRingMat.emissiveIntensity = 0.95;
      irisMat.uniforms.uOpacity.value = 0.28;
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
      ribbonMesh.visible = isWarpActive;
      milestoneGroup.visible = isWarpActive;
      if (!isWarpActive) {
        ribbonMat.uniforms.uOpacity.value = 0;
        milestoneRings.forEach(r => { r.mat.opacity = 0; });
        portalGroup.visible = false;
        gateOpening = false;
      } else {
        ribbonMat.uniforms.uOpacity.value = 0.88;
        milestoneRings.forEach(r => { r.mat.opacity = 0.45; });
        portalGroup.visible = true;
      }
    },

    setOpacity(opacity) {
      ribbonMat.uniforms.uOpacity.value = opacity * 0.88;
      milestoneRings.forEach(r => { r.mat.opacity = opacity * 0.45; });
      if (portalGroup.visible) {
        outerRingMat.opacity = opacity;
        innerRingMat.opacity = opacity;
        irisMat.uniforms.uOpacity.value = opacity * 0.28;
      }
    },

    update(delta, time, camera, _flightProgress = 0) {
      // 1. Idle rotation & Gate Opening
      if (portalGroup.visible) {
        outerRingMesh.rotation.z += delta * 0.22;
        innerRingMesh.rotation.z -= delta * 0.28;
        irisMesh.rotation.z += delta * 0.14;
        irisMat.uniforms.uTime.value = time;

        const minDim = Math.min(window.innerWidth, window.innerHeight);
        const baseScale = Math.min(1.0, Math.max(0.65, minDim / 760));

        if (gateOpening) {
          gateOpenProgress = Math.min(1.0, gateOpenProgress + delta * 0.95);
          const s = baseScale * (1.0 + gateOpenProgress * 2.8);
          portalGroup.scale.set(s, s, s);
          outerRingMat.emissiveIntensity = 0.85 + gateOpenProgress * 1.8;
          innerRingMat.emissiveIntensity = 0.95 + gateOpenProgress * 1.8;
          irisMat.uniforms.uOpacity.value = Math.max(0, 0.28 * (1.0 - gateOpenProgress));
        } else if (isIntroActive) {
          const breath = baseScale * (1.0 + Math.sin(time * 1.8) * 0.025);
          portalGroup.scale.set(breath, breath, breath);
        }
      }

      // 2. Warp Speed Ribbons & Milestones
      if (isWarpActive && camera) {
        ribbonMat.uniforms.uTime.value = time;
        ribbonMesh.position.set(0, 0, camera.position.z);

        // Position milestone rings along camera position
        milestoneGroup.position.copy(camera.position);
        milestoneGroup.quaternion.copy(camera.quaternion);
        milestoneRings.forEach((r, idx) => {
          r.mesh.rotation.z += delta * (0.35 + idx * 0.08);
          r.mesh.position.z += r.speed * delta;
          if (r.mesh.position.z > 60) r.mesh.position.z = -280;
        });
      }
    },

    dispose() {
      root.remove(portalGroup);
      root.remove(ribbonMesh);
      root.remove(milestoneGroup);
      scene.remove(root);

      outerRingGeo.dispose();
      outerRingMat.dispose();
      innerRingGeo.dispose();
      innerRingMat.dispose();
      nodeGeo.dispose();
      nodeMat.dispose();
      irisGeo.dispose();
      irisMat.dispose();

      ribbonBaseGeo.dispose();
      ribbonGeo.dispose();
      ribbonMat.dispose();

      milestoneRings.forEach(r => {
        r.mesh.geometry.dispose();
        r.mat.dispose();
      });
    }
  };
}
