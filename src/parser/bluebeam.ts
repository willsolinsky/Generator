import { BluebeamRow, ParsedRow, RowGroup } from '../types';
import { parseLabel } from './label-parser';

/**
 * Parse an array of raw Bluebeam rows into ParsedRow objects.
 */
export function parseBluebeamRows(rows: BluebeamRow[]): ParsedRow[] {
  return rows.map(row => {
    const result = parseLabel(row.label);
    const isMainRow = result.ret !== null || result.wot !== null;
    return {
      raw: row,
      ret: result.ret,
      wot: result.wot,
      isMainRow,
      labelType: result.labelType,
    };
  });
}

/**
 * Group parsed rows into wall segments.
 *
 * A "main" row has a RET or WOT label. Subsequent COUNT rows with
 * CORNER/MITER/CJ/END labels are attached to the preceding main row.
 * Grouping continues until the next main row starts.
 *
 * Rows that are not main rows and have no recognised labelType are skipped
 * with a warning.
 */
export function groupRowsBySegment(parsedRows: ParsedRow[]): RowGroup[] {
  const groups: RowGroup[] = [];
  let current: RowGroup | null = null;

  for (const row of parsedRows) {
    if (row.isMainRow) {
      current = { mainRow: row, labelRows: [] };
      groups.push(current);
    } else if (row.labelType !== null) {
      if (current !== null) {
        current.labelRows.push(row);
      } else {
        // Label row before any main row – attach as an orphan group only if it
        // has count information worth preserving (warn but don't throw)
        console.warn(
          `[bluebeam] Label row "${row.raw.label}" (id=${row.raw.id}) found before any main wall row – skipping`,
        );
      }
    } else {
      // Neither a main row nor a recognised label row
      console.warn(
        `[bluebeam] Unrecognised row "${row.raw.label}" (id=${row.raw.id}) could not be classified – skipping`,
      );
    }
  }

  return groups;
}
