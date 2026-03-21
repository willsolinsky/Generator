import { NormalizedSegment, RebarSchedule, RodCalculation } from '../types';
import { REBAR_STOCK_LENGTH_FT } from '../schedule/config';

/**
 * Calculate rebar rod quantities for a wall segment.
 *
 * - rod_count per LF  = 12 / rebar_spacing_in (from rebar schedule)
 * - rod_length        = wall_height_ft + embed_depth_ft
 * - extension_rods    when rod_length > standard stock length for that bar size
 */
export function calculateRods(
  segment: NormalizedSegment,
  rebarSchedule: RebarSchedule | null,
  lf: number,
): RodCalculation {
  const segId = segment.segment_id;

  if (rebarSchedule === null || lf === 0) {
    return {
      segment_id: segId,
      rod_count: 0,
      extension_rod_count: 0,
      rod_size: rebarSchedule?.bar_size ?? 'unknown',
    };
  }

  const { bar_size, spacing_in, embed_depth_in } = rebarSchedule;

  // Number of rod positions along the length of the wall
  const rodsPerLf = 12 / spacing_in;
  const rod_count = Math.ceil(lf * rodsPerLf);

  // Determine if extension rods are required
  const comp =
    segment.ret !== null ? segment.ret : segment.wot;
  const height_ft = comp?.height_ft ?? segment.avg_height_ft ?? 0;
  const embedFt = (embed_depth_in ?? 0) / 12;
  const totalRodLength = height_ft + embedFt;

  const stockLength = REBAR_STOCK_LENGTH_FT[bar_size] ?? 20;
  const extension_rod_count =
    totalRodLength > stockLength ? rod_count : 0;

  return {
    segment_id: segId,
    rod_count,
    extension_rod_count,
    rod_size: bar_size,
  };
}
