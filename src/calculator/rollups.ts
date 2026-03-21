import {
  BlockCalculation,
  BucketDistribution,
  GroutCalculation,
  LadderWireCalculation,
  NormalizedSegment,
  RodCalculation,
  SegmentCalculation,
} from '../types';
import { assignHeightBucket } from '../schedule/height-buckets';
import { lookupRebar } from '../schedule/rebar';
import { calculateBlockCounts } from './block-logic';
import { distributeIntoBuckets } from './bucket-dist';
import { calculateGrout } from './grout-logic';
import { calculateLadderWire } from './ladder-wire';
import { calculateRetGeometry, calculateWotGeometry } from './geometry';
import { calculateRods } from './rod-logic';

/**
 * Produce a combined BlockCalculation by summing RET and WOT sub-calculations.
 */
function mergeBlockCalcs(a: BlockCalculation, b: BlockCalculation): BlockCalculation {
  return {
    segment_id: a.segment_id,
    standard_block_count: a.standard_block_count + b.standard_block_count,
    half_block_count: a.half_block_count + b.half_block_count,
    bond_beam_block_count: a.bond_beam_block_count + b.bond_beam_block_count,
    total_block_count: a.total_block_count + b.total_block_count,
    courses: Math.max(a.courses, b.courses),
  };
}

/**
 * Produce a combined GroutCalculation by summing grout volumes.
 */
function mergeGroutCalcs(a: GroutCalculation, b: GroutCalculation): GroutCalculation {
  return {
    segment_id: a.segment_id,
    grout_cy: a.grout_cy + b.grout_cy,
    partial_fill: a.partial_fill || b.partial_fill,
    full_fill: a.full_fill || b.full_fill,
  };
}

/**
 * Roll up all segment calculations to produce aggregate totals.
 */
export function rollupCalculations(calculations: SegmentCalculation[]): {
  total_block: number;
  total_grout_cy: number;
  total_lf: number;
  total_area_sf: number;
} {
  let total_block = 0;
  let total_grout_cy = 0;
  let total_lf = 0;
  let total_area_sf = 0;

  for (const c of calculations) {
    total_block += c.blocks.total_block_count;
    total_grout_cy += c.grout.grout_cy;
    total_lf += c.segment.length_lf ?? 0;
    total_area_sf += c.segment.area_sf ?? 0;
  }

  return { total_block, total_grout_cy, total_lf, total_area_sf };
}

/**
 * Calculate everything for a single NormalizedSegment.
 */
export function calculateSegment(segment: NormalizedSegment): SegmentCalculation {
  const { ret, wot } = segment;
  const lf = segment.length_lf ?? 0;

  // ── Geometry ──────────────────────────────────────────────────────────────
  const retGeo = calculateRetGeometry(segment);
  const wotGeo = calculateWotGeometry(segment);

  // ── Height buckets ────────────────────────────────────────────────────────
  const heights: number[] = [];
  if (ret?.height_ft != null) heights.push(ret.height_ft);
  if (wot?.height_ft != null) heights.push(wot.height_ft);
  if (heights.length === 0 && segment.avg_height_ft != null) {
    heights.push(segment.avg_height_ft);
  }
  const bucket_distribution: BucketDistribution = distributeIntoBuckets(lf, heights);

  // ── Blocks ────────────────────────────────────────────────────────────────
  const retBlocks = calculateBlockCounts(segment, 'ret');
  const wotBlocks = calculateBlockCounts(segment, 'wot');
  const blocks =
    ret !== null && wot !== null
      ? mergeBlockCalcs(retBlocks, wotBlocks)
      : ret !== null
      ? retBlocks
      : wotBlocks;

  // ── Grout ─────────────────────────────────────────────────────────────────
  const retGrout = calculateGrout(segment, 'ret', retGeo.face_sf ?? 0);
  const wotGrout = calculateGrout(segment, 'wot', wotGeo.face_sf ?? 0);
  const grout =
    ret !== null && wot !== null
      ? mergeGroutCalcs(retGrout, wotGrout)
      : ret !== null
      ? retGrout
      : wotGrout;

  // ── Rebar / rods ──────────────────────────────────────────────────────────
  const primaryComponent = ret ?? wot;
  let rods: RodCalculation = {
    segment_id: segment.segment_id,
    rod_count: 0,
    extension_rod_count: 0,
    rod_size: 'unknown',
  };

  if (primaryComponent !== null) {
    const bucket = assignHeightBucket(
      primaryComponent.height_ft ?? segment.avg_height_ft ?? 0,
    );
    const rebarSched = lookupRebar(bucket, primaryComponent.width_in);
    rods = calculateRods(segment, rebarSched, lf);
  }

  // ── Ladder wire ───────────────────────────────────────────────────────────
  let ladder_wire: LadderWireCalculation = {
    segment_id: segment.segment_id,
    ladder_wire_lf: 0,
    wire_gauge: '9 gauge',
  };
  if (blocks.courses > 0 && lf > 0) {
    ladder_wire = calculateLadderWire(lf, blocks.courses, segment.segment_id);
  }

  // ── Footing / keyway LF ───────────────────────────────────────────────────
  // Footings run the full LF of the wall (null when no ret component)
  const footing_lf = ret !== null ? lf : null;
  const keyway_lf = ret !== null ? lf : null;

  return {
    segment,
    bucket_distribution,
    blocks,
    grout,
    rods,
    ladder_wire,
    footing_lf,
    keyway_lf,
  };
}

/**
 * Calculate all segments.
 */
export function calculateAll(segments: NormalizedSegment[]): SegmentCalculation[] {
  return segments.map(calculateSegment);
}
