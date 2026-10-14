import { LRUCache } from "./LRUCache.ts";
import {
  type Bucket,
  type BucketSearchStatus,
  BucketSearchStatuses,
  type IdentifiableT,
  type MetaReturn,
  type Options,
  type OptionsInput,
  type ProcessedIdentifiableT,
  type SingleCacheResult,
} from "./types.ts";
import { DEFAULT_OPTIONS, DEFAULT_RESULTS_LIMIT, MIN_SEARCH_LENGTH } from "./defaults.ts";
import { parseQuery, sanitizeString } from "./utilities.ts";
import { ERR_DUPLICATE_ID, ERR_INVALID_SCHEMA } from "./errors.ts";
import { type Msg, debug as originalDebugFn } from "./debug.ts";

// ADVANCED CLIENT SEARCH CLASS
// --------------------------------------------------

export default class AdvancedClientSearch<T extends IdentifiableT = IdentifiableT> {
  protected userOptions: Options<T> & { maxResults: number } = DEFAULT_OPTIONS as any;
  protected totalDataLength: number = 0;

  // Optimized data structures
  protected dataById: Map<string | number, T> = new Map();
  protected dataByBuckets: Bucket[] = [];
  protected cache: LRUCache<string, SingleCacheResult>;

  // INITIALIZATION
  // --------------------------------------------------

  /**
   * Logs a debug message with optional additional arguments.
   * @param msg - The debug message to log.
   * @param args - Additional arguments to include in the log.
   */
  private debug = (msg: Msg, ...args: unknown[]): void => {
    if (!this.userOptions.verbose) return;
    originalDebugFn(msg, ...args);
  };

  /**
   * Constructs a new instance of the AdvancedClientSearch class.
   * @param {OptionsInput<T>} options - The options for the AdvancedClientSearch.
   */
  constructor(options: OptionsInput<T>) {
    this.userOptions = {
      ...DEFAULT_OPTIONS,
      ...options,
      advanced: { ...DEFAULT_OPTIONS.advanced, ...options.advanced },
      maxResults: options.maxResults ?? DEFAULT_RESULTS_LIMIT,
      verbose: options.verbose ?? false,
    };

    this.cache = new LRUCache<string, SingleCacheResult>(this.userOptions.advanced.maxCacheLength);

    this.debug("initstart");

    const preprocessOnCreate = async () => {
      // Defer after the construction
      await new Promise((resolve) => setTimeout(resolve));

      await this.addData(this.userOptions.data);
      this.debug("bucketlength", this.dataByBuckets.length);
      this.debug("initend");

      this.userOptions.readyCallback?.();
    };

    preprocessOnCreate();
  }

  /**
   * Adds a chunk of data and processes it
   * @param {T[]} data - A chunk of data
   */
  public addData = async (data: T[]): Promise<void> => {
    const maxConcurrentProducts = 2000;
    this.totalDataLength += data.length;

    let productCounter = maxConcurrentProducts;

    for (const item of data) {
      // Reinforce the id field
      const dataOptimizedForSearch = { id: item.id } as ProcessedIdentifiableT;
      this.preprocessOptimizedItem(item, dataOptimizedForSearch);
      this.preprocessItemIntoBucket(dataOptimizedForSearch);
      productCounter--;

      if (productCounter === 0) {
        await new Promise((resolve) => setTimeout(resolve));
        productCounter = maxConcurrentProducts;
      }
    }

    this.debug("datalength", this.totalDataLength);
    this.cache.clear();
  };

  // PREPROCESSING METHODS
  // --------------------------------------------------

  /**
   * Preprocesses an item (in-place) for optimized search - includes only required fields, filtering & sanitization
   * @param item - The item to preprocess.
   * @param dataOptimizedForSearch - The object to store the preprocessed data.
   */
  private preprocessOptimizedItem = (item: T, dataOptimizedForSearch: ProcessedIdentifiableT): boolean => {
    // Exit if any line ID is duplicate or missing
    if (item.id === undefined || !String(item.id).length) throw new Error(ERR_INVALID_SCHEMA);
    if (this.dataById.has(item.id)) throw new Error(ERR_DUPLICATE_ID);

    // Store the original indexed by ID for constant access speed
    this.dataById.set(item.id, item); // This needs to be a complete item, UNTOUCHED

    // Sanitize and optimize all data
    for (const field of this.userOptions.fields) {
      if (item[field] === undefined || field === "id") continue;
      const sanitizedString: string = sanitizeString(String(item[field])) || "";
      dataOptimizedForSearch[String(field)] = sanitizedString;
    }

    return true;
  };

  /**
   * Preprocesses an item and adds it to the appropriate bucket.
   * If no bucket exists, a new one is created.
   * If all existing buckets are full, a new bucket is created and the item is added to it.
   * @param dataOptimizedForSearch - The item to be processed and added to the bucket.
   */
  private preprocessItemIntoBucket = (dataOptimizedForSearch: ProcessedIdentifiableT) => {
    // Create the first bucket if none exist yet
    if (!this.dataByBuckets.length) this.dataByBuckets.push([]);

    // Find the first bucket that has space and push optimized data
    const wasPushed = !!this.dataByBuckets
      .find((bucket) => bucket.length < this.userOptions.advanced!.maxBucketSize!)
      ?.push(dataOptimizedForSearch);

    // Or create a new bucket with this data in-place
    if (!wasPushed) this.dataByBuckets.push([dataOptimizedForSearch]);
  };

  // CACHE METHODS
  // --------------------------------------------------

  /**
   * Saves the query, results IDs, and bucket search status to the cache.
   * @param {string} query - The query to be saved.
   * @param {T['id'][]} resultsIds - The array of results IDs to be saved.
   * @param {BucketSearchStatus[]} bucketSearchStatuses - The array of bucket search status to be saved.
   * @returns {void}
   */
  private saveQueryToCache = (
    query: string,
    resultsIds: T["id"][],
    resultsByBucket: SingleCacheResult["resultsByBucket"],
    bucketSearchStatuses: BucketSearchStatus[],
  ): void => {
    if (!resultsIds.length) return;
    const cachedResult: SingleCacheResult = {
      buckets: bucketSearchStatuses,
      resultsByBucket,
      resultsIds,
    };
    this.cache.set(query, cachedResult);
  };

  /**
   * Retrieves a cached result from the cache based on the provided query.
   * The query is shortened by removing the last letter until a partial match is found or undefined is returned.
   * @param query - The query to search for in the cache.
   * @returns An object containing the cached result (if found) and a boolean indicating if it is a full match.
   */
  private getQueryFromCache = (query: string): { cachedResult: SingleCacheResult | undefined; fullMatch: boolean } => {
    // Keep shortening the query by removing last letter until a partial match is found
    // or undefined is returned
    for (let i = query.length; i > 0; i--) {
      const prefix = query.slice(0, i);
      const { item: cachedResult } = this.cache.get(prefix);
      if (cachedResult) {
        return { cachedResult, fullMatch: i === query.length };
      }
    }
    return { cachedResult: undefined, fullMatch: false };
  };

  // SEARCH TOOLS
  // --------------------------------------------------

  /**
   * Retrieves the search buckets from the cached result or initializes them with the default status.
   * @param cachedResult - The cached result containing the search buckets.
   * @returns The search buckets from the cached result or an array of search bucket statuses.
   */
  private getSearchBuckets = (cachedResult: SingleCacheResult | undefined): SingleCacheResult["buckets"] => {
    if (cachedResult) {
      return [...cachedResult.buckets];
    } else {
      return Array(this.dataByBuckets.length).fill(BucketSearchStatuses.NotSearched);
    }
  };

  /**
   * Searches for items in a given bucket based on a split and sanitized query.
   * @param bucket - The bucket to search in.
   * @param query - The search query.
   * @returns An object containing the matching item IDs and the number of searched items.
   */
  private searchInBucket = (
    resultsIds: T["id"][],
    bucket: Bucket,
    query: string[],
    previousResultsInBucket: SingleCacheResult["resultsByBucket"][0],
    bucketStatus: BucketSearchStatus,
  ): {
    hasNoMatches?: boolean;
    resultsIds: T["id"][];
    resultsInBucket: SingleCacheResult["resultsByBucket"][0];
    searchedItems: number;
  } => {
    const internalResultsIds: T["id"][] = [];
    const resultsInBucket: SingleCacheResult["resultsByBucket"][0] = [];
    const searchIndexes = previousResultsInBucket ?? [];
    let searchedItems = 0;

    for (let i = 0; i < bucket.length; i++) {
      const item = bucket[i];
      if (!item) continue;

      // Search by indexes of previous search results in bucket
      const lastIndex = searchIndexes[searchIndexes.length - 1];
      if (searchIndexes.length && !!lastIndex) {
        if (i < lastIndex && !searchIndexes.includes(i)) {
          continue;
        }

        if (i > lastIndex && bucketStatus === BucketSearchStatuses.HasNoMoreMatches) {
          break;
        }
      }

      searchedItems++;

      // Search in all requested fields of this item
      for (const field of this.userOptions.fields) {
        // Skip searching if the field is empty
        const searchIn = item[String(field)];
        if (!searchIn?.length) continue;

        const matchesAll = query.every((query) => searchIn.includes(query));
        if (matchesAll) {
          // If this item matches all queries, add it to the results
          if (!internalResultsIds.includes(item.id)) {
            internalResultsIds.push(item.id);
            resultsInBucket.push(i);
          }
          // If there are already enough results, stop searching
          if (resultsIds.length + internalResultsIds.length >= this.userOptions.maxResults) {
            return {
              hasNoMatches: false,
              resultsIds: internalResultsIds,
              resultsInBucket,
              searchedItems,
            };
          }
        }
      }
    }

    return {
      hasNoMatches: true,
      resultsIds: internalResultsIds,
      resultsInBucket,
      searchedItems,
    };
  };

  // PUBLICLY REVEALED METHOD (only search)
  // --------------------------------------------------

  /**
   * Performs an advanced client search based on the provided query.
   * Returns a capped amount of results based on the user options.
   * Caches the queries for faster subsequent searches.
   * @param query - The search query.
   * @returns An array of search results.
   */
  public search = (query: string): MetaReturn<T> => {
    this.debug("searchinit", query);
    const metaReturn: MetaReturn<T> = {
      meta: { bucketsChecked: 0, isFromCache: false, itemsChecked: 0 },
      results: [],
    };

    // Sanitize and split query by words
    const sanitizedQuery = parseQuery(query);

    // Check if query meets criteria and return [] if not
    if (query.length < (this.userOptions.minQueryLength ?? MIN_SEARCH_LENGTH) || !sanitizedQuery?.length) {
      this.debug("shortquery");
      return metaReturn;
    }

    // Try looking in cache for full or partial matches on the search query
    const { cachedResult, fullMatch } = this.getQueryFromCache(query);

    // If there is the exact same query cached, return the results
    if (cachedResult && fullMatch) {
      const cacheHit = cachedResult.resultsIds.map((id) => this.dataById.get(id)).filter(Boolean) as T[];
      if (cacheHit.length) {
        this.debug("returnfromcache", cachedResult.resultsIds.length);
        metaReturn.results = cacheHit;
        metaReturn.meta.isFromCache = true;
        return metaReturn;
      }
    }

    // Collect these data when searching
    const limitedResults: T[] = []; // Limitied by maxResults
    let resultsIds: T["id"][] = []; // Collection of ids of results
    const resultsByBucket: SingleCacheResult["resultsByBucket"] = cachedResult?.resultsByBucket ?? [];
    const bucketsToSearch = this.getSearchBuckets(cachedResult);

    // Performance metrics collection
    let searchedItems = 0;
    let searchedBuckets = 0;

    // Iterate over ALL buckets
    for (let i = 0; i < this.dataByBuckets.length; i++) {
      const bucketStatus = bucketsToSearch[i];
      if (bucketStatus === undefined || bucketStatus === BucketSearchStatuses.NoMatches) continue;

      let resultsBucket = resultsByBucket[i];
      if (!resultsBucket) resultsBucket = resultsByBucket[i] = [];

      const activeBucket = this.dataByBuckets[i];
      if (!activeBucket) continue;

      searchedBuckets++;

      let foundMatchInBucket = false;

      const {
        resultsIds: newResults,
        searchedItems: newItems,
        resultsInBucket,
        hasNoMatches,
      } = this.searchInBucket(resultsIds, activeBucket, sanitizedQuery, resultsBucket, bucketStatus);

      resultsIds = [...resultsIds, ...newResults].slice(0, this.userOptions.maxResults);
      searchedItems += newItems;
      foundMatchInBucket = foundMatchInBucket || !!newItems;
      resultsByBucket[i] = resultsInBucket;

      if (newResults.length) {
        bucketsToSearch[i] = hasNoMatches ? BucketSearchStatuses.HasNoMoreMatches : BucketSearchStatuses.HasMatches;
      } else {
        bucketsToSearch[i] = BucketSearchStatuses.NoMatches;
      }

      // Populate limitedResults with results from this bucket
      if (limitedResults.length < this.userOptions.maxResults)
        newResults.slice(0, this.userOptions.maxResults - limitedResults.length).forEach((id) => {
          if (this.dataById.has(id)) limitedResults.push(this.dataById.get(id)!);
        });

      // if newResults.length > maxResults, quit operation, update cache, return results
      if (limitedResults.length >= this.userOptions.maxResults) {
        this.saveQueryToCache(query, resultsIds, resultsByBucket, bucketsToSearch);
        this.debug(
          "searchend",
          resultsIds.length,
          query,
          searchedItems,
          this.totalDataLength,
          searchedBuckets,
          this.dataByBuckets.length,
        );
        // Slice is just an additionall fallback
        metaReturn.results = limitedResults.slice(0, this.userOptions.maxResults);
        metaReturn.meta = {
          bucketsChecked: searchedBuckets,
          isFromCache: false,
          itemsChecked: searchedItems,
        };
        return metaReturn;
      }

      // Update bucket status
      if (!foundMatchInBucket) {
        bucketsToSearch[i] = BucketSearchStatuses.NoMatches;
      }
    }

    // If less or equal than requested results were found.
    // Save the result to cache and return it.
    this.saveQueryToCache(query, resultsIds, resultsByBucket, bucketsToSearch);
    this.debug(
      "searchend",
      resultsIds.length,
      query,
      searchedItems,
      this.totalDataLength,
      searchedBuckets,
      this.dataByBuckets.length,
    );
    metaReturn.results = limitedResults;
    metaReturn.meta = {
      bucketsChecked: searchedBuckets,
      isFromCache: false,
      itemsChecked: searchedItems,
    };
    return metaReturn;
  };
}
