import fs from "node:fs";
import path from "node:path";

// Ensure public directory exists
const publicDir = path.join(process.cwd(), "public");
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Copy PDF.js worker
const pdfjsDistPath = path.dirname(
  path.resolve("node_modules/pdfjs-dist/package.json")
);
const pdfjsWorkerPath = path.join(pdfjsDistPath, "build", "pdf.worker.min.js");
const cMapsDir = path.join(pdfjsDistPath, "cmaps");
const publicCMapsDir = path.join(publicDir, "cmaps");

if (fs.existsSync(pdfjsWorkerPath)) {
  fs.copyFileSync(pdfjsWorkerPath, path.join(publicDir, "pdf.worker.min.js"));
  console.log("PDF.js worker copied successfully");
} else {
  console.error("PDF.js worker file not found at:", pdfjsWorkerPath);
  process.exit(1);
}

// Copy cMaps
if (fs.existsSync(cMapsDir)) {
  if (!fs.existsSync(publicCMapsDir)) {
    fs.mkdirSync(publicCMapsDir, { recursive: true });
  }
  fs.cpSync(cMapsDir, publicCMapsDir, { recursive: true });
  console.log("PDF.js cMaps copied successfully");
} else {
  console.error("PDF.js cMaps directory not found at:", cMapsDir);
  process.exit(1);
}
