import { RebarSchedule, HeightBucket } from '../types';

// UNRESOLVED: Rebar spacing and size schedule not fully confirmed from project
// workbook – using common engineering practice values.
export const REBAR_SCHEDULE: RebarSchedule[] = [
  // --- 8" wall ---
  { height_bucket: 2,  wall_width_in: 8, bar_size: '#4', spacing_in: 48, embed_depth_in: 18 },
  { height_bucket: 4,  wall_width_in: 8, bar_size: '#4', spacing_in: 48, embed_depth_in: 18 },
  { height_bucket: 6,  wall_width_in: 8, bar_size: '#4', spacing_in: 32, embed_depth_in: 24 },
  { height_bucket: 8,  wall_width_in: 8, bar_size: '#5', spacing_in: 32, embed_depth_in: 24 },
  { height_bucket: 10, wall_width_in: 8, bar_size: '#5', spacing_in: 24, embed_depth_in: 30 },
  { height_bucket: 12, wall_width_in: 8, bar_size: '#6', spacing_in: 24, embed_depth_in: 36 },
  { height_bucket: 14, wall_width_in: 8, bar_size: '#6', spacing_in: 24, embed_depth_in: 36 },
  { height_bucket: 16, wall_width_in: 8, bar_size: '#7', spacing_in: 16, embed_depth_in: 42 },
  { height_bucket: 18, wall_width_in: 8, bar_size: '#7', spacing_in: 16, embed_depth_in: 42 },
  { height_bucket: 20, wall_width_in: 8, bar_size: '#8', spacing_in: 16, embed_depth_in: 48 },
  // --- 12" wall ---
  { height_bucket: 2,  wall_width_in: 12, bar_size: '#4', spacing_in: 48, embed_depth_in: 18 },
  { height_bucket: 4,  wall_width_in: 12, bar_size: '#4', spacing_in: 48, embed_depth_in: 18 },
  { height_bucket: 6,  wall_width_in: 12, bar_size: '#5', spacing_in: 32, embed_depth_in: 24 },
  { height_bucket: 8,  wall_width_in: 12, bar_size: '#5', spacing_in: 32, embed_depth_in: 24 },
  { height_bucket: 10, wall_width_in: 12, bar_size: '#6', spacing_in: 24, embed_depth_in: 30 },
  { height_bucket: 12, wall_width_in: 12, bar_size: '#6', spacing_in: 24, embed_depth_in: 36 },
  { height_bucket: 14, wall_width_in: 12, bar_size: '#7', spacing_in: 24, embed_depth_in: 36 },
  { height_bucket: 16, wall_width_in: 12, bar_size: '#7', spacing_in: 16, embed_depth_in: 42 },
  { height_bucket: 18, wall_width_in: 12, bar_size: '#8', spacing_in: 16, embed_depth_in: 42 },
  { height_bucket: 20, wall_width_in: 12, bar_size: '#8', spacing_in: 16, embed_depth_in: 48 },
];

/**
 * Look up the rebar schedule for a given height bucket and wall width.
 * Falls back to the nearest lower bucket for the same wall width.
 */
export function lookupRebar(
  height_bucket: HeightBucket,
  wall_width_in: number,
): RebarSchedule | null {
  const exact = REBAR_SCHEDULE.find(
    r => r.height_bucket === height_bucket && r.wall_width_in === wall_width_in,
  );
  if (exact) return exact;

  const candidates = REBAR_SCHEDULE.filter(
    r => r.wall_width_in === wall_width_in && r.height_bucket <= height_bucket,
  );
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.height_bucket - a.height_bucket);
  return candidates[0];
}
