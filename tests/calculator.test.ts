import { heightToCourses, blocksPerLf, calculateBlockCounts } from '../src/calculator/block-logic';
import { determineGroutType, calculateGrout } from '../src/calculator/grout-logic';
import { calculateRods } from '../src/calculator/rod-logic';
import { calculateLadderWire } from '../src/calculator/ladder-wire';
import { calculateRetGeometry, calculateWotGeometry, calculateTotalHeight } from '../src/calculator/geometry';
import { distributeIntoBuckets, getHeightBucket } from '../src/calculator/bucket-dist';
import { calculateSegment, calculateAll } from '../src/calculator/rollups';
import { processBluebeamInput } from '../src/parser';
import bluebeamInput from './fixtures/bluebeam-input.json';
import { BluebeamRow, NormalizedSegment, RebarSchedule } from '../src/types';

const rawRows = bluebeamInput as BluebeamRow[];

function makeSegment(overrides: Partial<NormalizedSegment> = {}): NormalizedSegment {
  return {
    segment_id: 'TEST-001',
    raw_label: 'RET 8 PROTO 8',
    ret: { type: 'RET', width_in: 8, texture: 'PROTO', height_ft: 8 },
    wot: null,
    length_lf: 100,
    area_sf: 800,
    avg_height_ft: 8,
    labels: { corner_count: 0, miter_count: 0, control_joint_count: 0, end_count: 0 },
    source_rows: [],
    ...overrides,
  };
}

describe('block-logic', () => {
  test('heightToCourses: 8ft wall = 12 courses', () => {
    expect(heightToCourses(8)).toBe(12);
  });

  test('heightToCourses: 6ft wall = 9 courses', () => {
    expect(heightToCourses(6)).toBe(9);
  });

  test('heightToCourses: 6.67ft wall rounds up', () => {
    expect(heightToCourses(6.67)).toBe(11);  // ceil(80.04/8) = 11
  });

  test('blocksPerLf: 12 courses = 9 blocks/LF', () => {
    expect(blocksPerLf(12)).toBeCloseTo(9);
  });

  test('calculateBlockCounts: RET 8 @ 8ft, 100 LF', () => {
    const seg = makeSegment();
    const result = calculateBlockCounts(seg, 'ret');
    expect(result.courses).toBe(12);
    expect(result.standard_block_count).toBe(Math.ceil(blocksPerLf(12) * 100));
    expect(result.bond_beam_block_count).toBe(100);
    expect(result.total_block_count).toBeGreaterThan(900);
  });

  test('calculateBlockCounts: with corners adds half blocks', () => {
    const seg = makeSegment({ labels: { corner_count: 4, miter_count: 0, control_joint_count: 0, end_count: 0 } });
    const result = calculateBlockCounts(seg, 'ret');
    expect(result.half_block_count).toBeGreaterThan(0);
  });

  test('calculateBlockCounts: null component returns zeros', () => {
    const seg = makeSegment({ ret: null });
    const result = calculateBlockCounts(seg, 'ret');
    expect(result.total_block_count).toBe(0);
    expect(result.courses).toBe(0);
  });
});

describe('grout-logic', () => {
  test('RET wall always gets full grout', () => {
    const seg = makeSegment();
    expect(determineGroutType(seg, 'ret')).toBe('full');
  });

  test('WOT <= 6ft gets partial grout', () => {
    const seg = makeSegment({ wot: { type: 'WOT', width_in: 6, texture: null, height_ft: 4 }, ret: null });
    expect(determineGroutType(seg, 'wot')).toBe('partial');
  });

  test('WOT > 6ft gets full grout', () => {
    const seg = makeSegment({ wot: { type: 'WOT', width_in: 6, texture: null, height_ft: 8 }, ret: null });
    expect(determineGroutType(seg, 'wot')).toBe('full');
  });

  test('null component returns none', () => {
    const seg = makeSegment({ ret: null });
    expect(determineGroutType(seg, 'ret')).toBe('none');
  });

  test('calculateGrout produces positive CY for RET wall', () => {
    const seg = makeSegment();
    const result = calculateGrout(seg, 'ret', 800);
    expect(result.grout_cy).toBeGreaterThan(0);
    expect(result.full_fill).toBe(true);
    expect(result.partial_fill).toBe(false);
  });

  test('calculateGrout partial fill is smaller than full fill', () => {
    const seg = makeSegment({ wot: { type: 'WOT', width_in: 8, texture: null, height_ft: 4 } });
    const partial = calculateGrout(seg, 'wot', 400);
    const fullSeg = makeSegment({ wot: { type: 'WOT', width_in: 8, texture: null, height_ft: 8 } });
    const full = calculateGrout(fullSeg, 'wot', 400);
    expect(partial.grout_cy).toBeLessThan(full.grout_cy);
  });
});

describe('rod-logic', () => {
  const rebar: RebarSchedule = {
    height_bucket: 8,
    wall_width_in: 8,
    bar_size: '#5',
    spacing_in: 32,
    embed_depth_in: 24,
  };

  test('calculateRods produces positive rod count', () => {
    const seg = makeSegment();
    const result = calculateRods(seg, rebar, 100);
    expect(result.rod_count).toBeGreaterThan(0);
    expect(result.rod_size).toBe('#5');
  });

  test('calculateRods: null schedule returns zeros', () => {
    const seg = makeSegment();
    const result = calculateRods(seg, null, 100);
    expect(result.rod_count).toBe(0);
    expect(result.extension_rod_count).toBe(0);
  });

  test('calculateRods: no extension rods for short wall', () => {
    const seg = makeSegment({ ret: { type: 'RET', width_in: 8, texture: null, height_ft: 4 } });
    const result = calculateRods(seg, { ...rebar, embed_depth_in: 18 }, 100);
    // 4ft + 1.5ft = 5.5ft total rod length < 20ft stock
    expect(result.extension_rod_count).toBe(0);
  });
});

describe('ladder-wire', () => {
  test('calculateLadderWire: 12 courses, 100 LF', () => {
    const result = calculateLadderWire(100, 12, 'TEST-001');
    expect(result.ladder_wire_lf).toBe(100 * 6);  // 6 wire rows for 12 courses
    expect(result.wire_gauge).toBe('9 gauge');
  });

  test('calculateLadderWire: odd courses rounds up', () => {
    const result = calculateLadderWire(100, 9, 'TEST-001');
    expect(result.ladder_wire_lf).toBe(100 * 5);  // ceil(9/2) = 5
  });
});

describe('geometry', () => {
  test('calculateRetGeometry: derives face_sf from lf and height', () => {
    const seg = makeSegment();
    const geo = calculateRetGeometry(seg);
    expect(geo.face_sf).toBeCloseTo(800);
    expect(geo.lf).toBe(100);
    expect(geo.height_ft).toBe(8);
  });

  test('calculateRetGeometry: returns nulls when no ret', () => {
    const seg = makeSegment({ ret: null });
    const geo = calculateRetGeometry(seg);
    expect(geo.face_sf).toBeNull();
    expect(geo.lf).toBeNull();
  });

  test('calculateWotGeometry: derives face_sf for WOT', () => {
    const seg = makeSegment({ wot: { type: 'WOT', width_in: 6, texture: null, height_ft: 6 } });
    const geo = calculateWotGeometry(seg);
    expect(geo.face_sf).toBeCloseTo(600);
  });

  test('calculateTotalHeight: sums RET + WOT heights', () => {
    const seg = makeSegment({ wot: { type: 'WOT', width_in: 6, texture: null, height_ft: 6 } });
    expect(calculateTotalHeight(seg)).toBeCloseTo(14);
  });

  test('calculateTotalHeight: returns only RET height when no WOT', () => {
    const seg = makeSegment();
    expect(calculateTotalHeight(seg)).toBe(8);
  });
});

describe('bucket-dist', () => {
  test('getHeightBucket: 6.67 → 7', () => {
    expect(getHeightBucket(6.67)).toBe(7);
  });

  test('distributeIntoBuckets single height', () => {
    const d = distributeIntoBuckets(50, [8]);
    expect(d[8]).toBeCloseTo(50);
  });
});

describe('rollups – full pipeline', () => {
  test('calculateAll produces one result per segment', () => {
    const segments = processBluebeamInput(rawRows);
    const results = calculateAll(segments);
    expect(results).toHaveLength(3);
  });

  test('calculateSegment: SEG-001 RET has full grout', () => {
    const segments = processBluebeamInput(rawRows);
    const result = calculateSegment(segments[0]);
    expect(result.grout.full_fill).toBe(true);
    expect(result.grout.grout_cy).toBeGreaterThan(0);
  });

  test('calculateSegment: SEG-001 has footing_lf and keyway_lf', () => {
    const segments = processBluebeamInput(rawRows);
    const result = calculateSegment(segments[0]);
    expect(result.footing_lf).toBe(45.5);
    expect(result.keyway_lf).toBe(45.5);
  });

  test('calculateSegment: SEG-003 WOT 4ft has partial grout', () => {
    const segments = processBluebeamInput(rawRows);
    const result = calculateSegment(segments[2]);
    expect(result.grout.partial_fill).toBe(true);
    expect(result.grout.full_fill).toBe(false);
    expect(result.footing_lf).toBeNull();  // no RET
  });

  test('calculateSegment: SEG-002 RET 12" @ 10ft has positive rod count', () => {
    const segments = processBluebeamInput(rawRows);
    const result = calculateSegment(segments[1]);
    expect(result.rods.rod_count).toBeGreaterThan(0);
    expect(result.rods.rod_size).toBe('#6');
  });

  test('calculateSegment: bucket distribution is non-empty', () => {
    const segments = processBluebeamInput(rawRows);
    const result = calculateSegment(segments[0]);
    expect(Object.keys(result.bucket_distribution).length).toBeGreaterThan(0);
  });
});
