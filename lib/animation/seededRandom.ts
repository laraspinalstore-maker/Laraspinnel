/**
 * Deterministic pseudo-random numbers for decorative animations.
 *
 * `Math.random()` called while rendering has three separate problems, and the
 * confetti/sprinkle components hit all three:
 *
 *   1. It is impure in render, which `react-hooks/purity` reports and the React
 *      Compiler cannot memoize — every re-render reshuffled every particle.
 *   2. Server and client produce different numbers, so the markup could not be
 *      server-rendered without a hydration mismatch. Both components worked
 *      around that with a `mounted` state flag and an effect, which cost a render
 *      pass and left the decoration missing from the initial HTML.
 *   3. The particle set changed on every render of the parent, so an unrelated
 *      state update restarted the animation.
 *
 * Seeding by index instead gives the same visual variety with none of that: the
 * values are fixed at module load, identical on both sides of hydration, and free
 * to compute at module scope.
 *
 * This is mulberry32's mixing step — cheap, no state, and well-distributed enough
 * for positions and delays. It is NOT suitable for anything security-related; use
 * `crypto.getRandomValues` for that.
 */
export function seededRandom(seed: number): number {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/**
 * `count` evenly-seeded values in [0, 1).
 *
 * `salt` separates independent series for the same index — pass a different salt
 * per property (x position, delay, scale) so they do not correlate.
 */
export function seededSeries(count: number, salt: number): number[] {
  return Array.from({ length: count }, (_, i) => seededRandom(i * 97 + salt * 7919));
}
