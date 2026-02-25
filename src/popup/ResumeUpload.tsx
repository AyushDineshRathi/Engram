import { useState, type ChangeEvent } from "react";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import workerSrc from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";

GlobalWorkerOptions.workerSrc = workerSrc;

type Status = "Idle" | "Extracting..." | "Done" | "Error extracting PDF";

export default function ResumeUpload() {
  const [status, setStatus] = useState<Status>("Idle");

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) return;

    setStatus("Extracting...");

    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;

      const pageTexts: string[] = [];

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item) => ("str" in item ? item.str : ""))
          .join(" ");
        pageTexts.push(pageText);
      }

      const fullText = pageTexts.join("\n").replace(/\s+/g, " ").trim();
      console.log(fullText);
      setStatus("Done");
    } catch (error) {
      console.error("Error extracting PDF:", error);
      setStatus("Error extracting PDF");
    } finally {
      event.target.value = "";
    }
  };

  return (
    <div>
      <h2>Upload Resume</h2>
      <label htmlFor="resume-upload">
        <input
          id="resume-upload"
          type="file"
          accept="application/pdf,.pdf"
          onChange={handleFileChange}
          disabled={status === "Extracting..."}
          title="Upload a PDF resume file"
        />
      </label>
      <p>{status}</p>
    </div>
  );
}
