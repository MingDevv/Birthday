import * as THREE from 'three';

export function createWormhole(scene) {
  const geometry = new THREE.CylinderGeometry(34, 34, 900, 48, 96, true);
  geometry.rotateX(Math.PI / 2);

  const material = new THREE.ShaderMaterial({
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
        float spiral = sin(angle * 5.0 + vUv.y * 22.0 - uTime * 2.2);
        float filament = smoothstep(0.72, 0.98, spiral) * 0.42;
        float bands = 0.5 + 0.5 * sin(vUv.y * 38.0 - uTime * 3.0 + sin(angle * 3.0) * 1.7);
        float glow = filament + bands * 0.10;
        vec3 violet = vec3(0.30, 0.08, 0.82);
        vec3 magenta = vec3(0.78, 0.12, 0.62);
        vec3 cyan = vec3(0.08, 0.46, 0.70);
        vec3 color = mix(violet, magenta, smoothstep(0.05, 0.75, vUv.y));
        color = mix(color, cyan, smoothstep(0.72, 1.0, bands) * 0.24);
        float endFade = smoothstep(0.0, 0.08, vUv.y) * (1.0 - smoothstep(0.92, 1.0, vUv.y));
        float alpha = glow * endFade * uStrength;
        if (alpha < 0.015) discard;
        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending
  });

  const tunnel = new THREE.Mesh(geometry, material);
  tunnel.name = 'proceduralWormhole';
  tunnel.visible = false;
  tunnel.renderOrder = 2;
  scene.add(tunnel);

  return {
    setActive(active) {
      tunnel.visible = active;
      if (!active) material.uniforms.uStrength.value = 0;
    },
    update(time, camera, active, progress = 0) {
      if (!active) return;
      tunnel.position.copy(camera.position);
      tunnel.quaternion.copy(camera.quaternion);
      material.uniforms.uTime.value = time;
      material.uniforms.uStrength.value = Math.min(0.22, 0.06 + Math.sin(progress * Math.PI) * 0.16);
    }
  };
}
