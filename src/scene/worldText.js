import * as THREE from 'three';

export function createWorldText(scene, { text, font = '700 96px Prompt', color = '#fff3fc', outline = true, width = 42, height = 7, position = new THREE.Vector3(0, 14, -8) } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 384;
  const context = canvas.getContext('2d');
  context.scale(2, 2);
  context.font = font;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.lineJoin = 'round';
  if (outline) {
    context.lineWidth = 9;
    context.strokeStyle = 'rgba(24, 9, 38, .9)';
    context.strokeText(text, 512, 96, 1000);
  }
  context.fillStyle = color;
  context.fillText(text, 512, 96, 1000);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 2;
  const geometry = new THREE.PlaneGeometry(width, height);
  const material = new THREE.ShaderMaterial({
    uniforms: { uMap: { value: texture }, uReveal: { value: 0 }, uOpacity: { value: 1 } },
    vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: `uniform sampler2D uMap; uniform float uReveal; uniform float uOpacity; varying vec2 vUv;
      void main(){ vec4 color=texture2D(uMap,vUv); float edge=smoothstep(uReveal-0.035,uReveal+0.035,vUv.x); color.a*=edge*uOpacity; if(color.a<0.01) discard; gl_FragColor=color; }`,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false
  });
  const object3D = new THREE.Mesh(geometry, material);
  object3D.name = 'worldText';
  object3D.position.copy(position);
  object3D.visible = false;
  scene.add(object3D);
  let mode = 'idle';
  let duration = 0.45;
  let elapsed = 0;
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    scene.remove(object3D);
    geometry.dispose();
    texture.dispose();
    material.dispose();
  };
  return {
    object3D,
    show(seconds = 0.45) {
      if (disposed) return;
      duration = Math.max(.01, seconds);
      elapsed = 0;
      mode = 'show';
      object3D.visible = true;
      material.uniforms.uReveal.value = 0;
      material.uniforms.uOpacity.value = 1;
    },
    update(delta, camera, reducedMotion = false) {
      if (disposed) return;
      if (camera) object3D.quaternion.copy(camera.quaternion);
      if (mode === 'idle') return;
      elapsed += delta;
      const progress = reducedMotion ? 1 : Math.min(1, elapsed / duration);
      if (mode === 'show') {
        material.uniforms.uReveal.value = progress;
        if (progress >= 1) mode = 'shown';
      } else {
        material.uniforms.uOpacity.value = 1 - progress;
        if (progress >= 1) dispose();
      }
    },
    hide(seconds = .28) {
      if (disposed) return;
      if (seconds <= 0) { dispose(); return; }
      elapsed = 0;
      duration = seconds;
      mode = 'hide';
    },
    dispose,
    get disposed() { return disposed; }
  };
}
