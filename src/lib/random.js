// Small randomness helpers shared by every question generator.

export function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pickOne(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** n distinct random items (fewer if the array is shorter). */
export function sample(arr, n) {
  return shuffle(arr).slice(0, n);
}

/**
 * Pick `count` distinct distractors.
 * `tiers` is an ordered list of candidate arrays (closest first) with the
 * number to try to take from each; anything still missing is filled from the
 * later tiers and finally from `fallback`. Items are de-duplicated by `keyOf`.
 */
export function pickDistractors({ correctKey, tiers, fallback = [], count = 3, keyOf = (x) => x }) {
  const chosen = [];
  const seen = new Set([correctKey]);
  const take = (items, limit) => {
    for (const item of shuffle(items)) {
      if (chosen.length >= count || limit <= 0) return;
      const k = keyOf(item);
      if (k == null || seen.has(k)) continue;
      seen.add(k);
      chosen.push(item);
      limit--;
    }
  };
  for (const { items, take: n } of tiers) take(items, n ?? count);
  for (const { items } of tiers) take(items, count);
  take(fallback, count);
  return chosen;
}

/** Cycle through a shuffled pool, reshuffling once exhausted (no repeats until the pool is used up). */
export function cycler(pool) {
  let queue = [];
  return () => {
    if (queue.length === 0) queue = shuffle(pool);
    return queue.pop();
  };
}
