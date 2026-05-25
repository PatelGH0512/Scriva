import {
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  ShadingType,
} from "docx";
import type { Block } from "@blocknote/core";
import { mapInlineContent } from "./mapInlineContent";
import { mapTableToDocx } from "./mapTable";

const ALIGNMENT_MAP: Record<string, string> = {
  left: AlignmentType.LEFT,
  center: AlignmentType.CENTER,
  right: AlignmentType.RIGHT,
  justify: AlignmentType.JUSTIFIED,
};

export function mapBlocksToDocx(
  blocks: Block<any, any, any>[],
  depth = 0,
): any[] {
  return blocks.flatMap((block) => {
    const elements = mapSingleBlock(block, depth);

    if (block.children && block.children.length > 0) {
      const childElements = mapBlocksToDocx(
        block.children as Block<any, any, any>[],
        depth + 1,
      );
      return [...elements, ...childElements];
    }

    return elements;
  });
}

function mapSingleBlock(block: Block<any, any, any>, depth: number): any[] {
  const alignment = (
    ALIGNMENT_MAP[(block.props as any)?.textAlignment] ?? AlignmentType.LEFT
  ) as any;
  const indent = depth > 0 ? { left: depth * 360 } : undefined;

  switch (block.type) {
    case "heading": {
      const headingLevels: Record<number, string> = {
        1: HeadingLevel.HEADING_1,
        2: HeadingLevel.HEADING_2,
        3: HeadingLevel.HEADING_3,
      };
      return [
        new Paragraph({
          children: mapInlineContent(block.content),
          heading: (
            headingLevels[(block.props as any).level] ?? HeadingLevel.HEADING_1
          ) as any,
          alignment,
          spacing: { before: 280, after: 120 },
        }),
      ];
    }

    case "paragraph":
      return [
        new Paragraph({
          children: mapInlineContent(block.content),
          alignment,
          indent,
          spacing: { before: 0, after: 160 },
        }),
      ];

    case "bulletListItem":
      return [
        new Paragraph({
          children: mapInlineContent(block.content),
          bullet: { level: depth },
          alignment,
          spacing: { before: 0, after: 80 },
        }),
      ];

    case "numberedListItem":
      return [
        new Paragraph({
          children: mapInlineContent(block.content),
          numbering: { reference: "default-numbering", level: depth },
          alignment,
          spacing: { before: 0, after: 80 },
        }),
      ];

    case "checkListItem":
      return [
        new Paragraph({
          children: [
            new TextRun({
              text: (block.props as any)?.checked ? "☑ " : "☐ ",
              font: "Georgia",
              size: 24,
            }),
            ...mapInlineContent(block.content),
          ],
          spacing: { before: 0, after: 80 },
        }),
      ];

    case "quote":
      return [
        new Paragraph({
          children: mapInlineContent(block.content),
          border: {
            left: { style: BorderStyle.SINGLE, size: 6, color: "0D9488" },
          },
          indent: { left: 720 },
          spacing: { before: 160, after: 160 },
        }),
      ];

    case "divider":
      return [
        new Paragraph({
          children: [new TextRun({ text: "" })],
          border: {
            bottom: { style: BorderStyle.SINGLE, size: 2, color: "E5E5E5" },
          },
          spacing: { before: 200, after: 200 },
        }),
      ];

    case "table":
      return [mapTableToDocx(block)];

    case "codeBlock":
      return [
        new Paragraph({
          children: [
            new TextRun({
              text:
                typeof block.content === "string"
                  ? block.content
                  : (block.content as any[]).map((c: any) => c.text).join(""),
              font: "Courier New",
              size: 20,
              color: "3A3A3A",
            }),
          ],
          shading: {
            type: ShadingType.CLEAR,
            color: "auto",
            fill: "F4F4F4",
          },
          border: {
            top: { style: BorderStyle.SINGLE, size: 1, color: "E5E5E5" },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: "E5E5E5" },
            left: { style: BorderStyle.SINGLE, size: 1, color: "E5E5E5" },
            right: { style: BorderStyle.SINGLE, size: 1, color: "E5E5E5" },
          },
          spacing: { before: 120, after: 120 },
        }),
      ];

    case "image":
      return [
        new Paragraph({
          children: [
            new TextRun({
              text: `[Image${(block.props as any)?.caption ? ": " + (block.props as any).caption : ""}]`,
              italics: true,
              color: "8A8A93",
            }),
          ],
        }),
      ];

    case "video":
    case "audio":
    case "file":
      return [
        new Paragraph({
          children: [
            new TextRun({
              text: `[${block.type.charAt(0).toUpperCase() + block.type.slice(1)}: ${(block.props as any)?.url || "embedded media"}]`,
              italics: true,
              color: "8A8A93",
            }),
          ],
        }),
      ];

    case "annotated":
      return []; // NEVER export — Scriva app artifact

    default:
      return [
        new Paragraph({
          children: [
            new TextRun({
              text:
                typeof block.content === "string" ? block.content : "",
            }),
          ],
        }),
      ];
  }
}
