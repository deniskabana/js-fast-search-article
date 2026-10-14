export type IdentifiableT<T = {}> = T & {
  id: number | string;
};

export type MetaReturn<T extends IdentifiableT> = {
  meta: {
    bucketsChecked: number;
    isFromCache: boolean;
    itemsChecked: number;
  };
  results: T[];
};

export const BucketSearchStatuses = {
  NotSearched: 0,
  HasMatches: 1,
  HasNoMoreMatches: 2,
  NoMatches: 3,
} as const;

type ValueOf<T> = T[keyof T];
export type BucketSearchStatus = ValueOf<typeof BucketSearchStatuses>;

export type SingleCacheResult = {
  buckets: BucketSearchStatus[];
  resultsByBucket: number[][];
  resultsIds: IdentifiableT["id"][];
};

export type ProcessedIdentifiableT = Partial<IdentifiableT> & {
  [key: string]: string;
} & {
  id: number | string;
};

export type Bucket = ProcessedIdentifiableT[];

export type OptionsInput<T> = {
  advanced?: Partial<{
    maxBucketSize: number;
    maxCacheLength: number;
  }>;
  data: T[];
  fields: (keyof IdentifiableT<T>)[];
  maxResults?: number;
  minQueryLength?: number;
  readyCallback?: () => void;
  sortBy?: keyof T;
  verbose?: boolean;
};

export type Options<T> = Required<Omit<OptionsInput<T>, "readyCallback" | "sortBy">> & {
  advanced: Required<OptionsInput<T>["advanced"]>;
  readyCallback?: undefined | (() => void);
  sortBy?: keyof T | undefined;
};
