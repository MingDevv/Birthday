import * as THREE from 'three';

/**
 * Khao Hom's cat, as a small round 3D figure for the centre of the universe.
 * Modelled on her grey tabby: white blaze down the nose, white chin, chest,
 * belly and socks, pink nose and toe beans, chubby round face, eyes closed in a
 * happy sleepy squint with pink cheeks. Faces +Z. Roughly 16 units tall.
 */

function createTabbyTexture({ stripes = 9, base = '#8f9099', dark = '#5d5e69', width = 512, height = 256 } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, width, height);
  // soft fur speckle
  for (let i = 0; i < 2600; i++) {
    const shade = Math.random() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(40,40,50,0.07)';
    ctx.fillStyle = shade;
    ctx.fillRect(Math.random() * width, Math.random() * height, 2, 5);
  }
  // wavy tabby stripes running from top to bottom of each part
  ctx.strokeStyle = dark;
  ctx.lineCap = 'round';
  for (let s = 0; s < stripes; s++) {
    const x0 = (s + 0.5) * (width / stripes);
    ctx.lineWidth = 9 + Math.random() * 7;
    ctx.globalAlpha = 0.55 + Math.random() * 0.25;
    ctx.beginPath();
    for (let y = height * 0.08; y <= height * 0.92; y += 8) {
      const x = x0 + Math.sin(y * 0.045 + s) * 9;
      if (y === height * 0.08) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

export function createCuteCat({ quality = 'high' } = {}) {
  const seg = quality === 'low' ? 24 : 40;
  const group = new THREE.Group();
  group.name = 'khaoHomCat';

  const disposables = [];
  const track = (thing) => { disposables.push(thing); return thing; };
  const fur = (texture) => track(new THREE.MeshPhysicalMaterial({
    map: texture, color: 0xffffff, roughness: 0.82, metalness: 0,
    sheen: 1, sheenColor: new THREE.Color(0xf4f1ff), sheenRoughness: 0.55, envMapIntensity: 0.45
  }));
  const bodyTex = track(createTabbyTexture({ stripes: 10 }));
  const headTex = track(createTabbyTexture({ stripes: 7, base: '#94959e', dark: '#686974' }));
  const tailTex = track(createTabbyTexture({ stripes: 1, base: '#8a8b95', dark: '#5d5e69', width: 64, height: 256 }));
  tailTex.rotation = Math.PI / 2;
  tailTex.repeat.set(1, 6);
  tailTex.wrapT = THREE.RepeatWrapping;

  const bodyMat = fur(bodyTex);
  const headMat = fur(headTex);
  const tailMat = fur(tailTex);
  const whiteMat = track(new THREE.MeshPhysicalMaterial({
    color: 0xf7f4f1, roughness: 0.85, sheen: 1, sheenColor: new THREE.Color(0xffffff), sheenRoughness: 0.5, envMapIntensity: 0.45
  }));
  const pinkMat = track(new THREE.MeshStandardMaterial({ color: 0xeba3ad, roughness: 0.55 }));
  const innerEarMat = track(new THREE.MeshStandardMaterial({ color: 0xe9b1b9, roughness: 0.7 }));
  const inkMat = track(new THREE.MeshStandardMaterial({ color: 0x3b3239, roughness: 0.6 }));
  const blushMat = track(new THREE.MeshBasicMaterial({ color: 0xf2a2b6, transparent: true, opacity: 0.8, depthWrite: false }));
  const whiskerMat = track(new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75 }));

  const sphere = track(new THREE.SphereGeometry(1, seg, Math.round(seg * 0.7)));
  const blob = (mat, [x, y, z], [sx, sy, sz], parent = group) => {
    const m = new THREE.Mesh(sphere, mat);
    m.position.set(x, y, z);
    m.scale.set(sx, sy, sz);
    parent.add(m);
    return m;
  };

  // ---- body (a pivot so it can breathe from the floor up)
  const bodyPivot = new THREE.Group();
  bodyPivot.position.y = -9.6;
  group.add(bodyPivot);
  const body = new THREE.Group();
  body.position.y = 9.6;
  bodyPivot.add(body);
  blob(bodyMat, [0, -4.6, 0], [6.9, 5.0, 5.8], body);
  blob(whiteMat, [0, -4.9, 3.4], [4.3, 3.9, 2.8], body);          // white chest and belly
  // front paws (white socks) with pink toe beans
  for (const side of [-1, 1]) {
    const paw = blob(whiteMat, [side * 1.9, -8.75, 4.2], [1.45, 1.05, 1.6], body);
    blob(pinkMat, [side * 1.9, -8.75, 5.75], [0.42, 0.34, 0.2], body);
    for (const t of [-0.55, 0, 0.55]) blob(pinkMat, [side * 1.9 + t, -8.15, 5.6], [0.2, 0.2, 0.14], body);
    paw.name = 'catPaw';
    blob(whiteMat, [side * 4.4, -9.0, 1.4], [1.7, 1.0, 2.0], body);  // hind feet
  }

  // ---- tail curled around the right side
  const tailPivot = new THREE.Group();
  tailPivot.position.set(3.8, -8.6, -3.2);
  body.add(tailPivot);
  const tailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0), new THREE.Vector3(2.8, 0.2, 1.4), new THREE.Vector3(3.9, 0.5, 4.6), new THREE.Vector3(2.8, 1.0, 7.4)
  ]);
  const tailGeo = track(new THREE.TubeGeometry(tailCurve, 48, 1.0, 16, false));
  tailPivot.add(new THREE.Mesh(tailGeo, tailMat));
  blob(tailMat, [2.8, 1.0, 7.4], [1.0, 1.0, 1.0], tailPivot);       // round tail tip

  // ---- head
  const head = new THREE.Group();
  head.position.set(0, 2.9, 0.9);
  body.add(head);
  blob(headMat, [0, 0, 0], [6.1, 4.8, 4.9], head);
  blob(whiteMat, [0, 0.7, 4.55], [0.42, 1.75, 0.5], head);          // blaze down the forehead
  blob(whiteMat, [-0.95, -1.15, 4.15], [1.35, 1.05, 0.95], head);   // muzzle
  blob(whiteMat, [0.95, -1.15, 4.15], [1.35, 1.05, 0.95], head);
  blob(whiteMat, [0, -2.05, 3.8], [1.5, 1.0, 1.0], head);           // chin
  blob(pinkMat, [0, -0.35, 4.95], [0.5, 0.36, 0.32], head);          // nose

  const arc = track(new THREE.TorusGeometry(1, 0.13, 8, 24, Math.PI));
  const addArc = (mat, [x, y, z], r, rotY = 0, thick = 1) => {
    const m = new THREE.Mesh(arc, mat);
    m.position.set(x, y, z);
    m.scale.set(r, r, thick);
    m.rotation.set(0, rotY, Math.PI); // ∪ : closed, happy, sleepy
    head.add(m);
    return m;
  };
  addArc(inkMat, [-2.0, 0.95, 4.66], 0.78, -0.36);                     // closed eyes
  addArc(inkMat, [2.0, 0.95, 4.66], 0.78, 0.36);
  addArc(inkMat, [-0.42, -0.95, 5.0], 0.42, 0);                        // ω mouth
  addArc(inkMat, [0.42, -0.95, 5.0], 0.42, 0);

  const blushGeo = track(new THREE.CircleGeometry(1.0, 24));
  for (const side of [-1, 1]) {
    const b = new THREE.Mesh(blushGeo, blushMat);
    b.position.set(side * 3.25, -0.3, 4.26);
    b.rotation.y = side * 0.72;
    head.add(b);
    // whiskers
    for (const k of [0, 1]) {
      const w = new THREE.Mesh(track(new THREE.CylinderGeometry(0.035, 0.035, 3.4, 4)), whiskerMat);
      w.position.set(side * 3.6, -0.75 - k * 0.45, 4.0);
      w.rotation.z = Math.PI / 2 + side * (0.08 + k * 0.12);
      w.rotation.y = side * 0.4;
      head.add(w);
    }
  }

  // ears
  const earGeo = track(new THREE.ConeGeometry(2.1, 3.4, 24));
  const ears = [];
  for (const side of [-1, 1]) {
    const ear = new THREE.Group();
    ear.position.set(side * 3.3, 4.1, 0.4);
    ear.rotation.z = -side * 0.38;
    head.add(ear);
    const outer = new THREE.Mesh(earGeo, headMat);
    outer.scale.z = 0.62;
    ear.add(outer);
    const inner = new THREE.Mesh(earGeo, innerEarMat);
    inner.scale.set(0.58, 0.72, 0.3);
    inner.position.set(0, -0.2, 0.62);
    ear.add(inner);
    ears.push(ear);
  }

  group.scale.setScalar(0.82);
  group.position.y = 1.2;

  let twitchAt = 3;
  return {
    group,
    update(delta, time, reducedMotion = false) {
      if (reducedMotion) return;
      bodyPivot.scale.y = 1 + Math.sin(time * 1.7) * 0.022;              // breathing
      head.rotation.z = Math.sin(time * 0.7) * 0.06;                       // sleepy sway
      head.rotation.x = 0.05 + Math.sin(time * 0.55) * 0.03;
      tailPivot.rotation.y = Math.sin(time * 1.1) * 0.18;                  // lazy tail
      if (time > twitchAt) {                                               // the odd ear flick
        const t = time - twitchAt;
        const ear = ears[Math.floor(twitchAt) % 2];
        ear.rotation.x = Math.sin(Math.min(1, t / 0.35) * Math.PI) * -0.35;
        if (t > 0.35) { ear.rotation.x = 0; twitchAt = time + 3 + Math.random() * 4; }
      }
    },
    dispose() {
      disposables.forEach((d) => d.dispose?.());
    }
  };
}
