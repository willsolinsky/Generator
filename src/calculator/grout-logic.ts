import { GroutCalculation, NormalizedSegment } from '../types';
import { GROUT_CY_PER_SF, GROUT_FILL_FACTORS } from '../schedule/config';

/**
 * Determine the grout type for a wall component.
 *
 * Rules:
 * - RET walls always receive full grout fill (structural requirement).
 * - WOT ≤ 6 ft: partial grout (bond beams only).
 * - WOT > 6 ft: full grout fill.
 */
export function determineGroutType(
  segment: NormalizedSegment,
  component: 'ret' | 'wot',
): 'partial' | 'full' | 'none' {
  const comp = component === 'ret' ? segment.ret : segment.wot;
  if (comp === null) return 'none';

  if (component === 'ret') return 'full';

  const height_ft = comp.height_ft ?? segment.avg_height_ft;
  if (height_ft === null) return 'partial'; // default conservative
  return height_ft > 6 ? 'full' : 'partial';
}

/**
 * Calculate grout volume for a wall component.
 *
 * grout_cy = face_sf * grout_cy_per_sf * fill_factor
 *
 * UNRESOLVED: Exact grout CY/SF factors not confirmed from project workbook.
 */
export function calculateGrout(
  segment: NormalizedSegment,
  component: 'ret' | 'wot',
  face_sf: number,
): GroutCalculation {
  const comp = component === 'ret' ? segment.ret : segment.wot;
  const segId = segment.segment_id;

  if (comp === null) {
    return { segment_id: segId, grout_cy: 0, partial_fill: false, full_fill: false };
  }

  const groutType = determineGroutType(segment, component);

  if (groutType === 'none') {
    return { segment_id: segId, grout_cy: 0, partial_fill: false, full_fill: false };
  }

  const cyPerSf = GROUT_CY_PER_SF[comp.width_in] ?? 0;
  const fillFactor =
    groutType === 'full' ? GROUT_FILL_FACTORS.FULL : GROUT_FILL_FACTORS.PARTIAL;

  const grout_cy = face_sf * cyPerSf * fillFactor;

  return {
    segment_id: segId,
    grout_cy,
    partial_fill: groutType === 'partial',
    full_fill: groutType === 'full',
  };
}
