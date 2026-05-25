import { TextRun } from "docx";

function textRunsFromContent(content: any[]): TextRun[] {
  return content.flatMap((item: any): TextRun[] => {
    if (item.type === "text") {
      const styles = item.styles ?? {};
      return [
        new TextRun({
          text: item.text ?? "",
          bold: styles.bold === true,
          italics: styles.italic === true,
          underline: styles.underline === true ? {} : undefined,
          strike: styles.strike === true,
          font: styles.code === true ? "Courier New" : undefined,
          size: styles.code === true ? 20 : undefined,
          color:
            styles.textColor && styles.textColor !== "default"
              ? styles.textColor
              : undefined,
        }),
      ];
    }

    if (item.type === "link") {
      const linkText = Array.isArray(item.content)
        ? item.content.map((c: any) => c.text ?? "").join("")
        : item.href ?? "";
      return [
        new TextRun({
          text: linkText,
          style: "Hyperlink",
        }),
      ];
    }

    return [];
  });
}

export function mapInlineContent(content: unknown): TextRun[] {
  if (!content || !Array.isArray(content)) return [];
  return textRunsFromContent(content);
}
