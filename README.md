This repository contains code pertaining to my Medium article.

[How I made JavaScript search millions of rows fast](https://medium.com/@denis.kabana/how-i-made-javascript-search-millions-of-rows-fast-bda68c48fd91)

---

### Repository structure

```
-src/
  -backend/ A simple backend that serves faux data with pagination and can simulate delay
  -dataset/ Generated dataset, included in tracked files
  -frontend/ AdvancedClientSearch and a small vanilla JS frontend
  -scripts/ Node.js scripts - contains dataset generator
```

---

### Usage scripts

```
npm install

npm start # Starts server at localhost:3000 (also hosts frontend build)
npm run generate-products # Generates products; amount set in generateDataSet.ts
npm run build-frontend # Bundles the frontend so the backend can serve it
```
