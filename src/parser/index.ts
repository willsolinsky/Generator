export { parseBluebeamRows, groupRowsBySegment } from './bluebeam';
export { normalizeSegment, calculateAverageHeight } from './normalizer';
export { parseLabel } from './label-parser';
export type { ParseLabelResult } from './label-parser';

import { BluebeamRow, NormalizedSegment } from '../types';
import { parseBluebeamRows, groupRowsBySegment } from './bluebeam';
import { normalizeSegment } from './normalizer';

/**
 * End-to-end convenience function: raw Bluebeam rows → normalized segments.
 */
export function processBluebeamInput(rows: BluebeamRow[]): NormalizedSegment[] {
  const parsed = parseBluebeamRows(rows);
  const groups = groupRowsBySegment(parsed);
  return groups.map((g, i) => normalizeSegment(g, i));
}
