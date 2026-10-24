/**
 * =============================================================================
 * 🎂 Arrival Celebration Flow (หลังการเดินทางสิ้นสุดลง)
 * 1. ป๊อบอัพ "อายุ 16 แล้วนะ! 🎉✨" (คลิกที่ไหนก็ได้เพื่อปิด)
 * 2. หลังกดปิด จะปรากฏป้ายนำทางลอย "ลองเปิดการ์ดดูสิ 💌👉"
 * =============================================================================
 */

export function showArrivalCelebrationFlow(soundManager) {
  // 1. Create and display Popup 1: "อายุ 16 แล้วนะ! 🎉✨"
  const overlay = document.createElement('div');
  overlay.id = 'arrival-popup-overlay';
  overlay.className = 'arrival-popup-overlay';

  overlay.innerHTML = `
    <div class="arrival-popup-card" id="arrival-popup-card">
      <div class="popup-emblem">🎂👑✨</div>
      <div class="popup-sub-tag">HAPPY 16th BIRTHDAY KHAO HOM</div>
      <h2 class="popup-title">อายุ 16 แล้วนะ! 🎉✨</h2>
      <p class="popup-desc">
        สุขสันต์วันเกิดนะข้าวหอม ขอให้วัย 16 ปีนี้เต็มไปด้วยรอยยิ้ม ความสุข<br>
        และการเติบโตที่เปล่งประกายที่สุดในจักรวาล 💜
      </p>

      <button id="btn-close-arrival-popup" class="popup-action-btn">
        <span>ไปต่อกันเลย 💖</span>
      </button>

      <div class="popup-dismiss-hint">(แตะตรงไหนก็ได้เพื่อปิด)</div>
    </div>
  `;

  document.body.appendChild(overlay);

  if (soundManager) {
    soundManager.playChimeSound();
  }

  // Trigger entering animation
  requestAnimationFrame(() => {
    overlay.classList.add('visible');
    const card = overlay.querySelector('#arrival-popup-card');
    if (card) card.classList.add('pop-in');
  });

  let isDismissed = false;

  const dismissPopup = () => {
    if (isDismissed) return;
    isDismissed = true;

    overlay.classList.remove('visible');
    overlay.classList.add('fade-out');

    if (soundManager) {
      soundManager.playClickSound();
    }

    setTimeout(() => {
      overlay.remove();
      // Step 2: Show guided prompt "ลองเปิดการ์ดดูสิ ✨👉"
      showGuideCardPrompt();
    }, 380);
  };

  // Close on button click
  const btn = overlay.querySelector('#btn-close-arrival-popup');
  if (btn) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      dismissPopup();
    });
  }

  // Close on overlay tap
  overlay.addEventListener('click', () => {
    dismissPopup();
  });
}

/**
 * 💌 Step 2: Floating Pulsating Guide Banner "ลองเปิดการ์ดดูสิ ✨👉"
 */
export function showGuideCardPrompt() {
  const existing = document.getElementById('guide-open-card');
  if (existing) existing.remove();

  const guideEl = document.createElement('div');
  guideEl.id = 'guide-open-card';
  guideEl.className = 'guide-open-card-pill';

  guideEl.innerHTML = `
    <span class="guide-icon">💌</span>
    <span class="guide-text">ลองเปิดการ์ดดูสิ</span>
    <span class="guide-arrow">👉✨</span>
  `;

  document.body.appendChild(guideEl);

  requestAnimationFrame(() => {
    guideEl.classList.add('guide-visible');
  });

  // Clicking on guide dismisses it
  guideEl.addEventListener('click', () => {
    guideEl.classList.remove('guide-visible');
    setTimeout(() => guideEl.remove(), 400);
  });

  // Automatically dismiss guide when user opens a memory card
  const onCardOpen = () => {
    const el = document.getElementById('guide-open-card');
    if (el) {
      el.classList.remove('guide-visible');
      setTimeout(() => el.remove(), 400);
    }
    window.removeEventListener('memory-modal-opened', onCardOpen);
  };

  window.addEventListener('memory-modal-opened', onCardOpen);
}
