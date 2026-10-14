import { type Options } from "./types.ts";

// BE MINDFUL TUNING ANY OF THESE DEFAULTS AND ALWAYS TEST FOR IMPACTS !!!

// Max cache pairs of search string, buckets and results
export const DEFAULT_CACHE_LENGTH: number = 200;
// Max size of a single bucket
export const DEFAULT_BUCKET_SIZE: number = 200;
// Limit the amount of results looking for
export const DEFAULT_RESULTS_LIMIT: number = 15;
// Limit how many characters are requested before searching
export const MIN_SEARCH_LENGTH: number = 3;
// Default options for the user to modify
export const DEFAULT_OPTIONS: Options<unknown> = {
  sortBy: undefined,
  readyCallback: undefined,
  advanced: {
    maxBucketSize: DEFAULT_BUCKET_SIZE,
    maxCacheLength: DEFAULT_CACHE_LENGTH,
  },
  data: [],
  fields: [],
  maxResults: DEFAULT_RESULTS_LIMIT,
  minQueryLength: MIN_SEARCH_LENGTH,
  verbose: false,
} as const;
