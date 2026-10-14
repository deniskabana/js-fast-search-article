This repository contains code pertaining to my Medium article.

**TBD: Add article link and title here**

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
