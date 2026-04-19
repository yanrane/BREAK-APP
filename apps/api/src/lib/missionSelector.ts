export interface MissionPool {
  id: string;
  category: 'PHYSICAL' | 'MENTAL' | 'SOCIAL' | 'CREATIVE';
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

/**
 * Selects up to 3 daily missions from the provided pool.
 *
 * Selection strategy:
 * 1. Pick 1 PHYSICAL mission (if available)
 * 2. Pick 1 MENTAL mission (if available)
 * 3. Pick 1 SOCIAL or CREATIVE mission (if available)
 * 4. Fill remaining slots from any unselected missions (fallback)
 *
 * Returns fewer than 3 if the pool itself has fewer than 3 missions.
 * Guarantees no duplicate mission IDs in the result.
 */
export function selectDailyMissions(pool: MissionPool[]): MissionPool[] {
  if (pool.length === 0) return [];

  const physical = shuffle(pool.filter((m) => m.category === 'PHYSICAL'));
  const mental = shuffle(pool.filter((m) => m.category === 'MENTAL'));
  const socialCreative = shuffle(
    pool.filter((m) => m.category === 'SOCIAL' || m.category === 'CREATIVE'),
  );

  const selected: MissionPool[] = [];
  const selectedIds = new Set<string>();

  const pickFrom = (bucket: MissionPool[]) => {
    const m = bucket.find((item) => !selectedIds.has(item.id));
    if (m) {
      selected.push(m);
      selectedIds.add(m.id);
    }
  };

  pickFrom(physical);
  pickFrom(mental);
  pickFrom(socialCreative);

  // Fill remaining slots from any unselected mission (fallback for empty category buckets)
  if (selected.length < 3) {
    for (const m of shuffle(pool.filter((item) => !selectedIds.has(item.id)))) {
      if (selected.length >= 3) break;
      selected.push(m);
      selectedIds.add(m.id);
    }
  }

  return selected;
}
