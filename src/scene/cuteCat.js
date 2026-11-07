import * as THREE from 'three';

/**
 * Khao Hom's cat as a sleeping "loaf": paws tucked in, round and flat like a
 * bun, eyes closed, pink cheeks. Grey tabby with soft (blurred) stripes, white
 * blaze, white muzzle, chin and paw tips, pink nose. Faces +Z.
 * About 17 units wide and 12 tall.
 */

function softTabbyTexture({ base = '#9a9ba5', dark = '#6d6e79', stripes = 8, size = 512 } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size / 2;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // blurred, irregular stripes so they read as fur markings, not painted bands
  ctx.filter = 'blur(7px)';
  ctx.strokeStyle = dark;
  ctx.lineCap = 'round';
  for (let s = 0; s < stripes; s++) {
    const x0 = (s + 0.5) * (canvas.width / stripes);
    ctx.globalAlpha = 0.45 + Math.random() * 0.2;
    ctx.lineWidth = 12 + Math.random() * 10;
    ctx.beginPath();
    for (let y = canvas.height * 0.18; y <= canvas.height * 0.86; y += 6) {
      const x = x0 + Math.sin(y * 0.05 + s * 1.7) * 10;
      if (y === canvas.height * 0.18) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.filter = 'none';
  ctx.globalAlpha = 1;
  // fine fur speckle
  for (let i = 0; i < 4000; i++) {
    ctx.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(30,30,40,0.06)';
    ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1.5, 4);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

function blushTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(246, 150, 175, 0.9)');
  grad.addColorStop(0.55, 'rgba(246, 150, 175, 0.35)');
  grad.addColorStop(1, 'rgba(246, 150, 175, 0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function createCuteCat({ quality = 'high' } = {}) {
  const seg = quality === 'low' ? 28 : 48;
  const group = new THREE.Group();
  group.name = 'khaoHomCat';
  const disposables = [];
  const track = (x) => { disposables.push(x); return x; };

  const furMat = (map) => track(new THREE.MeshPhysicalMaterial({
    map, roughness: 0.9, metalness: 0,
    sheen: 1, sheenColor: new THREE.Color(0xf2efff), sheenRoughness: 0.5, envMapIntensity: 0.4
  }));
  const bodyMat = furMat(track(softTabbyTexture({ stripes: 9 })));
  const headMat = furMat(track(softTabbyTexture({ stripes: 6, base: '#9fa0aa', dark: '#73747f' })));
  const plainFur = track(new THREE.MeshPhysicalMaterial({
    color: 0x9a9ba5, roughness: 0.9, sheen: 1, sheenColor: new THREE.Color(0xf2efff), sheenRoughness: 0.5, envMapIntensity: 0.4
  }));
  const whiteMat = track(new THREE.MeshPhysicalMaterial({
    color: 0xfaf8f5, roughness: 0.88, sheen: 1, sheenColor: new THREE.Color(0xffffff), sheenRoughness: 0.45, envMapIntensity: 0.4
  }));
  const pinkMat = track(new THREE.MeshStandardMaterial({ color: 0xf0a3b0, roughness: 0.5 }));
  const earPink = track(new THREE.MeshStandardMaterial({ color: 0xeeb7c0, roughness: 0.7 }));
  const inkMat = track(new THREE.MeshStandardMaterial({ color: 0x3a3138, roughness: 0.6 }));
  const blushMat = track(new THREE.MeshBasicMaterial({ map: track(blushTexture()), transparent: true, depthWrite: false }));
  const whiskerMat = track(new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 }));

  const sphere = track(new THREE.SphereGeometry(1, seg, Math.round(seg * 0.7)));
  const blob = (mat, p, sc, parent, rot) => {
    const m = new THREE.Mesh(sphere, mat);
    m.position.set(...p);
    m.scale.set(...sc);
    if (rot) m.rotation.set(...rot);
    parent.add(m);
    return m;
  };

  // ---- loaf body (breathes from its base)
  const loaf = new THREE.Group();
  loaf.position.y = -5.6;
  group.add(loaf);
  blob(bodyMat, [0, 3.6, -1.2], [7.6, 4.0, 5.6], loaf);              // the bun
  blob(whiteMat, [0, 2.6, 3.4], [4.2, 2.8, 1.6], loaf);              // white chest
  // tucked front paws peeking out
  for (const side of [-1, 1]) {
    blob(whiteMat, [side * 1.9, 0.75, 4.15], [1.35, 0.8, 1.15], loaf);
    for (const t of [-0.45, 0, 0.45]) blob(pinkMat, [side * 1.9 + t, 0.55, 5.18], [0.16, 0.14, 0.08], loaf);
  }
  // tail wrapped along the front-right
  const tailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(6.6, 1.2, -3.8), new THREE.Vector3(7.4, 0.9, 0.2),
    new THREE.Vector3(5.8, 0.75, 3.4), new THREE.Vector3(3.5, 0.7, 4.6)
  ]);
  const tail = new THREE.Mesh(track(new THREE.TubeGeometry(tailCurve, 48, 0.95, 16, false)), plainFur);
  loaf.add(tail);
  blob(plainFur, [3.5, 0.7, 4.6], [0.95, 0.95, 0.95], loaf);

  // ---- head, resting low at the front of the loaf
  const head = new THREE.Group();
  head.position.set(0, 7.0, 1.6);
  loaf.add(head);
  blob(headMat, [0, 0, 0], [5.3, 4.3, 4.4], head);
  blob(headMat, [-2.9, -1.0, 1.3], [2.2, 1.9, 2.2], head);           // round cheeks
  blob(headMat, [2.9, -1.0, 1.3], [2.2, 1.9, 2.2], head);
  blob(whiteMat, [0, 0.9, 4.15], [0.38, 1.55, 0.45], head);          // blaze
  blob(whiteMat, [-0.85, -1.05, 3.95], [1.2, 0.95, 0.85], head);     // muzzle
  blob(whiteMat, [0.85, -1.05, 3.95], [1.2, 0.95, 0.85], head);
  blob(whiteMat, [0, -1.85, 3.55], [1.25, 0.8, 0.85], head);         // chin
  blob(pinkMat, [0, -0.35, 4.62], [0.46, 0.32, 0.3], head);           // nose

  const arc = track(new THREE.TorusGeometry(1, 0.15, 10, 28, Math.PI));
  const addArc = (p, r, rotY) => {
    const m = new THREE.Mesh(arc, inkMat);
    m.position.set(...p);
    m.scale.set(r, r, 1);
    m.rotation.set(0, rotY, Math.PI); // ∪ closed sleepy eyes / ω mouth
    head.add(m);
  };
  addArc([-1.95, 0.75, 4.12], 0.72, -0.38);
  addArc([1.95, 0.75, 4.12], 0.72, 0.38);
  addArc([-0.38, -0.92, 4.72], 0.38, 0);
  addArc([0.38, -0.92, 4.72], 0.38, 0);

  const blushGeo = track(new THREE.PlaneGeometry(2.4, 1.6));
  const whiskerGeo = track(new THREE.CylinderGeometry(0.03, 0.03, 3.2, 4));
  for (const side of [-1, 1]) {
    const b = new THREE.Mesh(blushGeo, blushMat);
    b.position.set(side * 3.05, -0.55, 3.62);
    b.rotation.y = side * 0.62;
    head.add(b);
    for (const k of [0, 1]) {
      const w = new THREE.Mesh(whiskerGeo, whiskerMat);
      w.position.set(side * 3.7, -0.95 - k * 0.42, 3.55);
      w.rotation.z = Math.PI / 2 + side * (0.06 + k * 0.12);
      w.rotation.y = side * 0.35;
      head.add(w);
    }
  }

  // ears
  const earGeo = track(new THREE.ConeGeometry(1.9, 2.9, 32));
  const ears = [];
  for (const side of [-1, 1]) {
    const ear = new THREE.Group();
    ear.position.set(side * 3.0, 3.4, 0.2);
    ear.rotation.z = -side * 0.42;
    ear.rotation.x = -0.1;
    head.add(ear);
    const outer = new THREE.Mesh(earGeo, headMat);
    outer.scale.z = 0.6;
    ear.add(outer);
    const inner = new THREE.Mesh(earGeo, earPink);
    inner.scale.set(0.56, 0.7, 0.28);
    inner.position.set(0, -0.25, 0.58);
    ear.add(inner);
    ears.push(ear);
  }

  group.scale.setScalar(0.95);
  group.position.y = 0.4;

  let twitchAt = 3;
  return {
    group,
    update(delta, time, reducedMotion = false) {
      if (reducedMotion) return;
      loaf.scale.y = 1 + Math.sin(time * 1.6) * 0.02;                  // breathing
      head.rotation.z = Math.sin(time * 0.6) * 0.05;                    // sleepy sway
      tail.rotation.y = Math.sin(time * 0.9) * 0.04;
      if (time > twitchAt) {                                            // the odd ear flick
        const t = time - twitchAt;
        const ear = ears[Math.floor(twitchAt) % 2];
        ear.rotation.x = -0.1 - Math.sin(Math.min(1, t / 0.32) * Math.PI) * 0.35;
        if (t > 0.32) { ear.rotation.x = -0.1; twitchAt = time + 3 + Math.random() * 4; }
      }
    },
    dispose() { disposables.forEach((d) => d.dispose?.()); }
  };
}
