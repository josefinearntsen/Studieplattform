export type { AgendaCategory, AgendaItem } from '@/lib/agenda';
export { itemColor } from '@/lib/agenda';

import type { AgendaItem } from '@/lib/agenda';

export type PositionedItem = AgendaItem & { col: number; cols: number };

/**
 * Enkel "interval graph coloring"-algoritme (samme idé som Google Calendar bruker):
 * hendelser som overlapper i tid får hver sin kolonne innenfor dagen, slik at ingen
 * dekker hverandre. Hendelser som ikke overlapper noe, får full bredde.
 */
export function layoutOverlaps(items: AgendaItem[]): PositionedItem[] {
  const sorted = [...items].sort(
    (a, b) => a.start.getTime() - b.start.getTime() || b.end.getTime() - a.end.getTime()
  );

  const result: PositionedItem[] = [];
  let cluster: (AgendaItem & { col: number })[] = [];
  let colEndTimes: number[] = [];
  let clusterEnd = -Infinity;

  const flush = () => {
    if (cluster.length === 0) return;
    const cols = Math.max(...cluster.map((e) => e.col)) + 1;
    for (const e of cluster) result.push({ ...e, cols });
    cluster = [];
    colEndTimes = [];
    clusterEnd = -Infinity;
  };

  for (const item of sorted) {
    const startTime = item.start.getTime();
    if (startTime >= clusterEnd) flush();

    let col = colEndTimes.findIndex((end) => end <= startTime);
    if (col === -1) {
      col = colEndTimes.length;
      colEndTimes.push(item.end.getTime());
    } else {
      colEndTimes[col] = item.end.getTime();
    }
    cluster.push({ ...item, col });
    clusterEnd = Math.max(clusterEnd, item.end.getTime());
  }
  flush();

  return result;
}

export function minutesSinceMidnight(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}
