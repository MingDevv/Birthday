export function heroCamera(aspect) {
  const portrait = aspect < 1;
  const fov = portrait ? 58 : 45;
  const fitRadius = portrait ? 50 : 68;
  const halfFov = Math.tan((fov * Math.PI / 180) / 2);
  const distance = Math.max(86, fitRadius / (halfFov * Math.max(aspect, 0.35)));
  const elevation = (portrait ? 30 : 24) * Math.PI / 180;
  return {
    fov,
    position: {
      x: 0,
      y: Math.sin(elevation) * distance,
      z: Math.cos(elevation) * distance
    },
    target: { x: 0, y: portrait ? -6 : 0, z: 0 }
  };
}
