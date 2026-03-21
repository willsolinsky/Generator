import { UnresolvedItem } from '../types';

// Block dimensions (nominal with mortar joint)
export const CMU_HEIGHT_IN = 8;   // 7-5/8" face + 3/8" mortar
export const CMU_LENGTH_IN = 16;  // 15-5/8" face + 3/8" mortar

// Grout fill ratios
export const GROUT_FILL_FACTORS = {
  PARTIAL: 0.25,  // bond-beam-only partial fill (fraction of total cell volume)
  FULL: 1.0,      // fully grouted wall
};

// UNRESOLVED: Exact grout CY/SF factors not confirmed from project workbook –
// using standard industry factors.
export const GROUT_CY_PER_SF: Record<number, number> = {
  4:  0.012,
  6:  0.018,
  8:  0.024,
  10: 0.030,
  12: 0.037,
};

// Standard rebar stock lengths used to determine whether extension rods are needed
export const REBAR_STOCK_LENGTH_FT: Record<string, number> = {
  '#3': 20,
  '#4': 20,
  '#5': 20,
  '#6': 20,
  '#7': 20,
  '#8': 20,
};

// Pallet quantities for standard CMU products (blocks per pallet)
export const CMU_PALLET_QTY: Record<number, number> = {
  4:  180,
  6:  120,
  8:  90,
  10: 75,
  12: 60,
};

// Known gaps relative to the project workbook
export const UNRESOLVED_ITEMS: UnresolvedItem[] = [
  {
    area: 'grout',
    description: 'Exact grout CY/SF factors not confirmed from workbook',
    current_behavior: 'Using standard industry factors (see GROUT_CY_PER_SF)',
    workbook_evidence: null,
  },
  {
    area: 'rebar_schedule',
    description: 'Rebar spacing and size schedule not fully confirmed',
    current_behavior: 'Using common engineering practice values',
    workbook_evidence: null,
  },
  {
    area: 'footing_schedule',
    description: 'Footing depth and reinforcement schedule not fully confirmed',
    current_behavior: 'Using typical structural practice values',
    workbook_evidence: null,
  },
];
