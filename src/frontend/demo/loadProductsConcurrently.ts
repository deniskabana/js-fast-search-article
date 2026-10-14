import { Product } from "../../backend/types.ts";

const API_URL = "http://localhost:3000";
const LIMIT = 5_000;

/**
 * Keeps up to `maxConcurrent` requests in flight at all times.
 * A worker grabs the next page the moment its previous one finishes.
 */
export async function loadProductsConcurrently(
  onChunkLoad?: (chunk: Product[], products: Product[]) => void,
  maxConcurrent: number = 5,
  simulateDelay?: boolean,
): Promise<Product[]> {
  let nextPage = 1;
  let hasMoreProducts = true;
  let products: Product[] = [];

  async function worker(): Promise<void> {
    while (hasMoreProducts) {
      const page = nextPage++;
      const response = await fetch(
        `${API_URL}/products?page=${page}&limit=${LIMIT}&simulateLatency=${simulateDelay ?? "false"}`,
      );
      if (!response.ok) throw new Error(`Failed on page ${page}: ${response.status}`);
      const chunk: Product[] = await response.json();

      if (chunk.length < LIMIT) hasMoreProducts = false;
      products.push(...chunk);
      onChunkLoad?.(chunk, products);

      await new Promise((resolve) => setTimeout(resolve));
    }
  }

  await Promise.all(Array.from({ length: maxConcurrent }, worker));
  return products;
}
