import { MaterialRollup, SegmentCalculation } from '../types';
import { buildMaterialRollup } from './aggregator';
import { formatVendorOrder, formatVendorOrderCsv } from './vendor-output';

/**
 * Build a human-readable back-page / quote-sheet summary.
 */
export function buildQuoteSummary(rollup: MaterialRollup): string {
  const lines: string[] = [
    'QUOTE SUMMARY',
    '=============',
    '',
    `  Total CMU Blocks : ${rollup.total_block.toFixed(0)} EA`,
    `  Total Grout      : ${rollup.total_grout_cy.toFixed(2)} CY`,
    `  Total Rebar      : ${rollup.total_rebar_lf.toFixed(1)} LF`,
    '',
    'BREAKDOWN BY MATERIAL:',
  ];

  for (const item of rollup.line_items) {
    const palletNote =
      item.pallets !== null ? ` (${item.pallets} pallets)` : '';
    lines.push(
      `  ${item.scheme.padEnd(8)} ${item.system.padEnd(8)} ${String(item.wall_width_in).padEnd(3)}" ` +
        `${(item.texture ?? 'N/A').padEnd(10)} : ${item.quantity.toFixed(2)} ${item.unit}${palletNote}`,
    );
  }

  if (rollup.unresolved_items.length > 0) {
    lines.push('');
    lines.push('NOTES / UNRESOLVED:');
    for (const u of rollup.unresolved_items) {
      lines.push(`  * [${u.area}] ${u.description}`);
    }
  }

  return lines.join('\n');
}

export { buildMaterialRollup, formatVendorOrder, formatVendorOrderCsv };

/**
 * Convenience function – build everything from segment calculations.
 */
export function generateOutputs(calculations: SegmentCalculation[]): {
  rollup: MaterialRollup;
  vendorText: string;
  vendorCsv: string;
  quoteSummary: string;
} {
  const rollup = buildMaterialRollup(calculations);
  return {
    rollup,
    vendorText: formatVendorOrder(rollup),
    vendorCsv: formatVendorOrderCsv(rollup),
    quoteSummary: buildQuoteSummary(rollup),
  };
}
