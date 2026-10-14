import AdvancedClientSearch from "./search/AdvancedClientSearch.ts";
import { loadProductsConcurrently } from "./demo/loadProductsConcurrently.ts";
import { throttle } from "./demo/throttle.ts";
import { Product } from "../backend/types.ts";

const $loadBtn = document.getElementById("load")! as HTMLButtonElement;
const $loading = document.getElementById("loading")!;
const $noResults = document.getElementById("no-results")!;
const $input = document.getElementById("search-input")! as HTMLInputElement;
const $resultsTable = document.getElementById("results-table")!;
const $resultsContainer = document.getElementById("results-container")!;
const $simulateDelay = document.getElementById("simulateDelay")! as HTMLInputElement;

let products: Product[] = [];
let ACS: AdvancedClientSearch<Product>;

async function loadProducts(onChunkLoad?: () => void): Promise<void> {
  const startTime = Date.now();
  products = [];
  $loading.style.display = "block";

  products = await loadProductsConcurrently(
    (chunk) => {
      ACS?.addData(chunk);
      onChunkLoad?.();
    },
    5,
    $simulateDelay.checked,
  );

  console.log(`Loaded ${products.length} products in ${Date.now() - startTime} ms`);

  $loading.style.display = "none";
}

function initSearch() {
  ACS = new AdvancedClientSearch<Product>({
    verbose: true,
    data: [],
    fields: ["name", "sku", "ean"],
    minQueryLength: 1,
    maxResults: 15,
    readyCallback: () => {
      $input.style.display = "block";
      $noResults.style.display = "block";
      $resultsContainer.style.display = "block";
    },
  });
}

function main() {
  $loading.style.display = "none";
  initSearch();

  $loadBtn.addEventListener("click", () => {
    initSearch();
    loadProducts(inputChangeListener);
  });

  const inputChangeListener = throttle(() => {
    const results = ACS.search($input.value).results;

    if (results.length === 0) {
      $noResults.style.display = "block";
      $resultsTable.innerHTML = "";
    } else {
      $noResults.style.display = "none";
      $resultsTable.innerHTML = results
        .map(
          (product, index) =>
            `<tr>
              <td style="text-align: center"><small>${index + 1}</small></td>
              <td><img src="${product.image || ""}" style="height: 2rem; width: 2rem; display: block; visibility: ${product.image ? "visible" : "hidden"}" /></td>
              <td><b>${product.name}</b></td>
              <td><pre>${product.sku || "-"}</pre></td>
              <td style="text-align: center"><pre>${product.ean || "-"}</pre></td>
            </tr>`,
        )
        .join("");
    }
  }, 250);

  $input.addEventListener("input", inputChangeListener);
  loadProducts(() => {
    if ($input.value.length) inputChangeListener();
  });
}
main();
