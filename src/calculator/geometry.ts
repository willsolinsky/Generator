import { NormalizedSegment } from '../types';

/**
 * Calculate the face area and linear footage for the RET (retaining wall)
 * component of a segment.
 *
 * If the segment supplies an explicit area_sf we use that; otherwise we derive
 * face_sf from length × height.
 */
export function calculateRetGeometry(segment: NormalizedSegment): {
  face_sf: number | null;
  lf: number | null;
  height_ft: number | null;
} {
  const ret = segment.ret;
  if (ret === null) return { face_sf: null, lf: null, height_ft: null };

  const lf = segment.length_lf;
  const height_ft = ret.height_ft ?? segment.avg_height_ft;
  let face_sf: number | null = null;

  if (lf !== null && height_ft !== null) {
    face_sf = lf * height_ft;
  } else if (segment.area_sf !== null && segment.wot === null) {
    // If there is no WOT, the full area belongs to RET
    face_sf = segment.area_sf;
  }

  return { face_sf, lf, height_ft };
}

/**
 * Calculate the face area and linear footage for the WOT (wall-on-top)
 * component of a segment.
 */
export function calculateWotGeometry(segment: NormalizedSegment): {
  face_sf: number | null;
  lf: number | null;
  height_ft: number | null;
} {
  const wot = segment.wot;
  if (wot === null) return { face_sf: null, lf: null, height_ft: null };

  const lf = segment.length_lf;
  const height_ft = wot.height_ft ?? segment.avg_height_ft;
  let face_sf: number | null = null;

  if (lf !== null && height_ft !== null) {
    face_sf = lf * height_ft;
  }

  return { face_sf, lf, height_ft };
}

/**
 * Calculate the combined height of RET + WOT components.
 */
export function calculateTotalHeight(segment: NormalizedSegment): number | null {
  const retH = segment.ret?.height_ft ?? null;
  const wotH = segment.wot?.height_ft ?? null;

  if (retH !== null && wotH !== null) return retH + wotH;
  if (retH !== null) return retH;
  if (wotH !== null) return wotH;
  return segment.avg_height_ft;
}
