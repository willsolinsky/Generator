import { parseLabel } from '../src/parser/label-parser';
import { parseBluebeamRows, groupRowsBySegment } from '../src/parser/bluebeam';
import { normalizeSegment } from '../src/parser/normalizer';
import { processBluebeamInput } from '../src/parser';
import bluebeamInput from './fixtures/bluebeam-input.json';
import { BluebeamRow } from '../src/types';

const rawRows = bluebeamInput as BluebeamRow[];

describe('label-parser', () => {
  test('parses combined RET+WOT label with direction prefix', () => {
    const result = parseLabel('E RET 8 PROTO 6.67 _ WOT 6 PROTO 6');
    expect(result.ret).toMatchObject({ type: 'RET', width_in: 8, texture: 'PROTO', height_ft: 6.67 });
    expect(result.wot).toMatchObject({ type: 'WOT', width_in: 6, texture: 'PROTO', height_ft: 6 });
    expect(result.labelType).toBeNull();
  });

  test('parses RET-only label with texture and height', () => {
    const result = parseLabel('RET 12 SPLIT 8');
    expect(result.ret).toMatchObject({ type: 'RET', width_in: 12, texture: 'SPLIT', height_ft: 8 });
    expect(result.wot).toBeNull();
  });

  test('parses WOT-only label with texture and height', () => {
    const result = parseLabel('WOT 6 SMOOTH 4');
    expect(result.wot).toMatchObject({ type: 'WOT', width_in: 6, texture: 'SMOOTH', height_ft: 4 });
    expect(result.ret).toBeNull();
  });

  test('parses WOT label without texture', () => {
    const result = parseLabel('WOT 6 8');
    expect(result.wot).toMatchObject({ type: 'WOT', width_in: 6, height_ft: 8 });
    expect(result.wot?.texture).toBeNull();
  });

  test('parses CORNER label type', () => {
    const result = parseLabel('CORNER');
    expect(result.labelType).toBe('CORNER');
    expect(result.ret).toBeNull();
    expect(result.wot).toBeNull();
  });

  test('parses MITER label type', () => {
    expect(parseLabel('MITER').labelType).toBe('MITER');
  });

  test('parses CJ label type', () => {
    expect(parseLabel('CJ').labelType).toBe('CJ');
  });

  test('parses END label type', () => {
    expect(parseLabel('END').labelType).toBe('END');
  });

  test('handles unknown label gracefully', () => {
    const result = parseLabel('GARBAGE_TOKEN');
    expect(result.ret).toBeNull();
    expect(result.wot).toBeNull();
    expect(result.labelType).toBeNull();
  });

  test('parses RET label with only width (no texture/height)', () => {
    const result = parseLabel('RET 8');
    expect(result.ret).toMatchObject({ type: 'RET', width_in: 8, texture: null, height_ft: null });
  });

  test('handles north direction prefix', () => {
    const result = parseLabel('N RET 8 SPLIT 6');
    expect(result.ret).toMatchObject({ type: 'RET', width_in: 8, texture: 'SPLIT', height_ft: 6 });
  });
});

describe('bluebeam ingestion', () => {
  test('parseBluebeamRows identifies main and label rows correctly', () => {
    const parsed = parseBluebeamRows(rawRows);
    expect(parsed[0].isMainRow).toBe(true);   // RET+WOT row
    expect(parsed[1].isMainRow).toBe(false);  // CORNER
    expect(parsed[1].labelType).toBe('CORNER');
    expect(parsed[2].labelType).toBe('END');
    expect(parsed[3].isMainRow).toBe(true);   // RET only
  });

  test('groupRowsBySegment creates correct number of groups', () => {
    const parsed = parseBluebeamRows(rawRows);
    const groups = groupRowsBySegment(parsed);
    expect(groups).toHaveLength(3);
  });

  test('first group has correct label rows', () => {
    const parsed = parseBluebeamRows(rawRows);
    const groups = groupRowsBySegment(parsed);
    expect(groups[0].labelRows).toHaveLength(2);
    expect(groups[0].labelRows[0].labelType).toBe('CORNER');
    expect(groups[0].labelRows[1].labelType).toBe('END');
  });

  test('second group has miter and CJ rows', () => {
    const parsed = parseBluebeamRows(rawRows);
    const groups = groupRowsBySegment(parsed);
    expect(groups[1].labelRows).toHaveLength(2);
    const types = groups[1].labelRows.map(r => r.labelType);
    expect(types).toContain('MITER');
    expect(types).toContain('CJ');
  });

  test('third group (WOT only) has no label rows', () => {
    const parsed = parseBluebeamRows(rawRows);
    const groups = groupRowsBySegment(parsed);
    expect(groups[2].labelRows).toHaveLength(0);
  });
});

describe('normalizer', () => {
  test('normalizeSegment produces correct segment_id and label counts', () => {
    const parsed = parseBluebeamRows(rawRows);
    const groups = groupRowsBySegment(parsed);
    const seg = normalizeSegment(groups[0], 0);

    expect(seg.segment_id).toBe('SEG-001');
    expect(seg.labels.corner_count).toBe(2);
    expect(seg.labels.end_count).toBe(1);
    expect(seg.labels.miter_count).toBe(0);
    expect(seg.labels.control_joint_count).toBe(0);
  });

  test('normalizeSegment preserves length and area', () => {
    const parsed = parseBluebeamRows(rawRows);
    const groups = groupRowsBySegment(parsed);
    const seg = normalizeSegment(groups[0], 0);
    expect(seg.length_lf).toBe(45.5);
    expect(seg.area_sf).toBe(304.1);
  });

  test('normalizeSegment calculates avg_height from component heights when row height is null', () => {
    const parsed = parseBluebeamRows(rawRows);
    const groups = groupRowsBySegment(parsed);
    const seg = normalizeSegment(groups[0], 0);
    // avg of 6.67 and 6.0
    expect(seg.avg_height_ft).toBeCloseTo(6.335, 3);
  });

  test('normalizeSegment uses row height_ft when available', () => {
    const parsed = parseBluebeamRows(rawRows);
    const groups = groupRowsBySegment(parsed);
    const seg2 = normalizeSegment(groups[1], 1);
    expect(seg2.avg_height_ft).toBe(10.0);
  });

  test('processBluebeamInput end-to-end produces 3 segments', () => {
    const segments = processBluebeamInput(rawRows);
    expect(segments).toHaveLength(3);
    expect(segments[0].segment_id).toBe('SEG-001');
    expect(segments[1].segment_id).toBe('SEG-002');
    expect(segments[2].segment_id).toBe('SEG-003');
  });
});
