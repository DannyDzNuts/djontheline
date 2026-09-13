/** Rest the media below the top edge, only if native momentum already landed nearby. */
export function settleDelta(top: number, height: number, viewport: number): number | null {
  const delta = top - viewport * 0.12;
  if (height < 40 || Math.abs(delta) < 5 || Math.abs(delta) > Math.min(144, viewport * 0.17)) return null;
  return delta;
}
/** Conservative inference: uncertain/high-resolution input stays native. */
export function wheelLooksDiscrete(delta: number, mode: number, elapsed: number, previous: number) {
  const amount = Math.abs(delta);
  if (mode === 1) return Number.isInteger(amount) && amount >= 1 && amount <= 8;
  return mode === 0 && Number.isInteger(amount) && amount >= 80 && amount <= 160
    && delta === previous && elapsed >= 40 && elapsed <= 260;
}
