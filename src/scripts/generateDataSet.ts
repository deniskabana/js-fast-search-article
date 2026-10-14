import { faker } from "@faker-js/faker";
import { createWriteStream } from "fs";
import { writeFile } from "fs/promises";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import { datasetFile } from "../backend/constants.ts";
import { type Product } from "../backend/types.ts";

const SETTINGS = {
  productsSize: 250_000,
  batchSize: 2_000,
} as const;

function* createProductsGenerator(settings: typeof SETTINGS = SETTINGS): Generator<string> {
  yield "[\n";

  for (let i = 0; i < settings.productsSize; i += settings.batchSize) {
    let chunk = "";

    for (let j = 0; j < settings.batchSize; j++) {
      if (i + j >= settings.productsSize) break;
      const name = [
        faker.color
          .human()
          .split(" ")
          .map((c) => c.slice(0, 1).toLocaleUpperCase() + c.slice(1))
          .join(" "),
        faker.commerce.productAdjective(),
        faker.commerce.productMaterial(),
        faker.commerce.product(),
      ].join(" ");

      const record: Product = {
        id: i + j,
        name,
        sku: Math.random() > 0.9 ? undefined : name.toLocaleLowerCase().replaceAll(/\s/g, "_"),
        ean: Math.random() > 0.9 ? undefined : faker.commerce.isbn({ separator: "", variant: 13 }),
        image:
          Math.random() > 0.9
            ? undefined
            : `https://img.loomhelix.com/seed/sku-${i + j}/200x200?angle=${((i + j) % 7) + 1}`,
      };

      chunk += (i + j === 0 ? "" : ",\n") + JSON.stringify(record);
    }

    yield chunk;
  }

  yield "\n]\n"; // EOF
}

// ==================================================
// Execution block
// ==================================================

await writeFile(datasetFile, "", "utf8");

console.log(`Generating ${SETTINGS.productsSize} products`);

await pipeline(Readable.from(createProductsGenerator(), { objectMode: false }), createWriteStream(datasetFile, "utf8"));

console.log(`Success creating dataset!`);
console.log(`Output file: ${datasetFile}`);

process.exit(0);
