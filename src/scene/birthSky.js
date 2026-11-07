/**
 * Birth Sky — the real night sky over Chiang Rai on 13 January 2011 (Khao Hom's birthday).
 *
 * A self-contained view with its own renderer, opened from the epilogue. Star positions come from
 * the Hipparcos catalogue (via d3-celestial), the Moon, Sun and planets were precomputed with
 * astronomy-engine for every hour of that night (public/data/birth-sky.json). Nobody knows the
 * birth time, so the visitor scrubs through the whole night, 18:00 → 06:00.
 */
import * as THREE from 'three';

const DATA_URL = `${import.meta.env.BASE_URL}data/birth-sky.json`;
const MOON_URL = `${import.meta.env.BASE_URL}textures/planets/2k_moon.jpg`;
const DEG = Math.PI / 180;
const SKY_R = 1000;
const ACCENT = new THREE.Color(0xb98cff);
const PLEIADES = { ra: 56.87, dec: 24.12 };
const DEFAULT_MINUTE = 120; // 20:00

const CONSTELLATION_TH = {
  Ori: 'นายพราน', Tau: 'วัว', Gem: 'คนคู่', CMa: 'สุนัขใหญ่', CMi: 'สุนัขเล็ก', Aur: 'สารถี',
  Per: 'เพอร์ซิอุส', Cas: 'แคสซิโอเปีย', And: 'แอนดรอเมดา', Peg: 'ม้าบิน', Ari: 'แกะ', Psc: 'ปลา',
  Cet: 'ปลาวาฬ', Eri: 'แม่น้ำ', Lep: 'กระต่ายป่า', Cnc: 'ปู', Leo: 'สิงโต', UMa: 'หมีใหญ่',
  Pup: 'ท้ายเรือ', Cep: 'เซฟิอุส', Car: 'กระดูกงูเรือ', Vir: 'หญิงสาว', Boo: 'คนเลี้ยงสัตว์',
  Sco: 'แมงป่อง', Cyg: 'หงส์', Lyr: 'พิณ', Aql: 'นกอินทรี', Dra: 'มังกร', Sgr: 'คนยิงธนู',
  Her: 'เฮอร์คิวลีส', Cen: 'คนครึ่งม้า', Cru: 'กางเขนใต้', Hya: 'งูไฮดรา', Col: 'นกพิราบ', Phe: 'นกฟีนิกซ์'
};
const STAR_TH = {
  Sirius: 'ซิริอุส', Canopus: 'คาโนปุส', Arcturus: 'อาร์คทุรุส', Vega: 'เวกา', Capella: 'คาเพลลา',
  Rigel: 'ไรเจล', Procyon: 'โปรซีออน', Betelgeuse: 'บีเทลจุส', Achernar: 'อาเคอร์นาร์',
  Aldebaran: 'ดาวโรหิณี', Altair: 'อัลแทร์', Antares: 'แอนทาเรส', Spica: 'สไปกา', Pollux: 'พอลลักซ์',
  Fomalhaut: 'โฟมัลฮอต', Deneb: 'เดเนบ', Regulus: 'เรกูลัส', Castor: 'แคสเตอร์'
};
const PLANET_TH = { Mercury: 'ดาวพุธ', Venus: 'ดาวศุกร์', Mars: 'ดาวอังคาร', Jupiter: 'ดาวพฤหัสบดี', Saturn: 'ดาวเสาร์' };
const COMPASS = [
  { az: 0, label: 'เหนือ' }, { az: 90, label: 'ตะวันออก' }, { az: 180, label: 'ใต้' }, { az: 270, label: 'ตะวันตก' }
];

// J2000 equatorial → galactic
const EQ_TO_GAL = new THREE.Matrix3().set(
  -0.0548755604, -0.8734370902, -0.4838350155,
  0.4941094279, -0.44482963, 0.7469822445,
  -0.867666149, -0.1980763734, 0.4559837762
);

function eqVector(raDeg, decDeg, r = 1, out = new THREE.Vector3()) {
  const ra = raDeg * DEG, dec = decDeg * DEG;
  return out.set(Math.cos(dec) * Math.cos(ra) * r, Math.cos(dec) * Math.sin(ra) * r, Math.sin(dec) * r);
}

// B−V colour index → star colour (blackbody-ish, tuned for screens)
const BV_STOPS = [
  [-0.4, [0.61, 0.70, 1.00]], [0.0, [0.79, 0.85, 1.00]], [0.3, [0.95, 0.96, 1.00]], [0.6, [1.00, 0.95, 0.86]],
  [0.9, [1.00, 0.87, 0.70]], [1.3, [1.00, 0.77, 0.53]], [1.8, [1.00, 0.66, 0.40]], [2.2, [1.00, 0.58, 0.32]]
];
function bvColor(bv) {
  const v = THREE.MathUtils.clamp(bv, -0.4, 2.2);
  for (let i = 1; i < BV_STOPS.length; i++) {
    const [b1, c1] = BV_STOPS[i];
    if (v <= b1) {
      const [b0, c0] = BV_STOPS[i - 1];
      const t = (v - b0) / (b1 - b0);
      return [0, 1, 2].map((k) => c0[k] + (c1[k] - c0[k]) * t);
    }
  }
  return BV_STOPS.at(-1)[1];
}

function gmstDeg(date) {
  const jd = date.getTime() / 86400000 + 2440587.5;
  const d = jd - 2451545.0;
  return ((280.46061837 + 360.98564736629 * d) % 360 + 360) % 360;
}

function lerpAngle(a, b, t) {
  let d = b - a;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return a + d * t;
}

const STAR_VERT = /* glsl */`
  attribute float aSize;
  attribute float aPhase;
  attribute vec3 aColor;
  uniform float uPixelRatio;
  uniform float uZoom;
  uniform float uTime;
  uniform float uTwinkle;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec3 worldDir = normalize((modelMatrix * vec4(position, 0.0)).xyz);
    float alt = worldDir.y;
    // atmospheric extinction + reddening near the horizon
    float ext = smoothstep(-0.01, 0.22, alt);
    float tw = 1.0 + uTwinkle * (0.10 + 0.45 * (1.0 - smoothstep(0.0, 0.6, alt)))
      * sin(uTime * (3.0 + aPhase * 5.0) + aPhase * 40.0) * sin(uTime * 1.7 + aPhase * 13.0);
    vColor = mix(aColor * vec3(1.0, 0.82, 0.66), aColor, smoothstep(0.0, 0.3, alt));
    vAlpha = ext * tw;
    vec4 mv = viewMatrix * modelMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uPixelRatio * uZoom * (0.7 + 0.3 * ext);
  }
`;
const STAR_FRAG = /* glsl */`
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    if (d > 1.0) discard;
    float core = exp(-d * d * 7.0);
    float halo = exp(-d * 3.2) * 0.35;
    gl_FragColor = vec4(vColor * (core + halo), (core + halo) * vAlpha);
  }
`;

const SKY_VERT = /* glsl */`
  uniform mat3 uEqToGal;
  varying vec3 vGal;
  varying vec3 vWorld;
  void main() {
    vGal = uEqToGal * normalize(position);
    vWorld = normalize((modelMatrix * vec4(position, 0.0)).xyz);
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
  }
`;
const SKY_FRAG = /* glsl */`
  varying vec3 vGal;
  varying vec3 vWorld;
  float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float noise(vec3 x) {
    vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  float fbm(vec3 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }
  void main() {
    float alt = vWorld.y;
    // night-sky base: near-black zenith, faint airglow towards the horizon
    vec3 zenith = vec3(0.006, 0.007, 0.016);
    vec3 horizon = vec3(0.035, 0.032, 0.060);
    vec3 col = mix(horizon, zenith, smoothstep(0.0, 0.55, alt));
    // Milky Way: brighter towards the galactic centre (l = 0), dark rifts from noise
    float b = asin(clamp(vGal.z, -1.0, 1.0));
    float l = atan(vGal.y, vGal.x);
    float centre = 0.6 + 0.4 * pow(0.5 + 0.5 * cos(l), 2.0);
    float width = 0.13 + 0.07 * centre;
    float band = exp(-pow(b / width, 2.0));
    float clouds = fbm(vGal * 7.0);
    float rifts = smoothstep(0.42, 0.68, fbm(vGal * 13.0 + 4.0));
    float mw = band * (0.45 + 0.9 * clouds) * (1.0 - 0.65 * rifts * band) * centre;
    vec3 mwCol = mix(vec3(0.62, 0.64, 0.78), vec3(0.85, 0.78, 0.66), centre);
    col += mwCol * mw * 0.16 * smoothstep(-0.02, 0.25, alt);
    gl_FragColor = vec4(col, 1.0);
  }
`;

function ridgeHeight(azDeg) {
  // a low, irregular line of hills around the valley (degrees above the true horizon)
  const a = azDeg * DEG;
  let h = 1.2;
  h += 1.6 * Math.max(0, Math.sin(a * 2 + 0.6));
  h += 0.9 * Math.sin(a * 5 + 1.3) + 0.5 * Math.sin(a * 11 + 2.1) + 0.25 * Math.sin(a * 23 + 0.4);
  h += 2.6 * Math.exp(-Math.pow((((azDeg - 15 + 540) % 360) - 180) / 18, 2)); // the doi to the north
  return Math.max(0.4, h);
}

function createGround() {
  const SEG = 360;
  const positions = [];
  const R = 600;
  for (let i = 0; i <= SEG; i++) {
    const az = (i / SEG) * 360;
    const top = ridgeHeight(az) * DEG;
    const dir = (alt) => [Math.cos(alt) * Math.sin(az * DEG) * R, Math.sin(alt) * R, -Math.cos(alt) * Math.cos(az * DEG) * R];
    positions.push(...dir(top), ...dir(-80 * DEG));
  }
  const index = [];
  for (let i = 0; i < SEG; i++) {
    const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
    index.push(a, b, c, b, d, c);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(index);
  const mat = new THREE.MeshBasicMaterial({ color: 0x040307, side: THREE.DoubleSide });
  return new THREE.Mesh(geo, mat);
}

function createRingTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.strokeStyle = '#ffffff';
  g.lineWidth = 3;
  g.beginPath();
  g.arc(64, 64, 56, 0, Math.PI * 2);
  g.stroke();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function formatClock(minute) {
  const total = (18 * 60 + Math.round(minute)) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export function createBirthSky({ reducedMotion = false, onOpen = () => {}, onClose = () => {} } = {}) {
  let built = null;
  let open = false;
  let raf = 0;

  async function build() {
    const data = await fetch(DATA_URL).then((r) => {
      if (!r.ok) throw new Error(`birth sky data ${r.status}`);
      return r.json();
    });

    const root = document.createElement('section');
    root.className = 'birth-sky';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-labelledby', 'birth-sky-title');
    root.innerHTML = `
      <canvas class="bs-canvas" aria-hidden="true"></canvas>
      <div class="bs-labels" aria-hidden="true"></div>
      <header class="bs-head">
        <h2 id="birth-sky-title"><span class="bs-nw">ท้องฟ้าคืนที่</span><span class="bs-nw">ข้าวหอมเกิด</span></h2>
        <p>13 มกราคม 2554 · มองจากเชียงราย ดาวทุกดวงอยู่ตรงตำแหน่งจริงของคืนนั้น</p>
      </header>
      <button type="button" class="bs-close">กลับสู่จักรวาล</button>
      <aside class="bs-note" aria-live="polite">
        <h3>ดาวลูกไก่</h3>
        <p>คืนนั้นดาวลูกไก่ลอยอยู่เหนือเชียงราย สูงจากขอบฟ้า <strong class="bs-pleiades-alt">80°</strong> เกือบกลางฟ้าพอดี ให้เป็นดาวของข้าวหอมนะ</p>
      </aside>
      <button type="button" class="bs-guide-start">วิธีหาดาวลูกไก่บนฟ้าจริง</button>
      <aside class="bs-guide" hidden aria-live="polite">
        <p class="bs-guide-step"></p>
        <h3 class="bs-guide-title"></h3>
        <div class="bs-guide-body"></div>
        <div class="bs-guide-actions">
          <button type="button" class="bs-guide-prev">ย้อนกลับ</button>
          <button type="button" class="bs-guide-next">ต่อไป</button>
        </div>
      </aside>
      <div class="bs-time">
        <output class="bs-clock" for="bs-range">20:00</output>
        <label for="bs-range">เลื่อนดูทั้งคืน</label>
        <input id="bs-range" type="range" min="0" max="720" step="5" value="${DEFAULT_MINUTE}" aria-valuetext="20:00 น.">
        <div class="bs-ends"><span>18:00</span><span>เที่ยงคืน</span><span>06:00</span></div>
      </div>
      <p class="bs-credit">ตำแหน่งดาว: Hipparcos ผ่าน d3-celestial (BSD) · ดวงจันทร์และดาวเคราะห์: astronomy-engine (MIT)</p>
    `;
    document.body.appendChild(root);

    const canvas = root.querySelector('.bs-canvas');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020205);
    const camera = new THREE.PerspectiveCamera(72, 1, 0.1, 3000);
    camera.rotation.order = 'YXZ';

    // Celestial group: children live in J2000 equatorial coords; its matrix turns the sky for the hour.
    const sky = new THREE.Group();
    sky.matrixAutoUpdate = false;
    scene.add(sky);

    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(SKY_R * 1.2, 96, 48),
      new THREE.ShaderMaterial({
        vertexShader: SKY_VERT,
        fragmentShader: SKY_FRAG,
        uniforms: { uEqToGal: { value: EQ_TO_GAL } },
        side: THREE.BackSide,
        depthWrite: false
      })
    );
    dome.renderOrder = -2;
    sky.add(dome);

    // Stars
    const n = data.stars.length / 4;
    const pos = new Float32Array(n * 3), size = new Float32Array(n), col = new Float32Array(n * 3), phase = new Float32Array(n);
    const v = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      const [ra, dec, mag, bv] = data.stars.slice(i * 4, i * 4 + 4);
      eqVector(ra, dec, SKY_R, v).toArray(pos, i * 3);
      const bright = THREE.MathUtils.clamp((6.3 - mag) / 7.8, 0, 1);
      size[i] = 3.2 + 22.0 * Math.pow(bright, 2.2);
      const c = bvColor(bv);
      const lum = 0.55 + 0.75 * Math.pow(bright, 0.8);
      const sat = 0.55 + 0.45 * bright; // faint stars read whiter
      for (let k = 0; k < 3; k++) col[i * 3 + k] = (1 - sat + sat * c[k]) * lum;
      phase[i] = Math.random();
    }
    const starUniforms = {
      uPixelRatio: { value: renderer.getPixelRatio() },
      uZoom: { value: 1 },
      uTime: { value: 0 },
      uTwinkle: { value: reducedMotion ? 0 : 1 }
    };
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    starGeo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    starGeo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
    starGeo.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
    const starMat = new THREE.ShaderMaterial({
      vertexShader: STAR_VERT, fragmentShader: STAR_FRAG, uniforms: starUniforms,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
    });
    sky.add(new THREE.Points(starGeo, starMat));

    // Constellation lines, revealed one figure after another
    const linePos = [], lineReveal = [];
    const labelSpecs = [];
    const figures = [...data.constellations].sort((a, b) => (CONSTELLATION_TH[b.id] ? 1 : 0) - (CONSTELLATION_TH[a.id] ? 1 : 0));
    figures.forEach((fig, fi) => {
      const reveal = fi / figures.length;
      const centroid = new THREE.Vector3();
      let count = 0;
      for (const seg of fig.lines) {
        for (let i = 0; i < seg.length - 1; i++) {
          const a = eqVector(seg[i][0], seg[i][1], SKY_R * 0.99);
          const b = eqVector(seg[i + 1][0], seg[i + 1][1], SKY_R * 0.99);
          linePos.push(a.x, a.y, a.z, b.x, b.y, b.z);
          lineReveal.push(reveal, reveal);
          centroid.add(a).add(b);
          count += 2;
        }
      }
      if (CONSTELLATION_TH[fig.id] && count) {
        labelSpecs.push({ kind: 'constellation', text: CONSTELLATION_TH[fig.id], local: centroid.divideScalar(count).setLength(SKY_R * 0.98) });
      }
    });
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePos, 3));
    lineGeo.setAttribute('aReveal', new THREE.Float32BufferAttribute(lineReveal, 1));
    const lineUniforms = { uReveal: { value: 0 } };
    const lineMat = new THREE.ShaderMaterial({
      uniforms: lineUniforms,
      vertexShader: `attribute float aReveal; uniform float uReveal; varying float vA;
        void main(){ vec3 w = normalize((modelMatrix*vec4(position,0.)).xyz);
          vA = smoothstep(aReveal, aReveal + 0.12, uReveal) * smoothstep(0.0, 0.15, w.y);
          gl_Position = projectionMatrix*viewMatrix*modelMatrix*vec4(position,1.); }`,
      fragmentShader: `varying float vA; void main(){ gl_FragColor = vec4(0.82, 0.80, 0.92, 0.13 * vA); }`,
      transparent: true, depthWrite: false
    });
    sky.add(new THREE.LineSegments(lineGeo, lineMat));

    for (const s of data.named) {
      if (s.mag < 1.2 && STAR_TH[s.name]) labelSpecs.push({ kind: 'star', text: STAR_TH[s.name], local: eqVector(s.ra, s.dec, SKY_R) });
    }

    // Pleiades: Khao Hom's star
    const ringTex = createRingTexture();
    const ring = new THREE.Sprite(new THREE.SpriteMaterial({ map: ringTex, color: ACCENT, transparent: true, opacity: 0, depthWrite: false }));
    ring.position.copy(eqVector(PLEIADES.ra, PLEIADES.dec, SKY_R * 0.97));
    ring.scale.setScalar(64);
    sky.add(ring);
    labelSpecs.push({ kind: 'accent', text: 'ดาวลูกไก่', local: eqVector(PLEIADES.ra, PLEIADES.dec - 2.4, SKY_R) });

    // Star-hopping guide: Orion's belt → Aldebaran → the Pleiades
    const BELT = [[85.19, -1.94], [84.05, -1.2], [83.0, -0.3]];
    const ALDEBARAN = [68.98, 16.51];
    const beltCentre = [84.05, -1.2];
    const guideMat = new THREE.MeshBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.95, depthWrite: false, blending: THREE.AdditiveBlending });
    function arcTube(from, to, radius = 1.5) {
      const a = eqVector(from[0], from[1], 1), b = eqVector(to[0], to[1], 1);
      const pts = [];
      for (let i = 0; i <= 48; i++) {
        const t = i / 48;
        pts.push(new THREE.Vector3().copy(a).lerp(b, t).normalize().multiplyScalar(SKY_R * 0.985));
      }
      const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 96, radius, 6, false);
      const mesh = new THREE.Mesh(geo, guideMat);
      mesh.visible = false;
      sky.add(mesh);
      return { mesh, total: geo.index.count, progress: 0, target: 0 };
    }
    const guideArcs = {
      belt: arcTube(BELT[0], BELT[2], 3.2),
      leg1: arcTube(beltCentre, ALDEBARAN, 2.4),
      leg2: arcTube(ALDEBARAN, [PLEIADES.ra, PLEIADES.dec], 2.4)
    };
    const beltLabel = { kind: 'guide', text: 'เข็มขัดนายพราน', local: eqVector(84.05, -5.2, SKY_R) };
    const aldLabel = { kind: 'guide', text: 'ตาวัว', local: eqVector(ALDEBARAN[0] + 4.5, ALDEBARAN[1] + 1.2, SKY_R) };
    labelSpecs.push(beltLabel, aldLabel);
    const guideFocus = {
      belt: eqVector(84.05, -1.2, 1),
      aldebaran: eqVector(ALDEBARAN[0], ALDEBARAN[1], 1),
      between: eqVector(70, 12, 1),
      pleiades: eqVector(PLEIADES.ra, PLEIADES.dec - 8, 1),
      route: eqVector(71, 9, 1)
    };

    // Planets (bright points) and the Moon
    const planetPts = new Float32Array(5 * 3);
    const planetSize = new Float32Array(5), planetCol = new Float32Array(15), planetPhase = new Float32Array(5).fill(0.5);
    const planetGeo = new THREE.BufferGeometry();
    planetGeo.setAttribute('position', new THREE.BufferAttribute(planetPts, 3));
    planetGeo.setAttribute('aSize', new THREE.BufferAttribute(planetSize, 1));
    planetGeo.setAttribute('aColor', new THREE.BufferAttribute(planetCol, 3));
    planetGeo.setAttribute('aPhase', new THREE.BufferAttribute(planetPhase, 1));
    const planetPoints = new THREE.Points(planetGeo, new THREE.ShaderMaterial({
      vertexShader: STAR_VERT, fragmentShader: STAR_FRAG,
      uniforms: { ...starUniforms, uTwinkle: { value: 0 } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
    }));
    sky.add(planetPoints);
    const planetLabels = data.hourly[0].planets.map((p) => {
      const spec = { kind: 'planet', text: PLANET_TH[p.id], local: new THREE.Vector3() };
      labelSpecs.push(spec);
      return spec;
    });

    const moonTex = new THREE.TextureLoader().load(MOON_URL);
    moonTex.colorSpace = THREE.SRGBColorSpace;
    const moon = new THREE.Mesh(new THREE.SphereGeometry(5.6, 48, 32), new THREE.MeshStandardMaterial({ map: moonTex, roughness: 1, metalness: 0 }));
    scene.add(moon);
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = glowCanvas.height = 128;
    const gctx = glowCanvas.getContext('2d');
    const grad = gctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.25, 'rgba(255,255,255,0.35)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    gctx.fillStyle = grad;
    gctx.fillRect(0, 0, 128, 128);
    const moonGlow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(glowCanvas), color: 0xfff2dc, transparent: true, opacity: 0.32,
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
    moonGlow.scale.setScalar(80);
    scene.add(moonGlow);
    const sunLight = new THREE.DirectionalLight(0xfff4e6, 14);
    scene.add(sunLight, sunLight.target);
    scene.add(new THREE.AmbientLight(0x8890b0, 0.05)); // earthshine
    const moonLabel = { kind: 'planet', text: 'ดวงจันทร์', local: null, world: new THREE.Vector3() };
    labelSpecs.push(moonLabel);

    scene.add(createGround());

    // HTML labels
    const labelLayer = root.querySelector('.bs-labels');
    for (const spec of labelSpecs) {
      spec.el = document.createElement('span');
      spec.el.className = `bs-label bs-label--${spec.kind}`;
      spec.el.textContent = spec.text;
      labelLayer.appendChild(spec.el);
    }
    const compassEls = COMPASS.map((c) => {
      const el = document.createElement('span');
      el.className = 'bs-label bs-label--compass';
      el.textContent = c.label;
      labelLayer.appendChild(el);
      return { el, world: new THREE.Vector3(Math.sin(c.az * DEG) * 500, Math.tan(0.6 * DEG) * 500, -Math.cos(c.az * DEG) * 500) };
    });

    // View state
    const view = { az: 72, alt: 3, fov: 72, targetAz: 72, targetAlt: 3, vAz: 0, vAlt: 0 };
    let minute = DEFAULT_MINUTE;
    let introStart = performance.now();
    let introDone = reducedMotion;
    if (reducedMotion) { view.alt = view.targetAlt = 58; view.az = view.targetAz = 78; lineUniforms.uReveal.value = 1.2; }

    const tmp = new THREE.Vector3();
    const latR = data.site.lat * DEG;
    const horizonMatrix = new THREE.Matrix4().set(
      0, 1, 0, 0,
      Math.cos(latR), 0, Math.sin(latR), 0,
      Math.sin(latR), 0, -Math.cos(latR), 0,
      0, 0, 0, 1
    );
    const startMs = new Date(data.startUtc).getTime();
    const altEl = root.querySelector('.bs-pleiades-alt');

    function setMinute(m) {
      minute = m;
      const date = new Date(startMs + m * 60000);
      const lst = gmstDeg(date) + data.site.lon;
      sky.matrix.copy(horizonMatrix).multiply(new THREE.Matrix4().makeRotationZ(-lst * DEG));
      sky.matrixWorldNeedsUpdate = true;
      sky.updateMatrixWorld(true);

      const h = THREE.MathUtils.clamp(m / 60, 0, data.hourly.length - 1.0001);
      const i0 = Math.floor(h), t = h - i0;
      const a = data.hourly[i0], b = data.hourly[Math.min(i0 + 1, data.hourly.length - 1)];
      const radec = (p, q) => [lerpAngle(p.ra, q.ra, t), p.dec + (q.dec - p.dec) * t];

      a.planets.forEach((p, k) => {
        const [ra, dec] = radec(p, b.planets[k]);
        eqVector(ra, dec, SKY_R * 0.98, tmp).toArray(planetPts, k * 3);
        const bright = THREE.MathUtils.clamp((6.3 - p.mag) / 9.5, 0, 1);
        planetSize[k] = 5 + 30 * Math.pow(bright, 2);
        planetCol.set([1.0, 0.96, 0.88], k * 3);
        planetLabels[k].local.copy(eqVector(ra, dec - 2.2, SKY_R));
      });
      planetGeo.attributes.position.needsUpdate = true;
      planetGeo.attributes.aSize.needsUpdate = true;
      planetGeo.attributes.aColor.needsUpdate = true;

      const [mra, mdec] = radec(a.moon, b.moon);
      eqVector(mra, mdec, 500, tmp).applyMatrix4(sky.matrix);
      moon.position.copy(tmp);
      moon.lookAt(0, 0, 0);
      moonGlow.position.copy(tmp).multiplyScalar(1.02);
      moonLabel.world.copy(tmp).setLength(500);
      const [sra, sdec] = radec(a.sun, b.sun);
      eqVector(sra, sdec, 5000, tmp).applyMatrix4(sky.matrix);
      sunLight.position.copy(tmp);
      sunLight.target.position.copy(moon.position);

      const pl = eqVector(PLEIADES.ra, PLEIADES.dec, 1, tmp).applyMatrix4(sky.matrix);
      const plAlt = Math.round(Math.asin(THREE.MathUtils.clamp(pl.y, -1, 1)) / DEG);
      altEl.textContent = plAlt > 0 ? `${plAlt}°` : 'ใต้ขอบฟ้าแล้ว';
      range.setAttribute('aria-valuetext', `${formatClock(m)} น.`);
      clock.textContent = formatClock(m);
    }

    const range = root.querySelector('#bs-range');
    if (new URLSearchParams(window.location.search).has('qa')) window.__birthSky = { view, skipIntro: () => { introDone = true; } };
    const clock = root.querySelector('.bs-clock');
    range.addEventListener('input', () => setMinute(Number(range.value)));
    setMinute(DEFAULT_MINUTE);

    // Look around: drag, wheel/pinch zoom, arrow keys
    const pointers = new Map();
    let pinchDist = 0;
    canvas.addEventListener('pointerdown', (e) => {
      canvas.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      introDone = true;
    });
    canvas.addEventListener('pointermove', (e) => {
      const prev = pointers.get(e.pointerId);
      if (!prev) return;
      if (pointers.size === 2) {
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const [p, q] = [...pointers.values()];
        const dist = Math.hypot(p.x - q.x, p.y - q.y);
        if (pinchDist) view.fov = THREE.MathUtils.clamp(view.fov * (pinchDist / dist), 28, 95);
        pinchDist = dist;
        return;
      }
      const k = view.fov / canvas.clientHeight;
      view.targetAz -= (e.clientX - prev.x) * k;
      view.targetAlt = THREE.MathUtils.clamp(view.targetAlt + (e.clientY - prev.y) * k, -4, 89);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    });
    const release = (e) => { pointers.delete(e.pointerId); pinchDist = 0; };
    canvas.addEventListener('pointerup', release);
    canvas.addEventListener('pointercancel', release);
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      view.fov = THREE.MathUtils.clamp(view.fov * (1 + e.deltaY * 0.001), 28, 95);
    }, { passive: false });
    root.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { close(); return; }
      if (e.target === range) return;
      const step = { ArrowLeft: [-6, 0], ArrowRight: [6, 0], ArrowUp: [0, 5], ArrowDown: [0, -5] }[e.key];
      if (step) { introDone = true; view.targetAz += step[0]; view.targetAlt = THREE.MathUtils.clamp(view.targetAlt + step[1], -4, 89); }
    });
    root.querySelector('.bs-close').addEventListener('click', () => close());

    const GUIDE_STEPS = [
      {
        title: 'หาเข็มขัดนายพราน',
        body: '<p>หันไปทาง<strong>ทิศตะวันออก</strong> มองหาดาวสว่าง 3 ดวงเรียงกันเป็นเส้นตรง ห่างเท่าๆ กัน นี่คือเข็มขัดของกลุ่มดาวนายพราน หาง่ายที่สุดบนฟ้าเดือนมกราคม</p>',
        focus: 'belt', arcs: ['belt'], labels: [beltLabel]
      },
      {
        title: 'ลากเส้นไปหาดาวสีส้ม',
        body: '<p>ลากเส้นต่อจากเข็มขัด<strong>ขึ้นไปทางขวา</strong> จะเจอดาวสว่างสีส้มดวงหนึ่ง นั่นคือ<strong>ดาวโรหิณี</strong> ตาของกลุ่มดาววัว</p>',
        focus: 'between', arcs: ['belt', 'leg1'], labels: [beltLabel, aldLabel]
      },
      {
        title: 'ไปต่ออีกเท่าตัว เจอดาวลูกไก่',
        body: '<p>ลากเส้นเดิมต่อไปอีกประมาณเท่าตัว จะเจอกลุ่มดาวเล็กๆ เกาะกันเป็นฝ้าจางๆ นั่นแหละ<strong>ดาวลูกไก่</strong> ดาวของข้าวหอม</p>',
        focus: 'route', fov: 84, arcs: ['belt', 'leg1', 'leg2'], labels: [beltLabel, aldLabel], ring: true
      },
      {
        title: 'ดูของจริงคืนวันเกิดปีนี้',
        body: `<p>คืนวันที่ <strong>13 มกราคม 2570</strong> ราวสองทุ่ม ออกไปมองฟ้าที่เชียงราย ดาวทุกดวงจะอยู่ตรงตำแหน่งเดียวกับคืนที่ข้าวหอมเกิดเลย (ดาวกลับมาที่เดิมทุกปี มีแค่ดวงจันทร์กับดาวเคราะห์ที่ย้ายไป)</p>
          <ul>
            <li>ไปที่มืดๆ ห่างไฟถนน ยิ่งมืดยิ่งเห็นดาวเยอะ</li>
            <li>ไม่ดูจอมือถือสัก 15 นาที ให้ตาชินกับความมืดก่อน</li>
            <li>ดาวลูกไก่จะชัดขึ้นถ้ามองเฉียงๆ ข้างๆ แทนการจ้องตรงๆ</li>
            <li>ถ้ามีกล้องส่องทางไกล จะเห็นดาวลูกไก่เป็นกระจุกสีฟ้าหลายสิบดวง</li>
          </ul>`,
        focus: 'pleiades', arcs: ['belt', 'leg1', 'leg2'], labels: [beltLabel, aldLabel], ring: true
      }
    ];
    const guideEl = root.querySelector('.bs-guide');
    const guideStart = root.querySelector('.bs-guide-start');
    let guideStep = -1;
    function lookAtLocal(vec) {
      const w = tmp.copy(vec).applyMatrix4(sky.matrix).normalize();
      view.targetAlt = THREE.MathUtils.clamp(Math.asin(w.y) / DEG, -4, 85);
      let az = Math.atan2(w.x, -w.z) / DEG;
      while (az - view.az > 180) az -= 360;
      while (az - view.az < -180) az += 360;
      view.targetAz = az;
      view.fov = Math.max(view.fov, 64);
    }
    function showGuideStep(i) {
      guideStep = i;
      const step = GUIDE_STEPS[i];
      introDone = true;
      if (minute !== DEFAULT_MINUTE) { range.value = DEFAULT_MINUTE; setMinute(DEFAULT_MINUTE); }
      root.querySelector('.bs-guide-step').textContent = `ขั้นที่ ${i + 1} จาก ${GUIDE_STEPS.length}`;
      root.querySelector('.bs-guide-title').textContent = step.title;
      root.querySelector('.bs-guide-body').innerHTML = step.body;
      root.querySelector('.bs-guide-prev').hidden = i === 0;
      root.querySelector('.bs-guide-next').textContent = i === GUIDE_STEPS.length - 1 ? 'ปิดคำแนะนำ' : 'ต่อไป';
      for (const [key, arc] of Object.entries(guideArcs)) {
        arc.target = step.arcs.includes(key) ? 1 : 0;
        arc.mesh.visible = true;
      }
      for (const l of [beltLabel, aldLabel]) l.el.classList.toggle('is-on', step.labels.includes(l));
      lookAtLocal(guideFocus[step.focus]);
      if (step.fov) view.fov = step.fov;
      // portrait: the guide card sits low, so lift the target into the upper half
      if (window.innerWidth < window.innerHeight) view.targetAlt = Math.max(-4, view.targetAlt - 18);
    }
    function closeGuide() {
      guideStep = -1;
      guideEl.hidden = true;
      guideStart.hidden = false;
      root.classList.remove('is-guiding');
      for (const arc of Object.values(guideArcs)) arc.target = 0;
      for (const l of [beltLabel, aldLabel]) l.el.classList.remove('is-on');
    }
    guideStart.addEventListener('click', () => {
      guideEl.hidden = false;
      guideStart.hidden = true;
      root.classList.add('is-guiding');
      showGuideStep(0);
      root.querySelector('.bs-guide-next').focus({ preventScroll: true });
    });
    root.querySelector('.bs-guide-next').addEventListener('click', () => {
      if (guideStep >= GUIDE_STEPS.length - 1) closeGuide(); else showGuideStep(guideStep + 1);
    });
    root.querySelector('.bs-guide-prev').addEventListener('click', () => { if (guideStep > 0) showGuideStep(guideStep - 1); });

    function resize() {
      const w = window.innerWidth, h = window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      // portrait screens get a wider vertical view so the whole figure fits
      view.fovBase = w < h ? 1.25 : 1;
      camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize);
    resize();

    const clockStart = performance.now();
    const project = new THREE.Vector3();
    function frame() {
      raf = requestAnimationFrame(frame);
      const now = performance.now();
      const time = (now - clockStart) / 1000;

      if (!introDone) {
        // Lift the gaze from the dark ridge to the stars, then trace the figures.
        const t = Math.min(1, (now - introStart) / 6500);
        const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        view.targetAlt = 3 + 55 * e;
        view.targetAz = 72 + 6 * e;
        if (t >= 1) introDone = true;
      }
      const revealTarget = reducedMotion ? 1.2 : Math.max(0, (now - introStart) / 1000 - 3.5) / 6;
      lineUniforms.uReveal.value = Math.min(1.2, revealTarget);
      const showNote = reducedMotion || now - introStart > 6000;
      root.classList.toggle('is-noted', showNote && guideStep < 0);
      ring.material.opacity = showNote ? Math.min(0.9, ring.material.opacity + 0.02) : 0;
      if (!reducedMotion) ring.scale.setScalar(64 + Math.sin(time * 1.4) * 3);

      for (const arc of Object.values(guideArcs)) {
        const speed = reducedMotion ? 1 : 0.035;
        arc.progress += (arc.target - arc.progress) * (arc.target > arc.progress ? speed : 0.2);
        const count = Math.floor(arc.progress * arc.total / 3) * 3;
        arc.mesh.geometry.setDrawRange(0, count);
        arc.mesh.visible = count > 0;
      }
      const ease = reducedMotion ? 1 : 0.08;
      view.az += (view.targetAz - view.az) * ease;
      view.alt += (view.targetAlt - view.alt) * ease;
      camera.rotation.y = -view.az * DEG;
      camera.rotation.x = view.alt * DEG;
      const fov = Math.min(110, view.fov * (view.fovBase || 1));
      if (Math.abs(camera.fov - fov) > 0.01) { camera.fov = fov; camera.updateProjectionMatrix(); }
      starUniforms.uZoom.value = THREE.MathUtils.clamp(72 / view.fov, 0.8, 2.2);
      starUniforms.uTime.value = time;
      camera.updateMatrixWorld();

      const w = canvas.clientWidth, h = canvas.clientHeight;
      const place = (el, world) => {
        project.copy(world).project(camera);
        const visible = project.z < 1 && Math.abs(project.x) < 1.1 && Math.abs(project.y) < 1.1 && world.y > 4;
        el.style.opacity = visible ? '' : '0';
        if (visible) el.style.transform = `translate(${(project.x * 0.5 + 0.5) * w}px, ${(-project.y * 0.5 + 0.5) * h}px) translate(-50%, -50%)`;
      };
      for (const spec of labelSpecs) {
        const world = spec.local ? tmp.copy(spec.local).applyMatrix4(sky.matrix) : spec.world;
        if (spec.kind === 'constellation') spec.el.classList.toggle('is-on', lineUniforms.uReveal.value > 0.35);
        if (spec.kind === 'accent') spec.el.classList.toggle('is-on', showNote);
        place(spec.el, world);
      }
      for (const c of compassEls) {
        project.copy(c.world).project(camera);
        const visible = project.z < 1 && Math.abs(project.x) < 1.1 && project.y > -0.62;
        c.el.style.opacity = visible ? '' : '0';
        if (visible) c.el.style.transform = `translate(${(project.x * 0.5 + 0.5) * w}px, ${(-project.y * 0.5 + 0.5) * h}px) translate(-50%, -50%)`;
      }
      renderer.render(scene, camera);
    }

    return {
      root,
      start() { introStart = performance.now(); introDone = reducedMotion; if (!reducedMotion) { view.alt = view.targetAlt = 3; view.az = view.targetAz = 72; } frame(); },
      stop() { cancelAnimationFrame(raf); raf = 0; },
      focus() { root.querySelector('.bs-close').focus({ preventScroll: true }); }
    };
  }

  let lastFocus = null;
  async function show() {
    if (open) return;
    open = true;
    lastFocus = document.activeElement;
    onOpen();
    try {
      built = built || await build();
    } catch (error) {
      console.error('Birth sky failed to load:', error);
      open = false;
      onClose();
      return;
    }
    built.root.hidden = false;
    requestAnimationFrame(() => built.root.classList.add('is-open'));
    built.start();
    built.focus();
  }

  function close() {
    if (!open || !built) return;
    open = false;
    built.root.classList.remove('is-open');
    built.stop();
    built.root.hidden = true;
    onClose();
    lastFocus?.focus?.({ preventScroll: true });
  }

  return { show, close, get isOpen() { return open; } };
}
