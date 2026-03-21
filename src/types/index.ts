// All shared TypeScript types and interfaces for the CMU/block wall estimating engine

// Raw Bluebeam row as exported from a Bluebeam takeoff
export interface BluebeamRow {
  id: string;
  label: string;         // e.g. "E RET 8 PROTO 6.67 _ WOT 6 PROTO 6"
  length_lf: number | null;
  area_sf: number | null;
  count: number | null;
  height_ft: number | null;
  markupType: string;    // "Polyline", "Polygon", "Count", etc.
  pageLabel: string;
  subject: string | null;
  comments: string | null;
}

// A parsed wall component from a label token
export interface WallComponent {
  type: 'RET' | 'WOT';
  width_in: number;      // CMU width in inches (4, 6, 8, 10, 12)
  texture: string | null;
  height_ft: number | null;
}

// Corner/miter/joint label row data
export interface LabelCounts {
  corner_count: number;
  miter_count: number;
  control_joint_count: number;
  end_count: number;
}

// A fully normalized wall segment (output of parser)
export interface NormalizedSegment {
  segment_id: string;
  raw_label: string;
  ret: WallComponent | null;
  wot: WallComponent | null;
  length_lf: number | null;
  area_sf: number | null;
  avg_height_ft: number | null;
  labels: LabelCounts;
  source_rows: BluebeamRow[];
}

// Canonical height buckets (canonical heights in feet)
export type HeightBucket = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 12 | 14 | 16 | 18 | 20;

// Distribution of LF across height buckets
export type BucketDistribution = Partial<Record<HeightBucket, number>>;

// Footing schedule entry
export interface FootingSchedule {
  height_bucket: HeightBucket;
  width_in: number;           // footing width
  depth_in: number;           // footing depth
  rebar_top: string | null;   // e.g. "#4"
  rebar_bottom: string | null;
  keyway: boolean;
}

// Keyway schedule entry
export interface KeywaySchedule {
  height_bucket: HeightBucket;
  width_in: number;
  keyway_depth_in: number;
  keyway_width_in: number;
}

// Rebar schedule entry
export interface RebarSchedule {
  height_bucket: HeightBucket;
  wall_width_in: number;
  bar_size: string;            // e.g. "#5"
  spacing_in: number;          // vertical spacing in inches
  embed_depth_in: number | null;
}

// Block calculation result for one segment
export interface BlockCalculation {
  segment_id: string;
  standard_block_count: number;
  half_block_count: number;
  bond_beam_block_count: number;
  total_block_count: number;
  courses: number;
}

// Grout calculation result
export interface GroutCalculation {
  segment_id: string;
  grout_cy: number;           // cubic yards
  partial_fill: boolean;
  full_fill: boolean;
}

// Rod calculation result
export interface RodCalculation {
  segment_id: string;
  rod_count: number;
  extension_rod_count: number;
  rod_size: string;
}

// Ladder wire calculation result
export interface LadderWireCalculation {
  segment_id: string;
  ladder_wire_lf: number;
  wire_gauge: string;
}

// Material line item
export interface MaterialLineItem {
  scheme: string;
  wall_width_in: number;
  system: string;
  texture: string | null;
  color: string | null;
  product_code: string | null;
  quantity: number;
  unit: string;
  pallet_qty: number | null;
  pallets: number | null;
}

// Full segment calculation result
export interface SegmentCalculation {
  segment: NormalizedSegment;
  bucket_distribution: BucketDistribution;
  blocks: BlockCalculation;
  grout: GroutCalculation;
  rods: RodCalculation;
  ladder_wire: LadderWireCalculation;
  footing_lf: number | null;
  keyway_lf: number | null;
}

// Material rollup output
export interface MaterialRollup {
  line_items: MaterialLineItem[];
  total_block: number;
  total_grout_cy: number;
  total_rebar_lf: number;
  unresolved_items: UnresolvedItem[];
}

// Documents a gap in workbook parity
export interface UnresolvedItem {
  area: string;
  description: string;
  current_behavior: string;
  workbook_evidence: string | null;
}

// Internal parsed row representation (output of label parsing step)
export interface ParsedRow {
  raw: BluebeamRow;
  ret: WallComponent | null;
  wot: WallComponent | null;
  isMainRow: boolean;        // true if label contains RET or WOT
  labelType: LabelRowType | null;  // non-null for CORNER/MITER/CJ/END rows
}

export type LabelRowType = 'CORNER' | 'MITER' | 'CJ' | 'END';

// A group of rows that belong to the same wall segment
export interface RowGroup {
  mainRow: ParsedRow;
  labelRows: ParsedRow[];
}
