import { GUIDE_COPY } from '../config/guideCopy.js';

/**
 * =========================================================================
 * 🧭 First-run Tour: ทัวร์แนะนำปุ่มบน HUD ครั้งแรก
 * เดินตามทีละปุ่ม พร้อม Spotlight วงกลมเน้นเป้าหมาย และปุ่มถัดไป/ข้าม
 * =========================================================================
 */
export function startFirstRunTour({
  uiDirector,
  copy = GUIDE_COPY,
  reducedMotion = false,
  onComplete
} = {}) {
  const stepsConfig = [
    {
      targetId: '#tracker-hearts',
      title: 'ตัวนับดาวเคราะห์ (0/5)',
      text: copy.tour?.stepHearts || 'แตะหัวใจเพื่อวาร์ปไปดาวนั้น · เต็มทั้ง 5 ดวงจะมีเซอร์ไพรส์ 💜'
    },
    {
      targetId: '#btn-toggle-galaxy',
      title: 'ท่องกาแล็กซี่ 3D',
      text: copy.tour?.stepGalaxy || 'ดูจักรวาลมุมกว้างและชื่อ 3D ในอวกาศลึก 🌌'
    },
    {
      targetId: '#btn-reset-cam',
      title: 'ดวงใจวันเกิด',
      text: copy.tour?.stepReset || 'กลับมาที่หัวใจตรงกลางเสมอ 🎯'
    },
    {
      targetId: '#vinyl-widget',
      title: 'เพลงประกอบ',
      text: copy.tour?.stepMusic || 'เปิด/ปิดเพลงประกอบ 🔊'
    },
    {
      targetId: '#btn-make-wish',
      title: 'อธิษฐานขอพรวันเกิด',
      text: copy.tour?.stepWish || 'กดแล้วมีพลุขอพรวันเกิด ✨'
    },
    {
      targetId: '.mobile-tools-toggle, #btn-tilt, .cinema-record-button',
      title: 'เครื่องมือเสริม',
      text: copy.tour?.stepTools || 'เครื่องมือเสริม (เอียงเครื่อง / อัดคลิป) ⋯'
    }
  ];

  // Filter only steps with matching elements present in DOM
  const activeSteps = stepsConfig.filter((step) => {
    const el = document.querySelector(step.targetId);
    return el && el.offsetParent !== null; // Element is connected & visible
  });

  if (activeSteps.length === 0) {
    finishTour();
    return null;
  }

  // The tour card and its target spotlight replace the separate planet
  // pointer/edge arrow. Remove any pointer left by the first-explore prompt.
  document.body.classList.add('guide-tour-active');
  document.querySelectorAll('.guide-3d-pointer, .guide-edge-arrow').forEach((element) => element.remove());

  let currentIndex = 0;
  let spotlightEl = document.querySelector('.guide-spotlight');
  if (!spotlightEl) {
    spotlightEl = document.createElement('div');
    spotlightEl.className = 'guide-spotlight';
    document.body.appendChild(spotlightEl);
  }

  let currentCardHandle = null;

  function finishTour() {
    document.body.classList.remove('guide-tour-active');
    try {
      sessionStorage.setItem('tourSeen', 'true');
    } catch {}

    if (spotlightEl) {
      spotlightEl.classList.remove('visible');
      setTimeout(() => spotlightEl?.remove(), 350);
      spotlightEl = null;
    }

    if (currentCardHandle) {
      currentCardHandle.dispose();
      currentCardHandle = null;
    }

    window.removeEventListener('keydown', handleKey);
    window.removeEventListener('memory-modal-opened', onModalOpen);
    onComplete?.();
  }

  function handleKey(e) {
    if (e.key === 'Escape') {
      finishTour();
    }
  }
  const onModalOpen = () => finishTour();
  window.addEventListener('keydown', handleKey);
  window.addEventListener('memory-modal-opened', onModalOpen, { once: true });

  function renderStep(index) {
    if (index >= activeSteps.length) {
      finishTour();
      return;
    }

    const step = activeSteps[index];
    const targetEl = document.querySelector(step.targetId);
    if (!targetEl) {
      renderStep(index + 1);
      return;
    }

    const rect = targetEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const radius = Math.max(rect.width, rect.height) * 0.65 + 14;

    // Update spotlight position
    spotlightEl.style.setProperty('--gx', `${Math.round(centerX)}px`);
    spotlightEl.style.setProperty('--gy', `${Math.round(centerY)}px`);
    spotlightEl.style.setProperty('--gr', `${Math.round(radius)}px`);
    spotlightEl.classList.add('visible');

    // Create tour bubble card
    const card = document.createElement('div');
    card.className = 'guide-tour-card';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-label', step.title);

    const isLast = index === activeSteps.length - 1;
    card.innerHTML = `
      <div class="guide-tour-step-badge">ปุ่มที่ ${index + 1} จาก ${activeSteps.length} · ${step.title}</div>
      <div class="guide-tour-desc">${step.text}</div>
      <div class="guide-tour-actions">
        <button class="guide-tour-btn-skip" id="tour-skip-btn">ข้ามทัวร์</button>
        <button class="guide-tour-btn-next" id="tour-next-btn">${isLast ? 'เข้าใจแล้ว ✨' : 'ถัดไป ➔'}</button>
      </div>
    `;

    // Position card safely near target (never covering target or siblings)
    const cardWidth = Math.min(window.innerWidth * 0.9, 360);
    let left = centerX - cardWidth / 2;
    left = Math.max(16, Math.min(window.innerWidth - cardWidth - 16, left));

    let top = rect.bottom + (step.targetId === '#tracker-hearts' ? 64 : 20);
    if (top + 160 > window.innerHeight) {
      // Place safely above target
      top = Math.max(16, rect.top - 165);
    }

    card.style.left = `${Math.round(left)}px`;
    card.style.top = `${Math.round(top)}px`;

    // Bind buttons
    card.querySelector('#tour-skip-btn').addEventListener('click', () => finishTour());
    card.querySelector('#tour-next-btn').addEventListener('click', () => {
      currentIndex += 1;
      renderStep(currentIndex);
    });

    if (currentCardHandle) {
      currentCardHandle.dispose();
    }

    currentCardHandle = uiDirector.show({
      id: 'guide-tour-card',
      zone: 'center-stage',
      layer: 'coach',
      exclusive: true,
      element: card,
      states: ['EXPLORE']
    });
  }

  // Start with first step
  renderStep(0);

  return {
    next: () => {
      currentIndex += 1;
      renderStep(currentIndex);
    },
    stop: finishTour
  };
}
