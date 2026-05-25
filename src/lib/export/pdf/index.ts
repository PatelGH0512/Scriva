import { PDFExporter } from "@blocknote/xl-pdf-exporter";
import { pdf } from "@react-pdf/renderer";
import type { Block, BlockNoteSchema } from "@blocknote/core";
import { scrivaPDFMappings } from "./customMappings";
import { filterExportableBlocks } from "../filterBlocks";
import { sanitizeFilename } from "../sanitizeFilename";

export async function exportToPdf(
  blocks: Block<any, any, any>[],
  schema: BlockNoteSchema<any, any, any>,
  title: string,
): Promise<void> {
  const exportableBlocks = filterExportableBlocks(blocks);

  const exporter = new PDFExporter(schema, scrivaPDFMappings as any);

  const pdfDocument = await exporter.toReactPDFDocument(
    exportableBlocks,
    {
      // No header or footer — clean document, no Scriva branding
      // Respects the "no AI fingerprints" export contract
    },
  );

  const blob = await pdf(pdfDocument).toBlob();

  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.download = `${sanitizeFilename(title)}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(link.href);
}
