import path from "node:path";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

import { ingestResume } from "./ingestResume";

async function extractPdfText(pdfPath: string): Promise<string> {
  const bytes = await readFile(pdfPath);
  const loadingTask = getDocument({ data: new Uint8Array(bytes) });
  const pdf = await loadingTask.promise;

  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .trim();

    if (pageText.length > 0) {
      pages.push(pageText);
    }
  }

  return pages.join("\n").replace(/\s+/g, " ").trim();
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../config/env/.env") });

if (!("indexedDB" in globalThis)) {
  throw new Error(
    "IndexedDB is not available in this runtime. Run this script in a browser-like environment."
  );
}

const pdfPath = path.join(__dirname, "../../resume.pdf");
const extractedText = await extractPdfText(pdfPath);

await ingestResume({
  fileName: "resume.pdf",
  rawText: extractedText,
});
