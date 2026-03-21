import { assignHeightBucket, distributeIntoBuckets, HEIGHT_BUCKETS } from '../src/schedule/height-buckets';
import { lookupFooting } from '../src/schedule/footing';
import { lookupRebar } from '../src/schedule/rebar';
import { lookupKeyway } from '../src/schedule/keyway';
import { GROUT_CY_PER_SF } from '../src/schedule/config';

describe('height-buckets', () => {
  test('HEIGHT_BUCKETS has 14 canonical buckets', () => {
    expect(HEIGHT_BUCKETS).toHaveLength(14);
  });

  test('assignHeightBucket rounds up to next bucket', () => {
    expect(assignHeightBucket(2)).toBe(2);
    expect(assignHeightBucket(2.1)).toBe(3);
    expect(assignHeightBucket(6.67)).toBe(7);
    expect(assignHeightBucket(10)).toBe(10);
    expect(assignHeightBucket(10.5)).toBe(12);
  });

  test('assignHeightBucket clamps at maximum bucket', () => {
    expect(assignHeightBucket(25)).toBe(20);
  });

  test('distributeIntoBuckets: single height puts all LF in one bucket', () => {
    const dist = distributeIntoBuckets(100, [6.67]);
    expect(dist[7]).toBeCloseTo(100);
    expect(Object.keys(dist)).toHaveLength(1);
  });

  test('distributeIntoBuckets: two heights splits LF evenly', () => {
    const dist = distributeIntoBuckets(100, [4, 8]);
    expect(dist[4]).toBeCloseTo(50);
    expect(dist[8]).toBeCloseTo(50);
  });

  test('distributeIntoBuckets: empty heights returns empty object', () => {
    const dist = distributeIntoBuckets(100, []);
    expect(Object.keys(dist)).toHaveLength(0);
  });

  test('distributeIntoBuckets: heights that map to same bucket are summed', () => {
    const dist = distributeIntoBuckets(100, [3, 3]);
    expect(dist[3]).toBeCloseTo(100);
  });
});

describe('footing schedule', () => {
  test('lookupFooting returns correct entry for 8" wall at h=8', () => {
    const f = lookupFooting(8, 8);
    expect(f).not.toBeNull();
    expect(f?.depth_in).toBe(16);
    expect(f?.rebar_top).toBe('#4');
    expect(f?.keyway).toBe(true);
  });

  test('lookupFooting returns correct entry for 12" wall at h=10', () => {
    const f = lookupFooting(10, 12);
    expect(f).not.toBeNull();
    expect(f?.depth_in).toBe(24);
  });

  test('lookupFooting returns null for unknown wall width', () => {
    const f = lookupFooting(8, 5);
    expect(f).toBeNull();
  });

  test('lookupFooting falls back to lower bucket', () => {
    // No entry for height_bucket=3 – should fall back to 2
    const f = lookupFooting(3, 8);
    expect(f).not.toBeNull();
    expect(f?.height_bucket).toBe(2);
  });
});

describe('rebar schedule', () => {
  test('lookupRebar returns correct bar size for 8" wall at h=8', () => {
    const r = lookupRebar(8, 8);
    expect(r?.bar_size).toBe('#5');
    expect(r?.spacing_in).toBe(32);
  });

  test('lookupRebar returns correct bar size for 12" wall at h=10', () => {
    const r = lookupRebar(10, 12);
    expect(r?.bar_size).toBe('#6');
  });

  test('lookupRebar returns null for unknown width', () => {
    const r = lookupRebar(8, 5);
    expect(r).toBeNull();
  });

  test('lookupRebar falls back to lower bucket', () => {
    // No entry for bucket 9 – should fall back to 8
    const r = lookupRebar(9, 8);
    expect(r).not.toBeNull();
    expect(r?.height_bucket).toBeLessThanOrEqual(9);
  });
});

describe('keyway schedule', () => {
  test('lookupKeyway returns a valid entry for 8" wall at h=6', () => {
    const k = lookupKeyway(6, 8);
    expect(k).not.toBeNull();
    expect(k?.keyway_depth_in).toBeGreaterThan(0);
  });

  test('lookupKeyway returns null for unknown width', () => {
    const k = lookupKeyway(6, 5);
    expect(k).toBeNull();
  });
});

describe('config', () => {
  test('GROUT_CY_PER_SF has entries for all standard widths', () => {
    [4, 6, 8, 10, 12].forEach(w => {
      expect(GROUT_CY_PER_SF[w]).toBeGreaterThan(0);
    });
  });
});
