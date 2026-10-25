const ZONES = new Set(['top-left', 'top-right', 'center-stage', 'bottom-center', 'bottom-left', 'bottom-right']);
const LAYERS = new Set(['hud', 'action', 'toast', 'coach', 'modal', 'cinematic', 'system']);

const LAYER_Z = {
  hud: 'var(--z-hud)', action: 'var(--z-action)', toast: 'var(--z-toast)', coach: 'var(--z-coach)',
  modal: 'var(--z-modal)', cinematic: 'var(--z-cinematic)', system: 'var(--z-system)'
};

export function createUIDirector({ root = document.body, reducedMotion = false } = {}) {
  const registry = new Map();
  let state = 'LOADING';
  let modalOpen = false;
  const allowed = {
    LOADING: ['system'], INTRO: ['system', 'cinematic'], FLIGHT: ['action', 'cinematic'],
    ARRIVAL: ['cinematic', 'coach'], EXPLORE: ['hud', 'action', 'coach', 'toast', 'cinematic'],
    FOCUS: ['cinematic'], MEMORY: ['modal'], FINALE_ALIGN: ['cinematic'], FINALE_HEART: ['cinematic'],
    FINALE_CAKE: ['action', 'cinematic'], FINALE_LETTER: ['cinematic'], EPILOGUE: ['hud', 'action', 'toast']
  };

  function removeEntry(entry, { immediate = false, callClose = true } = {}) {
    if (!entry || entry.closing) return;
    entry.closing = true;
    clearTimeout(entry.timer);
    clearTimeout(entry.removeTimer);
    entry.el.classList.add('ui-director-leaving');
    const remove = () => {
      if (entry.removed) return;
      entry.removed = true;
      entry.el.removeEventListener('transitionend', entry.transitionEnd);
      entry.el.remove();
      registry.delete(entry.id);
      entry.el.dispatchEvent(new CustomEvent('ui-director-removed'));
      if (callClose) entry.onClose?.();
    };
    if (immediate || reducedMotion || !entry.el.isConnected) remove();
    else {
      entry.transitionEnd = (event) => { if (event.target === entry.el) remove(); };
      entry.el.addEventListener('transitionend', entry.transitionEnd, { once: true });
      entry.removeTimer = setTimeout(remove, 320);
    }
  }

  function show({ id, zone = 'center-stage', layer = 'toast', exclusive = true, ttl = null, render, element, onClose, states = null }) {
    if (!id || !ZONES.has(zone) || !LAYERS.has(layer)) throw new TypeError('Invalid UI director entry');
    registry.get(id) && removeEntry(registry.get(id), { immediate: true, callClose: false });
    if (exclusive) {
      for (const entry of [...registry.values()]) if (entry.zone === zone && entry.id !== id) removeEntry(entry);
    }
    const el = element || render?.();
    if (!(el instanceof HTMLElement)) throw new TypeError('UI director render must return an HTMLElement');
    el.dataset.uiLayer = id;
    el.dataset.uiZone = zone;
    el.dataset.uiLayerType = layer;
    el.classList.add('ui-director-item', `ui-zone-${zone}`, `ui-layer-${layer}`);
    el.style.zIndex = LAYER_Z[layer];
    root.append(el);
    const entry = { id, zone, layer, el, onClose, states: states ? new Set(states) : null, timer: null, removeTimer: null, remaining: ttl, shownAt: performance.now(), paused: false, closing: false, removed: false };
    if (ttl !== null) entry.timer = setTimeout(() => removeEntry(entry), ttl);
    registry.set(id, entry);
    if (modalOpen && layer !== 'modal') setInert(entry, true);
    return { el, hide: () => removeEntry(entry), dispose: () => removeEntry(entry, { immediate: true }) };
  }

  function setInert(entry, inert) {
    entry.el.inert = inert;
    if (inert) entry.el.setAttribute('aria-hidden', 'true');
    else entry.el.removeAttribute('aria-hidden');
    if (entry.remaining === null) return;
    if (inert && !entry.paused) {
      clearTimeout(entry.timer);
      entry.remaining = Math.max(0, entry.remaining - (performance.now() - entry.shownAt));
      entry.paused = true;
    } else if (!inert && entry.paused && !entry.closing) {
      entry.paused = false;
      entry.shownAt = performance.now();
      entry.timer = setTimeout(() => removeEntry(entry), entry.remaining);
    }
  }

  return {
    show,
    adopt(id, element, options = {}) { return show({ ...options, id, element }); },
    hide(id) { removeEntry(registry.get(id)); },
    hideAll({ except = [] } = {}) { for (const entry of [...registry.values()]) if (!except.includes(entry.id)) removeEntry(entry); },
    setState(next) {
      state = next;
      const permitted = new Set(allowed[next] || []);
      for (const entry of [...registry.values()]) {
        if (!permitted.has(entry.layer) || (entry.states && !entry.states.has(next))) removeEntry(entry);
      }
      root.dataset.flowState = state;
    },
    setModalOpen(open) {
      modalOpen = open;
      for (const entry of registry.values()) if (entry.layer !== 'modal') setInert(entry, open);
    },
    get state() { return state; },
    get entries() { return [...registry.values()].map(({ id, zone, layer, el }) => ({ id, zone, layer, el })); }
  };
}
