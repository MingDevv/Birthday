import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import gsap from 'gsap';

import { MEMORIES_LIST, PLANET_CONFIG } from './config/memoriesData.js';
import { createGalaxySkybox } from './scene/galaxySkybox.js';
import { createSpiralGalaxy } from './scene/spiralGalaxy.js';
import { createSolarSystemHeart } from './scene/solarSystemHeart.js';
import { createFireworksSystem } from './scene/fireworks.js';
import { SoundManager } from './audio/soundManager.js';
import { PolaroidModal } from './ui/polaroidModal.js';
import { HudOverlay } from './ui/hudOverlay.js';
import { IntroScreen } from './ui/introScreen.js';
import { createGiant3DNameText } from './scene/name3DText.js';
import { createWormhole } from './scene/wormhole.js';
import { showArrivalCelebrationFlow } from './ui/arrivalPopups.js';
import { createFrameGovernor, getQualityConfig, getQueryFlags } from './core/quality.js';
import { heroCamera } from './core/responsive.js';
import { orbitClock } from './core/orbitClock.js';
import './style.css';

async function initializeApp() {
const queryFlags = getQueryFlags();
const getRenderSize = () => queryFlags.portraitRatio
  ? { width: 1080, height: 1920, aspect: 9 / 16 }
  : { width: window.innerWidth, height: window.innerHeight, aspect: window.innerWidth / window.innerHeight };
if (queryFlags.portraitRatio) document.body.classList.add('cinema-portrait');
await Promise.race([
  document.fonts.load('900 100px "Prompt"').catch(() => []),
  new Promise((resolve) => setTimeout(resolve, 1800))
]);
const debugModules = queryFlags.debug
  ? await Promise.all([import('lil-gui'), import('stats.js')])
  : null;
const GUI = debugModules?.[0].default;
const Stats = debugModules?.[1].default;

// -----------------------------------------------------------------------------
// 1. Initial State & Setup
// -----------------------------------------------------------------------------
const visitedMemories = new Set();
let currentQuality = getQualityConfig();
if (queryFlags.portraitRatio) currentQuality.pixelRatio = 1;
let currentHoveredMesh = null;
let isCinematicFlying = false;
let isGalaxyView = false;

const canvas = document.getElementById('webgl-canvas');
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  powerPreference: 'high-performance'
});

let renderViewport = getRenderSize();
renderer.setSize(renderViewport.width, renderViewport.height);
renderer.setPixelRatio(currentQuality.pixelRatio);
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = false;

const scene = new THREE.Scene();
// Deep Cosmic Purple & Midnight Indigo space
scene.background = new THREE.Color(0x060212);
scene.fog = null;

let heroPose = heroCamera(renderViewport.aspect);
const camera = new THREE.PerspectiveCamera(
  heroPose.fov,
  renderViewport.aspect,
  0.1,
  1800
);
camera.updateProjectionMatrix();

// Camera vantage points
const defaultCameraPos = new THREE.Vector3(heroPose.position.x, heroPose.position.y, heroPose.position.z);
const defaultCameraTarget = new THREE.Vector3(heroPose.target.x, heroPose.target.y, heroPose.target.z);
const galaxyCameraPos = new THREE.Vector3(0, 125, 245);  // Optimal vantage point framing the Hubble Galaxy & Giant 3D Text
const deepSpacePos = new THREE.Vector3(120, 160, 260);   // Start of 7.5s Cosmic Galaxy Journey
camera.position.copy(deepSpacePos);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxDistance = 240;
controls.minDistance = 16.0;
controls.autoRotate = false;
controls.autoRotateSpeed = 0.45;
controls.target.copy(defaultCameraTarget);

// -----------------------------------------------------------------------------
// 2. Post-Processing Bloom (Give Love Studio Signature Glowing Galaxy)
// -----------------------------------------------------------------------------
const renderTarget = new THREE.WebGLRenderTarget(renderViewport.width, renderViewport.height, {
  type: renderer.extensions.has('EXT_color_buffer_float') ? THREE.HalfFloatType : THREE.UnsignedByteType,
  samples: renderer.capabilities.isWebGL2 ? 4 : 0
});
const composer = new EffectComposer(renderer, renderTarget);
composer.setPixelRatio(currentQuality.pixelRatio);
composer.setSize(renderViewport.width, renderViewport.height);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(renderViewport.width, renderViewport.height),
  0.32, // Bloom only catches the brightest star and heart highlights
  0.55,
  1.0
);
composer.addPass(bloomPass);
const outputPass = new OutputPass();
composer.addPass(outputPass);

let webglContextLost = false;
canvas.addEventListener('webglcontextlost', (event) => {
  event.preventDefault();
  webglContextLost = true;
});
canvas.addEventListener('webglcontextrestored', () => {
  webglContextLost = false;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, currentQuality.pixelRatio));
  renderer.setSize(renderViewport.width, renderViewport.height);
  composer.reset();
  composer.setPixelRatio(Math.min(window.devicePixelRatio || 1, currentQuality.pixelRatio));
  composer.setSize(renderViewport.width, renderViewport.height);
});

let stats = null;
let debugGui = null;
const debugQuality = { quality: currentQuality.tier };
let qualityController = null;
if (queryFlags.debug) {
  stats = new Stats();
  stats.showPanel(0);
  stats.dom.style.cssText += ';position:fixed;left:0;top:0;z-index:10000';
  document.body.appendChild(stats.dom);
  debugGui = new GUI({ title: 'Cosmic scene tuning' });
  debugGui.add(bloomPass, 'strength', 0, 0.9, 0.01).name('Bloom strength');
  debugGui.add(bloomPass, 'threshold', 0.5, 1.5, 0.01).name('Bloom threshold');
  debugGui.add(renderer, 'toneMappingExposure', 0.5, 1.5, 0.01).name('Exposure');
  qualityController = debugGui.add(debugQuality, 'quality').disable();
}

// -----------------------------------------------------------------------------
// 3. Scene Lighting (Cinema 4D / Blender Grade Cosmic Purple Starlight)
// -----------------------------------------------------------------------------
const ambientLight = new THREE.HemisphereLight(0x58307c, 0x08041a, 0.72);
scene.add(ambientLight);

// A single central key light gives the orbiting planets a consistent day side.
const heartSun = new THREE.PointLight(0xffe8f8, 6000, 0, 2);
scene.add(heartSun);

const softKeyLight = new THREE.DirectionalLight(0xfff1f8, 1.1);
softKeyLight.position.set(45, 60, 45);
scene.add(softKeyLight);

const violetRim = new THREE.DirectionalLight(0xa855f7, 0.48);
violetRim.position.set(-45, -20, -40);
scene.add(violetRim);
const roseRim = new THREE.DirectionalLight(0xec4899, 0.22);
roseRim.position.set(0, -35, 50);
scene.add(roseRim);

// -----------------------------------------------------------------------------
// 4. Subsystems Initialization
// -----------------------------------------------------------------------------
const soundManager = new SoundManager();
soundManager.isMuted = queryFlags.mute;
const galaxy = createGalaxySkybox(scene, currentQuality);
const spiralGalaxy = createSpiralGalaxy(scene, currentQuality);
const solarSystem = createSolarSystemHeart(scene);
const fireworks = createFireworksSystem(scene, soundManager);
const name3DText = createGiant3DNameText(scene);
const wormhole = createWormhole(scene);
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const frameGovernor = createFrameGovernor({
  renderer,
  composer,
  initialConfig: currentQuality,
  getSize: getRenderSize,
  onTierChange: (next) => {
    currentQuality = next;
    galaxy.setQuality(next.backgroundStars);
    spiralGalaxy.setQuality(next.galaxyStars);
    debugQuality.quality = next.tier;
    qualityController?.updateDisplay();
  }
});

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
// 5. Hyperspace Warp Speed System (TikTok Give Love Studio Style — Ultra Spectacle)
// -----------------------------------------------------------------------------
const warpStreakCount = 550;
const warpStreakGeo = new THREE.BufferGeometry();
const warpStreakPositions = new Float32Array(warpStreakCount * 6);
const warpStreakColors = new Float32Array(warpStreakCount * 6);
const warpStreaksData = [];

const warpPalette = [
  new THREE.Color(0xf5d0fe), // Diamond Lilac
  new THREE.Color(0xd946ef), // Neon Magenta
  new THREE.Color(0xa855f7), // Cosmic Purple
  new THREE.Color(0x38bdf8), // Electric Cyan
  new THREE.Color(0xfef08a), // Stardust Gold
  new THREE.Color(0xffffff)  // Pure Diamond Starlight
];

for (let i = 0; i < warpStreakCount; i++) {
  const theta = Math.random() * Math.PI * 2;
  const rad = 8 + Math.random() * 52;
  const z = (Math.random() - 0.5) * 380;
  const speed = 260 + Math.random() * 320;
  const len = 18 + Math.random() * 42;
  const col = warpPalette[Math.floor(Math.random() * warpPalette.length)];

  warpStreaksData.push({ rad, theta, z, speed, len });

  const x = Math.cos(theta) * rad;
  const y = Math.sin(theta) * rad;
  const idx = i * 6;

  warpStreakPositions[idx] = x;
  warpStreakPositions[idx + 1] = y;
  warpStreakPositions[idx + 2] = z;
  warpStreakPositions[idx + 3] = x;
  warpStreakPositions[idx + 4] = y;
  warpStreakPositions[idx + 5] = z - len;

  warpStreakColors[idx] = col.r;
  warpStreakColors[idx + 1] = col.g;
  warpStreakColors[idx + 2] = col.b;
  warpStreakColors[idx + 3] = col.r * 0.12;
  warpStreakColors[idx + 4] = col.g * 0.12;
  warpStreakColors[idx + 5] = col.b * 0.12;
}

warpStreakGeo.setAttribute('position', new THREE.BufferAttribute(warpStreakPositions, 3));
warpStreakGeo.setAttribute('color', new THREE.BufferAttribute(warpStreakColors, 3));

const warpStreakMat = new THREE.LineBasicMaterial({
  vertexColors: true,
  transparent: true,
  opacity: 0,
  blending: THREE.AdditiveBlending
});
const warpStreakMesh = new THREE.LineSegments(warpStreakGeo, warpStreakMat);
warpStreakMesh.visible = false;
scene.add(warpStreakMesh);

// 5b. Hyperspace Stargate Concentric Warp Rings (12 Glowing Neon Rings)
const warpRingCount = 12;
const warpRingGroup = new THREE.Group();
warpRingGroup.visible = false;
scene.add(warpRingGroup);

const warpRingsData = [];
for (let r = 0; r < warpRingCount; r++) {
  const ringGeo = new THREE.RingGeometry(16 + r * 1.8, 17.2 + r * 1.8, 48);
  const ringCol = warpPalette[r % warpPalette.length];
  const ringMat = new THREE.MeshBasicMaterial({
    color: ringCol,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  ringMesh.position.z = -r * 28;
  warpRingGroup.add(ringMesh);

  warpRingsData.push({
    mesh: ringMesh,
    mat: ringMat,
    z: -r * 28,
    speed: 180 + r * 16,
    baseRad: 16 + r * 1.8
  });
}

// 5c. Cosmic Stardust Cloud Particle Surge (1,200 Particles)
const warpSurgeCount = 1200;

function createGlowTexture(size, centerColor, edgeColor) {
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = size;
  glowCanvas.height = size;
  const context = glowCanvas.getContext('2d');
  const gradient = context.createRadialGradient(
    size / 2, size / 2, 0,
    size / 2, size / 2, size / 2
  );
  gradient.addColorStop(0, centerColor);
  gradient.addColorStop(1, edgeColor);
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(glowCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const warpSurgeGeo = new THREE.BufferGeometry();
const warpSurgePos = new Float32Array(warpSurgeCount * 3);
const warpSurgeCol = new Float32Array(warpSurgeCount * 3);
const warpSurgeData = [];

for (let i = 0; i < warpSurgeCount; i++) {
  const theta = Math.random() * Math.PI * 2;
  const rad = 4.0 + Math.random() * 38;
  const z = (Math.random() - 0.5) * 320;
  const speed = 220 + Math.random() * 360;
  const col = warpPalette[Math.floor(Math.random() * warpPalette.length)];

  warpSurgePos[i * 3] = Math.cos(theta) * rad;
  warpSurgePos[i * 3 + 1] = Math.sin(theta) * rad;
  warpSurgePos[i * 3 + 2] = z;

  warpSurgeCol[i * 3] = col.r;
  warpSurgeCol[i * 3 + 1] = col.g;
  warpSurgeCol[i * 3 + 2] = col.b;

  warpSurgeData.push({ theta, rad, z, speed });
}

warpSurgeGeo.setAttribute('position', new THREE.BufferAttribute(warpSurgePos, 3));
warpSurgeGeo.setAttribute('color', new THREE.BufferAttribute(warpSurgeCol, 3));

const warpSurgeMat = new THREE.PointsMaterial({
  size: 1.15,
  map: createGlowTexture(48, 'rgba(255,255,255,1)', 'rgba(255,255,255,0)'),
  vertexColors: true,
  transparent: true,
  alphaTest: 0.025,
  opacity: 0,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});
const warpSurgePoints = new THREE.Points(warpSurgeGeo, warpSurgeMat);
warpSurgePoints.visible = false;
scene.add(warpSurgePoints);

let isWarpActive = false;

function updateWarpStreaks(delta) {
  if (!isWarpActive) {
    warpStreakMesh.visible = false;
    warpRingGroup.visible = false;
    warpSurgePoints.visible = false;
    return;
  }
  warpStreakMesh.visible = true;
  warpRingGroup.visible = true;
  warpSurgePoints.visible = true;

  // Align warp tunnel precisely with camera pose
  warpStreakMesh.position.copy(camera.position);
  warpStreakMesh.quaternion.copy(camera.quaternion);

  warpRingGroup.position.copy(camera.position);
  warpRingGroup.quaternion.copy(camera.quaternion);

  warpSurgePoints.position.copy(camera.position);
  warpSurgePoints.quaternion.copy(camera.quaternion);

  // 1. Update Warp Streaks
  const pos = warpStreakGeo.attributes.position.array;
  for (let i = 0; i < warpStreakCount; i++) {
    const s = warpStreaksData[i];
    s.z += s.speed * delta;
    if (s.z > 40) s.z = -340;

    const x = Math.cos(s.theta) * s.rad;
    const y = Math.sin(s.theta) * s.rad;
    const idx = i * 6;

    pos[idx] = x;
    pos[idx + 1] = y;
    pos[idx + 2] = s.z;
    pos[idx + 3] = x;
    pos[idx + 4] = y;
    pos[idx + 5] = s.z - s.len;
  }
  warpStreakGeo.attributes.position.needsUpdate = true;

  // 2. Update Warp Rings
  for (let r = 0; r < warpRingCount; r++) {
    const item = warpRingsData[r];
    item.z += item.speed * delta;
    if (item.z > 30) item.z = -320;
    item.mesh.position.z = item.z;
  }

  // 3. Update Stardust Surge
  const sPos = warpSurgeGeo.attributes.position.array;
  for (let i = 0; i < warpSurgeCount; i++) {
    const s = warpSurgeData[i];
    s.z += s.speed * delta;
    if (s.z > 35) s.z = -300;
    sPos[i * 3 + 2] = s.z;
  }
  warpSurgeGeo.attributes.position.needsUpdate = true;
}

// -----------------------------------------------------------------------------
// 6. Extended TikTok-Style Cinematic Galaxy Journey (Give Love Studio Signature)
// -----------------------------------------------------------------------------
let approachTimeline = null;

function runCinemaDirector() {
  hud.hide();
  isCinematicFlying = true;
  controls.autoRotate = false;
  gsap.to(orbitClock, { scale: 0.04, duration: 1.0, ease: 'power2.out' });

  const tour = gsap.timeline({
    onComplete: () => {
      isCinematicFlying = false;
      controls.autoRotate = false;
    }
  });

  solarSystem.planetsList.forEach((planet, index) => {
    const lookAt = planet.group.position.clone();
    const cameraPosition = lookAt.clone().add(new THREE.Vector3(0, planet.config.radius * 1.8, planet.config.radius * 4.2));
    const at = index * 2.8;
    tour.to(camera.position, {
      x: cameraPosition.x,
      y: cameraPosition.y,
      z: cameraPosition.z,
      duration: 2.45,
      ease: 'power2.inOut'
    }, at);
    tour.to(controls.target, {
      x: lookAt.x,
      y: lookAt.y,
      z: lookAt.z,
      duration: 2.45,
      ease: 'power2.inOut'
    }, at);
  });

  const revealAt = solarSystem.planetsList.length * 2.8;
  tour.to(camera.position, {
    x: galaxyCameraPos.x,
    y: galaxyCameraPos.y,
    z: galaxyCameraPos.z,
    duration: 3.0,
    ease: 'power3.inOut'
  }, revealAt);
  tour.to(controls.target, { x: 0, y: 28, z: -25, duration: 3.0, ease: 'power3.inOut' }, revealAt);
  tour.call(() => {
    isGalaxyView = true;
    name3DText.show();
    fireworks.triggerMakeAWish();
    galaxy.triggerGrandShower?.(10);
  }, [], revealAt + 3.1);
  tour.to({}, { duration: 3.0 }, revealAt + 3.2);
}

function startCinematicApproach(onComplete) {
  isCinematicFlying = true;
  controls.autoRotate = false;
  isWarpActive = true;
  wormhole.setActive(!prefersReducedMotion);

  const skipBtn = document.createElement('button');
  skipBtn.id = 'btn-skip-flight';
  skipBtn.className = 'skip-flight-btn';
  skipBtn.innerHTML = '<span>ข้ามฉากเดินทาง ⏩</span>';
  document.body.appendChild(skipBtn);

  soundManager.playWhooshSound();

  const finishFlight = () => {
    if (approachTimeline) approachTimeline.kill();
    isWarpActive = false;
    wormhole.setActive(false);
    warpStreakMat.opacity = 0;
    warpSurgeMat.opacity = 0;
    warpRingsData.forEach(r => { r.mat.opacity = 0; });
    warpStreakMesh.visible = false;
    warpRingGroup.visible = false;
    warpSurgePoints.visible = false;
    skipBtn.remove();

    camera.fov = heroPose.fov;
    camera.rotation.z = 0;
    camera.updateProjectionMatrix();
    camera.position.copy(defaultCameraPos);
    controls.target.copy(defaultCameraTarget);
    bloomPass.strength = 0.32;
    isCinematicFlying = false;
    controls.autoRotate = true;
    if (queryFlags.cinema) {
      runCinemaDirector();
      return;
    }
    showArrivalCelebrationFlow(soundManager);
    if (onComplete) onComplete();
  };

  skipBtn.addEventListener('click', finishFlight);

  approachTimeline = gsap.timeline({
    onComplete: finishFlight
  });

  // Stage 1 (0.0s - 2.5s): Hyperspace Warp Tunnel Acceleration & Dynamic FOV stretch
  approachTimeline.to(warpStreakMat, {
    opacity: 0.62,
    duration: 1.2,
    ease: 'power2.in'
  }, 0);

  approachTimeline.to(warpSurgeMat, {
    opacity: 0.42,
    duration: 1.2,
    ease: 'power2.in'
  }, 0);

  warpRingsData.forEach(r => {
    approachTimeline.to(r.mat, {
      opacity: 0.34,
      duration: 1.2,
      ease: 'power2.in'
    }, 0);
  });

  approachTimeline.to(camera, {
    fov: 82, // Moderate cinematic stretch without distorting the scene
    duration: 2.2,
    ease: 'power2.in',
    onUpdate: () => camera.updateProjectionMatrix()
  }, 0);

  approachTimeline.to(camera.position, {
    x: 75,
    y: 110,
    z: 180,
    duration: 2.5,
    ease: 'power2.inOut'
  }, 0);

  // Cinematic Banking Roll along the galaxy arm
  approachTimeline.to(camera.rotation, {
    z: -0.14,
    duration: 2.2,
    ease: 'power2.inOut'
  }, 0);

  // Stage 2 (2.5s - 5.0s): Sweeping Arc Bank through the glowing purple spiral arm
  approachTimeline.to(camera.position, {
    x: -32,
    y: 52,
    z: 110,
    duration: 2.5,
    ease: 'power2.inOut'
  }, 2.5);

  approachTimeline.to(camera.rotation, {
    z: 0.08,
    duration: 2.5,
    ease: 'power2.inOut'
  }, 2.5);

  approachTimeline.to(controls.target, {
    x: defaultCameraTarget.x,
    y: defaultCameraTarget.y,
    z: defaultCameraTarget.z,
    duration: 2.5,
    ease: 'power2.inOut'
  }, 2.5);

  // Stage 3 (5.0s - 7.5s): Smooth Deceleration, Warp exit, and Grand Reveal of Heart & Orbits
  approachTimeline.to(warpStreakMat, {
    opacity: 0,
    duration: 1.6,
    ease: 'power2.out'
  }, 4.8);

  approachTimeline.to(warpSurgeMat, {
    opacity: 0,
    duration: 1.6,
    ease: 'power2.out'
  }, 4.8);

  warpRingsData.forEach(r => {
    approachTimeline.to(r.mat, {
      opacity: 0,
      duration: 1.4,
      ease: 'power2.out'
    }, 4.8);
  });

  approachTimeline.to(camera.rotation, {
    z: 0,
    duration: 2.4,
    ease: 'power2.out'
  }, 4.8);

  approachTimeline.to(camera, {
    fov: heroPose.fov, // Restore the aspect-fitted hero composition
    duration: 2.7,
    ease: 'power3.out',
    onUpdate: () => camera.updateProjectionMatrix()
  }, 4.8);

  // Subtle arrival glow; keep the scene readable during the reveal.
  approachTimeline.to(bloomPass, {
    strength: 0.48,
    duration: 0.5,
    yoyo: true,
    repeat: 1,
    ease: 'power2.inOut',
    onStart: () => {
      soundManager.playChimeSound();
    }
  }, 5.0);

  approachTimeline.to(camera.position, {
    x: defaultCameraPos.x,
    y: defaultCameraPos.y,
    z: defaultCameraPos.z,
    duration: 2.7,
    ease: 'power3.out'
  }, 4.8);

  if (!prefersReducedMotion) approachTimeline.timeScale(0.55);
}

// -----------------------------------------------------------------------------
// 6. Camera Navigation to Solar System Planets & Galaxy Views
// -----------------------------------------------------------------------------
function flyToPlanet(planetId) {
  const planetItem = solarSystem.planetsList.find(p => p.id === planetId);
  if (!planetItem) return;

  isCinematicFlying = true;
  controls.autoRotate = false;
  gsap.to(orbitClock, { scale: 0.04, duration: 0.8, ease: 'power2.out' });
  controls.minDistance = 6.0;
  controls.maxDistance = 180;
  isGalaxyView = false;
  hud.setGalaxyMode(false);
  name3DText.hide();

  // Mark visited
  if (!visitedMemories.has(planetId)) {
    visitedMemories.add(planetId);
    solarSystem.markVisited(planetId);
    hud.updateProgress(visitedMemories);
  }

  soundManager.playClickSound();

  const targetLookAt = planetItem.group.position.clone();
  // Camera frames the planet with the glowing heart and galaxy in the background
  const targetCamPos = targetLookAt.clone().add(
    new THREE.Vector3(0, planetItem.config.radius * 1.5, planetItem.config.radius * 3.8)
  );

  const currentDist = camera.position.distanceTo(targetCamPos);
  const duration = currentDist > 90 ? 2.2 : 1.5;

  gsap.to(camera.position, {
    x: targetCamPos.x,
    y: targetCamPos.y,
    z: targetCamPos.z,
    duration: duration,
    ease: 'power3.inOut'
  });

  gsap.to(controls.target, {
    x: targetLookAt.x,
    y: targetLookAt.y,
    z: targetLookAt.z,
    duration: duration,
    ease: 'power3.inOut',
    onComplete: () => {
      isCinematicFlying = false;
      polaroidModal.show(planetItem.memory);
    }
  });
}

function returnToCenterOrbit() {
  isCinematicFlying = true;
  controls.autoRotate = true;
  controls.minDistance = 16.0;
  controls.maxDistance = 240;
  isGalaxyView = false;
  gsap.to(orbitClock, { scale: 1, duration: 0.8, ease: 'power2.out' });
  hud.setGalaxyMode(false);
  name3DText.hide();

  gsap.to(camera.position, {
    x: defaultCameraPos.x,
    y: defaultCameraPos.y,
    z: defaultCameraPos.z,
    duration: 1.6,
    ease: 'power3.out'
  });

  gsap.to(controls.target, {
    x: defaultCameraTarget.x,
    y: defaultCameraTarget.y,
    z: defaultCameraTarget.z,
    duration: 1.6,
    ease: 'power3.out',
    onComplete: () => {
      isCinematicFlying = false;
    }
  });
}

function toggleGalaxyView(forcedState) {
  if (isCinematicFlying) return;
  const targetState = forcedState !== undefined ? forcedState : !isGalaxyView;
  isGalaxyView = targetState;
  isCinematicFlying = true;
  polaroidModal.close();

  soundManager.playWhooshSound();

  if (isGalaxyView) {
    // Switch to Grand 3D Milky Way Galaxy Exploration Mode
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.32;
    controls.minDistance = 40;
    controls.maxDistance = 650;
    gsap.to(camera.position, {
      x: galaxyCameraPos.x,
      y: galaxyCameraPos.y,
      z: galaxyCameraPos.z,
      duration: 2.2,
      ease: 'power3.inOut'
    });

    gsap.to(controls.target, {
      x: 0,
      y: 28,
      z: -25,
      duration: 2.2,
      ease: 'power3.inOut',
      onComplete: () => {
        isCinematicFlying = false;
        hud.setGalaxyMode(true);
        name3DText.show();
      }
    });
  } else {
    // Return to Center Heart View
    name3DText.hide();
    returnToCenterOrbit();
  }
}

// -----------------------------------------------------------------------------
// 7. UI Modals & HUD Overlay
// -----------------------------------------------------------------------------
const polaroidModal = new PolaroidModal({
  onNext: (nextId) => {
    polaroidModal.close(false);
    setTimeout(() => flyToPlanet(nextId), 380);
  },
  onBackToGalaxy: () => {
    returnToCenterOrbit();
  },
  onWish: () => {
    fireworks.triggerMakeAWish();
    if (galaxy?.triggerGrandShower) galaxy.triggerGrandShower(10);
  }
});

const hud = new HudOverlay({
  onMakeWish: () => {
    soundManager.initAudioContext();
    if (!isGalaxyView && !isCinematicFlying) {
      gsap.to(camera.position, {
        x: 0,
        y: 28,
        z: 60,
        duration: 1.5,
        ease: 'power2.out'
      });
      gsap.to(controls.target, {
        x: 0,
        y: 12,
        z: 0,
        duration: 1.5,
        ease: 'power2.out'
      });
    }
    fireworks.triggerMakeAWish();
    if (galaxy?.triggerGrandShower) galaxy.triggerGrandShower(10);
  },
  onToggleSound: () => {
    return soundManager.toggleMute();
  },
  onResetCamera: () => {
    polaroidModal.close();
    returnToCenterOrbit();
  },
  onToggleGalaxy: () => {
    toggleGalaxyView();
  },
  onSelectMemory: (id) => {
    polaroidModal.close();
    flyToPlanet(id);
  }
});

// Intro Screen: 3-2-1 Countdown & Journey Trigger
if (queryFlags.skipIntro || queryFlags.cinema) {
  camera.position.copy(queryFlags.cinema ? deepSpacePos : defaultCameraPos);
  controls.target.copy(queryFlags.cinema ? new THREE.Vector3(0, 0, 0) : defaultCameraTarget);
  if (queryFlags.cinema) {
    hud.hide();
  } else {
    hud.show();
    hud.setSoundPlayingState(false);
  }
} else {
  new IntroScreen({
    soundManager,
    onEnter: () => {
      startCinematicApproach(() => {
        hud.show();
        hud.setSoundPlayingState(soundManager.isPlaying());
      });
    }
  });
}

// -----------------------------------------------------------------------------
// 8. Raycasting & Interactive Solar System Planets
// -----------------------------------------------------------------------------
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let pointerDownPosition = null;

function updatePointer(e) {
  const x = e.clientX || (e.touches && e.touches[0].clientX);
  const y = e.clientY || (e.touches && e.touches[0].clientY);
  if (x === undefined || y === undefined) return;

  pointer.x = (x / window.innerWidth) * 2 - 1;
  pointer.y = -(y / window.innerHeight) * 2 + 1;
}

window.addEventListener('pointermove', (e) => {
  updatePointer(e);
  if (polaroidModal.isOpen || isCinematicFlying) {
    solarSystem.setHover(null, false);
    return;
  }

  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(solarSystem.interactiveMeshes, false);

  if (intersects.length > 0) {
    const hit = intersects[0].object;
    if (currentHoveredMesh !== hit) {
      if (currentHoveredMesh) solarSystem.setHover(currentHoveredMesh, false);
      currentHoveredMesh = hit;
      solarSystem.setHover(currentHoveredMesh, true, e.clientX, e.clientY);
      soundManager.playHoverSound();
      canvas.style.cursor = 'pointer';
    } else {
      solarSystem.setHover(currentHoveredMesh, true, e.clientX, e.clientY);
    }
  } else {
    if (currentHoveredMesh) {
      solarSystem.setHover(currentHoveredMesh, false);
      currentHoveredMesh = null;
    }
    canvas.style.cursor = 'grab';
  }
});

window.addEventListener('pointerup', (e) => {
  const wasDrag = pointerDownPosition
    && Math.hypot(e.clientX - pointerDownPosition.x, e.clientY - pointerDownPosition.y) > 8;
  pointerDownPosition = null;
  if (wasDrag) return;
  if (polaroidModal.isOpen || isCinematicFlying) return;

  updatePointer(e);
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(solarSystem.interactiveMeshes, false);

  if (intersects.length > 0) {
    const hit = intersects[0].object;
    const planetId = hit.userData.planetId || hit.userData.memoryId;
    if (planetId) {
      flyToPlanet(planetId);
    }
  }
});

window.addEventListener('pointerdown', (e) => {
  pointerDownPosition = { x: e.clientX, y: e.clientY };
}, { passive: true });

// Resume Audio on first touch/click
window.addEventListener('pointerdown', () => {
  soundManager.initAudioContext();
}, { once: true });

// Window Resize
window.addEventListener('resize', () => {
  renderViewport = getRenderSize();
  camera.aspect = renderViewport.aspect;
  heroPose = heroCamera(camera.aspect);
  defaultCameraPos.set(heroPose.position.x, heroPose.position.y, heroPose.position.z);
  defaultCameraTarget.set(heroPose.target.x, heroPose.target.y, heroPose.target.z);
  if (!isGalaxyView && !isCinematicFlying && !polaroidModal.isOpen) {
    camera.fov = heroPose.fov;
    gsap.to(camera.position, { ...heroPose.position, duration: 0.45, ease: 'power2.out' });
    gsap.to(controls.target, { ...heroPose.target, duration: 0.45, ease: 'power2.out' });
  }
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, currentQuality.pixelRatio));
  composer.setPixelRatio(Math.min(window.devicePixelRatio || 1, currentQuality.pixelRatio));
  renderer.setSize(renderViewport.width, renderViewport.height);
  composer.setSize(renderViewport.width, renderViewport.height);
  bloomPass.resolution.set(renderViewport.width, renderViewport.height);
});

// -----------------------------------------------------------------------------
// 9. 60 FPS Render Loop with Post-Processing Bloom
// -----------------------------------------------------------------------------
const clock = new THREE.Clock();
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) clock.start();
});

function animate() {
  requestAnimationFrame(animate);
  if (document.hidden || webglContextLost) return;
  stats?.begin();

  const delta = Math.min(clock.getDelta(), 0.1);
  const time = clock.getElapsedTime();
  orbitClock.time += delta * orbitClock.scale;

  controls.update();

  galaxy.update(delta, time);
  spiralGalaxy.update(delta, time, camera);
  solarSystem.update(delta, orbitClock.time, time);
  fireworks.update(delta);
  updateWarpStreaks(delta);
  name3DText.update(delta, time, camera);
  wormhole.update(time, camera, isWarpActive && !prefersReducedMotion, approachTimeline?.progress() ?? 0);
  frameGovernor.update(delta);

  // Render through EffectComposer with UnrealBloomPass for celestial glowing aesthetics
  composer.render();
  stats?.end();
}

// Start animation loop
animate();
if (queryFlags.cinema) {
  hud.hide();
  startCinematicApproach();
}
}

initializeApp().catch((error) => {
  console.error('Unable to initialize the birthday galaxy scene:', error);
});
