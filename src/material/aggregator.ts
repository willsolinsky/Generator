import { MaterialLineItem, MaterialRollup, SegmentCalculation, UnresolvedItem } from '../types';
import { UNRESOLVED_ITEMS } from '../schedule/config';

/**
 * Aggregate block counts across segment calculations, grouped by wall width
 * and texture.
 */
export function aggregateBlocks(calculations: SegmentCalculation[]): MaterialLineItem[] {
  // Key: `${width_in}|${texture}|${scheme}`
  const map = new Map<string, MaterialLineItem>();

  for (const calc of calculations) {
    const seg = calc.segment;

    // Aggregate RET blocks
    if (seg.ret !== null && calc.blocks.total_block_count > 0) {
      addBlockItem(map, seg.ret.width_in, seg.ret.texture, 'RET', calc.blocks.total_block_count);
    }

    // Aggregate WOT blocks – WOT uses its own width; if ret+wot share same
    // segment we attribute blocks to the dominant component (ret handles the
    // main wall; wot is above grade).
    if (seg.wot !== null && seg.ret === null) {
      addBlockItem(map, seg.wot.width_in, seg.wot.texture, 'WOT', calc.blocks.total_block_count);
    }
  }

  return Array.from(map.values());
}

function addBlockItem(
  map: Map<string, MaterialLineItem>,
  width_in: number,
  texture: string | null,
  scheme: string,
  qty: number,
): void {
  const key = `${scheme}|${width_in}|${texture ?? 'NONE'}`;
  const existing = map.get(key);
  if (existing) {
    existing.quantity += qty;
    if (existing.pallet_qty !== null) {
      existing.pallets = Math.ceil(existing.quantity / existing.pallet_qty);
    }
  } else {
    const pallet_qty = getPalletQty(width_in);
    map.set(key, {
      scheme,
      wall_width_in: width_in,
      system: 'CMU',
      texture,
      color: null,
      product_code: null,
      quantity: qty,
      unit: 'EA',
      pallet_qty,
      pallets: pallet_qty !== null ? Math.ceil(qty / pallet_qty) : null,
    });
  }
}

/**
 * Aggregate grout quantities by wall width.
 */
export function aggregateGrout(calculations: SegmentCalculation[]): MaterialLineItem[] {
  const map = new Map<number, MaterialLineItem>();

  for (const calc of calculations) {
    const grout_cy = calc.grout.grout_cy;
    if (grout_cy <= 0) continue;

    const width_in =
      calc.segment.ret?.width_in ?? calc.segment.wot?.width_in ?? 8;

    const existing = map.get(width_in);
    if (existing) {
      existing.quantity += grout_cy;
    } else {
      map.set(width_in, {
        scheme: 'GROUT',
        wall_width_in: width_in,
        system: 'GROUT',
        texture: null,
        color: null,
        product_code: null,
        quantity: grout_cy,
        unit: 'CY',
        pallet_qty: null,
        pallets: null,
      });
    }
  }

  return Array.from(map.values());
}

/**
 * Aggregate rebar LF quantities by bar size.
 */
export function aggregateRebar(calculations: SegmentCalculation[]): MaterialLineItem[] {
  const map = new Map<string, MaterialLineItem>();

  for (const calc of calculations) {
    const { rod_count, rod_size } = calc.rods;
    if (rod_count <= 0) continue;

    const seg = calc.segment;
    const comp = seg.ret ?? seg.wot;
    const height_ft = comp?.height_ft ?? seg.avg_height_ft ?? 0;
    const rebarLf = rod_count * height_ft;

    const existing = map.get(rod_size);
    if (existing) {
      existing.quantity += rebarLf;
    } else {
      map.set(rod_size, {
        scheme: 'REBAR',
        wall_width_in: comp?.width_in ?? 8,
        system: 'REBAR',
        texture: null,
        color: null,
        product_code: rod_size,
        quantity: rebarLf,
        unit: 'LF',
        pallet_qty: null,
        pallets: null,
      });
    }
  }

  return Array.from(map.values());
}

/**
 * Build the complete material rollup for all segment calculations.
 */
export function buildMaterialRollup(
  calculations: SegmentCalculation[],
  extraUnresolved: UnresolvedItem[] = [],
): MaterialRollup {
  const blockItems = aggregateBlocks(calculations);
  const groutItems = aggregateGrout(calculations);
  const rebarItems = aggregateRebar(calculations);

  const total_block = blockItems.reduce((s, i) => s + i.quantity, 0);
  const total_grout_cy = groutItems.reduce((s, i) => s + i.quantity, 0);
  const total_rebar_lf = rebarItems.reduce((s, i) => s + i.quantity, 0);

  return {
    line_items: [...blockItems, ...groutItems, ...rebarItems],
    total_block,
    total_grout_cy,
    total_rebar_lf,
    unresolved_items: [...UNRESOLVED_ITEMS, ...extraUnresolved],
  };
}

function getPalletQty(width_in: number): number | null {
  const pallets: Record<number, number> = {
    4: 180,
    6: 120,
    8: 90,
    10: 75,
    12: 60,
  };
  return pallets[width_in] ?? null;
}
