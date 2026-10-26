import { PLANET_CONFIG } from '../config/memoriesData.js';

/**
 * =============================================================================
 * 🐷 Intro Screen: ยินดีต้อนรับสู่ดาวลูกหมู (16th Birthday Khao Hom)
 * - สวยงาม เรียบหรู อบอุ่น สไตล์ Minimal Cosmic Glassmorphism
 * - ข้อความกระชับ เข้าประเด็น: "ยินดีต้อนรับสู่ดาวลูกหมู 🐷✨"
 * - การนับถอยหลัง 3 -> 2 -> 1 -> 🎉 และปุ่มออกเดินทาง
 * =============================================================================
 */
export class IntroScreen {
  constructor({ onEnter, soundManager }) {
    this.onEnter = onEnter;
    this.soundManager = soundManager;
    this.container = null;
    this.hasEntered = false;

    this.initDOM();
    this.startCountdown();
  }

  initDOM() {
    this.container = document.createElement('div');
    this.container.id = 'intro-screen';
    this.container.className = 'intro-screen-overlay';

    this.container.innerHTML = `
      <div class="intro-backdrop-decorations">
        <span class="bday-decor d-1">🐷</span>
        <span class="bday-decor d-2">✨</span>
        <span class="bday-decor d-3">🎂</span>
        <span class="bday-decor d-4">👑</span>
        <span class="bday-decor d-5">💜</span>
        <span class="bday-decor d-6">🌟</span>
      </div>

      <div class="intro-content">
        <!-- Floating Celestial Piggy & Crown Emblem -->
        <div class="intro-emblem">
          <span class="emblem-pig">🐷</span>
          <span class="emblem-crown">👑</span>
        </div>

        <!-- 3-2-1 Countdown Display -->
        <div id="intro-countdown-wrap" class="intro-countdown-wrap">
          <div class="intro-sub-badge">🎁 กำลังเปิดประตูสู่ดาวลูกหมู...</div>
          <div id="intro-number" class="intro-number">3</div>
        </div>

        <!-- Greeting & Enter Button (Shown after countdown) -->
        <div id="intro-greeting-wrap" class="intro-greeting-wrap hidden">
          <div class="intro-tag">✨ HAPPY 16th BIRTHDAY ✨</div>
          <h1 class="intro-title">ยินดีต้อนรับสู่ดาวลูกหมู 🐷✨</h1>
          <div class="intro-birthday-badge">🎂 สุขสันต์วันเกิดครบรอบ 16 ปี ข้าวหอม 💜</div>

          <button id="btn-enter-galaxy" class="intro-enter-btn">
            <span class="btn-icon">🚀</span>
            <span>ออกเดินทางสู่ดาวลูกหมู</span>
            <span class="btn-sparkle">✨</span>
          </button>
          <div class="intro-sound-hint" id="intro-sound-hint">เปิดเสียงไว้ด้วยนะ จะมีเพลงให้ฟังตลอดทาง 🔊</div>
          <div class="intro-idle-cta hidden" id="intro-idle-cta">แตะปุ่มเพื่อออกเดินทางได้เลย 🚀</div>
        </div>

        <!-- Small Skip Button -->
        <button id="btn-skip-countdown" class="intro-skip-btn">
          ข้ามการนับถอยหลัง ⏩
        </button>
      </div>
    `;

    document.body.appendChild(this.container);

    // Bind Enter Button
    this.container.querySelector('#btn-enter-galaxy').addEventListener('click', () => {
      this.enterGalaxy();
    });

    // Bind Skip Button
    this.container.querySelector('#btn-skip-countdown').addEventListener('click', () => {
      this.finishCountdownEarly();
    });
  }

  startCountdown() {
    let count = 3;
    const numEl = this.container.querySelector('#intro-number');

    const tick = () => {
      if (this.hasEntered) return;

      if (count > 0) {
        numEl.textContent = String(count);
        numEl.classList.remove('pop-anim');
        void numEl.offsetWidth;
        numEl.classList.add('pop-anim');

        // Play gentle music box tone
        if (this.soundManager) {
          const tones = [523.25, 659.25, 783.99]; // C5, E5, G5
          this.soundManager.playMusicBoxTone(tones[3 - count], 0.6, 0.15);
        }

        count--;
        this.countdownTimer = setTimeout(tick, 1000);
      } else {
        numEl.textContent = '🎉';
        numEl.classList.remove('pop-anim');
        void numEl.offsetWidth;
        numEl.classList.add('pop-anim');
        if (this.soundManager) {
          this.soundManager.playMusicBoxTone(1046.50, 0.8, 0.22); // C6 celebration
        }
        setTimeout(() => {
          this.revealGreeting();
        }, 550);
      }
    };

    // First tick
    this.countdownTimer = setTimeout(tick, 300);
  }

  finishCountdownEarly() {
    if (this.countdownTimer) clearTimeout(this.countdownTimer);
    this.revealGreeting();
  }

  revealGreeting() {
    const countdownWrap = this.container.querySelector('#intro-countdown-wrap');
    const greetingWrap = this.container.querySelector('#intro-greeting-wrap');
    const skipBtn = this.container.querySelector('#btn-skip-countdown');

    countdownWrap.classList.add('fade-out');
    skipBtn.style.display = 'none';

    setTimeout(() => {
      countdownWrap.style.display = 'none';
      greetingWrap.classList.remove('hidden');
      greetingWrap.classList.add('fade-in-up');

      if (this.soundManager) {
        this.soundManager.playChimeSound();
      }

      this.idleTimer = setTimeout(() => {
        if (!this.hasEntered) {
          const idleCta = this.container.querySelector('#intro-idle-cta');
          if (idleCta) idleCta.classList.remove('hidden');
        }
      }, 2500);
    }, 320);
  }

  enterGalaxy() {
    if (this.hasEntered) return;
    this.hasEntered = true;
    if (this.idleTimer) clearTimeout(this.idleTimer);

    if (this.soundManager) {
      this.soundManager.initAudioContext();
      this.soundManager.playClickSound();
      this.soundManager.startBGM();
    }

    this.container.classList.add('intro-exit-anim');

    setTimeout(() => {
      this.container.remove();
      if (this.onEnter) {
        this.onEnter();
      }
    }, 650);
  }
}
