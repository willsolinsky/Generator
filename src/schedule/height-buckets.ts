import { BucketDistribution, HeightBucket } from '../types';

// Canonical height buckets in feet (ascending order)
export const HEIGHT_BUCKETS: HeightBucket[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20];

/**
 * Assign a given height to the nearest canonical bucket by rounding UP to the
 * next bucket.  Heights above the maximum bucket clamp to the maximum.
 */
export function assignHeightBucket(height_ft: number): HeightBucket {
  for (const bucket of HEIGHT_BUCKETS) {
    if (height_ft <= bucket) return bucket;
  }
  // Clamp to maximum
  return HEIGHT_BUCKETS[HEIGHT_BUCKETS.length - 1];
}

/**
 * Distribute a total LF across height buckets.
 *
 * - Single height provided → all LF goes to that height's bucket.
 * - Multiple heights provided → each height gets an equal share of the LF,
 *   which are then accumulated into the appropriate buckets.
 *
 * Buckets with zero LF are omitted from the result.
 */
export function distributeIntoBuckets(
  total_lf: number,
  heights: number[],
): BucketDistribution {
  if (heights.length === 0) return {};

  const dist: BucketDistribution = {};

  const lfPerHeight = total_lf / heights.length;

  for (const h of heights) {
    const bucket = assignHeightBucket(h);
    dist[bucket] = (dist[bucket] ?? 0) + lfPerHeight;
  }

  return dist;
}
