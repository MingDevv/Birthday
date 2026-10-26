import { PLANET_CONFIG, MEMORIES_LIST } from '../config/memoriesData.js';
import { ledger } from './guideLedger.js';

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
    this.openOrigin = null;

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
          <div class="polaroid-photo-frame" id="polaroid-frame" title="แตะเพื่อดูภาพเต็ม 🔍">
            <div class="polaroid-photo-placeholder" id="photo-placeholder">
              <span class="placeholder-icon">💖</span>
              <span class="placeholder-title" id="placeholder-text">ความทรงจำแสนพิเศษ</span>
            </div>
            <img id="polaroid-img" class="polaroid-img" alt="ความทรงจำ" />
            <div class="polaroid-collage-grid hidden" id="polaroid-collage"></div>
            <div class="photo-shine-overlay"></div>
            <div class="photo-heart-badge" id="photo-badge">01 ♥</div>
            <div class="photo-zoom-hint" id="photo-zoom-hint">🔍 แตะดูรูปเต็ม</div>
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
            <div class="memory-first-guide hidden" id="memory-first-guide">
              อ่านจบแล้วกด "ความทรงจำถัดไป" หรือ ✕ เพื่อกลับ ✨
            </div>
          </div>
        </div>
      </div>

      <!-- Lightbox Fullscreen View -->
      <div id="memory-lightbox" class="memory-lightbox hidden" role="dialog" aria-modal="true" aria-label="ภาพความทรงจำขนาดเต็ม">
        <button class="lightbox-close-btn" id="lightbox-close-btn" title="ปิดภาพเต็ม">✕</button>
        <div class="lightbox-content" id="lightbox-content">
          <img id="lightbox-img" class="lightbox-img hidden" alt="ภาพความทรงจำขนาดเต็ม" />
          <div id="lightbox-collage" class="lightbox-collage hidden"></div>
        </div>
      </div>
    `;

    document.body.appendChild(this.container);

    this.card = this.container.querySelector('#memory-card');
    this.lightbox = this.container.querySelector('#memory-lightbox');
    this.isLightboxOpen = false;

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

    // Lightbox triggers
    const photoFrame = this.container.querySelector('#polaroid-frame');
    photoFrame.addEventListener('click', (e) => {
      // Don't open if clicked badge
      if (e.target.closest('#photo-badge')) return;
      this.openLightbox();
    });

    this.lightbox.addEventListener('click', (e) => {
      if (e.target === this.lightbox || e.target.closest('#lightbox-close-btn') || e.target.closest('.lightbox-content')) {
        this.closeLightbox();
      }
    });

    this.onKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (this.isLightboxOpen) {
          event.stopPropagation();
          this.closeLightbox();
        } else if (this.isOpen) {
          this.close();
        }
      }
    };
    window.addEventListener('keydown', this.onKeyDown);

    // 3D Parallax Tilt Effect
    const cardWrap = this.container.querySelector('.modal-card-wrap');

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

  openLightbox() {
    if (!this.currentMemory) return;
    this.isLightboxOpen = true;
    const lbImg = this.lightbox.querySelector('#lightbox-img');
    const lbCollage = this.lightbox.querySelector('#lightbox-collage');

    if (this.currentMemory.collage && Array.isArray(this.currentMemory.collage)) {
      lbImg.classList.add('hidden');
      lbCollage.innerHTML = '';
      this.currentMemory.collage.forEach((cid) => {
        const item = document.createElement('img');
        item.className = 'lightbox-c-item';
        item.src = `${import.meta.env.BASE_URL}images/memory-${cid}.jpg`;
        item.alt = `ความทรงจำที่ ${cid}`;
        const targetMem = MEMORIES_LIST.find((m) => m.id === cid);
        item.style.objectPosition = targetMem?.imagePosition || (cid >= 3 ? '50% 55%' : '50% 22%');
        lbCollage.appendChild(item);
      });
      lbCollage.classList.remove('hidden');
    } else if (this.currentMemory.image) {
      lbCollage.classList.add('hidden');
      lbImg.src = this.currentMemory.image;
      lbImg.classList.remove('hidden');
    }

    this.lightbox.classList.remove('hidden');
    void this.lightbox.offsetWidth;
    this.lightbox.classList.add('visible');
  }

  closeLightbox() {
    if (!this.isLightboxOpen) return;
    this.isLightboxOpen = false;
    this.lightbox.classList.remove('visible');
    setTimeout(() => {
      if (!this.isLightboxOpen) this.lightbox.classList.add('hidden');
    }, 240);
  }

  show(memory, origin = null) {
    clearInterval(this.typeTimer);
    this.typeTimer = null;
    this.closeLightbox();
    this.currentMemory = memory;
    this.isOpen = true;
    this.openOrigin = origin;
    window.dispatchEvent(new CustomEvent('memory-modal-opened', { detail: memory }));

    // Populate data
    this.container.querySelector('#memory-tag').textContent = memory.tag || `MEMORY 0${memory.id}`;
    this.container.querySelector('#memory-date').textContent = memory.date || '';
    this.container.querySelector('#photo-badge').textContent = `${memory.badge} ♥`;
    this.container.querySelector('#memory-title').textContent = memory.title;
    this.container.querySelector('#memory-thai-sub').textContent = memory.thaiSubtitle || '';
    this.container.querySelector('#memory-desc').textContent = memory.description;
    this.container.querySelector('#memory-quote-text').textContent = memory.quote;

    // Image & Fallback & Collage
    const imgEl = this.container.querySelector('#polaroid-img');
    const collageEl = this.container.querySelector('#polaroid-collage');
    const placeholder = this.container.querySelector('#photo-placeholder');
    const placeholderText = this.container.querySelector('#placeholder-text');

    placeholderText.textContent = memory.title;
    placeholder.style.background = `linear-gradient(135deg, ${memory.color || '#ff9a9e'}44, rgba(20,18,36,0.9))`;

    if (memory.collage && Array.isArray(memory.collage)) {
      // 2x2 collage
      imgEl.style.display = 'none';
      placeholder.style.display = 'none';
      collageEl.innerHTML = '';
      memory.collage.forEach((cid) => {
        const cImg = document.createElement('img');
        cImg.className = 'collage-item';
        cImg.src = `${import.meta.env.BASE_URL}images/memory-${cid}.jpg`;
        cImg.alt = `ความทรงจำที่ ${cid}`;
        const targetMem = MEMORIES_LIST.find((m) => m.id === cid);
        cImg.style.objectPosition = targetMem?.imagePosition || (cid >= 3 ? '50% 55%' : '50% 22%');
        collageEl.appendChild(cImg);
      });
      collageEl.classList.remove('hidden');
      collageEl.style.display = 'grid';
    } else if (memory.image) {
      collageEl.classList.add('hidden');
      collageEl.style.display = 'none';
      imgEl.src = memory.image;
      imgEl.style.objectPosition = memory.imagePosition || '50% 25%';
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
      collageEl.classList.add('hidden');
      collageEl.style.display = 'none';
      imgEl.style.display = 'none';
      placeholder.style.display = 'flex';
    }

    // Guide on first memory
    const firstGuide = this.container.querySelector('#memory-first-guide');
    if (!ledger.seen('memory-first') && memory.id === 1) {
      firstGuide.classList.remove('hidden');
    } else {
      firstGuide.classList.add('hidden');
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
    const wrap = this.container.querySelector('.modal-card-wrap');
    this.card.classList.remove('reveal-staged');
    void this.card.offsetWidth;
    this.card.classList.add('reveal-staged');
    if (origin && Number.isFinite(origin.x) && Number.isFinite(origin.y) && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      wrap.style.transition = 'none';
      wrap.style.transform = `translate(${origin.x - window.innerWidth / 2}px, ${origin.y - window.innerHeight / 2}px) scale(.38)`;
      wrap.style.opacity = '0.45';
      void wrap.offsetWidth;
      wrap.style.transition = 'transform 620ms cubic-bezier(.2,.8,.2,1), opacity 420ms ease';
      requestAnimationFrame(() => {
        wrap.style.transform = 'translate(0, 0) scale(1)';
        wrap.style.opacity = '1';
      });
    } else {
      wrap.style.transform = '';
      wrap.style.opacity = '';
    }
    setTimeout(() => {
      this.container.classList.add('visible');
    }, 10);
  }

  close(triggerBack = true) {
    if (!this.isOpen) return;
    this.isOpen = false;
    ledger.retire('memory-first');
    this.closeLightbox();
    clearInterval(this.typeTimer);
    this.typeTimer = null;
    this.container.classList.remove('visible');
    const wrap = this.container.querySelector('.modal-card-wrap');
    if (this.openOrigin && Number.isFinite(this.openOrigin.x) && Number.isFinite(this.openOrigin.y) && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      wrap.style.transition = 'transform 320ms cubic-bezier(.4,0,.8,.3), opacity 280ms ease';
      wrap.style.transform = `translate(${this.openOrigin.x - window.innerWidth / 2}px, ${this.openOrigin.y - window.innerHeight / 2}px) scale(.38)`;
      wrap.style.opacity = '0.35';
    }
    setTimeout(() => {
      this.container.classList.add('hidden');
      wrap.style.transition = '';
      wrap.style.transform = '';
      wrap.style.opacity = '';
      this.openOrigin = null;
      window.dispatchEvent(new CustomEvent('memory-modal-closed', { detail: this.currentMemory }));
      if (triggerBack && this.onBackToGalaxy) this.onBackToGalaxy();
    }, 320);
  }
}
