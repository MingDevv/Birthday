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

  // Round 14: the gate is a spiral galaxy seen almost face-on. The camera dives
  // into its golden core instead of passing through neon rings.
  const tierName = qualityConfig?.tier || 'high';
  const galaxyCount = tierName === 'low' ? 9000 : tierName === 'medium' ? 18000 : 32000;
  const gPos = new Float32Array(galaxyCount * 3);
  const gCol = new Float32Array(galaxyCount * 3);
  const gSize = new Float32Array(galaxyCount);
  const gRand = new Float32Array(galaxyCount);
  const cCore = new THREE.Color(0xffd9a3);
  const cDisc = new THREE.Color(0xfff2e2);
  const cArm = new THREE.Color(0xc4d6ff);
  const cHalpha = new THREE.Color(0xff7aa8);
  const cViolet = new THREE.Color(0xb98cff);
  const GAL_R = 46;
  const arms = 2;
  for (let i = 0; i < galaxyCount; i++) {
    const bulge = Math.random() < 0.22;
    let x, y, z;
    const col = new THREE.Color();
    let size;
    if (bulge) {
      // old, warm, dense core
      const r = Math.pow(Math.random(), 2.2) * GAL_R * 0.32;
      const a = Math.random() * Math.PI * 2;
      x = Math.cos(a) * r; y = Math.sin(a) * r * 0.9; z = (Math.random() - 0.5) * (GAL_R * 0.28 - r * 0.6);
      col.copy(cCore).lerp(cDisc, r / (GAL_R * 0.32));
      size = 0.7 + Math.random() * 0.8;
    } else {
      // Exponential disc; ~65% of disc stars crowd the arms, the rest fill the disc
      const r = GAL_R * Math.min(1.15, 0.1 + -Math.log(1 - Math.random() * 0.97) * 0.3);
      const t = r / GAL_R;
      const arm = i % arms;
      const twist = Math.log(Math.max(r, 1.2) / (GAL_R * 0.07)) * 2.0;
      const inArm = Math.random() < 0.65;
      // gaussian-ish offset from the arm crest; arms widen outward
      const g = (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
      const spread = inArm ? g * (0.75 + 0.55 * t) : Math.random() * Math.PI * 2;
      const a = arm * Math.PI + twist + spread;
      x = Math.cos(a) * r; y = Math.sin(a) * r; z = (Math.random() - 0.5) * (2.4 - t * 1.4);
      col.copy(cDisc).lerp(cArm, Math.min(1, t * 1.4));
      // dust lane: just inside the leading edge of each arm, stars are dimmed and reddened
      const lane = inArm && spread > -0.55 && spread < -0.22 && t > 0.15;
      if (lane) col.multiplyScalar(0.18).lerp(new THREE.Color(0x3a2418), 0.4);
      const k = Math.random();
      if (inArm && !lane && Math.abs(spread) < 0.2 && t > 0.25 && k < 0.08) col.copy(cHalpha);
      else if (inArm && !lane && t > 0.3 && k < 0.025) col.copy(cViolet);
      size = 0.45 + Math.pow(Math.random(), 4) * 2.2;
      col.multiplyScalar((inArm ? 0.75 - Math.min(0.35, Math.abs(spread) * 0.3) : 0.5) + 0.4 * (1 - Math.min(1, t)));
    }
    gPos[i * 3] = x; gPos[i * 3 + 1] = y; gPos[i * 3 + 2] = z;
    col.toArray(gCol, i * 3);
    gSize[i] = size;
    gRand[i] = Math.random();
  }
  const galaxyGeo = new THREE.BufferGeometry();
  galaxyGeo.setAttribute('position', new THREE.BufferAttribute(gPos, 3));
  galaxyGeo.setAttribute('aColor', new THREE.BufferAttribute(gCol, 3));
  galaxyGeo.setAttribute('aSize', new THREE.BufferAttribute(gSize, 1));
  galaxyGeo.setAttribute('aRand', new THREE.BufferAttribute(gRand, 1));
  const galaxyMat = new THREE.ShaderMaterial({
    uniforms: {
      uOpacity: { value: 1 },
      uPx: { value: Math.min(window.devicePixelRatio || 1, 2) * 2.4 },
      uTime: { value: 0 }
    },
    vertexShader: `
      attribute vec3 aColor;
      attribute float aSize;
      attribute float aRand;
      uniform float uPx;
      uniform float uTime;
      varying vec3 vColor;
      varying float vTw;
      void main() {
        vColor = aColor;
        vTw = 0.8 + 0.2 * sin(uTime * (1.5 + aRand * 3.0) + aRand * 40.0);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = clamp(uPx * aSize * (60.0 / -mv.z), 1.0, 28.0);
      }
    `,
    fragmentShader: `
      uniform float uOpacity;
      varying vec3 vColor;
      varying float vTw;
      void main() {
        float d = length(gl_PointCoord - 0.5) * 2.0;
        if (d > 1.0) discard;
        float a = (exp(-d * d * 5.0) + exp(-d * 3.0) * 0.25) * uOpacity * vTw;
        gl_FragColor = vec4(vColor * a, a);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const galaxyPoints = new THREE.Points(galaxyGeo, galaxyMat);
  galaxyPoints.frustumCulled = false;
  const galaxyDisc = new THREE.Group();
  galaxyDisc.rotation.x = -0.62;
  galaxyDisc.rotation.y = 0.18;
  galaxyDisc.add(galaxyPoints);
  portalGroup.add(galaxyDisc);

  // Warm core glow
  const coreCanvas = document.createElement('canvas');
  coreCanvas.width = coreCanvas.height = 256;
  const cctx = coreCanvas.getContext('2d');
  const cg = cctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  cg.addColorStop(0, 'rgba(255, 244, 225, 1)');
  cg.addColorStop(0.12, 'rgba(255, 214, 160, 0.55)');
  cg.addColorStop(0.4, 'rgba(200, 160, 120, 0.12)');
  cg.addColorStop(1, 'rgba(0, 0, 0, 0)');
  cctx.fillStyle = cg;
  cctx.fillRect(0, 0, 256, 256);
  const coreTex = new THREE.CanvasTexture(coreCanvas);
  coreTex.colorSpace = THREE.SRGBColorSpace;
  const coreMat = new THREE.SpriteMaterial({ map: coreTex, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
  const coreSprite = new THREE.Sprite(coreMat);
  coreSprite.scale.setScalar(34);
  portalGroup.add(coreSprite);

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
    const width = 0.12 + Math.random() * 0.2;
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

        vec3 blue = vec3(0.70, 0.79, 1.0);
        vec3 warm = vec3(1.0, 0.90, 0.76);
        vec3 violet = vec3(0.73, 0.55, 1.0);
        vec3 white = vec3(1.0, 1.0, 1.0);

        vec3 baseCol = vColorType > 1.5 ? violet : (vColorType > 0.5 ? warm : blue);
        vec3 color = mix(baseCol * 0.7, white, smoothstep(0.55, 1.0, headToTail));

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
  const milestoneCount = 0; // Round 14: no neon rings in the tunnel
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
      galaxyMat.uniforms.uOpacity.value = 1;
      coreMat.opacity = 0.9;
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
        ribbonMat.uniforms.uOpacity.value = 0.6;
        milestoneRings.forEach(r => { r.mat.opacity = 0.45; });
        portalGroup.visible = true;
      }
    },

    setOpacity(opacity) {
      ribbonMat.uniforms.uOpacity.value = opacity * 0.6;
      milestoneRings.forEach(r => { r.mat.opacity = opacity * 0.45; });
      if (portalGroup.visible) {
        galaxyMat.uniforms.uOpacity.value = opacity;
        coreMat.opacity = opacity * 0.9;
      }
    },

    update(delta, time, camera, _flightProgress = 0) {
      // 1. Idle rotation & Gate Opening
      if (portalGroup.visible) {
        galaxyPoints.rotation.z += delta * (gateOpening ? 0.22 : 0.05);
        galaxyMat.uniforms.uTime.value = time;

        const minDim = Math.min(window.innerWidth, window.innerHeight);
        const baseScale = Math.min(1.0, Math.max(0.65, minDim / 760));

        if (gateOpening) {
          gateOpenProgress = Math.min(1.0, gateOpenProgress + delta * 0.95);
          const s = baseScale * (1.0 + gateOpenProgress * 2.8);
          portalGroup.scale.set(s, s, s);
          coreMat.opacity = 0.9 + gateOpenProgress * 0.6;
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

      galaxyGeo.dispose();
      galaxyMat.dispose();
      coreTex.dispose();
      coreMat.dispose();

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
