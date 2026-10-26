import { GUIDE_COPY } from '../config/guideCopy.js';

/**
 * =========================================================================
 * 📖 Guide Help Sheet: แผ่นคู่มือแนะนำฟังก์ชันครบทั้งเว็บ
 * เปิดได้จากปุ่ม "?" หรือเมนูเครื่องมือ ให้ข้อมูลพร้อมปุ่ม "ลองเลย"
 * =========================================================================
 */
export function createGuideHelpSheet({
  uiDirector,
  copy = GUIDE_COPY,
  onToggleSound,
  onResetCamera,
  onToggleGalaxy,
  onMakeWish,
  onGoNextPlanet,
  onReplayTour
} = {}) {
  let backdropEl = null;
  let isOpen = false;
  let lastFocusedEl = null;

  function buildItems() {
    const items = [
      {
        icon: '💫',
        name: 'สำรวจจักรวาล',
        desc: 'ลากเมาส์หรือนิ้วเพื่อหมุน · บีบนิ้ว/เลื่อนล้อเพื่อซูม',
        actionLabel: null,
        onAction: null
      },
      {
        icon: '🪐',
        name: '5 ดาวเคราะห์ความทรงจำ',
        desc: 'แตะดาวที่เรืองแสงเพื่อเปิดอ่านการ์ดความทรงจำ',
        actionLabel: 'ไปดาวถัดไป ➔',
        onAction: () => onGoNextPlanet?.()
      },
      {
        icon: '💜',
        name: 'ตัวนับหัวใจ (0/5)',
        desc: 'แตะรูปหัวใจมุมซ้ายบนเพื่อวาร์ปไปดาวนั้นทันที',
        actionLabel: null,
        onAction: null
      },
      {
        icon: '🌌',
        name: 'ท่องกาแล็กซี่ 3D',
        desc: 'สลับมุมกว้างเพื่อชมทางช้างเผือกและชื่อ 3D',
        actionLabel: 'ลองเลย',
        onAction: () => onToggleGalaxy?.()
      },
      {
        icon: '🎯',
        name: 'ดวงใจวันเกิด',
        desc: 'รีเซ็ตมุมกล้องกลับมาที่หัวใจคริสตัลตรงกลาง',
        actionLabel: 'ลองเลย',
        onAction: () => onResetCamera?.()
      },
      {
        icon: '🔊',
        name: 'เพลงประกอบ',
        desc: 'แตะแผ่นเสียงเพื่อเปิดหรือปิดเพลง',
        actionLabel: 'สลับเพลง',
        onAction: () => onToggleSound?.()
      },
      {
        icon: '🎂',
        name: 'อธิษฐานขอพรวันเกิด',
        desc: 'จุดพลุดาวกระจายพร้อมข้อความอวยพรสุดพิเศษ',
        actionLabel: 'ขอพรเลย',
        onAction: () => onMakeWish?.()
      }
    ];

    // Check optional features available on this device
    const hasTilt = document.querySelector('#btn-tilt') !== null;
    if (hasTilt) {
      items.push({
        icon: '📱',
        name: 'โหมดเอียงเครื่อง',
        desc: 'ขยับมุมมองกล้องตามการเอียงของมือถือ',
        actionLabel: null,
        onAction: null
      });
    }

    const hasCinema = document.querySelector('.cinema-record-button') !== null;
    if (hasCinema) {
      items.push({
        icon: '🎬',
        name: 'บันทึกวิดีโอ',
        desc: 'อัดคลิปการเดินทางในจักรวาลไว้เป็นที่ระลึก',
        actionLabel: null,
        onAction: null
      });
    }

    return items;
  }

  function initDOM() {
    backdropEl = document.createElement('div');
    backdropEl.id = 'guide-help-backdrop';
    backdropEl.className = 'guide-help-backdrop hidden';
    backdropEl.setAttribute('role', 'dialog');
    backdropEl.setAttribute('aria-modal', 'true');
    backdropEl.setAttribute('aria-label', copy.help?.title || 'คู่มือเล็กๆ ✨');

    const items = buildItems();
    const itemsHtml = items.map((item, idx) => `
      <div class="guide-help-item">
        <div class="guide-help-item-left">
          <span class="guide-help-icon">${item.icon}</span>
          <div class="guide-help-info">
            <div class="guide-help-name">${item.name}</div>
            <div class="guide-help-desc">${item.desc}</div>
          </div>
        </div>
        ${item.actionLabel ? `<button class="guide-help-action-btn" data-item-idx="${idx}">${item.actionLabel}</button>` : ''}
      </div>
    `).join('');

    backdropEl.innerHTML = `
      <div class="guide-help-sheet">
        <div class="guide-help-header">
          <div>
            <h2 class="guide-help-title">${copy.help?.title || 'คู่มือเล็กๆ ✨'}</h2>
            <div class="guide-help-subtitle">${copy.help?.subtitle || 'รวมวิธีเล่นและปุ่มทั้งหมดในจักรวาลดาวลูกหมู'}</div>
          </div>
          <button class="guide-help-close" id="guide-help-close-btn" title="ปิดคู่มือ" aria-label="ปิดคู่มือ">✕</button>
        </div>

        <div class="guide-help-list">
          ${itemsHtml}
        </div>

        <div class="guide-help-footer">
          <button class="guide-help-replay-btn" id="guide-help-replay-btn">${copy.help?.replay || 'ดูไกด์อีกครั้ง ↺'}</button>
          <button class="guide-tour-btn-next" id="guide-help-ok-btn">${copy.help?.close || 'ปิด ✕'}</button>
        </div>
      </div>
    `;

    document.body.appendChild(backdropEl);

    // Bind item action buttons
    const actionBtns = backdropEl.querySelectorAll('.guide-help-action-btn');
    actionBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const idx = Number(btn.getAttribute('data-item-idx'));
        const actionItem = items[idx];
        close();
        actionItem?.onAction?.();
      });
    });

    // Close handlers
    backdropEl.querySelector('#guide-help-close-btn').addEventListener('click', () => close());
    backdropEl.querySelector('#guide-help-ok-btn').addEventListener('click', () => close());
    backdropEl.addEventListener('click', (e) => {
      if (e.target === backdropEl) close();
    });

    // Replay tour button
    backdropEl.querySelector('#guide-help-replay-btn').addEventListener('click', () => {
      close();
      onReplayTour?.();
    });
  }

  function handleKey(e) {
    if (e.key === 'Escape' && isOpen) {
      e.stopPropagation();
      close();
    }
  }

  function open() {
    if (isOpen) return;
    isOpen = true;
    lastFocusedEl = document.activeElement;

    if (!backdropEl) {
      initDOM();
    }

    backdropEl.classList.remove('hidden');
    void backdropEl.offsetWidth;
    backdropEl.classList.add('visible');

    window.addEventListener('keydown', handleKey);
    backdropEl.querySelector('#guide-help-close-btn')?.focus();
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    window.removeEventListener('keydown', handleKey);

    if (backdropEl) {
      backdropEl.classList.remove('visible');
      setTimeout(() => {
        if (!isOpen) backdropEl?.classList.add('hidden');
      }, 260);
    }

    if (lastFocusedEl && typeof lastFocusedEl.focus === 'function') {
      lastFocusedEl.focus();
    }
  }

  return {
    open,
    close,
    get isOpen() {
      return isOpen;
    },
    dispose() {
      close();
      backdropEl?.remove();
      backdropEl = null;
    }
  };
}
