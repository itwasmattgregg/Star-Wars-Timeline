import type { TimelineEvent } from '../data/timeline';
import { TIMELINE_EVENTS, yearToX } from '../data/timeline';

/** Minimum world-space gap between *different-year* columns along the timeline */
export const MIN_NODE_GAP = 2.4;
/** Vertical spacing when multiple events share the exact same year */
export const SAME_YEAR_STACK_GAP = 1.0;

export interface EventLayout {
  x: number;
  y: number;
  z: number;
}

function laneToZ(x: number, stackIndex: number): number {
  return Math.sin(x * 0.08) * 1.5 + (stackIndex % 2 === 0 ? 0.25 : -0.25);
}

/**
 * Events at the same year share one X column and stack vertically.
 * Different years are separated horizontally when the timeline compresses them.
 */
export function computeEventLayouts(
  events: TimelineEvent[] = TIMELINE_EVENTS
): Map<string, EventLayout> {
  const sorted = [...events].sort(
    (a, b) => a.year - b.year || a.lane - b.lane || a.title.localeCompare(b.title)
  );

  const layouts = new Map<string, EventLayout>();
  let prevX = -Infinity;

  let i = 0;
  while (i < sorted.length) {
    const year = sorted[i]!.year;
    const group: TimelineEvent[] = [];
    while (i < sorted.length && sorted[i]!.year === year) {
      group.push(sorted[i]!);
      i++;
    }

    let x = yearToX(year);
    if (x < prevX + MIN_NODE_GAP) {
      x = prevX + MIN_NODE_GAP;
    }
    prevX = x;

    const stackSpan = (group.length - 1) * SAME_YEAR_STACK_GAP;
    const yStart = -stackSpan / 2;

    group.forEach((event, stackIndex) => {
      const y = yStart + stackIndex * SAME_YEAR_STACK_GAP;
      const z = laneToZ(x, stackIndex);
      layouts.set(event.id, { x, y, z });
    });
  }

  return layouts;
}

/** World-space extent of all laid-out events (ribbon & era zones should match this) */
export function getTimelineLayoutBounds(padding = 2): { minX: number; maxX: number } {
  const layouts = computeEventLayouts();
  let minX = Infinity;
  let maxX = -Infinity;
  for (const layout of layouts.values()) {
    minX = Math.min(minX, layout.x);
    maxX = Math.max(maxX, layout.x);
  }
  if (!isFinite(minX)) {
    return { minX: yearToX(-100) - padding, maxX: yearToX(40) + padding };
  }
  return { minX: minX - padding, maxX: maxX + padding };
}

/** Node visual scale — gentle shrink when zoomed in, but stays readable up close */
export function getZoomNodeScale(cameraDistance: number): number {
  const refDistance = 24;
  const minScale = 0.62;
  return Math.min(1, Math.max(minScale, cameraDistance / refDistance));
}
