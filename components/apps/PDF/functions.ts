import { type TextItem } from "pdfjs-dist/types/src/display/api";
import { PROGRAM_FILES_PATH } from "utils/constants";
import { loadFiles } from "utils/functions";

export const readPdfText = async (pdfDoc: Buffer): Promise<string> => {
  await loadFiles([`${PROGRAM_FILES_PATH}/PDF.js/pdf.js`]);

  let text = "";

  if (window.pdfjsLib) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = `${PROGRAM_FILES_PATH}/PDF.js/pdf.worker.js`;

    try {
      const doc = await window.pdfjsLib.getDocument(pdfDoc).promise;

      for (let p = 0; p < doc.numPages; p += 1) {
        // eslint-disable-next-line no-await-in-loop
        const content = await (await doc.getPage(p + 1)).getTextContent();

        text += content.items
          .map((item) => (item as TextItem).str || "")
          .filter(Boolean)
          .join(" ");
      }
    } catch {
      // Ignore failure to read PDF
    }
  }

  return text;
};
