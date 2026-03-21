import { MaterialLineItem, MaterialRollup } from '../types';

/**
 * Format a material rollup as a plain-text vendor order sheet.
 */
export function formatVendorOrder(rollup: MaterialRollup): string {
  const lines: string[] = [
    'VENDOR MATERIAL ORDER',
    '======================',
    '',
    'MATERIAL LINE ITEMS:',
    buildTable(rollup.line_items),
    '',
    `TOTAL BLOCK:      ${rollup.total_block.toFixed(0)} EA`,
    `TOTAL GROUT:      ${rollup.total_grout_cy.toFixed(2)} CY`,
    `TOTAL REBAR:      ${rollup.total_rebar_lf.toFixed(1)} LF`,
    '',
  ];

  if (rollup.unresolved_items.length > 0) {
    lines.push('UNRESOLVED ITEMS:');
    for (const u of rollup.unresolved_items) {
      lines.push(`  [${u.area}] ${u.description}`);
      lines.push(`           Current: ${u.current_behavior}`);
    }
  }

  return lines.join('\n');
}

/**
 * Format a material rollup as CSV.
 */
export function formatVendorOrderCsv(rollup: MaterialRollup): string {
  const header =
    'scheme,wall_width_in,system,texture,color,product_code,quantity,unit,pallet_qty,pallets';

  const rows = rollup.line_items.map(i =>
    [
      csvEscape(i.scheme),
      i.wall_width_in,
      csvEscape(i.system),
      csvEscape(i.texture ?? ''),
      csvEscape(i.color ?? ''),
      csvEscape(i.product_code ?? ''),
      i.quantity.toFixed(4),
      csvEscape(i.unit),
      i.pallet_qty ?? '',
      i.pallets ?? '',
    ].join(','),
  );

  return [header, ...rows].join('\n');
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function buildTable(items: MaterialLineItem[]): string {
  if (items.length === 0) return '  (no items)';

  const cols = [
    { header: 'Scheme',    key: 'scheme' as const,        width: 10 },
    { header: 'Width(in)', key: 'wall_width_in' as const, width: 9  },
    { header: 'System',    key: 'system' as const,        width: 8  },
    { header: 'Texture',   key: 'texture' as const,       width: 10 },
    { header: 'Qty',       key: 'quantity' as const,      width: 10 },
    { header: 'Unit',      key: 'unit' as const,          width: 6  },
    { header: 'Pallets',   key: 'pallets' as const,       width: 8  },
  ];

  const header = cols.map(c => c.header.padEnd(c.width)).join(' | ');
  const divider = cols.map(c => '-'.repeat(c.width)).join('-+-');

  const dataRows = items.map(item =>
    cols
      .map(c => {
        const val = item[c.key];
        const str =
          val === null || val === undefined
            ? ''
            : typeof val === 'number'
            ? val.toFixed(2)
            : String(val);
        return str.padEnd(c.width);
      })
      .join(' | '),
  );

  return [header, divider, ...dataRows].join('\n');
}
