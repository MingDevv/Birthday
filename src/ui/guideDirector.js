import * as THREE from 'three';
import { GUIDE_COPY, formatCopy } from '../config/guideCopy.js';
import { startFirstRunTour } from './guideTour.js';
import { createGuideHelpSheet } from './guideHelpSheet.js';

/**
 * =========================================================================
 * 🧭 Guide Director: ศูนย์กลางควบคุมระบบไกด์ "กดอะไรก่อน"
 * กติกาหลัก:
 * 1. แสดงทีละอย่างเดียว (exclusive ใน layer 'coach')
 * 2. ไม่บังการกด (overlay ทั้งหมด pointer-events: none ยกเว้นปุ่มไกด์)
 * 3. หลบ Action Slot (ล่างกลาง) ไม่ทับปุ่มสำคัญ
 * 4. สัญญาการหาย: ลบ DOM, ถอด listener, ล้าง timer ครบถ้วน
 * 5. ปิดได้ด้วย ?guide=off, รีเซ็ตด้วย ?guide=reset
 * =========================================================================
 */
export function createGuideDirector({
  uiDirector,
  flow,
  solarSystem,
  camera,
  renderer,
  hud,
  polaroidModal,
  progress,
  copy = GUIDE_COPY,
  reducedMotion = false,
  onFlyToPlanet
} = {}) {
  const query = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
  const isGuideOff = query.get('guide') === 'off';
  const isGuideReset = query.get('guide') === 'reset';
  const isFastQa = query.get('qaTime') === 'fast';

  if (isGuideReset && typeof sessionStorage !== 'undefined') {
    try {
      sessionStorage.removeItem('tourSeen');
      sessionStorage.removeItem('firstMemoryGuideSeen');
      sessionStorage.removeItem('exploreFirstSeen');
    } catch {}
  }

  // Active guide tracking
  let currentGuideHandle = null;
  let activeSpotlight = null;
  let activePointer3D = null;
  let activeEdgeArrow = null;
  let rAF = null;

  // Idle timer state
  let idleTimer1 = null;
  let idleTimer2 = null;
  let idleTimer3 = null;
  let idleNudgeCount = 0;
  let lastInteractionTime = performance.now();
  let tourInstance = null;

  // Idle thresholds (fast in QA)
  const IDLE_T1 = isFastQa ? 250 : 8000;
  const IDLE_T2 = isFastQa ? 650 : 18000;
  const IDLE_T3 = isFastQa ? 1100 : 35000;

  // Help Sheet instance
  const helpSheet = createGuideHelpSheet({
    uiDirector,
    copy,
    onToggleSound: () => hud?.container?.querySelector('#vinyl-widget')?.click(),
    onResetCamera: () => hud?.container?.querySelector('#btn-reset-cam')?.click(),
    onToggleGalaxy: () => hud?.container?.querySelector('#btn-toggle-galaxy')?.click(),
    onMakeWish: () => hud?.container?.querySelector('#btn-make-wish')?.click(),
    onGoNextPlanet: () => {
      const nextId = progress.getNextId();
      if (nextId) onFlyToPlanet?.(nextId);
    },
    onReplayTour: () => {
      clearAllGuides();
      startTour();
    }
  });

  // Spotlight element
  function getSpotlight() {
    if (!activeSpotlight) {
      activeSpotlight = document.createElement('div');
      activeSpotlight.className = 'guide-spotlight';
      document.body.appendChild(activeSpotlight);
    }
    return activeSpotlight;
  }

  function hideSpotlight() {
    if (activeSpotlight) {
      activeSpotlight.classList.remove('visible');
      setTimeout(() => {
        activeSpotlight?.remove();
        activeSpotlight = null;
      }, 350);
    }
  }

  let epilogueGalaxyTimer = null;
  let epilogueGalaxyCleanup = null;

  function clearAllGuides() {
    if (tourInstance) {
      tourInstance.stop();
      tourInstance = null;
    }
    if (idleTimer1) { clearTimeout(idleTimer1); idleTimer1 = null; }
    if (idleTimer2) { clearTimeout(idleTimer2); idleTimer2 = null; }
    if (idleTimer3) { clearTimeout(idleTimer3); idleTimer3 = null; }
    if (epilogueGalaxyTimer) {
      clearTimeout(epilogueGalaxyTimer);
      epilogueGalaxyTimer = null;
    }
    if (epilogueGalaxyCleanup) {
      epilogueGalaxyCleanup();
      epilogueGalaxyCleanup = null;
    }
    if (currentGuideHandle) {
      currentGuideHandle.dispose();
      currentGuideHandle = null;
    }
    if (activePointer3D) {
      activePointer3D.remove();
      activePointer3D = null;
    }
    if (activeEdgeArrow) {
      activeEdgeArrow.remove();
      activeEdgeArrow = null;
    }
    hideSpotlight();
    if (rAF) {
      cancelAnimationFrame(rAF);
      rAF = null;
    }
  }

  // Shows a gentle toast notification via uiDirector (layer: hud, non-blocking)
  function showToast(text, { ttl = 3500, states = ['EXPLORE', 'FLIGHT'] } = {}) {
    if (isGuideOff) return null;
    const toast = document.createElement('div');
    toast.className = 'guide-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.innerHTML = `<span class="guide-toast-text">${text}</span>`;
    return uiDirector.show({
      id: 'guide-toast-active',
      zone: 'bottom-center',
      layer: 'hud',
      exclusive: false,
      ttl: reducedMotion ? Math.min(ttl, 2500) : ttl,
      element: toast,
      states
    });
  }

  // Shows a gentle coach bubble via uiDirector (layer: coach, exclusive: true)
  function showBubble(text, { ttl = 6000, zone = 'bottom-left', states = ['EXPLORE'], onClose, className = '' } = {}) {
    if (isGuideOff) return null;
    clearAllGuides();

    const bubble = document.createElement('div');
    bubble.className = `guide-bubble ${className}`.trim();
    bubble.setAttribute('role', 'status');
    bubble.setAttribute('aria-live', 'polite');

    bubble.innerHTML = `
      <p class="guide-bubble-text">${text}</p>
      <button class="guide-bubble-close" aria-label="ปิดคำแนะนำ">✕</button>
    `;

    const handle = uiDirector.show({
      id: 'guide-bubble-active',
      zone,
      layer: 'coach',
      exclusive: true,
      ttl: reducedMotion ? Math.min(ttl, 3500) : ttl,
      element: bubble,
      states,
      onClose: () => {
        currentGuideHandle = null;
        onClose?.();
      }
    });

    bubble.querySelector('.guide-bubble-close').addEventListener('click', () => {
      handle.hide();
    });

    currentGuideHandle = handle;
    return handle;
  }

  // 3D planet tracking: Pointer or Edge Arrow
  function pointAtPlanet(planetId, labelText = '') {
    if (isGuideOff || !solarSystem?.planetsList) return;
    // The HUD tour owns the coach layer while active; do not let a later
    // EXPLORE callback put a planet arrow over its card.
    if (tourInstance || document.body.classList.contains('guide-tour-active') || document.querySelector('.guide-tour-card')) return;
    clearAllGuides();

    const planet = solarSystem.planetsList.find((p) => p.id === planetId);
    if (!planet) return;

    // Create 3D pointer and Edge Arrow DOM containers
    const pointer3D = document.createElement('div');
    pointer3D.className = 'guide-3d-pointer';
    pointer3D.innerHTML = `
      <span class="pointer-finger">👇</span>
      <span class="pointer-label">${labelText || planet.config.name}</span>
    `;
    document.body.appendChild(pointer3D);
    activePointer3D = pointer3D;

    const edgeArrow = document.createElement('div');
    edgeArrow.className = 'guide-edge-arrow hidden';
    edgeArrow.innerHTML = `
      <span class="arrow-symbol">➔</span>
      <span class="arrow-text">${labelText || planet.config.name}</span>
    `;
    edgeArrow.addEventListener('click', () => {
      onFlyToPlanet?.(planetId);
      clearAllGuides();
    });
    document.body.appendChild(edgeArrow);
    activeEdgeArrow = edgeArrow;

    const tempV = new THREE.Vector3();

    function updateProjection() {
      if (!camera || !activePointer3D || !activeEdgeArrow) return;

      planet.group.getWorldPosition(tempV);
      tempV.y += planet.config.radius * 1.5;
      tempV.project(camera);

      const W = window.innerWidth;
      const H = window.innerHeight;
      const x = (tempV.x * 0.5 + 0.5) * W;
      const y = (-tempV.y * 0.5 + 0.5) * H;
      const isBehind = tempV.z > 1.0;
      const pad = 36;

      const isOffscreen = isBehind || x < pad || x > W - pad || y < pad + 60 || y > H - pad;

      if (!isOffscreen) {
        // Onscreen: Show 3D finger pointer
        activePointer3D.style.display = 'flex';
        activePointer3D.style.left = `${Math.round(x)}px`;
        activePointer3D.style.top = `${Math.round(y - 12)}px`;
        activeEdgeArrow.classList.add('hidden');
      } else {
        // Offscreen or behind camera: Show screen edge indicator arrow
        activePointer3D.style.display = 'none';
        activeEdgeArrow.classList.remove('hidden');

        // Calculate clamped position along screen edge
        let edgeX = x;
        let edgeY = y;
        if (isBehind) {
          edgeX = W - edgeX;
          edgeY = H - edgeY;
        }

        const clampedX = Math.max(pad + 20, Math.min(W - pad - 120, edgeX));
        const clampedY = Math.max(pad + 70, Math.min(H - pad - 60, edgeY));

        activeEdgeArrow.style.left = `${Math.round(clampedX)}px`;
        activeEdgeArrow.style.top = `${Math.round(clampedY)}px`;

        // Compute angle from screen center to target
        const angle = Math.atan2(edgeY - H / 2, edgeX - W / 2) * (180 / Math.PI);
        const arrowSymbol = activeEdgeArrow.querySelector('.arrow-symbol');
        if (arrowSymbol) {
          arrowSymbol.style.transform = `rotate(${Math.round(angle)}deg)`;
        }
      }

      rAF = requestAnimationFrame(updateProjection);
    }

    rAF = requestAnimationFrame(updateProjection);
  }

  // First-run Tour trigger
  function startTour() {
    if (isGuideOff) return;
    try {
      const tourSeen = sessionStorage.getItem('tourSeen');
      if (tourSeen === 'true') return;
    } catch {}

    // The first-explore guide can leave its 3D planet pointer behind after
    // its bubble closes. The HUD tour has its own spotlight, so remove stale
    // pointers/bubbles before placing the tour card.
    if (tourInstance) {
      tourInstance.stop();
      tourInstance = null;
    }
    clearAllGuides();

    tourInstance = startFirstRunTour({
      uiDirector,
      copy,
      reducedMotion,
      onComplete: () => {
        tourInstance = null;
        resetIdleTimers();
      }
    });
  }

  // Idle Nudge Engine (8s, 18s, 35s)
  function clearIdleTimers() {
    clearTimeout(idleTimer1);
    clearTimeout(idleTimer2);
    clearTimeout(idleTimer3);
    idleTimer1 = null;
    idleTimer2 = null;
    idleTimer3 = null;
  }

  function resetIdleTimers() {
    clearIdleTimers();
    lastInteractionTime = performance.now();

    // Only count idle during EXPLORE when modal is closed
    if (flow.state !== 'EXPLORE' || polaroidModal?.isOpen || isGuideOff) return;
    if (idleNudgeCount >= 3) return;

    // Level 1 (8s): Pulse next chip
    idleTimer1 = setTimeout(() => {
      if (flow.state === 'EXPLORE' && !polaroidModal?.isOpen) {
        hud?.pulseNextChip(true);
      }
    }, IDLE_T1);

    // Level 2 (18s): Bubble nudge + point to next
    idleTimer2 = setTimeout(() => {
      if (flow.state === 'EXPLORE' && !polaroidModal?.isOpen) {
        idleNudgeCount += 1;
        const nextId = progress.getNextId();
        showBubble(copy.explore.idle2, { ttl: 8000, zone: 'bottom-left' });
        if (nextId) pointAtPlanet(nextId);
      }
    }, IDLE_T2);

    // Level 3 (35s): Edge arrow indicator
    idleTimer3 = setTimeout(() => {
      if (flow.state === 'EXPLORE' && !polaroidModal?.isOpen) {
        idleNudgeCount += 1;
        const nextId = progress.getNextId();
        showBubble(copy.explore.idle3, { ttl: 10000, zone: 'bottom-left' });
        if (nextId) pointAtPlanet(nextId);
      }
    }, IDLE_T3);
  }

  function noteInteraction() {
    // Reset idle timers on user movement/touch/key
    if (activePointer3D || activeEdgeArrow) {
      clearAllGuides();
    }
    hud?.pulseNextChip(false);
    resetIdleTimers();
  }

  // Event Listeners for user activity
  const onPointer = (e) => {
    noteInteraction();
  };
  window.addEventListener('pointerdown', onPointer, { passive: true });
  window.addEventListener('keydown', onPointer, { passive: true });
  window.addEventListener('wheel', onPointer, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearIdleTimers();
    else resetIdleTimers();
  });

  // State Change Reaction (Section 7.6)
  function onStateChange(nextState) {
    clearAllGuides();
    clearIdleTimers();
    idleNudgeCount = 0;

    if (isGuideOff) return;

    if (nextState === 'FLIGHT') {
      try {
        const flightSeen = sessionStorage.getItem('flightSkipSeen');
        if (!flightSeen) {
          sessionStorage.setItem('flightSkipSeen', 'true');
          showBubble(copy.flight.skip, { ttl: 3500, zone: 'bottom-left', states: ['FLIGHT'] });
        }
      } catch {}
    } else if (nextState === 'EXPLORE') {
      const nextId = progress.getNextId();
      const nextPlanet = solarSystem?.planetsList?.find((p) => p.id === nextId);
      const planetName = nextPlanet?.config?.name?.split(' ')[0] || 'ดาวศุกร์';
      hud?.updateNextPlanet(nextId, planetName);

      // Check first-time explore prompt
      try {
        const exploreSeen = sessionStorage.getItem('exploreFirstSeen');
        if (!exploreSeen && progress.size === 0) {
          sessionStorage.setItem('exploreFirstSeen', 'true');
          showBubble(copy.explore.first, {
            ttl: 8000,
            zone: 'bottom-left',
            states: ['EXPLORE'],
            onClose: () => {
              startTour();
            }
          });
          if (nextId) pointAtPlanet(nextId, planetName);
          return;
        }
      } catch {}

      startTour();
      resetIdleTimers();
    } else if (nextState === 'FINALE_ALIGN' || nextState === 'FINALE_HEART') {
      showBubble(copy.finale.wait, { ttl: 4500, zone: 'bottom-left', states: ['FINALE_ALIGN', 'FINALE_HEART'] });
    } else if (nextState === 'FINALE_CAKE') {
      // Spotlight & coach for blowing candles (floating centered above cake action buttons)
      showBubble(copy.cake.coach, { ttl: 9000, zone: 'bottom-left', className: 'guide-bubble-cake', states: ['FINALE_CAKE'] });
      setTimeout(() => {
        if (flow.state === 'FINALE_CAKE') {
          showBubble(copy.cake.idle, { ttl: 6000, zone: 'bottom-left', className: 'guide-bubble-cake', states: ['FINALE_CAKE'] });
        }
      }, 10000);
    } else if (nextState === 'FINALE_LETTER') {
      showBubble(copy.letter.close, { ttl: 5000, zone: 'bottom-left', states: ['FINALE_LETTER'] });
    } else if (nextState === 'EPILOGUE') {
      epilogueGalaxyTimer = setTimeout(() => {
        if (flow.state === 'EPILOGUE') {
          showEpilogueGalaxyGuide();
        }
      }, reducedMotion ? 200 : 750);
    }
  }

  function showEpilogueGalaxyGuide() {
    if (isGuideOff) return;
    clearAllGuides();

    const targetEl = document.querySelector('#btn-toggle-galaxy');
    if (!targetEl || targetEl.offsetParent === null) {
      epilogueGalaxyTimer = setTimeout(() => {
        if (flow.state === 'EPILOGUE') showEpilogueGalaxyGuide();
      }, 300);
      return;
    }

    const rect = targetEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const radius = Math.max(rect.width, rect.height) * 0.7 + 16;

    const spotlightEl = getSpotlight();
    spotlightEl.style.setProperty('--gx', `${Math.round(centerX)}px`);
    spotlightEl.style.setProperty('--gy', `${Math.round(centerY)}px`);
    spotlightEl.style.setProperty('--gr', `${Math.round(radius)}px`);
    spotlightEl.classList.add('visible');

    const isMobile = window.innerWidth <= 520;
    const message = isMobile ? copy.epilogue.galaxyMobile : copy.epilogue.galaxyDesktop;

    const card = document.createElement('div');
    card.className = 'guide-bubble guide-bubble-galaxy';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-label', 'แนะนำท่องกาแล็กซี่ 3D');

    card.innerHTML = `
      <p class="guide-bubble-text">${message}</p>
      <button class="guide-bubble-close" aria-label="ปิดคำแนะนำ">✕</button>
    `;

    // Calculate position directly under #btn-toggle-galaxy
    const cardWidth = Math.min(window.innerWidth * 0.9, 340);
    let left = centerX - cardWidth / 2;
    left = Math.max(16, Math.min(window.innerWidth - cardWidth - 16, left));
    let top = rect.bottom + 12;

    card.style.left = `${Math.round(left)}px`;
    card.style.top = `${Math.round(top)}px`;

    const dismiss = () => {
      clearAllGuides();
    };

    const onKey = (e) => {
      if (e.key === 'Escape') dismiss();
    };

    targetEl.addEventListener('click', dismiss, { once: true });
    window.addEventListener('keydown', onKey);

    epilogueGalaxyCleanup = () => {
      targetEl.removeEventListener('click', dismiss);
      window.removeEventListener('keydown', onKey);
      epilogueGalaxyCleanup = null;
    };

    card.querySelector('.guide-bubble-close').addEventListener('click', dismiss);

    currentGuideHandle = uiDirector.show({
      id: 'guide-epilogue-galaxy',
      zone: 'top-right',
      layer: 'coach',
      exclusive: true,
      ttl: reducedMotion ? 8000 : 16000,
      element: card,
      states: ['EPILOGUE'],
      onClose: () => {
        hideSpotlight();
        if (epilogueGalaxyCleanup) epilogueGalaxyCleanup();
        currentGuideHandle = null;
      }
    });
  }

  // Progress Update Reaction
  progress.onChange(({ visited, nextId, isComplete }) => {
    idleNudgeCount = 0;
    if (nextId) {
      const nextPlanet = solarSystem?.planetsList?.find((p) => p.id === nextId);
      const planetName = nextPlanet?.config?.name?.split(' ')[0] || '';
      hud?.updateNextPlanet(nextId, planetName);
    } else {
      hud?.updateNextPlanet(null);
    }
    hud?.updateProgress(visited);
  });

  // Global QA inspect hook
  if (typeof window !== 'undefined') {
    window.__qaGuide = () => {
      const coachElements = document.querySelectorAll('[data-ui-layer-type="coach"]:not(.ui-director-leaving)');
      return {
        visibleGuideCount: coachElements.length,
        nextId: progress.getNextId(),
        state: flow.state
      };
    };
    window.__qaGuidePointAtPlanet = (id) => pointAtPlanet(id);
  }

  return {
    onState: onStateChange,
    onProgress: () => resetIdleTimers(),
    noteInteraction,
    pointAtPlanet,
    showBubble,
    showToast,
    clear: clearAllGuides,
    openHelp: () => helpSheet.open(),
    closeHelp: () => helpSheet.close(),
    startTour,
    dispose() {
      clearAllGuides();
      clearIdleTimers();
      helpSheet.dispose();
      window.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('keydown', onPointer);
      window.removeEventListener('wheel', onPointer);
    }
  };
}
