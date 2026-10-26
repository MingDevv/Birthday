import { PLANET_CONFIG } from '../config/memoriesData.js';

/**
 * HUD Overlay for Give Love Studio Memory Planet:
 * 1. Floating Top Title: "Our Little Planet · ดวงดาวแห่งความทรงจำ"
 * 2. Floating Vinyl Record Music Player Widget with animated soundwaves
 * 3. Make a Wish Button ("อธิษฐานขอพรดวงดาว ✨")
 * 4. Memory Beacon Tracker (5 hearts)
 */
export class HudOverlay {
  constructor({ onMakeWish, onToggleSound, onResetCamera, onToggleGalaxy, onSelectMemory, onNextPlanet, onOpenHelp }) {
    this.onMakeWish = onMakeWish;
    this.onToggleSound = onToggleSound;
    this.onResetCamera = onResetCamera;
    this.onToggleGalaxy = onToggleGalaxy;
    this.onSelectMemory = onSelectMemory;
    this.onNextPlanet = onNextPlanet;
    this.onOpenHelp = onOpenHelp;

    this.container = null;
    this.visitedCount = 0;
    this.totalMemories = 5;
    this.isGalaxyMode = false;
    this.nextPlanetId = null;

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
              <h1 class="hud-main-title"><span class="hud-title-desktop">${PLANET_CONFIG.mainTitle.replace(PLANET_CONFIG.recipientName, `<span class="hud-name-emph">${PLANET_CONFIG.recipientName}</span>`)}</span><span class="hud-title-mobile"><span class="hud-name-emph">${PLANET_CONFIG.recipientName}</span></span></h1>
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
            <!-- Next Planet Action Chip (Chip "ต่อไป →") -->
            <div class="hud-next-chip hidden" id="hud-next-chip" role="button" tabindex="0" title="แตะเพื่อบินไปดาวดวงนี้ทันที">
              <span class="chip-arrow">👉</span>
              <span class="chip-label" id="hud-next-chip-text">ต่อไป: 01 ดาวศุกร์</span>
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
          <button id="btn-reset-cam" class="hud-icon-btn" title="กลับมาที่หัวใจกลาง" aria-label="กลับมาที่หัวใจกลาง">
            <span>🎯</span>
            <span class="btn-label">ดวงใจวันเกิด</span>
          </button>

          <!-- Floating Vinyl Record Music Player Widget -->
          <div class="vinyl-widget" id="vinyl-widget" role="button" tabindex="0" title="แตะเพื่อเปิดเพลง 🔊" aria-label="แตะเพื่อเปิดเพลง 🔊">
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
            <span class="vinyl-label" id="vinyl-status">แตะเพื่อเปิดเพลง</span>
          </div>

          <!-- Help Guide Button (?) -->
          <button id="btn-guide-help" class="hud-icon-btn hud-help-btn" title="คู่มือการใช้งาน ✨" aria-label="คู่มือการใช้งาน">
            <span>?</span>
          </button>
        </div>
      </header>

      <!-- Bottom Hint -->
      <div class="hud-hints">
        <span id="hud-hint-text">💫 ลากเมาส์สำรวจดวงใจคริสตัลและ 5 ดาวเคราะห์ความทรงจำวันเกิด · คลิกดาวเคราะห์เพื่อเปิดอ่านการ์ดอวยพร · กด 'ท่องกาแล็กซี่ 3D' เพื่อดูมุมกว้าง</span>
      </div>

      <!-- Bottom-Right: Make a Wish Button (ปุ่มขอพรวันเกิด) -->
      <div class="hud-wish-wrap">
        <button id="btn-make-wish" class="wish-btn" title="อธิษฐานขอพรวันเกิด (พลุ + ข้อความอวยพร)" aria-label="อธิษฐานขอพรวันเกิด (พลุ + ข้อความอวยพร)">
          <span class="wish-star">🎂</span>
          <span class="wish-text">อธิษฐานขอพรวันเกิด</span>
          <span class="wish-star">🌠✨</span>
        </button>
      </div>
    `;

    document.body.appendChild(this.container);

    const brand = this.container.querySelector('.hud-brand');
    brand.addEventListener('click', () => {
      if (window.matchMedia('(max-width: 480px)').matches) brand.classList.toggle('show-subtitle');
    });

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
    const toggleAudio = () => {
      if (this.onToggleSound) {
        const isPlaying = this.onToggleSound();
        this.setSoundPlayingState(isPlaying);
      }
    };
    vinylWidget.addEventListener('click', toggleAudio);
    vinylWidget.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleAudio();
      }
    });

    // Bind Reset Camera
    this.container.querySelector('#btn-reset-cam').addEventListener('click', () => {
      if (this.onResetCamera) this.onResetCamera();
    });

    // Bind Help Button
    this.container.querySelector('#btn-guide-help').addEventListener('click', () => {
      if (this.onOpenHelp) this.onOpenHelp();
    });

    // Bind Next Chip
    const nextChip = this.container.querySelector('#hud-next-chip');
    const triggerNext = () => {
      if (this.nextPlanetId && this.onNextPlanet) {
        this.onNextPlanet(this.nextPlanetId);
      }
    };
    nextChip.addEventListener('click', triggerNext);
    nextChip.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        triggerNext();
      }
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
    const btn = this.container.querySelector('#btn-toggle-galaxy');
    const btnIcon = this.container.querySelector('#galaxy-btn-icon');
    const btnText = this.container.querySelector('#galaxy-btn-text');
    const brandIcon = this.container.querySelector('#hud-brand-icon');
    const brandSub = this.container.querySelector('#hud-brand-sub');
    const hintText = this.container.querySelector('#hud-hint-text');

    if (isGalaxy) {
      btn.classList.add('is-galaxy-active');
      btnIcon.textContent = '💖';
      btnText.textContent = 'ดวงใจสุริยะ';
      brandIcon.textContent = '🌌';
      brandSub.textContent = 'มหากาแล็กซี่สีม่วงแห่งความทรงจำ · 120,000+ ดวงดาว';
      hintText.innerHTML = '🌌 <b>โหมดท่องกาแล็กซี่:</b> ลากเมาส์หมุนสำรวจทางช้างเผือกสีม่วง · คลิกดาวเคราะห์หรือหัวใจเพื่อวาร์ปเปิดความทรงจำ';
    } else {
      btn.classList.remove('is-galaxy-active');
      btnIcon.textContent = '🌌';
      btnText.textContent = 'ท่องกาแล็กซี่ 3D';
      brandIcon.textContent = '💖';
      brandSub.textContent = PLANET_CONFIG.subtitle;
      hintText.innerHTML = '💫 ลากเมาส์หมุนสำรวจดวงใจเรืองแสงและดาวเคราะห์แห่งความรัก · คลิกดาวเคราะห์เพื่อเปิดอ่าน';
    }
  }

  updateNextPlanet(nextId, name = '') {
    this.nextPlanetId = nextId;
    const nextChip = this.container.querySelector('#hud-next-chip');
    const chipText = this.container.querySelector('#hud-next-chip-text');
    if (!nextChip) return;

    if (nextId) {
      chipText.textContent = `ต่อไป: ${String(nextId).padStart(2, '0')} ${name}`;
      nextChip.classList.remove('hidden');
    } else {
      nextChip.classList.add('hidden');
    }
  }

  pulseNextChip(fast = true) {
    const nextChip = this.container.querySelector('#hud-next-chip');
    if (!nextChip || nextChip.classList.contains('hidden')) return;
    if (fast) {
      nextChip.classList.add('pulse-fast');
    } else {
      nextChip.classList.remove('pulse-fast');
    }
  }

  hideHint() {
    const hint = this.container.querySelector('.hud-hints');
    if (hint) hint.style.display = 'none';
  }

  updateProgress(visitedSet) {
    this.visitedCount = visitedSet.size;
    const countEl = this.container.querySelector('#tracker-count');
    countEl.textContent = `${this.visitedCount} / ${this.totalMemories}`;

    if (this.visitedCount > 0) {
      this.hideHint();
    }

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
      statusLabel.textContent = 'เพลงเปิดอยู่ · แตะเพื่อปิด';
      vinylWidget.setAttribute('title', 'เพลงเปิดอยู่ · แตะเพื่อปิด');
      vinylWidget.setAttribute('aria-label', 'เพลงเปิดอยู่ · แตะเพื่อปิด');
      vinylWidget.classList.add('playing');
      disc.classList.add('spinning');
      bars.classList.add('active');
    } else {
      statusLabel.textContent = 'แตะเพื่อเปิดเพลง';
      vinylWidget.setAttribute('title', 'แตะเพื่อเปิดเพลง 🔊');
      vinylWidget.setAttribute('aria-label', 'แตะเพื่อเปิดเพลง 🔊');
      vinylWidget.classList.remove('playing');
      disc.classList.remove('spinning');
      bars.classList.remove('active');
    }
  }
}

