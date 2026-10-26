import { createArrivalNumber } from '../scene/arrivalNumber.js';
import { createArrivalNameReveal } from '../scene/name3DText.js';
import { ledger } from './guideLedger.js';

export function showArrivalCelebrationFlow(soundManager, {
  uiDirector,
  flow,
  scene,
  camera,
  solarSystem,
  worldTextRegistry,
  reducedMotion = false,
  quality = { tier: 'medium' },
  startAtName = false
} = {}) {
  const isQa = new URLSearchParams(location.search).get('qa')?.startsWith('arrival-');
  let currentStep = startAtName ? 'name' : 'number';
  let skipCurrentStep = null;
  let flowTimer = null;
  let number = null;
  let nameReveal = null;
  let isCleanedUp = false;

  // Hide planet beacons during arrival sequence to keep hero name reveal clutter-free
  solarSystem?.setBeaconsVisible(false);

  const cleanupListeners = () => {
    if (isCleanedUp) return;
    isCleanedUp = true;
    if (flowTimer) {
      clearTimeout(flowTimer);
      flowTimer = null;
    }
    solarSystem?.setBeaconsVisible(true);
    window.removeEventListener('pointerdown', onScreenTap);
  };

  // Window tap listener to step through arrival sequence safely
  const onScreenTap = (e) => {
    // Ignore interactive UI clicks like HUD or buttons
    if (e.target.closest('button, .hud-top-actions, .polaroid-modal, .guide-open-card-pill, .bottom-right-dock')) return;
    if (skipCurrentStep) {
      const skipFn = skipCurrentStep;
      skipCurrentStep = null;
      skipFn();
    }
  };
  window.addEventListener('pointerdown', onScreenTap);

  // Auto cleanup on flow state change or modal open
  const onFlowStateChange = () => {
    if (flow && flow.state !== 'EXPLORE' && flow.state !== 'ARRIVAL') {
      cleanupListeners();
    }
  };
  window.addEventListener('memory-modal-opened', cleanupListeners, { once: true });

  // Step 2: Name Reveal "ข้าวหอม"
  const startNameReveal = () => {
    // A1 Guard: only allow transition into name reveal once
    if (currentStep !== 'number' && currentStep !== 'init') return;
    currentStep = 'name';
    if (flowTimer) {
      clearTimeout(flowTimer);
      flowTimer = null;
    }
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
      startCaption();
    };
  };

  // Step 3: Caption with emphasized "ข้าวหอม"
  const startCaption = () => {
    // A2 Guard: only allow transition into caption once
    if (currentStep === 'caption' || currentStep === 'done') return;
    currentStep = 'caption';
    if (flowTimer) {
      clearTimeout(flowTimer);
      flowTimer = null;
    }
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
        currentStep = 'done';
        cleanupListeners();
        showGuideCardPrompt(uiDirector, { reducedMotion });
      }
    });

    skipCurrentStep = () => {
      currentStep = 'done';
      cleanupListeners();
      handle.hide();
    };
  };

  if (startAtName && !isQa) {
    // Phase D9: Particle sequence already led into name, start name reveal directly!
    currentStep = 'init';
    startNameReveal();
  } else {
    // Standard / QA step 1: Number "16" appears with chime
    if (soundManager) soundManager.playChimeSound();
    number = createArrivalNumber(scene, { quality: quality.tier });
    worldTextRegistry?.add(number);

    if (isQa) {
      window.__qaArrivalNumber = number;
      window.__qaArrivalStage = 'number';
    }

    number.show(reducedMotion ? 0.05 : 0.55);

    // Schedule progression
    const numberDuration = reducedMotion ? 800 : 1400;
    if (!isQa) {
      flowTimer = flow?.after(() => {
        flowTimer = null;
        startNameReveal();
      }, numberDuration, 'EXPLORE');
    }

    skipCurrentStep = () => {
      startNameReveal();
    };
  }

  if (isQa) {
    window.__qaAdvanceArrivalStep = () => {
      if (skipCurrentStep) {
        const fn = skipCurrentStep;
        skipCurrentStep = null;
        fn();
      }
    };
  }
}

export function showGuideCardPrompt(uiDirector, { reducedMotion = false } = {}) {
  if (ledger.seen('explore-first')) return null;
  const guideEl = document.createElement('div');
  guideEl.id = 'guide-open-card';
  guideEl.className = 'guide-open-card-pill';
  guideEl.setAttribute('role', 'status');
  guideEl.innerHTML = '<span class="guide-icon">🌸</span><span class="guide-text">แตะดาวศุกร์ดวงแรกเลย</span><span class="guide-arrow">👉✨</span>';

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
    ledger.retire('explore-first');
    window.removeEventListener('memory-modal-opened', onCardOpen);
    handle.hide();
  };

  const onCardOpen = () => cleanup();
  guideEl.addEventListener('click', cleanup, { once: true });
  window.addEventListener('memory-modal-opened', onCardOpen, { once: true });
  return handle;
}
