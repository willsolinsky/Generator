import { WallComponent, LabelRowType } from '../types';

// Valid CMU widths in inches
const VALID_WIDTHS: ReadonlySet<number> = new Set([4, 6, 8, 10, 12]);

// Direction prefix tokens to ignore when parsing wall type
const DIRECTION_PREFIXES: ReadonlySet<string> = new Set(['N', 'S', 'E', 'W', 'NE', 'NW', 'SE', 'SW']);

// Known label row type keywords
const LABEL_ROW_KEYWORDS: ReadonlyMap<string, LabelRowType> = new Map([
  ['CORNER', 'CORNER'],
  ['MITER', 'MITER'],
  ['CJ', 'CJ'],
  ['END', 'END'],
]);

// Reserved tokens that are NOT texture names
const RESERVED_TOKENS: ReadonlySet<string> = new Set(['RET', 'WOT', '_', ...DIRECTION_PREFIXES]);

export interface ParseLabelResult {
  ret: WallComponent | null;
  wot: WallComponent | null;
  labelType: LabelRowType | null;
}

/**
 * Parse a label string into RET/WOT components or a label row type.
 *
 * Supported formats:
 *   "E RET 8 PROTO 6.67 _ WOT 6 PROTO 6"
 *   "RET 12 SPLIT 8"
 *   "WOT 6 8"
 *   "CORNER", "MITER", "CJ", "END"
 */
export function parseLabel(label: string): ParseLabelResult {
  const trimmed = label.trim().toUpperCase();

  // Check for label row types first
  const labelType = LABEL_ROW_KEYWORDS.get(trimmed);
  if (labelType !== undefined) {
    return { ret: null, wot: null, labelType };
  }

  const tokens = trimmed.split(/\s+/).filter(t => t.length > 0);

  // Split on the '_' separator into RET and WOT sections
  const separatorIdx = tokens.indexOf('_');

  if (separatorIdx !== -1) {
    const retTokens = tokens.slice(0, separatorIdx);
    const wotTokens = tokens.slice(separatorIdx + 1);
    const ret = parseComponentTokens(retTokens, 'RET');
    const wot = parseComponentTokens(wotTokens, 'WOT');
    if (ret === null && wot === null) {
      return { ret: null, wot: null, labelType: null };
    }
    return { ret, wot, labelType: null };
  }

  // No separator – look for explicit RET or WOT keyword
  const retIdx = tokens.indexOf('RET');
  const wotIdx = tokens.indexOf('WOT');

  if (retIdx !== -1 && wotIdx !== -1) {
    // Both in same token stream without separator – parse each slice
    const firstIdx = Math.min(retIdx, wotIdx);
    const secondIdx = Math.max(retIdx, wotIdx);
    const firstType = retIdx < wotIdx ? 'RET' : 'WOT';
    const secondType = retIdx < wotIdx ? 'WOT' : 'RET';
    const first = parseComponentTokens(tokens.slice(firstIdx, secondIdx), firstType);
    const second = parseComponentTokens(tokens.slice(secondIdx), secondType);
    return {
      ret: firstType === 'RET' ? first : second,
      wot: firstType === 'WOT' ? first : second,
      labelType: null,
    };
  }

  if (retIdx !== -1) {
    const ret = parseComponentTokens(tokens.slice(retIdx), 'RET');
    return { ret, wot: null, labelType: null };
  }

  if (wotIdx !== -1) {
    const wot = parseComponentTokens(tokens.slice(wotIdx), 'WOT');
    return { ret: null, wot, labelType: null };
  }

  // Could not identify wall type – warn and return empty
  console.warn(`[label-parser] Unrecognized label: "${label}"`);
  return { ret: null, wot: null, labelType: null };
}

/**
 * Parse a slice of tokens into a WallComponent.
 * Expected token ordering: [TYPE] [width] [texture?] [height?]
 * The first token is expected to be the wall type keyword (RET or WOT),
 * but we accept the forced `componentType` parameter as the source of truth.
 */
function parseComponentTokens(
  tokens: string[],
  componentType: 'RET' | 'WOT',
): WallComponent | null {
  // Strip leading direction prefixes and the wall type keyword itself
  let idx = 0;
  while (idx < tokens.length && (DIRECTION_PREFIXES.has(tokens[idx]) || tokens[idx] === componentType)) {
    idx++;
  }

  const remaining = tokens.slice(idx);
  if (remaining.length === 0) return null;

  // First remaining token should be the width
  const widthVal = parseFloat(remaining[0]);
  if (isNaN(widthVal) || !VALID_WIDTHS.has(widthVal)) {
    console.warn(`[label-parser] Expected valid CMU width after ${componentType}, got "${remaining[0]}"`);
    return null;
  }
  const width_in = widthVal;

  let texture: string | null = null;
  let height_ft: number | null = null;

  let tokenIdx = 1;
  while (tokenIdx < remaining.length) {
    const tok = remaining[tokenIdx];
    const num = parseFloat(tok);
    if (!isNaN(num)) {
      // Numeric token – height
      height_ft = num;
      tokenIdx++;
      break;
    } else if (!RESERVED_TOKENS.has(tok)) {
      // Non-numeric, non-reserved token – texture
      texture = tok;
    }
    tokenIdx++;
  }

  return { type: componentType, width_in, texture, height_ft };
}
