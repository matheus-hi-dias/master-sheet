/**
 * Clamp a raw dot value into the range accepted by a dot tracker.
 */
export function clampDotValue(value: number, maxDots: number): number {
  return Math.max(0, Math.min(Math.round(value) || 0, maxDots));
}

/**
 * Toggle a dot at `index` for the current value.
 *
 * Pressing the last filled dot clears it; pressing any other dot fills up to
 * and including that dot. This is the rule both platform renderers use.
 */
export function toggleDotValue(
  current: number,
  index: number,
  maxDots: number,
): number {
  const clamped = clampDotValue(current, maxDots);
  return index + 1 === clamped ? index : index + 1;
}
