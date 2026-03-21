import { aggregateBlocks, aggregateGrout, aggregateRebar, buildMaterialRollup } from '../src/material/aggregator';
import { formatVendorOrder, formatVendorOrderCsv } from '../src/material/vendor-output';
import { buildQuoteSummary } from '../src/material/summary';
import { processBluebeamInput } from '../src/parser';
import { calculateAll } from '../src/calculator/rollups';
import bluebeamInput from './fixtures/bluebeam-input.json';
import { BluebeamRow } from '../src/types';

const rawRows = bluebeamInput as BluebeamRow[];
const segments = processBluebeamInput(rawRows);
const calculations = calculateAll(segments);

describe('aggregateBlocks', () => {
  test('returns at least one block line item', () => {
    const items = aggregateBlocks(calculations);
    expect(items.length).toBeGreaterThan(0);
  });

  test('all items have scheme RET or WOT', () => {
    const items = aggregateBlocks(calculations);
    for (const item of items) {
      expect(['RET', 'WOT']).toContain(item.scheme);
    }
  });

  test('block quantities are positive', () => {
    const items = aggregateBlocks(calculations);
    for (const item of items) {
      expect(item.quantity).toBeGreaterThan(0);
    }
  });

  test('items include pallet counts', () => {
    const items = aggregateBlocks(calculations);
    for (const item of items) {
      expect(item.pallet_qty).toBeGreaterThan(0);
      expect(item.pallets).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('aggregateGrout', () => {
  test('returns grout line items', () => {
    const items = aggregateGrout(calculations);
    expect(items.length).toBeGreaterThan(0);
  });

  test('grout quantities are positive', () => {
    const items = aggregateGrout(calculations);
    for (const item of items) {
      expect(item.quantity).toBeGreaterThan(0);
      expect(item.unit).toBe('CY');
    }
  });
});

describe('aggregateRebar', () => {
  test('returns rebar line items', () => {
    const items = aggregateRebar(calculations);
    expect(items.length).toBeGreaterThan(0);
  });

  test('rebar items have LF unit', () => {
    const items = aggregateRebar(calculations);
    for (const item of items) {
      expect(item.unit).toBe('LF');
      expect(item.quantity).toBeGreaterThan(0);
    }
  });
});

describe('buildMaterialRollup', () => {
  test('total_block matches sum of block line items', () => {
    const rollup = buildMaterialRollup(calculations);
    const blockSum = rollup.line_items
      .filter(i => i.system === 'CMU')
      .reduce((s, i) => s + i.quantity, 0);
    expect(rollup.total_block).toBeCloseTo(blockSum);
  });

  test('total_grout_cy is positive', () => {
    const rollup = buildMaterialRollup(calculations);
    expect(rollup.total_grout_cy).toBeGreaterThan(0);
  });

  test('total_rebar_lf is positive', () => {
    const rollup = buildMaterialRollup(calculations);
    expect(rollup.total_rebar_lf).toBeGreaterThan(0);
  });

  test('unresolved_items list is populated', () => {
    const rollup = buildMaterialRollup(calculations);
    expect(rollup.unresolved_items.length).toBeGreaterThan(0);
  });
});

describe('vendor-output', () => {
  test('formatVendorOrder returns a non-empty string', () => {
    const rollup = buildMaterialRollup(calculations);
    const text = formatVendorOrder(rollup);
    expect(typeof text).toBe('string');
    expect(text.length).toBeGreaterThan(50);
    expect(text).toContain('VENDOR MATERIAL ORDER');
  });

  test('formatVendorOrderCsv returns valid CSV with header', () => {
    const rollup = buildMaterialRollup(calculations);
    const csv = formatVendorOrderCsv(rollup);
    const lines = csv.split('\n');
    expect(lines[0]).toContain('scheme');
    expect(lines[0]).toContain('quantity');
    expect(lines.length).toBeGreaterThan(1);
  });
});

describe('buildQuoteSummary', () => {
  test('returns a formatted summary string', () => {
    const rollup = buildMaterialRollup(calculations);
    const summary = buildQuoteSummary(rollup);
    expect(summary).toContain('QUOTE SUMMARY');
    expect(summary).toContain('Total CMU Blocks');
    expect(summary).toContain('Total Grout');
  });
});
