import {
  Table,
  TableRow,
  TableCell,
  Paragraph,
  WidthType,
  BorderStyle,
  ShadingType,
} from "docx";
import { mapInlineContent } from "./mapInlineContent";

export function mapTableToDocx(block: any): Table {
  // BlockNote table content: { type: "tableContent", rows: [{ cells: [InlineContent[], ...] }] }
  const rows: { cells: any[][] }[] = block.content?.rows ?? [];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(
      (row, rowIndex) =>
        new TableRow({
          tableHeader: rowIndex === 0,
          children: (row.cells ?? []).map(
            (cell: any[]) =>
              new TableCell({
                children: [
                  new Paragraph({
                    children: mapInlineContent(cell),
                  }),
                ],
                shading:
                  rowIndex === 0
                    ? { type: ShadingType.CLEAR, color: "auto", fill: "F0F0F0" }
                    : undefined,
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
                  bottom: {
                    style: BorderStyle.SINGLE,
                    size: 1,
                    color: "CCCCCC",
                  },
                  left: {
                    style: BorderStyle.SINGLE,
                    size: 1,
                    color: "CCCCCC",
                  },
                  right: {
                    style: BorderStyle.SINGLE,
                    size: 1,
                    color: "CCCCCC",
                  },
                },
              }),
          ),
        }),
    ),
  });
}
