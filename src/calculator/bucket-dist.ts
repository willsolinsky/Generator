import { BucketDistribution, HeightBucket } from '../types';
import { assignHeightBucket, HEIGHT_BUCKETS } from '../schedule/height-buckets';

export { assignHeightBucket as getHeightBucket };

/**
 * Distribute total_lf into height buckets.
 *
 * - Single height: all LF goes to that height's bucket.
 * - Multiple heights: LF is split evenly across heights and accumulated into
 *   the corresponding buckets.
 */
export function distributeIntoBuckets(
  total_lf: number,
  heights: number[],
): BucketDistribution {
  if (heights.length === 0) return {};

  const dist: BucketDistribution = {};
  const lfPerHeight = total_lf / heights.length;

  for (const h of heights) {
    const bucket = assignHeightBucket(h) as HeightBucket;
    dist[bucket] = (dist[bucket] ?? 0) + lfPerHeight;
  }

  return dist;
}

// Re-export canonical bucket list for convenience
export { HEIGHT_BUCKETS };
