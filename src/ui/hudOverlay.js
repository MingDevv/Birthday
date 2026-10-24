import { PLANET_CONFIG } from '../config/memoriesData.js';

/**
 * HUD Overlay for Give Love Studio Memory Planet:
 * 1. Floating Top Title: "Our Little Planet · ดวงดาวแห่งความทรงจำ"
 * 2. Floating Vinyl Record Music Player Widget with animated soundwaves
 * 3. Make a Wish Button ("อธิษฐานขอพรดวงดาว ✨")
 * 4. Memory Beacon Tracker (5 hearts)
 */
export class HudOverlay {
  constructor({ onMakeWish, onToggleSound, onResetCamera, onToggleGalaxy, onSelectMemory }) {
    this.onMakeWish = onMakeWish;
    this.onToggleSound = onToggleSound;
    this.onResetCamera = onResetCamera;
    this.onToggleGalaxy = onToggleGalaxy;
    this.onSelectMemory = onSelectMemory;

    this.container = null;
    this.visitedCount = 0;
    this.totalMemories = 5;
    this.isGalaxyMode = false;

    this.initDOM();
  }

  initDOM() {
    this.container = document.createElement('div');
    this.container.id = 'hud-overlay';
    this.container.className = 'hud-container hud-hidden';

    this.container.innerHTML = `
      <!-- Top Bar with Left Stack and Right Actions -->
      <header class="hud-header">
        <div class="hud-left-panel">
          <div class="hud-brand">
            <div class="hud-title-wrap">
              <span class="hud-planet-icon" id="hud-brand-icon">🎂</span>
              <h1 class="hud-main-title">${PLANET_CONFIG.mainTitle}</h1>
            </div>
            <p class="hud-subtitle" id="hud-brand-sub">${PLANET_CONFIG.subtitle}</p>
          </div>

          <!-- 5 Memory Beacons Heart Tracker neatly stacked underneath -->
          <div class="hud-beacons-tracker">
            <div class="tracker-header">
              <span class="tracker-title">🎂 ดาวเคราะห์วันเกิด 16 ปี</span>
              <span id="tracker-count" class="tracker-count">0 / 5</span>
            </div>
            <div class="tracker-hearts" id="tracker-hearts" title="คลิกรูปหัวใจเพื่อวาร์ปไปสู่ดาวเคราะห์ความทรงจำ">
              <span class="heart-dot clickable" data-id="1" title="01. ♀️ ดาวศุกร์ (Venus) · The First Day">🤍</span>
              <span class="heart-dot clickable" data-id="2" title="02. 🌍 โลก & ดวงจันทร์ (Earth & Moon) · Safe Zone">🤍</span>
              <span class="heart-dot clickable" data-id="3" title="03. ♂️ ดาวอังคาร (Mars) · The Journey">🤍</span>
              <span class="heart-dot clickable" data-id="4" title="04. ♃ ดาวพฤหัสบดี (Jupiter) · Beside You">🤍</span>
              <span class="heart-dot clickable" data-id="5" title="05. 🪐 ดาวเสาร์ (Saturn) · My Universe">🤍</span>
            </div>
          </div>
        </div>

        <div class="hud-top-actions">
          <!-- Toggle Galaxy / Center Mode Button -->
          <button id="btn-toggle-galaxy" class="hud-icon-btn hud-galaxy-btn" title="สลับมุมมองท่องกาแล็กซี่ 3D หรือศูนย์กลางดวงใจวันเกิด">
            <span id="galaxy-btn-icon">🌌</span>
            <span class="btn-label" id="galaxy-btn-text">ท่องกาแล็กซี่ 3D</span>
          </button>

          <!-- Reset Center View Button -->
          <button id="btn-reset-cam" class="hud-icon-btn" title="กลับสู่ศูนย์กลางดวงใจวันเกิด">
            <span>🎂</span>
            <span class="btn-label">ดวงใจวันเกิด</span>
          </button>

          <!-- Floating Vinyl Record Music Player Widget -->
          <div class="vinyl-widget" id="vinyl-widget" title="เปิด/ปิดเพลงประกอบ">
            <div class="vinyl-disc" id="vinyl-disc">
              <div class="vinyl-groove"></div>
              <div class="vinyl-center"></div>
            </div>
            <div class="sound-wave-bars" id="sound-wave-bars">
              <span class="bar bar-1"></span>
              <span class="bar bar-2"></span>
              <span class="bar bar-3"></span>
              <span class="bar bar-4"></span>
            </div>
            <span class="vinyl-label" id="vinyl-status">เปิดเพลง</span>
          </div>
        </div>
      </header>

      <!-- Bottom Hint -->
      <div class="hud-hints">
        <span id="hud-hint-text">💫 ลากเมาส์สำรวจดวงใจคริสตัลและ 5 ดาวเคราะห์ความทรงจำวันเกิด · คลิกดาวเคราะห์เพื่อเปิดอ่านการ์ดอวยพร · กด 'ท่องกาแล็กซี่ 3D' เพื่อดูมุมกว้าง</span>
      </div>

      <!-- Bottom-Right: Make a Wish Button (ปุ่มขอพรวันเกิด) -->
      <div class="hud-wish-wrap">
        <button id="btn-make-wish" class="wish-btn">
          <span class="wish-star">🎂</span>
          <span class="wish-text">อธิษฐานขอพรวันเกิด</span>
          <span class="wish-star">🌠✨</span>
        </button>
      </div>
    `;

    document.body.appendChild(this.container);

    // Bind Toggle Galaxy
    this.container.querySelector('#btn-toggle-galaxy').addEventListener('click', () => {
      if (this.onToggleGalaxy) this.onToggleGalaxy();
    });

    // Bind Make a Wish Button
    this.container.querySelector('#btn-make-wish').addEventListener('click', () => {
      if (this.onMakeWish) this.onMakeWish();
    });

    // Bind Vinyl Player
    const vinylWidget = this.container.querySelector('#vinyl-widget');
    vinylWidget.addEventListener('click', () => {
      if (this.onToggleSound) {
        const isPlaying = this.onToggleSound();
        this.setSoundPlayingState(isPlaying);
      }
    });

    // Bind Reset Camera
    this.container.querySelector('#btn-reset-cam').addEventListener('click', () => {
      if (this.onResetCamera) this.onResetCamera();
    });

    // Bind Clickable Heart Dots in Tracker
    const heartDots = this.container.querySelectorAll('.heart-dot');
    heartDots.forEach(dot => {
      dot.addEventListener('click', () => {
        const id = parseInt(dot.getAttribute('data-id'), 10);
        if (this.onSelectMemory) this.onSelectMemory(id);
      });
    });
  }

  setGalaxyMode(isGalaxy) {
    this.isGalaxyMode = isGalaxy;
    const btnIcon = this.container.querySelector('#galaxy-btn-icon');
    const btnText = this.container.querySelector('#galaxy-btn-text');
    const brandIcon = this.container.querySelector('#hud-brand-icon');
    const brandSub = this.container.querySelector('#hud-brand-sub');
    const hintText = this.container.querySelector('#hud-hint-text');

    if (isGalaxy) {
      btnIcon.textContent = '💖';
      btnText.textContent = 'ดวงใจสุริยะ';
      brandIcon.textContent = '🌌';
      brandSub.textContent = 'มหากาแล็กซี่สีม่วงแห่งความทรงจำ · 120,000+ ดวงดาว';
      hintText.innerHTML = '🌌 <b>โหมดท่องกาแล็กซี่:</b> ลากเมาส์หมุนสำรวจทางช้างเผือกสีม่วง · คลิกดาวเคราะห์หรือหัวใจเพื่อวาร์ปเปิดความทรงจำ';
    } else {
      btnIcon.textContent = '🌌';
      btnText.textContent = 'ท่องกาแล็กซี่ 3D';
      brandIcon.textContent = '💖';
      brandSub.textContent = PLANET_CONFIG.subtitle;
      hintText.innerHTML = '💫 ลากเมาส์หมุนสำรวจดวงใจเรืองแสงและดาวเคราะห์แห่งความรัก · คลิกดาวเคราะห์เพื่อเปิดอ่าน';
    }
  }


  updateProgress(visitedSet) {
    this.visitedCount = visitedSet.size;
    const countEl = this.container.querySelector('#tracker-count');
    countEl.textContent = `${this.visitedCount} / ${this.totalMemories}`;

    const heartDots = this.container.querySelectorAll('.heart-dot');
    heartDots.forEach(dot => {
      const id = parseInt(dot.getAttribute('data-id'), 10);
      if (visitedSet.has(id)) {
        dot.textContent = '💜';
        dot.classList.add('heart-active');
      } else {
        dot.textContent = '🤍';
        dot.classList.remove('heart-active');
      }
    });
  }

  show() {
    this.container.classList.remove('hud-hidden');
    this.container.classList.add('hud-visible');
  }

  hide() {
    this.container.classList.remove('hud-visible');
    this.container.classList.add('hud-hidden');
  }

  setSoundPlayingState(isPlaying) {
    const vinylWidget = this.container.querySelector('#vinyl-widget');
    const statusLabel = this.container.querySelector('#vinyl-status');
    const disc = this.container.querySelector('#vinyl-disc');
    const bars = this.container.querySelector('#sound-wave-bars');

    if (isPlaying) {
      statusLabel.textContent = 'เล่นเพลง';
      vinylWidget.classList.add('playing');
      disc.classList.add('spinning');
      bars.classList.add('active');
    } else {
      statusLabel.textContent = 'เปิดเพลง';
      vinylWidget.classList.remove('playing');
      disc.classList.remove('spinning');
      bars.classList.remove('active');
    }
  }
}

