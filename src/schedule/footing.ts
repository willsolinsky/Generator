import { FootingSchedule, HeightBucket } from '../types';

// UNRESOLVED: Footing depth and reinforcement schedule not fully confirmed from
// project workbook – using typical structural practice values.
export const FOOTING_SCHEDULE: FootingSchedule[] = [
  // --- 8" wall ---
  { height_bucket: 2,  width_in: 8, depth_in: 12, rebar_top: null, rebar_bottom: '#4', keyway: true },
  { height_bucket: 4,  width_in: 8, depth_in: 12, rebar_top: null, rebar_bottom: '#4', keyway: true },
  { height_bucket: 6,  width_in: 8, depth_in: 12, rebar_top: '#4', rebar_bottom: '#4', keyway: true },
  { height_bucket: 8,  width_in: 8, depth_in: 16, rebar_top: '#4', rebar_bottom: '#4', keyway: true },
  { height_bucket: 10, width_in: 8, depth_in: 18, rebar_top: '#5', rebar_bottom: '#5', keyway: true },
  { height_bucket: 12, width_in: 8, depth_in: 24, rebar_top: '#5', rebar_bottom: '#5', keyway: true },
  { height_bucket: 14, width_in: 8, depth_in: 28, rebar_top: '#5', rebar_bottom: '#6', keyway: true },
  { height_bucket: 16, width_in: 8, depth_in: 32, rebar_top: '#6', rebar_bottom: '#6', keyway: true },
  { height_bucket: 18, width_in: 8, depth_in: 36, rebar_top: '#6', rebar_bottom: '#6', keyway: true },
  { height_bucket: 20, width_in: 8, depth_in: 42, rebar_top: '#6', rebar_bottom: '#7', keyway: true },
  // --- 12" wall ---
  { height_bucket: 2,  width_in: 12, depth_in: 12, rebar_top: null, rebar_bottom: '#4', keyway: true },
  { height_bucket: 4,  width_in: 12, depth_in: 12, rebar_top: null, rebar_bottom: '#4', keyway: true },
  { height_bucket: 6,  width_in: 12, depth_in: 18, rebar_top: '#4', rebar_bottom: '#5', keyway: true },
  { height_bucket: 8,  width_in: 12, depth_in: 20, rebar_top: '#5', rebar_bottom: '#5', keyway: true },
  { height_bucket: 10, width_in: 12, depth_in: 24, rebar_top: '#5', rebar_bottom: '#5', keyway: true },
  { height_bucket: 12, width_in: 12, depth_in: 30, rebar_top: '#5', rebar_bottom: '#6', keyway: true },
  { height_bucket: 14, width_in: 12, depth_in: 34, rebar_top: '#6', rebar_bottom: '#6', keyway: true },
  { height_bucket: 16, width_in: 12, depth_in: 38, rebar_top: '#6', rebar_bottom: '#6', keyway: true },
  { height_bucket: 18, width_in: 12, depth_in: 42, rebar_top: '#6', rebar_bottom: '#7', keyway: true },
  { height_bucket: 20, width_in: 12, depth_in: 48, rebar_top: '#7', rebar_bottom: '#7', keyway: true },
];

/**
 * Look up the footing schedule entry for a given height bucket and wall width.
 * Returns the exact match or, if no exact match exists, the closest lower
 * height-bucket entry for the same wall width.  Returns null if not found.
 */
export function lookupFooting(
  height_bucket: HeightBucket,
  wall_width_in: number,
): FootingSchedule | null {
  // Exact match first
  const exact = FOOTING_SCHEDULE.find(
    f => f.height_bucket === height_bucket && f.width_in === wall_width_in,
  );
  if (exact) return exact;

  // Find the highest bucket that is ≤ requested bucket for this width
  const candidates = FOOTING_SCHEDULE.filter(
    f => f.width_in === wall_width_in && f.height_bucket <= height_bucket,
  );
  if (candidates.length === 0) return null;

  candidates.sort((a, b) => b.height_bucket - a.height_bucket);
  return candidates[0];
}
