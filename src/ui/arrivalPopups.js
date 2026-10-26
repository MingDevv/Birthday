import { createArrivalNumber } from '../scene/arrivalNumber.js';
import { createArrivalNameReveal } from '../scene/name3DText.js';

export function showArrivalCelebrationFlow(soundManager, {
  uiDirector,
  flow,
  scene,
  camera,
  solarSystem,
  worldTextRegistry,
  reducedMotion = false,
  quality = { tier: 'medium' }
} = {}) {
  const isQa = new URLSearchParams(location.search).get('qa')?.startsWith('arrival-');
  let currentStep = 'number';
  let skipCurrentStep = null;

  // Hide planet beacons during arrival sequence to keep hero name reveal clutter-free
  solarSystem?.setBeaconsVisible(false);

  // Window tap listener to step through arrival sequence
  const onScreenTap = (e) => {
    // Ignore interactive UI clicks like HUD or buttons
    if (e.target.closest('button, .hud-top-actions, .polaroid-modal, .guide-open-card-pill')) return;
    if (skipCurrentStep) skipCurrentStep();
  };
  window.addEventListener('pointerdown', onScreenTap);

  const cleanupListeners = () => {
    solarSystem?.setBeaconsVisible(true);
    window.removeEventListener('pointerdown', onScreenTap);
  };

  // Step 1: Number "16" appears with chime (t=0.3s)
  if (soundManager) soundManager.playChimeSound();
  const number = createArrivalNumber(scene, { quality: quality.tier });
  worldTextRegistry?.add(number);

  if (isQa) {
    window.__qaArrivalNumber = number;
    window.__qaArrivalStage = 'number';
  }

  number.show(reducedMotion ? 0.05 : 0.55);

  let nameReveal = null;

  // Step 2: Name Reveal "ข้าวหอม" (t=1.6s)
  const startNameReveal = () => {
    currentStep = 'name';
    if (isQa) window.__qaArrivalStage = 'name';

    // Number 16 fades out so it does not overlap with 3D Name
    if (number && !number.disposed) {
      number.hide(reducedMotion ? 0 : 0.28);
    }

    nameReveal = createArrivalNameReveal(scene, camera, { reducedMotion });
    worldTextRegistry?.add(nameReveal);
    if (isQa) window.__qaArrivalName = nameReveal;

    if (soundManager) soundManager.playMusicBoxTone(1046.5, 0.4, 0.04);

    nameReveal.show(() => {
      // Name held for >= 2.4s, proceed to caption
      if (!isQa) startCaption();
    });

    skipCurrentStep = () => {
      skipCurrentStep = null;
      startCaption();
    };
  };

  // Step 3: Caption with emphasized "ข้าวหอม" (t=4.5s)
  const startCaption = () => {
    currentStep = 'caption';
    if (isQa) window.__qaArrivalStage = 'caption';

    if (number && !number.disposed) {
      number.hide(reducedMotion ? 0 : 0.35);
    }
    if (nameReveal && !nameReveal.disposed) {
      nameReveal.hide(reducedMotion ? 0 : 0.45);
    }

    const caption = document.createElement('div');
    caption.className = 'ui-captions arrival-caption arrival-lower-third';
    caption.innerHTML = '<span>สุขสันต์วันเกิดนะ<strong class="name-emph">ข้าวหอม</strong> ขอให้วัย 16 ปีนี้เต็มไปด้วยรอยยิ้ม ความสุข<br>และการเติบโตที่เปล่งประกายที่สุดในจักรวาล 💜</span>';

    const handle = uiDirector.show({
      id: 'arrival-caption',
      zone: 'center-stage',
      layer: 'cinematic',
      exclusive: true,
      ttl: reducedMotion ? 2600 : 7200,
      element: caption,
      onClose: () => {
        cleanupListeners();
        showGuideCardPrompt(uiDirector, { reducedMotion });
      }
    });

    skipCurrentStep = () => {
      skipCurrentStep = null;
      cleanupListeners();
      handle.hide();
    };
  };

  // Schedule progression
  const numberDuration = reducedMotion ? 800 : 1400;
  if (!isQa) {
    flow?.after(() => {
      startNameReveal();
    }, numberDuration, 'EXPLORE');
  }

  skipCurrentStep = () => {
    skipCurrentStep = null;
    startNameReveal();
  };

  if (isQa) {
    window.__qaAdvanceArrivalStep = () => {
      if (skipCurrentStep) skipCurrentStep();
    };
  }
}

export function showGuideCardPrompt(uiDirector, { reducedMotion = false } = {}) {
  const guideEl = document.createElement('div');
  guideEl.id = 'guide-open-card';
  guideEl.className = 'guide-open-card-pill';
  guideEl.setAttribute('role', 'status');
  guideEl.innerHTML = '<span class="guide-icon">💌</span><span class="guide-text">ลองเปิดการ์ดดูสิ</span><span class="guide-arrow">👉✨</span>';

  const handle = uiDirector.show({
    id: 'arrival-guide',
    zone: 'bottom-center',
    layer: 'coach',
    exclusive: true,
    ttl: reducedMotion ? 2500 : 6000,
    element: guideEl,
    states: ['EXPLORE'],
    onClose: () => {
      window.removeEventListener('memory-modal-opened', onCardOpen);
      guideEl.removeEventListener('click', cleanup);
    }
  });

  let dismissed = false;
  const cleanup = () => {
    if (dismissed) return;
    dismissed = true;
    window.removeEventListener('memory-modal-opened', onCardOpen);
    handle.hide();
  };

  const onCardOpen = () => cleanup();
  guideEl.addEventListener('click', cleanup, { once: true });
  window.addEventListener('memory-modal-opened', onCardOpen, { once: true });
  return handle;
}
