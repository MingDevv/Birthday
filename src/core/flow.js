const VALID_STATES = new Set([
  'LOADING', 'INTRO', 'FLIGHT', 'ARRIVAL', 'EXPLORE', 'FOCUS', 'MEMORY',
  'FINALE_ALIGN', 'FINALE_HEART', 'FINALE_CAKE', 'FINALE_LETTER', 'EPILOGUE'
]);

export function createFlow({ ui, onChange = () => {}, killStateAnimations = () => {} } = {}) {
  let state = 'LOADING';
  let generation = 0;
  const timelines = new Set();
  return {
    go(next, { timeline = null, force = false } = {}) {
      if (!VALID_STATES.has(next)) throw new TypeError(`Unknown flow state: ${next}`);
      if (state === next && !force) return false;
      for (const item of timelines) item.kill?.();
      timelines.clear();
      killStateAnimations({ previous: state, next });
      if (timeline) timelines.add(timeline);
      const previous = state;
      state = next;
      generation += 1;
      ui?.setState(next);
      onChange({ previous, next, generation });
      document.body.dataset.flowState = next;
      return true;
    },
    track(timeline) { if (timeline?.kill) timelines.add(timeline); return timeline; },
    get state() { return state; },
    get generation() { return generation; },
    get locked() { return ['FLIGHT', 'FOCUS', 'FINALE_ALIGN', 'FINALE_HEART', 'FINALE_LETTER'].includes(state); }
  };
}
