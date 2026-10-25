import { PLANET_CONFIG } from '../config/memoriesData.js';

/**
 * Memory Popup Card (Glassmorphism & 3D Tilt):
 * - Displays high quality romantic photo with parallax mouse tilt
 * - Tag, Date, Title, Thai subtitle, Heartfelt narrative, and Quote
 * - Navigation: "ความทรงจำถัดไป ➔" and "⤶ ถอยกลับสู่จักรวาล"
 * - Special finale letter for Memory 05
 */
export class PolaroidModal {
  constructor({ onNext, onPrev, onBackToGalaxy, onWish, onTypeTick, onCapture }) {
    this.onNext = onNext;
    this.onPrev = onPrev;
    this.onBackToGalaxy = onBackToGalaxy;
    this.onWish = onWish;
    this.onTypeTick = onTypeTick;
    this.onCapture = onCapture;
    this.typeTimer = null;

    this.currentMemory = null;
    this.container = null;
    this.card = null;
    this.isOpen = false;

    this.initDOM();
  }

  initDOM() {
    this.container = document.createElement('div');
    this.container.id = 'memory-modal-backdrop';
    this.container.className = 'modal-backdrop hidden';

    this.container.innerHTML = `
      <div class="modal-card-wrap">
        <div class="memory-card" id="memory-card">
          <!-- Close button -->
          <button class="modal-close-btn" id="modal-close-btn" title="ถอยกลับสู่จักรวาล">✕</button>

          <!-- Top Meta Tag -->
          <div class="memory-tag-bar">
            <span class="memory-tag-badge" id="memory-tag">MEMORY 01 · FIRST ENCOUNTER</span>
            <span class="memory-date-text" id="memory-date">จุดเริ่มต้น</span>
          </div>

          <!-- 3D Polaroid Photo Frame with Parallax Tilt -->
          <div class="polaroid-photo-frame" id="polaroid-frame">
            <div class="polaroid-photo-placeholder" id="photo-placeholder">
              <span class="placeholder-icon">💖</span>
              <span class="placeholder-title" id="placeholder-text">ความทรงจำแสนพิเศษ</span>
            </div>
            <img id="polaroid-img" class="polaroid-img" alt="ความทรงจำ" />
            <div class="photo-shine-overlay"></div>
            <div class="photo-heart-badge" id="photo-badge">01 ♥</div>
          </div>

          <!-- Content Body -->
          <div class="memory-card-body">
            <h3 class="memory-title" id="memory-title">The First Day</h3>
            <div class="memory-thai-sub" id="memory-thai-sub">วันแรกที่เราได้รู้จักกัน</div>
            <p class="memory-desc" id="memory-desc">คำบรรยายความทรงจำ</p>

            <div class="memory-quote-box">
              <span class="quote-symbol">“</span>
              <span id="memory-quote-text">คำคมประจำความทรงจำ</span>
              <span class="quote-symbol">”</span>
            </div>

            <!-- Special Finale Box on Memory 05 -->
            <div id="finale-wish-box" class="finale-wish-box hidden">
              <div class="wish-ribbon">👑 ${PLANET_CONFIG.wishTitle}</div>
              <p class="wish-body" id="wish-body">${PLANET_CONFIG.wishBody}</p>
              <div class="wish-sig" id="wish-sig">${PLANET_CONFIG.signature}</div>
            </div>

            <!-- Action Navigation Buttons -->
            <div class="memory-actions">
              <button class="action-btn back-galaxy-btn" id="modal-back-btn">
                <span>⤶ ถอยกลับสู่วงโคจร</span>
              </button>
              <button class="action-btn next-memory-btn" id="modal-next-btn">
                <span>ความทรงจำถัดไป ➔</span>
              </button>
              <button class="action-btn capture-memory-btn" id="modal-capture-btn" type="button">
                <span>เก็บภาพความทรงจำ 📸</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.container);

    this.card = this.container.querySelector('#memory-card');

    // Event Listeners
    this.container.querySelector('#modal-close-btn').addEventListener('click', () => this.close());
    this.container.querySelector('#modal-back-btn').addEventListener('click', () => this.close());
    this.container.querySelector('#modal-capture-btn').addEventListener('click', () => this.onCapture?.());

    this.container.querySelector('#modal-next-btn').addEventListener('click', () => {
      if (this.currentMemory && this.onNext) {
        // If memory 5, wraps back to 1
        const nextId = this.currentMemory.id >= 5 ? 1 : this.currentMemory.id + 1;
        this.onNext(nextId);
      }
    });

    // Close on backdrop click
    this.container.addEventListener('click', (e) => {
      if (e.target === this.container) {
        this.close();
      }
    });

    // 3D Parallax Tilt Effect
    const cardWrap = this.container.querySelector('.modal-card-wrap');
    const photoFrame = this.container.querySelector('#polaroid-frame');

    cardWrap.addEventListener('mousemove', (e) => {
      const rect = this.card.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const mouseX = e.clientX - centerX;
      const mouseY = e.clientY - centerY;

      const tiltX = (mouseY / (rect.height / 2)) * -8;
      const tiltY = (mouseX / (rect.width / 2)) * 8;

      this.card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1.02)`;

      // Subtle parallax on inner photo
      if (photoFrame) {
        photoFrame.style.transform = `translateX(${tiltY * 0.8}px) translateY(${tiltX * -0.8}px)`;
      }
    });

    cardWrap.addEventListener('mouseleave', () => {
      this.card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
      if (photoFrame) photoFrame.style.transform = 'none';
    });
  }

  show(memory) {
    clearInterval(this.typeTimer);
    this.typeTimer = null;
    this.currentMemory = memory;
    this.isOpen = true;
    window.dispatchEvent(new CustomEvent('memory-modal-opened', { detail: memory }));

    // Populate data
    this.container.querySelector('#memory-tag').textContent = memory.tag || `MEMORY 0${memory.id}`;
    this.container.querySelector('#memory-date').textContent = memory.date || '';
    this.container.querySelector('#photo-badge').textContent = `${memory.badge} ♥`;
    this.container.querySelector('#memory-title').textContent = memory.title;
    this.container.querySelector('#memory-thai-sub').textContent = memory.thaiSubtitle || '';
    this.container.querySelector('#memory-desc').textContent = memory.description;
    this.container.querySelector('#memory-quote-text').textContent = memory.quote;

    // Image & Fallback
    const imgEl = this.container.querySelector('#polaroid-img');
    const placeholder = this.container.querySelector('#photo-placeholder');
    const placeholderText = this.container.querySelector('#placeholder-text');

    placeholderText.textContent = memory.title;
    placeholder.style.background = `linear-gradient(135deg, ${memory.color || '#ff9a9e'}44, rgba(20,18,36,0.9))`;

    if (memory.image) {
      imgEl.src = memory.image;
      imgEl.style.display = 'block';
      placeholder.style.display = 'none';

      imgEl.onerror = () => {
        imgEl.style.display = 'none';
        placeholder.style.display = 'flex';
      };
      imgEl.onload = () => {
        imgEl.style.display = 'block';
        placeholder.style.display = 'none';
      };
    } else {
      imgEl.style.display = 'none';
      placeholder.style.display = 'flex';
    }

    // Finale box on memory 5
    const finaleBox = this.container.querySelector('#finale-wish-box');
    const wishBody = this.container.querySelector('#wish-body');
    const nextBtn = this.container.querySelector('#modal-next-btn');

    if (memory.id === 5) {
      finaleBox.classList.remove('hidden');
      nextBtn.innerHTML = '<span>วนกลับสู่จุดเริ่มต้น ↺</span>';
      const wishText = Array.from(PLANET_CONFIG.wishBody);
      wishBody.textContent = '';
      let character = 0;
      this.typeTimer = setInterval(() => {
        if (!this.isOpen || character >= wishText.length) {
          clearInterval(this.typeTimer);
          this.typeTimer = null;
          return;
        }
        wishBody.textContent += wishText[character];
        if (character % 8 === 0) this.onTypeTick?.();
        character += 1;
      }, 26);
    } else {
      finaleBox.classList.add('hidden');
      nextBtn.innerHTML = '<span>ความทรงจำถัดไป ➔</span>';
      wishBody.textContent = PLANET_CONFIG.wishBody;
    }

    // Reveal
    this.container.classList.remove('hidden');
    setTimeout(() => {
      this.container.classList.add('visible');
    }, 10);
  }

  close(triggerBack = true) {
    this.isOpen = false;
    clearInterval(this.typeTimer);
    this.typeTimer = null;
    this.container.classList.remove('visible');
    setTimeout(() => {
      this.container.classList.add('hidden');
      if (triggerBack && this.onBackToGalaxy) this.onBackToGalaxy();
    }, 320);
  }
}
