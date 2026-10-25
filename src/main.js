import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import gsap from 'gsap';

import { MEMORIES_LIST, PLANET_CONFIG } from './config/memoriesData.js';
import { createGalaxySkybox } from './scene/galaxySkybox.js';
import { createSpiralGalaxy } from './scene/spiralGalaxy.js';
import { createSolarSystemHeart, loadPlanetTextures } from './scene/solarSystemHeart.js';
import { createFireworksSystem } from './scene/fireworks.js';
import { createCosmicCake } from './scene/cosmicCake.js';
import { createHeartStreak, createPointerStarTrail } from './scene/pointerStarTrail.js';
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
import { OPTIONAL_FEATURE_CONTENT } from './config/optionalFeatures.js';
import { createUIDirector } from './core/uiDirector.js';
import { createFlow } from './core/flow.js';
import { createWorldText } from './scene/worldText.js';
import './style.css';

async function initializeApp() {
const queryFlags = getQueryFlags();
const uiDirector = createUIDirector({ root: document.body, reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches });
const flow = createFlow({
  ui: uiDirector,
  onChange: ({ next }) => {
    document.body.classList.remove('mobile-tools-open');
    const grade = {
      FLIGHT: [0.9, 0.96, 1.06], ARRIVAL: [1.03, 0.93, 1.04], MEMORY: [1.02, 0.98, 1.04],
      FINALE_ALIGN: [1.04, 0.98, 0.92], FINALE_HEART: [1.08, 0.99, 0.94], FINALE_CAKE: [1.06, 0.98, 0.92]
    }[next] || [1, 1, 1];
    if (cinematicPass?.uniforms?.uGrade) gsap.to(cinematicPass.uniforms.uGrade.value, { r: grade[0], g: grade[1], b: grade[2], duration: prefersReducedMotion ? 0.08 : 0.8, overwrite: true });
  },
  killStateAnimations: () => {
    gsap.killTweensOf(camera.position);
    gsap.killTweensOf(controls.target);
    gsap.killTweensOf(orbitClock);
  }
});
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
let captureRequestPending = false;

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
const pmremGenerator = new THREE.PMREMGenerator(renderer);
const environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
scene.environment = environment.texture;
scene.environmentIntensity = 0.55;
pmremGenerator.dispose();

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
controls.maxDistance = Math.max(240, defaultCameraPos.length() + 48);

// -----------------------------------------------------------------------------
// 2. Post-Processing Bloom (Give Love Studio Signature Glowing Galaxy)
// -----------------------------------------------------------------------------
const renderTarget = new THREE.WebGLRenderTarget(renderViewport.width, renderViewport.height, {
  type: renderer.extensions.has('EXT_color_buffer_float') ? THREE.HalfFloatType : THREE.UnsignedByteType,
  samples: renderer.capabilities.isWebGL2 ? currentQuality.samples : 0
});
const composer = new EffectComposer(renderer, renderTarget);
composer.setPixelRatio(currentQuality.pixelRatio);
composer.setSize(renderViewport.width, renderViewport.height);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(renderViewport.width, renderViewport.height),
  currentQuality.bloomStrength, // Keep bloom on the star cores without softening planetary silhouettes
  0.42,
  1.0
);
composer.addPass(bloomPass);
const bokehPass = new BokehPass(scene, camera, { focus: 24, aperture: 0.00012, maxblur: 0.006 });
bokehPass.enabled = false;
composer.addPass(bokehPass);
const cinematicPass = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uVignette: { value: 0.28 }, uGrain: { value: 0.018 }, uCA: { value: 0.0012 }, uGrade: { value: new THREE.Color(1, 1, 1) } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
  fragmentShader: `varying vec2 vUv; uniform sampler2D tDiffuse; uniform float uTime,uVignette,uGrain,uCA; uniform vec3 uGrade;
    float hash(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
    void main(){ vec2 d=vUv-0.5; float r=dot(d,d); vec2 off=d*uCA*r*4.0;
      vec3 c=vec3(texture2D(tDiffuse,vUv+off).r,texture2D(tDiffuse,vUv).g,texture2D(tDiffuse,vUv-off).b);
      c*=uGrade; c*=1.0-uVignette*smoothstep(0.15,0.75,r*2.0); c+=(hash(vUv*vec2(1920.,1080.)+uTime)-0.5)*uGrain;
      gl_FragColor=vec4(c,1.0); }`
});
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const syncCinematicPass = () => {
  const enabled = currentQuality.tier === 'high' || currentQuality.tier === 'ultra';
  cinematicPass.enabled = enabled;
  cinematicPass.uniforms.uGrain.value = reducedMotion.matches ? 0 : 0.018;
  cinematicPass.uniforms.uCA.value = enabled ? 0.0012 : 0;
  cinematicPass.uniforms.uVignette.value = enabled ? 0.28 : 0.16;
};
syncCinematicPass();
composer.addPass(cinematicPass);
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
const solarSystem = createSolarSystemHeart(scene, currentQuality, { effectsEnabled: !queryFlags.fxOff });
const cosmicCake = createCosmicCake(scene, currentQuality, { enabled: !queryFlags.fxOff });
const pointerStarTrail = queryFlags.fxOff || window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ? null
  : createPointerStarTrail(scene, camera, currentQuality);
const heartStreak = queryFlags.fxOff || window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ? null
  : createHeartStreak(scene, currentQuality);
const loadingOverlay = document.getElementById('asset-loading');
const loadingBar = loadingOverlay?.querySelector('.asset-loading-bar');
const loadingManager = new THREE.LoadingManager();
const texturesReady = loadPlanetTextures({
  manager: loadingManager,
  onProgress: (progress) => loadingBar?.style.setProperty('--progress', `${Math.round(progress * 100)}%`)
}).then((textures) => solarSystem.setPlanetTextures(textures));
const fireworks = createFireworksSystem(scene, soundManager, uiDirector);
let cakeActions = null;
let cakeMicStream = null;
let cakeMicContext = null;
let cakeMicFrame = 0;
let shootingStarClicks = 0;
let shootingWishCard = null;
let cinemaRecorder = null;
let cinemaStream = null;
let cinemaButton = null;
const activeAuroras = new Set();
const activeWorldTexts = new Set();
let finaleSequenceStarted = false;
let finaleWorldText = null;
let qaFocusPlanet = null;
const tiltState = { enabled: false, targetX: 0, targetY: 0, currentX: 0, currentY: 0, appliedX: 0, appliedY: 0, button: null };

function setupTiltMode() {
  if (queryFlags.fxOff || queryFlags.cinema || prefersReducedMotion || !matchMedia('(pointer: coarse)').matches) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'tilt-mode-button';
  button.textContent = 'เปิดโหมดเอียงเครื่อง';
  button.setAttribute('aria-pressed', 'false');
  uiDirector.show({ id: 'tilt-mode', zone: 'bottom-left', layer: 'action', exclusive: false, element: button, states: ['EXPLORE', 'EPILOGUE'] });
  tiltState.button = button;
  const onOrientation = (event) => {
    tiltState.targetX = THREE.MathUtils.clamp((event.gamma || 0) / 30, -1, 1) * 0.052;
    tiltState.targetY = THREE.MathUtils.clamp((event.beta || 0) / 30, -1, 1) * 0.052;
  };
  button.addEventListener('click', async () => {
    if (tiltState.enabled) {
      window.removeEventListener('deviceorientation', onOrientation);
      tiltState.enabled = false;
      tiltState.targetX = 0;
      tiltState.targetY = 0;
      button.textContent = 'เปิดโหมดเอียงเครื่อง';
      button.setAttribute('aria-pressed', 'false');
      return;
    }
    try {
      if (typeof window.DeviceOrientationEvent?.requestPermission === 'function') {
        const permission = await window.DeviceOrientationEvent.requestPermission();
        if (permission !== 'granted') return;
      }
      window.addEventListener('deviceorientation', onOrientation, { passive: true });
      tiltState.enabled = true;
      button.textContent = 'ปิดโหมดเอียงเครื่อง';
      button.setAttribute('aria-pressed', 'true');
    } catch {
      button.disabled = true;
    }
  });
}

function stopCakeMic() {
  if (cakeMicFrame) cancelAnimationFrame(cakeMicFrame);
  cakeMicFrame = 0;
  cakeMicStream?.getTracks().forEach((track) => track.stop());
  cakeMicStream = null;
  cakeMicContext?.close().catch(() => {});
  cakeMicContext = null;
}

function showEpilogueActions() {
  uiDirector.hide('epilogue-actions');
  const panel = document.createElement('div');
  panel.className = 'ui-epilogue-actions';
  panel.innerHTML = '<button type="button" data-action="memory">ดูความทรงจำอีกครั้ง</button><button type="button" data-action="cake">เป่าเทียนอีกครั้ง</button><button type="button" data-action="capture">เก็บภาพ</button>';
  const handle = uiDirector.show({ id: 'epilogue-actions', zone: 'bottom-right', layer: 'action', exclusive: false, element: panel, states: ['EPILOGUE'] });
  panel.querySelector('[data-action="memory"]').addEventListener('click', () => {
    uiDirector.hide('epilogue-actions');
    finaleSequenceStarted = false;
    solarSystem.setFinaleMode(false);
    flow.go('EXPLORE');
    flyToPlanet(1);
  });
  panel.querySelector('[data-action="cake"]').addEventListener('click', startFinaleSequence);
  panel.querySelector('[data-action="capture"]').addEventListener('click', () => { captureRequestPending = true; });
  return handle;
}

function enterEpilogue() {
  if (finaleWorldText) { finaleWorldText.dispose(); finaleWorldText = null; }
  finaleSequenceStarted = false;
  uiDirector.hideAll();
  flow.go('EPILOGUE');
  document.body.classList.remove('flow-finale');
  solarSystem.setFinaleMode(false);
  solarSystem.setCakeStage(false);
  orbitClock.scale = 1;
  controls.autoRotate = true;
  returnToCenterOrbit();
  flow.after(showEpilogueActions, prefersReducedMotion ? 0 : 350, 'EPILOGUE');
}

function dismissFinaleAfterCake() {
  uiDirector.hide('cake-actions');
  cakeActions = null;
  stopCakeMic();
  gsap.to(cosmicCake.group.position, {
    y: -30,
    duration: prefersReducedMotion ? 0.18 : 0.7,
    ease: 'power2.in',
    onComplete: () => { cosmicCake.hide(); solarSystem.setCakeStage(false); }
  });
  const message = OPTIONAL_FEATURE_CONTENT.finalMessage.trim();
  if (!message || queryFlags.fxOff || prefersReducedMotion) {
    enterEpilogue();
    return;
  }
  flow.go('FINALE_LETTER');
  const letter = document.createElement('div');
  letter.className = 'finale-letter-card';
  const text = document.createElement('p');
  letter.append(text);
  let index = 0;
  const handle = uiDirector.show({ id: 'finale-letter', zone: 'center-stage', layer: 'cinematic', exclusive: true, ttl: 6500, element: letter, states: ['FINALE_LETTER'] });
  const timer = window.setInterval(() => {
    text.textContent = message.slice(0, index += 1);
    if (index >= [...message].length) window.clearInterval(timer);
  }, Math.max(20, 6000 / [...message].length));
  letter.addEventListener('click', () => uiDirector.hide('finale-letter'));
  handle.el.addEventListener('ui-director-removed', () => { window.clearInterval(timer); enterEpilogue(); }, { once: true });
}

function celebrateCake() {
  stopCakeMic();
  flow.go('FINALE_LETTER');
  fireworks.triggerStarBurst(new THREE.Vector3(0, 10, -5));
  dismissFinaleAfterCake();
}

function finishCake() {
  if (!cosmicCake.blown) cosmicCake.blowOut(celebrateCake, () => soundManager.playCandleBell());
}

function showCakeActions() {
  if (cakeActions) return;
  solarSystem.setFinaleMode(true);
  solarSystem.setCakeStage(true);
  if (queryFlags.fxOff || !cosmicCake.reveal(() => soundManager.playMusicBoxTone(1174.66, 0.055, 0.018))) {
    flow.go('FINALE_CAKE');
    const card = document.createElement('div');
    card.className = 'finale-letter-card lite';
    const text = document.createElement('p');
    text.textContent = OPTIONAL_FEATURE_CONTENT.secretMessage;
    const close = document.createElement('button');
    close.type = 'button';
    close.textContent = 'กลับสู่วงโคจร';
    card.append(text, close);
    uiDirector.show({ id: 'light-finale', zone: 'center-stage', layer: 'cinematic', exclusive: true, element: card, states: ['FINALE_CAKE'] });
    close.addEventListener('click', enterEpilogue);
    return;
  }
  flow.go('FINALE_CAKE');
  cosmicCake.setMessage(OPTIONAL_FEATURE_CONTENT.secretMessage);
  const panel = document.createElement('div');
  panel.className = 'cake-actions ui-action-slot';
  const blowButton = document.createElement('button');
  blowButton.type = 'button';
  blowButton.className = 'cake-blow-button';
  blowButton.textContent = 'เป่าเทียน 🎂';
  const micButton = document.createElement('button');
  micButton.type = 'button';
  micButton.className = 'cake-mic-button secondary';
  micButton.textContent = 'ใช้ไมค์เป่า';
  panel.append(blowButton, micButton);
  cakeActions = uiDirector.show({ id: 'cake-actions', zone: 'bottom-center', layer: 'action', exclusive: true, element: panel, states: ['FINALE_CAKE'] });
  blowButton.addEventListener('click', finishCake);
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!navigator.mediaDevices?.getUserMedia || !AudioContextClass) micButton.hidden = true;
  micButton.addEventListener('click', async () => {
    if (cakeMicStream || !flow.state.includes('FINALE_CAKE')) return;
    try {
      cakeMicStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      cakeMicContext = new AudioContextClass();
      const analyser = cakeMicContext.createAnalyser();
      analyser.fftSize = 1024;
      cakeMicContext.createMediaStreamSource(cakeMicStream).connect(analyser);
      const samples = new Uint8Array(analyser.fftSize);
      let strongFrames = 0;
      const inspectBreath = () => {
        if (document.hidden || flow.state !== 'FINALE_CAKE') { stopCakeMic(); return; }
        analyser.getByteTimeDomainData(samples);
        let energy = 0;
        for (const sample of samples) { const normalized = (sample - 128) / 128; energy += normalized * normalized; }
        if (Math.sqrt(energy / samples.length) > 0.11) strongFrames += 1;
        else strongFrames = Math.max(0, strongFrames - 1);
        if (strongFrames >= 4) { finishCake(); return; }
        cakeMicFrame = requestAnimationFrame(inspectBreath);
      };
      cakeMicFrame = requestAnimationFrame(inspectBreath);
    } catch { stopCakeMic(); }
  });
}

function startFinaleSequence() {
  if (finaleSequenceStarted || visitedMemories.size < 5) return;
  finaleSequenceStarted = true;
  stopCakeMic();
  uiDirector.hideAll();
  document.body.classList.add('flow-finale');
  flow.go('FINALE_ALIGN');
  controls.autoRotate = false;
  isCinematicFlying = true;
  solarSystem.setFinaleMode(true);
  solarSystem.setFinaleHeart(true);
  gsap.to(orbitClock, { scale: 0, duration: prefersReducedMotion ? 0.1 : 1.0, ease: 'power2.out' });
  const portrait = window.innerHeight > window.innerWidth;
  const targetPosition = new THREE.Vector3(0, portrait ? 45 : 30, portrait ? 245 : 175);
  gsap.to(camera.position, { x: targetPosition.x, y: targetPosition.y, z: targetPosition.z, duration: prefersReducedMotion ? .2 : 2.4, ease: 'power3.inOut' });
  gsap.to(controls.target, { x: 0, y: 0, z: -6, duration: prefersReducedMotion ? .2 : 2.4, ease: 'power3.inOut', onComplete: () => {
    isCinematicFlying = false;
    flow.go('FINALE_HEART');
    flow.after(() => {
      flow.go('FINALE_CAKE');
      solarSystem.setFinaleHeart(false);
      showCakeActions();
    }, prefersReducedMotion ? 500 : 2800);
  }});
}

function setupShootingStarWishes() {
  const messages = OPTIONAL_FEATURE_CONTENT.shootingStarMessages.filter((message) => typeof message === 'string' && message.trim());
  if (!messages.length || queryFlags.fxOff || prefersReducedMotion) return;
  shootingWishCard = true;
}

function setupCinemaRecorder() {
  if (!queryFlags.cinema || !canvas.captureStream || !window.MediaRecorder) return;
  const mimeType = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
    .find((type) => MediaRecorder.isTypeSupported?.(type));
  if (!mimeType) return;
  cinemaButton = document.createElement('button');
  cinemaButton.type = 'button';
  cinemaButton.className = 'cinema-record-button';
  cinemaButton.textContent = 'อัดคลิป';
  uiDirector.show({ id: 'cinema-recorder', zone: 'bottom-left', layer: 'action', exclusive: false, element: cinemaButton, states: ['FLIGHT', 'ARRIVAL', 'EXPLORE', 'EPILOGUE'] });
  cinemaButton.addEventListener('click', () => {
    if (cinemaRecorder?.state === 'recording') {
      cinemaRecorder.stop();
      return;
    }
    cinemaStream = canvas.captureStream(60);
    soundManager.startRecordingAudio()?.getAudioTracks().forEach((track) => cinemaStream.addTrack(track));
    const chunks = [];
    cinemaRecorder = new MediaRecorder(cinemaStream, { mimeType });
    cinemaRecorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
    cinemaRecorder.onstop = () => {
      const file = new Blob(chunks, { type: mimeType });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(file);
      link.download = 'ดาวลูกหมู-001.webm';
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
      cinemaStream?.getTracks().forEach((track) => track.stop());
      cinemaStream = null;
      soundManager.stopRecordingAudio();
      cinemaButton.textContent = 'อัดคลิป';
      document.body.classList.remove('cinema-recording');
    };
    cinemaRecorder.start(500);
    cinemaButton.textContent = 'หยุดและบันทึก';
    document.body.classList.add('cinema-recording');
  });
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && cinemaRecorder?.state === 'recording') cinemaRecorder.stop();
  });
}

function setupMobileToolsMenu() {
  if (!window.matchMedia('(max-width: 520px)').matches) return;
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'mobile-tools-toggle';
  toggle.textContent = '⋯';
  toggle.setAttribute('aria-label', 'เมนูเครื่องมือ');
  toggle.setAttribute('aria-expanded', 'false');
  uiDirector.show({ id: 'mobile-tools-toggle', zone: 'bottom-right', layer: 'action', exclusive: false, element: toggle, states: ['EXPLORE', 'EPILOGUE'] });
  toggle.addEventListener('click', () => {
    const open = document.body.classList.toggle('mobile-tools-open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  window.addEventListener('memory-modal-opened', () => {
    document.body.classList.remove('mobile-tools-open');
    toggle.setAttribute('aria-expanded', 'false');
  });
}

function setupBirthdayCountdown() {
  const rawDate = OPTIONAL_FEATURE_CONTENT.birthdayDate.trim();
  const target = rawDate ? new Date(rawDate).getTime() : NaN;
  const params = new URLSearchParams(location.search);
  const simulatedNow = params.get('now') ? new Date(params.get('now')).getTime() : Date.now();
  if (!Number.isFinite(target) || !Number.isFinite(simulatedNow)) return;
  if (target <= simulatedNow) {
    if (rawDate) fireworks.triggerStarBurst(new THREE.Vector3(0, 8, -5));
    return;
  }
  const clockStartedAt = performance.now();
  const overlay = document.createElement('div');
  overlay.className = 'birthday-countdown';
  overlay.innerHTML = '<div><span>ดาวลูกหมู-001 เปิดทำการใน</span><strong aria-live="polite"></strong></div>';
  document.body.append(overlay);
  const number = overlay.querySelector('strong');
  const tick = () => {
    const now = simulatedNow + (performance.now() - clockStartedAt);
    const remaining = target - now;
    if (remaining <= 0) {
      overlay.remove();
      fireworks.triggerStarBurst(new THREE.Vector3(0, 8, -5));
      return;
    }
    const days = Math.floor(remaining / 86400000);
    const hours = Math.floor((remaining % 86400000) / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    number.textContent = `${days} วัน · ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    setTimeout(tick, 1000);
  };
  tick();
}
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
    solarSystem.setQuality(next);
    galaxy.setQuality(next.backgroundStars);
    spiralGalaxy.setQuality(next.galaxyStars);
    renderTarget.samples = renderer.capabilities.isWebGL2 ? next.samples : 0;
    composer.renderTarget1.samples = renderer.capabilities.isWebGL2 ? next.samples : 0;
    composer.renderTarget2.samples = renderer.capabilities.isWebGL2 ? next.samples : 0;
    composer.renderTarget1.dispose();
    composer.renderTarget2.dispose();
    bloomPass.strength = next.bloomStrength;
    if (next.tier === 'low' || next.tier === 'medium') bokehPass.enabled = false;
    syncCinematicPass();
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
  bokehPass.enabled = (currentQuality.tier === 'high' || currentQuality.tier === 'ultra') && !prefersReducedMotion;
  hud.hide();
  isCinematicFlying = true;
  controls.autoRotate = false;
  gsap.to(orbitClock, { scale: 0.04, duration: 1.0, ease: 'power2.out' });

  const tour = gsap.timeline({
    onComplete: () => {
      isCinematicFlying = false;
      controls.autoRotate = false;
      bokehPass.enabled = false;
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
    spiralGalaxy.setGalaxyView(true);
    name3DText.show();
    galaxy.triggerGrandShower?.(10);
  }, [], revealAt + 3.1);
  tour.to({}, { duration: 3.0 }, revealAt + 3.2);
}

function startCinematicApproach(onComplete) {
  isCinematicFlying = true;
  let flightFinished = false;
  flow.go('FLIGHT');
  controls.autoRotate = false;
  isWarpActive = true;
  wormhole.setActive(!prefersReducedMotion);

  const skipBtn = document.createElement('button');
  skipBtn.id = 'btn-skip-flight';
  skipBtn.className = 'skip-flight-btn ui-action-slot';
  skipBtn.innerHTML = '<span>ข้ามฉากเดินทาง ⏩</span>';
  const skipHandle = uiDirector.show({ id: 'skip-flight', zone: 'bottom-center', layer: 'action', exclusive: true, element: skipBtn, states: ['FLIGHT'] });

  soundManager.playWhooshSound();

  const finishFlight = () => {
    if (flightFinished) return;
    flightFinished = true;
    if (approachTimeline) approachTimeline.kill();
    isWarpActive = false;
    wormhole.setActive(false);
    warpStreakMat.opacity = 0;
    warpSurgeMat.opacity = 0;
    warpRingsData.forEach(r => { r.mat.opacity = 0; });
    warpStreakMesh.visible = false;
    warpRingGroup.visible = false;
    warpSurgePoints.visible = false;
    skipHandle.dispose();
    flow.go('ARRIVAL');

    camera.fov = heroPose.fov;
    camera.rotation.z = 0;
    camera.updateProjectionMatrix();
    camera.position.copy(defaultCameraPos);
    controls.target.copy(defaultCameraTarget);
    bloomPass.strength = 0.24;
    isCinematicFlying = false;
    controls.autoRotate = true;
    if (queryFlags.cinema) {
      runCinemaDirector();
      return;
    }
    const finishArrival = () => {
      if (!queryFlags.fxOff) soundManager.playMusicBoxTone(880, 0.8, 0.06);
      if (onComplete) onComplete();
      flow.go('EXPLORE');
      showArrivalCelebrationFlow(soundManager, { uiDirector, scene, camera, worldTextRegistry: activeWorldTexts, reducedMotion: prefersReducedMotion, quality: currentQuality });
    };
    if (queryFlags.fxOff) finishArrival();
    else solarSystem.startArrivalShape({ reducedMotion: prefersReducedMotion, onComplete: finishArrival });
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
function playPlanetSignature(planetItem) {
  if (queryFlags.fxOff || prefersReducedMotion) return;
  const planet = planetItem.group;
  const radius = planetItem.config.radius;
  let effect;
  if (planetItem.id === 1) {
    effect = new THREE.Mesh(new THREE.RingGeometry(radius * 1.05, radius * 1.16, 64),
      new THREE.MeshBasicMaterial({ color: 0xffd88a, transparent: true, opacity: 0.82, side: THREE.DoubleSide }));
    effect.rotation.x = Math.PI / 2;
    effect.scale.setScalar(0.1);
    planet.add(effect);
    gsap.to(effect.scale, { x: 1, y: 1, z: 1, duration: 0.85, ease: 'back.out(1.7)' });
  } else if (planetItem.id === 2) {
    const auroraMaterial = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: `varying vec2 vUv; uniform float uTime; void main(){
        float band = smoothstep(0.05,0.3,sin(vUv.y*24.0 + sin(vUv.x*9.0+uTime*0.65)*1.2)*0.5+0.5);
        float curtains = smoothstep(0.38,0.95,sin(vUv.x*32.0+uTime*0.35)*0.5+0.5);
        float mask = smoothstep(0.04,0.2,vUv.y)*(1.0-smoothstep(0.68,0.92,vUv.y));
        vec3 col = mix(vec3(0.45,0.22,0.9),vec3(0.18,0.95,0.72),curtains);
        gl_FragColor=vec4(col,band*mask*0.52);
      }`,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    effect = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.075, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.58), auroraMaterial);
    effect.userData.aurora = true;
    activeAuroras.add(effect);
    planet.add(effect);
    gsap.to(effect.rotation, { y: 0.25, duration: 3, ease: 'sine.inOut' });
  } else if (planetItem.id === 3) {
    const count = currentQuality.tier === 'low' ? 28 : currentQuality.tier === 'medium' ? 54 : 90;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * radius * 3;
      positions[i * 3 + 1] = (Math.random() - 0.5) * radius * 1.4;
      positions[i * 3 + 2] = (Math.random() - 0.5) * radius * 0.15;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    effect = new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0xf97362, size: radius * 0.045, transparent: true, opacity: 0.8, depthWrite: false }));
    planet.add(effect);
    gsap.to(effect.position, { x: radius * 2, duration: 1.7, ease: 'power2.out' });
  } else if (planetItem.id === 4) {
    const spot = new THREE.Mesh(new THREE.CircleGeometry(radius * 0.19, 32),
      new THREE.MeshBasicMaterial({ color: 0xe86954, transparent: true, opacity: 0.74, side: THREE.DoubleSide }));
    spot.position.set(0, radius * 0.18, radius * 0.93);
    spot.rotation.x = -0.12;
    planet.add(spot);
    effect = spot;
    gsap.to(effect.rotation, { z: Math.PI * 2, duration: 4, ease: 'none' });
  } else if (planetItem.id === 5) {
    const petal = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.045, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0xffa4c9, transparent: true, opacity: 0.9 }));
    petal.position.set(radius * 0.2, radius * 0.85, 0);
    planet.add(petal);
    effect = petal;
    gsap.to(petal.position, { x: radius * 0.75, y: radius * 0.15, z: radius * 0.4, duration: 2.2, ease: 'power1.in' });
  }
  if (!effect) return;
  gsap.delayedCall(4, () => {
    activeAuroras.delete(effect);
    planet.remove(effect);
    effect.geometry?.dispose();
    if (Array.isArray(effect.material)) effect.material.forEach((material) => material.dispose());
    else effect.material?.dispose();
  });
}

function flyToPlanet(planetId) {
  if (isCinematicFlying || polaroidModal?.isOpen || finaleSequenceStarted) return;
  const planetItem = solarSystem.planetsList.find(p => p.id === planetId);
  if (!planetItem) return;

  isCinematicFlying = true;
  flow.go('FOCUS');
  controls.autoRotate = false;
  gsap.to(orbitClock, { scale: 0.04, duration: 0.8, ease: 'power2.out' });
  controls.minDistance = 6.0;
  controls.maxDistance = 180;
  isGalaxyView = false;
  spiralGalaxy.setGalaxyView(false);
  hud.setGalaxyMode(false);
  name3DText.hide();

  // Mark visited
  if (!visitedMemories.has(planetId)) {
    visitedMemories.add(planetId);
    solarSystem.markVisited(planetId);
    hud.updateProgress(visitedMemories);
  }
  if (!queryFlags.fxOff && !prefersReducedMotion && navigator.vibrate) navigator.vibrate(12);
  if (planetId === 5) solarSystem.showFinalRose();

  soundManager.playPlanetNote(planetId);
  playPlanetSignature(planetItem);

  const targetLookAt = planetItem.group.position.clone();
  const isFinalPlanet = planetId === solarSystem.planetsList[solarSystem.planetsList.length - 1]?.id;
  // Give the final planet a closer hero shot, then hold it briefly before the
  // memory card covers the scene. Keep the usual wider composition for others.
  const cameraOffset = isFinalPlanet
    ? new THREE.Vector3(0, planetItem.config.radius * 1.1, planetItem.config.radius * 2.7)
    : new THREE.Vector3(0, planetItem.config.radius * 1.5, planetItem.config.radius * 3.8);
  const targetCamPos = targetLookAt.clone().add(cameraOffset);

  const currentDist = camera.position.distanceTo(targetCamPos);
  bokehPass.enabled = (currentQuality.tier === 'high' || currentQuality.tier === 'ultra') && !prefersReducedMotion;
  if (bokehPass.enabled) {
    gsap.to(bokehPass.uniforms.focus, { value: Math.max(6, currentDist), duration: 0.75, ease: 'power2.out' });
    gsap.to(bokehPass.uniforms.aperture, { value: 0.00028, duration: 0.7, ease: 'power2.out' });
  }
  const duration = isFinalPlanet
    ? (currentDist > 90 ? 2.8 : 2.0)
    : (currentDist > 90 ? 2.2 : 1.5);
  const focusCaption = document.createElement('div');
  focusCaption.className = 'ui-captions focus-caption';
  focusCaption.textContent = `PLANET 0${planetId} · ${planetItem.config.name}`;
  uiDirector.show({ id: 'planet-focus-caption', zone: 'bottom-center', layer: 'cinematic', exclusive: true, ttl: duration * 1000 + (isFinalPlanet ? 800 : 450), element: focusCaption, states: ['FOCUS'] });

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
      bokehPass.enabled = false;
      bokehPass.uniforms.aperture.value = 0.00012;
      const worldPoint = planetItem.group.getWorldPosition(new THREE.Vector3()).project(camera);
      const modalOrigin = {
        x: (worldPoint.x * 0.5 + 0.5) * window.innerWidth,
        y: (-worldPoint.y * 0.5 + 0.5) * window.innerHeight
      };
      if (isFinalPlanet) {
        gsap.delayedCall(0.9, () => polaroidModal.show(planetItem.memory, modalOrigin));
      } else {
        polaroidModal.show(planetItem.memory, modalOrigin);
      }
    }
  });
}

function returnToCenterOrbit() {
  isCinematicFlying = true;
  controls.autoRotate = true;
  controls.minDistance = 16.0;
  controls.maxDistance = Math.max(240, defaultCameraPos.length() + 48);
  isGalaxyView = false;
  spiralGalaxy.setGalaxyView(false);
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
  spiralGalaxy.setGalaxyView(targetState);
  isCinematicFlying = true;
  if (polaroidModal.isOpen) polaroidModal.close(false);

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
  onTypeTick: () => soundManager.playLetterTick(),
  onCapture: () => { captureRequestPending = true; },
  onNext: (nextId) => {
    polaroidModal.close(false);
    setTimeout(() => flyToPlanet(nextId), 380);
  },
  onBackToGalaxy: () => {
    uiDirector.setModalOpen(false);
    if (visitedMemories.size === solarSystem.planetsList.length) startFinaleSequence();
    else {
      flow.go('EXPLORE');
      returnToCenterOrbit();
    }
  },
  onWish: () => {
    fireworks.triggerMakeAWish();
    if (galaxy?.triggerGrandShower) galaxy.triggerGrandShower(10);
  }
});

window.addEventListener('memory-modal-opened', () => {
  uiDirector.setModalOpen(true);
  flow.go('MEMORY');
});
window.addEventListener('memory-modal-closed', () => uiDirector.setModalOpen(false));

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
    if (polaroidModal.isOpen) polaroidModal.close(false);
    returnToCenterOrbit();
  },
  onToggleGalaxy: () => {
    toggleGalaxyView();
  },
  onSelectMemory: (id) => {
    if (polaroidModal.isOpen) polaroidModal.close(false);
    flyToPlanet(id);
  }
});
// Wait for local planet textures so the introduction never opens onto an empty scene.
await texturesReady;
loadingOverlay?.classList.add('asset-loading-done');

// Intro Screen: 3-2-1 Countdown & Journey Trigger
if (queryFlags.skipIntro || queryFlags.cinema) {
  flow.go(queryFlags.cinema ? 'FLIGHT' : 'EXPLORE');
  camera.position.copy(queryFlags.cinema ? deepSpacePos : defaultCameraPos);
  controls.target.copy(queryFlags.cinema ? new THREE.Vector3(0, 0, 0) : defaultCameraTarget);
  if (queryFlags.cinema) {
    hud.hide();
  } else {
    hud.show();
    hud.setSoundPlayingState(false);
    setupTiltMode();
  }
} else {
  flow.go('INTRO');
  new IntroScreen({
    soundManager,
    onEnter: () => {
      startCinematicApproach(() => {
        hud.show();
        hud.setSoundPlayingState(soundManager.isPlaying());
        setupTiltMode();
      });
    }
  });
}

if (queryFlags.qaScene === 'name-front') {
  hud.hide();
  isGalaxyView = true;
  spiralGalaxy.setGalaxyView(true);
  name3DText.show();
  camera.fov = 34;
  camera.position.set(0, 36, 72);
  controls.target.set(0, 36, -220);
  controls.minDistance = 10;
  controls.maxDistance = 500;
  camera.updateProjectionMatrix();
  controls.update();
} else if (queryFlags.qaScene === 'bulge-closeup') {
  hud.hide();
  name3DText.hide();
  camera.fov = 32;
  camera.position.set(0, -35, 120);
  controls.target.set(0, -35, -95);
  controls.minDistance = 10;
  controls.maxDistance = 500;
  camera.updateProjectionMatrix();
  controls.update();
} else if (queryFlags.qaScene === 'arrival-constellation') {
  hud.hide();
  camera.position.copy(defaultCameraPos);
  controls.target.copy(defaultCameraTarget);
  solarSystem.startArrivalShape({ reducedMotion: prefersReducedMotion, qaPreview: true });
} else if (queryFlags.qaScene === 'final-heart') {
  hud.hide();
  camera.position.copy(defaultCameraPos);
  controls.target.copy(defaultCameraTarget);
  for (const planet of solarSystem.planetsList) solarSystem.markVisited(planet.id);
  solarSystem.setFinaleMode(true);
  solarSystem.setFinaleHeart(true);
} else if (queryFlags.qaScene === 'signature-earth') {
  hud.hide();
  camera.position.copy(defaultCameraPos);
  controls.target.copy(defaultCameraTarget);
  const earth = solarSystem.planetsList.find((planet) => planet.id === 2);
  if (earth) {
    qaFocusPlanet = earth;
    controls.minDistance = 3;
    playPlanetSignature(earth);
  }
} else if (queryFlags.qaScene === 'modal-slide') {
  hud.hide();
  flyToPlanet(2);
} else if (queryFlags.qaScene === 'cake') {
  hud.hide();
  camera.position.set(0, 24, 150);
  controls.target.set(0, 4, -5);
  for (const planet of solarSystem.planetsList) solarSystem.markVisited(planet.id);
  showCakeActions();
}

setupShootingStarWishes();
setupCinemaRecorder();
setupMobileToolsMenu();
setupBirthdayCountdown();

// -----------------------------------------------------------------------------
// 8. Raycasting & Interactive Solar System Planets
// -----------------------------------------------------------------------------
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let pointerDownPosition = null;

function updatePointer(e) {
  const x = e.clientX ?? e.touches?.[0]?.clientX;
  const y = e.clientY ?? e.touches?.[0]?.clientY;
  if (x === undefined || y === undefined) return;
  const rect = canvas.getBoundingClientRect();
  if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
    pointer.set(2, 2);
    return false;
  }
  pointer.x = ((x - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((y - rect.top) / rect.height) * 2 + 1;
  return true;
}

window.addEventListener('pointermove', (e) => {
  if (!updatePointer(e)) {
    if (currentHoveredMesh) solarSystem.setHover(currentHoveredMesh, false);
    currentHoveredMesh = null;
    return;
  }
  pointerStarTrail?.spawn(e.clientX, e.clientY, canvas.getBoundingClientRect());
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

  if (!updatePointer(e)) return;
  raycaster.setFromCamera(pointer, camera);
  const wishMessages = OPTIONAL_FEATURE_CONTENT.shootingStarMessages.filter((message) => typeof message === 'string' && message.trim());
  if (shootingWishCard && flow.state === 'EXPLORE' && wishMessages.length && shootingStarClicks < 5 && !polaroidModal.isOpen && galaxy.pickMeteor(raycaster)) {
    shootingStarClicks += 1;
    const message = wishMessages[(shootingStarClicks - 1) % wishMessages.length];
    const wishCard = document.createElement('div');
    wishCard.className = 'shooting-wish-card ui-captions';
    wishCard.setAttribute('role', 'status');
    wishCard.textContent = `ขอพรหนึ่งข้อ ✨ ${message}`;
    uiDirector.show({ id: 'shooting-wish', zone: 'center-stage', layer: 'toast', exclusive: true, ttl: 2600, element: wishCard });
    return;
  }
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
  if (!isGalaxyView) controls.maxDistance = Math.max(240, defaultCameraPos.length() + 48);
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

function downloadBirthdaySnapshot() {
  let renderedFrame;
  try {
    // Copy the just-rendered frame synchronously, before the browser releases
    // the WebGL drawing buffer at the end of this animation frame.
    renderedFrame = canvas.toDataURL('image/png');
  } catch (error) {
    console.warn('Could not read the rendered WebGL frame for the birthday image.', error);
    return;
  }
  if (renderedFrame.length < 1000) return;
  const image = new Image();
    image.onload = () => {
      const frame = document.createElement('canvas');
      frame.width = image.width;
      frame.height = image.height;
      const context = frame.getContext('2d');
      context.fillStyle = '#080516';
      context.fillRect(0, 0, frame.width, frame.height);
      context.drawImage(image, 0, 0);
      const margin = Math.max(18, Math.round(frame.width * 0.018));
      context.strokeStyle = 'rgba(255, 226, 244, 0.92)';
      context.lineWidth = Math.max(3, Math.round(frame.width * 0.003));
      context.strokeRect(margin, margin, frame.width - margin * 2, frame.height - margin * 2);
      const bandHeight = Math.max(76, Math.round(frame.height * 0.085));
      const gradient = context.createLinearGradient(0, frame.height - bandHeight, 0, frame.height);
      gradient.addColorStop(0, 'rgba(20, 8, 38, 0.0)');
      gradient.addColorStop(1, 'rgba(20, 8, 38, 0.88)');
      context.fillStyle = gradient;
      context.fillRect(0, frame.height - bandHeight, frame.width, bandHeight);
      context.textAlign = 'center';
      context.textBaseline = 'bottom';
      context.font = `700 ${Math.max(24, Math.round(frame.width * 0.032))}px Prompt, sans-serif`;
      context.fillStyle = '#fff0f8';
      context.shadowColor = 'rgba(0,0,0,.8)';
      context.shadowBlur = 8;
      context.fillText('Happy Birthday ข้าวหอม 💗', frame.width / 2, frame.height - margin * 1.6);
      frame.toBlob((result) => {
        if (!result) return;
        const url = URL.createObjectURL(result);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'happy-birthday-khaohom.png';
        link.click();
        URL.revokeObjectURL(url);
      }, 'image/png');
    };
  image.src = renderedFrame;
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopCakeMic();
  else clock.start();
});

function animate() {
  requestAnimationFrame(animate);
  if (document.hidden || webglContextLost) return;
  stats?.begin();

  const delta = Math.min(clock.getDelta(), 0.1);
  const time = clock.getElapsedTime();
  cinematicPass.uniforms.uTime.value = time;
  orbitClock.time += delta * orbitClock.scale;

  controls.update();
  const tiltEase = prefersReducedMotion ? 1 : Math.min(1, delta * 5);
  tiltState.currentX += (tiltState.targetX - tiltState.currentX) * tiltEase;
  tiltState.currentY += (tiltState.targetY - tiltState.currentY) * tiltEase;
  const parallaxDistance = camera.position.distanceTo(controls.target);
  camera.position.x += (tiltState.currentX - tiltState.appliedX) * parallaxDistance;
  camera.position.y += (tiltState.currentY - tiltState.appliedY) * parallaxDistance;
  tiltState.appliedX = tiltState.currentX;
  tiltState.appliedY = tiltState.currentY;

  galaxy.update(delta, time);
  spiralGalaxy.update(delta, time, camera);
  const musicBass = soundManager.getMusicBassEnergy();
  solarSystem.update(delta, orbitClock.time, time, musicBass);
  if (qaFocusPlanet) {
    solarSystem.group.updateMatrixWorld(true);
    const focus = qaFocusPlanet.group.getWorldPosition(new THREE.Vector3());
    controls.target.copy(focus);
    camera.position.copy(focus).add(new THREE.Vector3(0, qaFocusPlanet.config.radius * 2.1, qaFocusPlanet.config.radius * 5.2));
    controls.update();
  }
  activeAuroras.forEach((aurora) => { aurora.material.uniforms.uTime.value = time; });
  activeWorldTexts.forEach((item) => {
    item.update(delta, camera, prefersReducedMotion);
    if (item.disposed) activeWorldTexts.delete(item);
  });
  cosmicCake.update(delta, time);
  pointerStarTrail?.update(delta);
  heartStreak?.update(delta, musicBass);
  bloomPass.strength = currentQuality.bloomStrength + Math.min(0.05, musicBass * 0.05);
  fireworks.update(delta);
  updateWarpStreaks(delta);
  name3DText.update(delta, time, camera);
  wormhole.update(time, camera, isWarpActive && !prefersReducedMotion, approachTimeline?.progress() ?? 0);
  frameGovernor.update(delta);

  // Render through EffectComposer with UnrealBloomPass for celestial glowing aesthetics
  composer.render();
  if (captureRequestPending) {
    captureRequestPending = false;
    downloadBirthdaySnapshot();
  }
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
