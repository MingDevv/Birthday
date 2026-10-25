import * as THREE from 'three';
import { createWorldText } from '../scene/worldText.js';

export function showArrivalCelebrationFlow(soundManager, { uiDirector, scene, camera, worldTextRegistry, reducedMotion = false, quality = { tier: 'medium' } } = {}) {
  if (soundManager) soundManager.playChimeSound();
  const number = createWorldText(scene, {
    text: 'อายุ 16 แล้วนะ! 🎉✨',
    font: '900 116px Prompt, sans-serif',
    color: '#ffe3aa',
    width: 58,
    height: 12,
    position: new THREE.Vector3(0, 20, -7)
  });
  worldTextRegistry?.add(number);
  number.show(reducedMotion ? .05 : .55);
  const numberDuration = quality.tier === 'low' ? 2100 : 2500;
  const addCaption = () => {
    const caption = document.createElement('div');
    caption.className = 'ui-captions arrival-caption';
    caption.innerHTML = '<span>สุขสันต์วันเกิดนะข้าวหอม ขอให้วัย 16 ปีนี้เต็มไปด้วยรอยยิ้ม ความสุข<br>และการเติบโตที่เปล่งประกายที่สุดในจักรวาล 💜</span>';
    uiDirector.show({
      id: 'arrival-caption', zone: 'center-stage', layer: 'cinematic', exclusive: true,
      ttl: reducedMotion ? 2600 : 7200, element: caption,
      onClose: () => showGuideCardPrompt(uiDirector, { reducedMotion })
    });
  };
  window.setTimeout(() => {
    number.hide(reducedMotion ? 0 : .3);
    window.setTimeout(addCaption, reducedMotion ? 50 : 320);
  }, reducedMotion ? 1000 : numberDuration);
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
