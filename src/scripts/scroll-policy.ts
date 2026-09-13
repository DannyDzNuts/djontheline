/** Proximity only: never pull a distant or taller-than-screen composition into place. */
export function settleDelta(top: number, height: number, viewport: number): number | null {
  const delta = top - viewport * 0.12;
  if (height > viewport * 0.9 || Math.abs(delta) < 6 || Math.abs(delta) > Math.min(72, viewport * 0.09)) return null;
  return delta;
}
