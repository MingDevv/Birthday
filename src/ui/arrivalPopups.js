import { createArrivalNumber } from '../scene/arrivalNumber.js';

export function showArrivalCelebrationFlow(soundManager, { uiDirector, flow, scene, camera, worldTextRegistry, reducedMotion = false, quality = { tier: 'medium' } } = {}) {
  if (soundManager) soundManager.playChimeSound();
  const number = createArrivalNumber(scene, { quality: quality.tier });
  worldTextRegistry?.add(number);
  if (new URLSearchParams(location.search).get('qa')?.startsWith('arrival-')) {
    window.__qaArrivalNumber = number;
    window.__qaArrivalStage = 'number';
  }
  number.show(reducedMotion ? .05 : .55);
  const numberDuration = quality.tier === 'low' ? 1900 : 2200;
  const addCaption = () => {
    if (window.__qaArrivalNumber) window.__qaArrivalStage = 'caption';
    const caption = document.createElement('div');
    caption.className = 'ui-captions arrival-caption arrival-lower-third';
    caption.innerHTML = '<span>สุขสันต์วันเกิดนะข้าวหอม ขอให้วัย 16 ปีนี้เต็มไปด้วยรอยยิ้ม ความสุข<br>และการเติบโตที่เปล่งประกายที่สุดในจักรวาล 💜</span>';
    uiDirector.show({
      id: 'arrival-caption', zone: 'center-stage', layer: 'cinematic', exclusive: true,
      ttl: reducedMotion ? 2600 : 7200, element: caption,
      onClose: () => showGuideCardPrompt(uiDirector, { reducedMotion })
    });
  };
  flow?.after(() => number.hide(reducedMotion ? 0 : .3), reducedMotion ? 1000 : numberDuration, 'EXPLORE');
  flow?.after(addCaption, (reducedMotion ? 1000 : numberDuration) + (reducedMotion ? 50 : 620), 'EXPLORE');
}

export function showGuideCardPrompt(uiDirector, { reducedMotion = false } = {}) {
  const guideEl = document.createElement('div');
  guideEl.id = 'guide-open-card';
  guideEl.className = 'guide-open-card-pill';
  guideEl.setAttribute('role', 'status');
  guideEl.innerHTML = '<span class="guide-icon">💌</span><span class="guide-text">ลองเปิดการ์ดดูสิ</span><span class="guide-arrow">👉✨</span>';
  const handle = uiDirector.show({
    id: 'arrival-guide', zone: 'bottom-center', layer: 'coach', exclusive: true,
    ttl: reducedMotion ? 2500 : 6000, element: guideEl, states: ['EXPLORE'],
    onClose: () => {
      window.removeEventListener('memory-modal-opened', onCardOpen);
      guideEl.removeEventListener('click', cleanup);
    }
  });
  let dismissed = false;
  const cleanup = () => {
    if (dismissed) return;
    dismissed = true;
    window.removeEventListener('memory-modal-opened', onCardOpen);
    handle.hide();
  };
  const onCardOpen = () => cleanup();
  guideEl.addEventListener('click', cleanup, { once: true });
  window.addEventListener('memory-modal-opened', onCardOpen, { once: true });
  return handle;
}
