const TIERS = {
  ultra: { pixelRatio: 2, galaxyStars: 180000, backgroundStars: 24000 },
  high: { pixelRatio: 1.75, galaxyStars: 135000, backgroundStars: 18000 },
  medium: { pixelRatio: 1.35, galaxyStars: 72000, backgroundStars: 10000 },
  low: { pixelRatio: 1, galaxyStars: 32000, backgroundStars: 5000 }
};

function detectTier() {
  const memory = navigator.deviceMemory || 8;
  const cores = navigator.hardwareConcurrency || 8;
  const isMobile = matchMedia('(pointer: coarse)').matches || /Android|iPhone|iPad/i.test(navigator.userAgent);
  if (isMobile && memory <= 4) return 'low';
  if (isMobile || memory <= 6 || cores <= 4) return 'medium';
  if (memory >= 16 && cores >= 8) return 'ultra';
  return 'high';
}

export function getQualityConfig(search = window.location.search) {
  const params = new URLSearchParams(search);
  const requested = params.get('quality');
  const tier = Object.prototype.hasOwnProperty.call(TIERS, requested) ? requested : detectTier();
  return { tier, ...TIERS[tier], pixelRatio: Math.min(TIERS[tier].pixelRatio, window.devicePixelRatio || 1) };
}

/** Dynamically adjusts render resolution without rebuilding scene geometry. */
export function createFrameGovernor({ renderer, composer, initialConfig, onTierChange, getSize = () => ({ width: window.innerWidth, height: window.innerHeight }) }) {
  const names = ['low', 'medium', 'high', 'ultra'];
  let tier = initialConfig.tier;
  let frames = 0;
  let totalMs = 0;
  let slowWindows = 0;
  let fastSince = 0;

  function apply(nextTier) {
    if (nextTier === tier) return;
    tier = nextTier;
    const pixelRatio = Math.min(TIERS[tier].pixelRatio, window.devicePixelRatio || 1);
    const { width, height } = getSize();
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
    composer.setPixelRatio(pixelRatio);
    composer.setSize(width, height);
    onTierChange?.({ tier, ...TIERS[tier], pixelRatio });
  }

  return {
    update(delta) {
      frames += 1;
      totalMs += delta * 1000;
      if (frames < 90) return;
      const averageMs = totalMs / frames;
      if (averageMs > 20) {
        slowWindows += 1;
        fastSince = 0;
        if (slowWindows >= 1) apply(names[Math.max(0, names.indexOf(tier) - 1)]);
      } else if (averageMs < 12) {
        fastSince += totalMs;
        if (fastSince >= 5000) {
          apply(names[Math.min(names.length - 1, names.indexOf(tier) + 1)]);
          fastSince = 0;
          slowWindows = 0;
        }
      } else {
        slowWindows = 0;
        fastSince = 0;
      }
      frames = 0;
      totalMs = 0;
    },
    get tier() { return tier; }
  };
}

export function getQueryFlags(search = window.location.search) {
  const params = new URLSearchParams(search);
  return {
    debug: params.get('debug') === '1',
    cinema: params.get('cinema') === '1',
    mute: params.get('mute') === '1',
    skipIntro: params.get('skipintro') === '1',
    portraitRatio: params.get('ratio') === '9x16'
  };
}

export { TIERS as QUALITY_TIERS };
