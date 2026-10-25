export function heroCamera(aspect) {
  const portrait = aspect < 1;
  const fov = portrait ? 58 : 68;
  // A high portrait angle keeps the orbital plane legible in a narrow frame.
  // The outer Saturn ring reaches roughly 96 world units after tightening
  // the orbit layout; include breathing room for its tilt and hit target.
  const orbitalRadius = 100;
  const elevation = (portrait ? 72 : 46) * Math.PI / 180;
  const halfFov = Math.tan((fov * Math.PI / 180) / 2);
  // Solve against perspective-projected points, rather than estimating from
  // an orthographic radius. Near-side orbit points otherwise grow and clip.
  const measure = (distance, targetY) => {
    let maxX = 0;
    let minY = Infinity;
    let maxY = -Infinity;
    for (let i = 0; i < 144; i++) {
      const angle = (i / 144) * Math.PI * 2;
      const radius = orbitalRadius * (1 + 0.04 * Math.cos(angle));
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = Math.sin(angle) * 6;
      for (const offset of [-12, 12]) {
        const dy = y + offset - targetY;
        const viewY = dy * Math.cos(elevation) - z * Math.sin(elevation);
        const depth = distance - dy * Math.sin(elevation) - z * Math.cos(elevation);
        if (depth <= 0) return { maxX: Infinity, maxY: Infinity };
        const ndcX = x / (depth * halfFov * Math.max(aspect, 0.35));
        const ndcY = viewY / (depth * halfFov);
        maxX = Math.max(maxX, Math.abs(ndcX));
        minY = Math.min(minY, ndcY);
        maxY = Math.max(maxY, ndcY);
      }
    }
    return { maxX, maxY: Math.max(Math.abs(minY), Math.abs(maxY)) };
  };

  const bestTarget = (distance) => {
    let best = { y: 0, score: Infinity };
    const targetMin = portrait ? -8 : -48;
    const targetMax = portrait ? 8 : 48;
    for (let y = targetMin; y <= targetMax; y += 2) {
      const bounds = measure(distance, y);
      const score = Math.max(bounds.maxX / 0.88, bounds.maxY / 0.8);
      if (score < best.score) best = { y, score };
    }
    return best;
  };

  let low = 86;
  let high = 1200;
  for (let i = 0; i < 32; i++) {
    const mid = (low + high) / 2;
    if (bestTarget(mid).score <= 1) high = mid;
    else low = mid;
  }
  const distance = high;
  const targetY = bestTarget(distance).y;
  return {
    fov,
    position: {
      x: 0,
      y: targetY + Math.sin(elevation) * distance,
      z: Math.cos(elevation) * distance
    },
    target: { x: 0, y: targetY, z: 0 }
  };
}
