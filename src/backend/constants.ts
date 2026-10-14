import path from "node:path";
import { fileURLToPath } from "node:url";

export const datasetFile = path.join(path.dirname(fileURLToPath(import.meta.url)), "../dataset/", "DEMO_DATASET.json");
export const frontendPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "../frontend/dist/");
