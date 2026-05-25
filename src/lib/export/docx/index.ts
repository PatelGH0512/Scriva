import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  LevelFormat,
  AlignmentType,
} from "docx";
import { saveAs } from "file-saver";
import type { Block } from "@blocknote/core";
import { mapBlocksToDocx } from "./mapBlocks";
import { filterExportableBlocks } from "../filterBlocks";
import { sanitizeFilename } from "../sanitizeFilename";

export async function exportToDocx(
  blocks: Block<any, any, any>[],
  title: string,
): Promise<void> {
  const exportableBlocks = filterExportableBlocks(blocks);
  const children = mapBlocksToDocx(exportableBlocks);

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: "default-numbering",
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL as any,
              text: "%1.",
              alignment: AlignmentType.LEFT as any,
            },
            {
              level: 1,
              format: LevelFormat.DECIMAL as any,
              text: "%2.",
              alignment: AlignmentType.LEFT as any,
            },
          ],
        },
      ],
    },
    styles: {
      default: {
        document: {
          run: { font: "Georgia", size: 24, color: "1A1A1A" },
          paragraph: { spacing: { line: 360 } },
        },
        heading1: {
          run: { font: "Georgia", size: 44, bold: true, color: "1A1A1A" },
        },
        heading2: {
          run: { font: "Georgia", size: 32, bold: true, color: "1A1A1A" },
        },
        heading3: {
          run: { font: "Georgia", size: 26, bold: true, color: "1A1A1A" },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, bottom: 1440, left: 1800, right: 1800 },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${sanitizeFilename(title)}.docx`);
}
