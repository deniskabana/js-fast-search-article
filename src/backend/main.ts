import express from "express";
import { type Product } from "./types.ts";
import { datasetFile, frontendPath } from "./constants.ts";
import { readFile } from "node:fs/promises";

const app = express();
const port = 3000;

app.use(express.json());

const products: Product[] = JSON.parse(await readFile(datasetFile, "utf8"));

app.use(express.static(frontendPath));

app.get("/products", async (req, res, _next) => {
  const page = req.query.page ? parseInt("" + req.query.page) : 0;
  const limit = req.query.limit ? parseInt("" + req.query.limit) : 10_000_000;
  const simulateLatency = req.query.simulateLatency === "true";
  const start = (page - 1) * limit;

  res.setHeader("Access-Control-Allow-Origin", "*");

  // NOTE: Simulated latency 100 ~ 200 ms
  if (simulateLatency) await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 100));

  res.set("X-Total-Count", String(products.length)).json(products.slice(start, start + limit));
});

app.listen(port, () => console.log(`Server running on port ${port}`));
