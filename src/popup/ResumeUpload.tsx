import { useState, type ChangeEvent } from "react";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import workerSrc from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";
import { ingestResume } from "../memory/ingestResume";

GlobalWorkerOptions.workerSrc = workerSrc;

type Status =
  | "Idle"
  | "Processing resume..."
  | "Resume stored successfully."
  | "Resume already ingested."
  | "Error storing resume.";

export default function ResumeUpload() {
  const [status, setStatus] = useState<Status>("Idle");

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) return;

    setStatus("Processing resume...");

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

      try {
        await ingestResume({
          fileName: file.name,
          rawText: fullText,
        });
        setStatus("Resume stored successfully.");
      } catch (error) {
        const message = error instanceof Error ? error.message.toLowerCase() : "";
        if (message.includes("already")) {
          setStatus("Resume already ingested.");
        } else {
          setStatus("Error storing resume.");
        }
      }
    } catch (error) {
      setStatus("Error storing resume.");
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
          disabled={status === "Processing resume..."}
          title="Upload a PDF resume file"
        />
      </label>
      <p>{status}</p>
    </div>
  );
}
