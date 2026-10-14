/**
 * A Least Recently Used (LRU) Cache implementation.
 */
export class LRUCache<Key extends string, Value> {
  private readonly map = new Map<Key, Value>();
  private readonly capacity: number;

  /**
   * @param {number} capacity The maximum number of items the cache can hold.
   */
  constructor(capacity: number) {
    this.capacity = capacity;
  }

  /**
   * @param {Key} key The key of the item to retrieve.
   * @returns {{ item: Value | undefined; key: Key }} An object containing the retrieved item and its key.
   */
  get(key: Key): { item: Value | undefined; key: Key } {
    const parsedKey = this.parseKey(key);
    const item = this.map.get(parsedKey);
    if (item !== undefined) {
      // Remove and add it back to update its position in the Map
      this.map.delete(parsedKey);
      this.map.set(parsedKey, item);
    }
    return { item, key: parsedKey };
  }

  /**
   * @param {Key} key The key of the item to add.
   * @param {Value} value The value of the item to add.
   */
  set(key: Key, value: Value): void {
    const parsedKey = this.parseKey(key);
    // Remove the existing item and add it back to update its position
    this.map.delete(parsedKey);

    if (this.map.size >= this.capacity) {
      // Remove the least recently used item
      const firstKey = this.map.keys().next().value;
      if (firstKey) this.map.delete(firstKey);
    }
    this.map.set(parsedKey, value);
  }

  clear(): void {
    this.map.clear();
  }

  private parseKey(key: string): Key {
    return key.replace(/\s/g, "") as Key;
  }
}
