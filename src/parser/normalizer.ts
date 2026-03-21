import { BluebeamRow, LabelCounts, NormalizedSegment, RowGroup } from '../types';

/**
 * Calculate the average height from a set of Bluebeam rows.
 * Uses height_ft field; rows without a height are excluded from the average.
 * Returns null if no rows have a valid height.
 */
export function calculateAverageHeight(rows: BluebeamRow[]): number | null {
  const heights = rows.map(r => r.height_ft).filter((h): h is number => h !== null);
  if (heights.length === 0) return null;
  return heights.reduce((sum, h) => sum + h, 0) / heights.length;
}

/**
 * Convert a RowGroup into a NormalizedSegment.
 */
export function normalizeSegment(group: RowGroup, segmentIndex: number): NormalizedSegment {
  const main = group.mainRow;
  const allRows: BluebeamRow[] = [main.raw, ...group.labelRows.map(r => r.raw)];

  const labels: LabelCounts = {
    corner_count: 0,
    miter_count: 0,
    control_joint_count: 0,
    end_count: 0,
  };

  for (const lr of group.labelRows) {
    const count = lr.raw.count ?? 0;
    switch (lr.labelType) {
      case 'CORNER': labels.corner_count += count; break;
      case 'MITER':  labels.miter_count  += count; break;
      case 'CJ':     labels.control_joint_count += count; break;
      case 'END':    labels.end_count    += count; break;
    }
  }

  // Determine avg height: prefer explicit height on main row, else calculate
  // from all rows.  Use RET or WOT height_ft as a fallback when no row-level
  // height is present.
  let avg_height_ft: number | null = calculateAverageHeight(allRows);

  // If no height_ft on raw rows, fall back to parsed component heights
  if (avg_height_ft === null) {
    const componentHeights: number[] = [];
    if (main.ret?.height_ft !== null && main.ret?.height_ft !== undefined) {
      componentHeights.push(main.ret.height_ft);
    }
    if (main.wot?.height_ft !== null && main.wot?.height_ft !== undefined) {
      componentHeights.push(main.wot.height_ft);
    }
    if (componentHeights.length > 0) {
      avg_height_ft =
        componentHeights.reduce((s, h) => s + h, 0) / componentHeights.length;
    }
  }

  const segId = `SEG-${String(segmentIndex + 1).padStart(3, '0')}`;

  return {
    segment_id: segId,
    raw_label: main.raw.label,
    ret: main.ret,
    wot: main.wot,
    length_lf: main.raw.length_lf,
    area_sf: main.raw.area_sf,
    avg_height_ft,
    labels,
    source_rows: allRows,
  };
}
