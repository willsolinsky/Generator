import { BlockCalculation, NormalizedSegment } from '../types';
import { CMU_HEIGHT_IN, CMU_LENGTH_IN } from '../schedule/config';

/**
 * Calculate the number of CMU courses for a given wall height.
 * 1 course = CMU_HEIGHT_IN (8") nominal height.
 */
export function heightToCourses(height_ft: number): number {
  return Math.ceil((height_ft * 12) / CMU_HEIGHT_IN);
}

/**
 * Standard blocks per linear foot for a given number of courses.
 * Each block is CMU_LENGTH_IN (16") long, so blocks/LF = courses * (12/16).
 */
export function blocksPerLf(courses: number): number {
  return courses * (12 / CMU_LENGTH_IN);
}

/**
 * Calculate block counts for a given component (ret or wot) of a segment.
 *
 * Rules:
 * - standard_blocks = courses * 0.75 * lf
 * - bond_beam_blocks at top course: 1 bond beam block per LF
 * - half_blocks at corners: corner_count * courses * 0.5
 * - Control joints: industry standard every 20 LF unless count provided via
 *   labels.control_joint_count
 */
export function calculateBlockCounts(
  segment: NormalizedSegment,
  component: 'ret' | 'wot',
): BlockCalculation {
  const comp = component === 'ret' ? segment.ret : segment.wot;
  const segId = segment.segment_id;

  if (comp === null || segment.length_lf === null) {
    return {
      segment_id: segId,
      standard_block_count: 0,
      half_block_count: 0,
      bond_beam_block_count: 0,
      total_block_count: 0,
      courses: 0,
    };
  }

  const height_ft = comp.height_ft ?? segment.avg_height_ft;
  if (height_ft === null) {
    return {
      segment_id: segId,
      standard_block_count: 0,
      half_block_count: 0,
      bond_beam_block_count: 0,
      total_block_count: 0,
      courses: 0,
    };
  }

  const lf = segment.length_lf;
  const courses = heightToCourses(height_ft);

  // Standard blocks for the full wall face
  const standard_block_count = Math.ceil(blocksPerLf(courses) * lf);

  // Bond beam at the top course: 1 block per LF
  const bond_beam_block_count = Math.ceil(lf);

  // Half blocks at corners
  const corner_count = segment.labels.corner_count;
  const half_block_count = Math.ceil(corner_count * courses * 0.5);

  const total_block_count =
    standard_block_count + bond_beam_block_count + half_block_count;

  return {
    segment_id: segId,
    standard_block_count,
    half_block_count,
    bond_beam_block_count,
    total_block_count,
    courses,
  };
}
