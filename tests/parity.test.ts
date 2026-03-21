/**
 * Parity tests: run the full pipeline against known fixtures and verify that
 * outputs match expected behaviour documented in the fixture files.
 */
import { processBluebeamInput } from '../src/parser';
import { calculateAll } from '../src/calculator/rollups';
import { buildMaterialRollup } from '../src/material/aggregator';
import bluebeamInput from './fixtures/bluebeam-input.json';
import normalizedSegments from './fixtures/normalized-segments.json';
import expectedCalculations from './fixtures/expected-calculations.json';
import { BluebeamRow } from '../src/types';

const rawRows = bluebeamInput as BluebeamRow[];

describe('parity: parser output vs normalized-segments fixture', () => {
  const segments = processBluebeamInput(rawRows);

  test('produces the expected number of segments', () => {
    expect(segments).toHaveLength(normalizedSegments.length);
  });

  for (let i = 0; i < normalizedSegments.length; i++) {
    const expected = normalizedSegments[i];
    test(`SEG-${String(i + 1).padStart(3, '0')}: segment_id matches`, () => {
      expect(segments[i].segment_id).toBe(expected.segment_id);
    });

    test(`SEG-${String(i + 1).padStart(3, '0')}: raw_label matches`, () => {
      expect(segments[i].raw_label).toBe(expected.raw_label);
    });

    test(`SEG-${String(i + 1).padStart(3, '0')}: length_lf matches`, () => {
      expect(segments[i].length_lf).toBe(expected.length_lf);
    });

    test(`SEG-${String(i + 1).padStart(3, '0')}: ret matches fixture`, () => {
      if (expected.ret === null) {
        expect(segments[i].ret).toBeNull();
      } else {
        expect(segments[i].ret).toMatchObject(expected.ret);
      }
    });

    test(`SEG-${String(i + 1).padStart(3, '0')}: wot matches fixture`, () => {
      if (expected.wot === null) {
        expect(segments[i].wot).toBeNull();
      } else {
        expect(segments[i].wot).toMatchObject(expected.wot);
      }
    });

    test(`SEG-${String(i + 1).padStart(3, '0')}: labels match fixture`, () => {
      expect(segments[i].labels).toMatchObject(expected.labels);
    });
  }
});

describe('parity: calculator output vs expected-calculations fixture', () => {
  const segments = processBluebeamInput(rawRows);
  const calcs = calculateAll(segments);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const expected = expectedCalculations as any[];

  for (let i = 0; i < expected.length; i++) {
    const exp = expected[i];

    test(`${exp.segment_id}: block counts meet minimums`, () => {
      expect(calcs[i].blocks.total_block_count).toBeGreaterThanOrEqual(
        exp.blocks.total_block_count_min,
      );
    });

    test(`${exp.segment_id}: grout CY meets minimum`, () => {
      expect(calcs[i].grout.grout_cy).toBeGreaterThanOrEqual(exp.grout.grout_cy_min);
    });

    test(`${exp.segment_id}: RET full fill status`, () => {
      if (exp.grout.ret_full_fill !== undefined) {
        expect(calcs[i].grout.full_fill).toBe(exp.grout.ret_full_fill);
      }
    });
  }
});

describe('parity: material rollup totals are consistent', () => {
  const segments = processBluebeamInput(rawRows);
  const calcs = calculateAll(segments);
  const rollup = buildMaterialRollup(calcs);

  test('total_block equals sum of all CMU line items', () => {
    const sum = rollup.line_items
      .filter(i => i.system === 'CMU')
      .reduce((acc, i) => acc + i.quantity, 0);
    expect(rollup.total_block).toBeCloseTo(sum, 5);
  });

  test('total_grout_cy equals sum of grout line items', () => {
    const sum = rollup.line_items
      .filter(i => i.system === 'GROUT')
      .reduce((acc, i) => acc + i.quantity, 0);
    expect(rollup.total_grout_cy).toBeCloseTo(sum, 5);
  });

  test('total_rebar_lf equals sum of rebar line items', () => {
    const sum = rollup.line_items
      .filter(i => i.system === 'REBAR')
      .reduce((acc, i) => acc + i.quantity, 0);
    expect(rollup.total_rebar_lf).toBeCloseTo(sum, 5);
  });
});
