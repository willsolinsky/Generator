import { LadderWireCalculation } from '../types';

const DEFAULT_WIRE_GAUGE = '9 gauge';

/**
 * Calculate ladder wire (horizontal joint reinforcement) quantities.
 *
 * Ladder wire is placed every 2 courses (every 16").
 * LF of ladder wire = lf_of_wall * Math.ceil(courses / 2)
 */
export function calculateLadderWire(
  lf: number,
  courses: number,
  segmentId: string,
): LadderWireCalculation {
  const wireRows = Math.ceil(courses / 2);
  const ladder_wire_lf = lf * wireRows;

  return {
    segment_id: segmentId,
    ladder_wire_lf,
    wire_gauge: DEFAULT_WIRE_GAUGE,
  };
}
