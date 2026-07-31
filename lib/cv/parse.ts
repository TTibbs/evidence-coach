import path from "node:path";
import mammoth from "mammoth";

let pdfWorkerConfigured = false;

async function loadPdfParse() {
  const { PDFParse } = await import("pdf-parse");

  if (!pdfWorkerConfigured) {
    // Next.js bundling breaks pdf.js's default worker resolution
    // ("Cannot find module '.../.next/.../pdf.worker.mjs'").
    const workerPath = path.join(
      process.cwd(),
      "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs",
    );
    PDFParse.setWorker(workerPath);
    pdfWorkerConfigured = true;
  }

  return PDFParse;
}

export async function extractTextFromFile(
  buffer: Buffer,
  filename: string,
): Promise<string> {
  const lower = filename.toLowerCase();

  if (lower.endsWith(".docx")) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (lower.endsWith(".pdf")) {
    const PDFParse = await loadPdfParse();
    // Copy bytes — pdf.js may transfer ownership of TypedArrays to the worker.
    const data = Uint8Array.from(buffer);
    const parser = new PDFParse({ data });
    try {
      const result = await parser.getText();
      return result.text;
    } finally {
      await parser.destroy().catch(() => undefined);
    }
  }

  throw new Error("Unsupported file type. Upload a PDF or DOCX.");
}
