import { KeywaySchedule, HeightBucket } from '../types';

// UNRESOLVED: Keyway dimensions not fully confirmed from project workbook –
// using typical structural practice values.
export const KEYWAY_SCHEDULE: KeywaySchedule[] = [
  { height_bucket: 2,  width_in: 8,  keyway_depth_in: 1.5, keyway_width_in: 3 },
  { height_bucket: 4,  width_in: 8,  keyway_depth_in: 1.5, keyway_width_in: 3 },
  { height_bucket: 6,  width_in: 8,  keyway_depth_in: 2,   keyway_width_in: 3 },
  { height_bucket: 8,  width_in: 8,  keyway_depth_in: 2,   keyway_width_in: 3 },
  { height_bucket: 10, width_in: 8,  keyway_depth_in: 2,   keyway_width_in: 4 },
  { height_bucket: 12, width_in: 8,  keyway_depth_in: 2.5, keyway_width_in: 4 },
  { height_bucket: 14, width_in: 8,  keyway_depth_in: 2.5, keyway_width_in: 4 },
  { height_bucket: 16, width_in: 8,  keyway_depth_in: 3,   keyway_width_in: 4 },
  { height_bucket: 18, width_in: 8,  keyway_depth_in: 3,   keyway_width_in: 4 },
  { height_bucket: 20, width_in: 8,  keyway_depth_in: 3,   keyway_width_in: 4 },
  { height_bucket: 2,  width_in: 12, keyway_depth_in: 1.5, keyway_width_in: 3 },
  { height_bucket: 4,  width_in: 12, keyway_depth_in: 1.5, keyway_width_in: 3 },
  { height_bucket: 6,  width_in: 12, keyway_depth_in: 2,   keyway_width_in: 4 },
  { height_bucket: 8,  width_in: 12, keyway_depth_in: 2,   keyway_width_in: 4 },
  { height_bucket: 10, width_in: 12, keyway_depth_in: 2.5, keyway_width_in: 4 },
  { height_bucket: 12, width_in: 12, keyway_depth_in: 2.5, keyway_width_in: 4 },
  { height_bucket: 14, width_in: 12, keyway_depth_in: 3,   keyway_width_in: 5 },
  { height_bucket: 16, width_in: 12, keyway_depth_in: 3,   keyway_width_in: 5 },
  { height_bucket: 18, width_in: 12, keyway_depth_in: 3,   keyway_width_in: 5 },
  { height_bucket: 20, width_in: 12, keyway_depth_in: 3.5, keyway_width_in: 5 },
];

/**
 * Look up the keyway schedule for a given height bucket and wall width.
 * Falls back to the nearest lower bucket for the same width.
 */
export function lookupKeyway(
  height_bucket: HeightBucket,
  wall_width_in: number,
): KeywaySchedule | null {
  const exact = KEYWAY_SCHEDULE.find(
    k => k.height_bucket === height_bucket && k.width_in === wall_width_in,
  );
  if (exact) return exact;

  const candidates = KEYWAY_SCHEDULE.filter(
    k => k.width_in === wall_width_in && k.height_bucket <= height_bucket,
  );
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.height_bucket - a.height_bucket);
  return candidates[0];
}
