/**
 * Parses markdown text into BlockNote-compatible block structures.
 * Supports: headings (h1-h3), bullet lists, numbered lists, paragraphs.
 * Bold (**text**) and italic (*text*) are converted to inline styles.
 */

export interface TableRow {
  cells: InlineContent[][];
}

export interface ParsedTableData {
  rows: TableRow[];
  headerRows?: number;
}

export interface ParsedBlock {
  type: "heading" | "bulletListItem" | "numberedListItem" | "paragraph" | "annotated" | "codeBlock" | "table";
  props?: Record<string, unknown>;
  content: string | InlineContent[];
  tableData?: ParsedTableData;
}

export interface InlineContent {
  type: "text";
  text: string;
  styles?: {
    bold?: true;
    italic?: true;
  };
}

/**
 * Parse inline markdown (bold, italic) into BlockNote inline content array
 */
function parseInlineContent(text: string): InlineContent[] {
  const result: InlineContent[] = [];
  
  // Regex to match **bold**, *italic*, or plain text
  // Order matters: check bold first (** before *)
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|([^*]+)/g;
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    if (match[2]) {
      // Bold: **text**
      result.push({ type: "text", text: match[2], styles: { bold: true } });
    } else if (match[4]) {
      // Italic: *text*
      result.push({ type: "text", text: match[4], styles: { italic: true } });
    } else if (match[5]) {
      // Plain text
      const plainText = match[5];
      if (plainText.trim()) {
        result.push({ type: "text", text: plainText });
      } else if (plainText) {
        // Preserve whitespace-only segments
        result.push({ type: "text", text: plainText });
      }
    }
  }
  
  // If no matches, return the original text
  if (result.length === 0 && text.trim()) {
    result.push({ type: "text", text });
  }
  
  return result;
}

/**
 * Check if a line is a markdown table separator row (|---|---|)
 */
function isSeparatorRow(line: string): boolean {
  const cells = line.trim().replace(/^\|?|\|?$/g, "").split("|");
  return cells.length > 0 && cells.every((cell) => /^\s*:?-+:?\s*$/.test(cell));
}

/**
 * Parse a markdown table row into an array of InlineContent arrays (one per cell)
 */
function parseTableRow(line: string): InlineContent[][] {
  const trimmed = line.trim().replace(/^\|?|\|?$/g, "");
  const cells = trimmed.split("|");
  return cells.map((cell) => parseInlineContent(cell.trim()) || [{ type: "text", text: cell.trim() }]);
}

/**
 * Parse a single line of markdown into a block
 */
function parseLine(line: string): ParsedBlock | null {
  const trimmed = line.trim();
  
  if (!trimmed) return null;
  
  // Heading 1: # text
  if (trimmed.startsWith("# ")) {
    return {
      type: "heading",
      props: { level: 1 },
      content: parseInlineContent(trimmed.slice(2)),
    };
  }
  
  // Heading 2: ## text
  if (trimmed.startsWith("## ")) {
    return {
      type: "heading",
      props: { level: 2 },
      content: parseInlineContent(trimmed.slice(3)),
    };
  }
  
  // Heading 3: ### text
  if (trimmed.startsWith("### ")) {
    return {
      type: "heading",
      props: { level: 3 },
      content: parseInlineContent(trimmed.slice(4)),
    };
  }
  
  // Bullet list: - text or * text (but not bold **)
  if (/^[-*]\s+/.test(trimmed) && !trimmed.startsWith("**")) {
    const content = trimmed.replace(/^[-*]\s+/, "");
    return {
      type: "bulletListItem",
      content: parseInlineContent(content),
    };
  }
  
  // Numbered list: 1. text, 2. text, etc.
  if (/^\d+\.\s+/.test(trimmed)) {
    const content = trimmed.replace(/^\d+\.\s+/, "");
    return {
      type: "numberedListItem",
      content: parseInlineContent(content),
    };
  }
  
  // Default: paragraph
  return {
    type: "paragraph",
    content: parseInlineContent(trimmed),
  };
}

/**
 * Parse full markdown text into an array of BlockNote blocks
 */
export function parseMarkdownToBlocks(markdown: string): ParsedBlock[] {
  const lines = markdown.split("\n");
  const blocks: ParsedBlock[] = [];
  let currentParagraph: string[] = [];
  let inCodeBlock = false;
  let codeLanguage = "";
  let codeLines: string[] = [];
  let tableLines: string[] = [];
  
  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const text = currentParagraph.join(" ").trim();
      if (text) {
        blocks.push({
          type: "paragraph",
          content: parseInlineContent(text),
        });
      }
      currentParagraph = [];
    }
  };

  const flushCodeBlock = () => {
    const code = codeLines.join("\n");
    blocks.push({
      type: "codeBlock",
      props: { language: codeLanguage || "text" },
      content: [{ type: "text", text: code }],
    });
    codeLines = [];
    codeLanguage = "";
  };

  const flushTableBlock = () => {
    if (tableLines.length === 0) return;
    const sepIndex = tableLines.findIndex((l) => isSeparatorRow(l));
    let allDataLines: string[];
    let headerRows: number | undefined;
    if (sepIndex > 0) {
      const headerLines = tableLines.slice(0, sepIndex);
      const bodyLines = tableLines.slice(sepIndex + 1);
      allDataLines = [...headerLines, ...bodyLines];
      headerRows = headerLines.length;
    } else {
      allDataLines = tableLines;
    }
    blocks.push({
      type: "table",
      content: [],
      tableData: {
        rows: allDataLines.map((l) => ({ cells: parseTableRow(l) })),
        headerRows,
      },
    });
    tableLines = [];
  };
  
  for (const line of lines) {
    const trimmed = line.trim();

    // Detect markdown table rows (lines starting with |)
    const isTableRow = trimmed.startsWith("|") || (tableLines.length > 0 && /^\|/.test(trimmed));
    if (isTableRow && !inCodeBlock) {
      flushParagraph();
      tableLines.push(line);
      continue;
    } else if (tableLines.length > 0 && !isTableRow) {
      flushTableBlock();
    }

    // Detect fenced code block start/end (``` or ~~~)
    if (/^(`{3,}|~{3,})/.test(trimmed)) {
      if (!inCodeBlock) {
        flushParagraph();
        inCodeBlock = true;
        // Extract language tag after the backticks
        codeLanguage = trimmed.replace(/^(`{3,}|~{3,})/, "").trim();
      } else {
        inCodeBlock = false;
        flushCodeBlock();
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }
    
    // Empty line: flush current paragraph
    if (!trimmed) {
      flushParagraph();
      continue;
    }
    
    // Check if this is a special block (heading, list)
    const isHeading = /^#{1,3}\s/.test(trimmed);
    const isBullet = /^[-*]\s+/.test(trimmed) && !trimmed.startsWith("**");
    const isNumbered = /^\d+\.\s+/.test(trimmed);
    
    if (isHeading || isBullet || isNumbered) {
      flushParagraph();
      const block = parseLine(trimmed);
      if (block) blocks.push(block);
    } else {
      // Accumulate paragraph lines
      currentParagraph.push(trimmed);
    }
  }

  // Handle unclosed code block
  if (inCodeBlock && codeLines.length > 0) {
    flushCodeBlock();
  }

  // Handle trailing table
  if (tableLines.length > 0) {
    flushTableBlock();
  }
  
  // Flush any remaining paragraph
  flushParagraph();
  
  return blocks;
}

/**
 * Convert parsed blocks to BlockNote format with annotated wrapper
 */
export function toAnnotatedBlocks(
  markdown: string,
  contextLabel: string
): unknown[] {
  const parsed = parseMarkdownToBlocks(markdown);
  
  if (parsed.length === 0) {
    // Fallback: single annotated block with raw content
    return [
      {
        type: "annotated",
        props: {
          contextLabel,
          appendedAt: new Date().toISOString(),
        },
        content: markdown.trim(),
      },
    ];
  }
  
  // For single paragraph, wrap in annotated block
  if (parsed.length === 1 && parsed[0].type === "paragraph") {
    return [
      {
        type: "annotated",
        props: {
          contextLabel,
          appendedAt: new Date().toISOString(),
        },
        content: parsed[0].content,
      },
    ];
  }
  
  // For structured content, add context label to first block only
  // and return all blocks as native BlockNote types
  return parsed.map((block, index) => {
    if (index === 0) {
      // First block gets the context label as an annotated block
      return {
        type: "annotated",
        props: {
          contextLabel,
          appendedAt: new Date().toISOString(),
        },
        content: typeof block.content === "string" ? block.content : block.content,
      };
    }
    
    // Subsequent blocks are native BlockNote blocks
    return {
      type: block.type,
      props: block.props ?? {},
      content: block.content,
    };
  });
}

/**
 * Smart append: parse markdown and return structured blocks
 * This preserves headings, lists, and formatting from AI responses
 */
export function smartParseForAppend(
  markdown: string,
  contextLabel: string
): unknown[] {
  const parsed = parseMarkdownToBlocks(markdown);
  
  if (parsed.length === 0) {
    return [
      {
        type: "annotated",
        props: { contextLabel, appendedAt: new Date().toISOString() },
        content: markdown.trim(),
      },
    ];
  }
  
  const blocks: unknown[] = [];
  
  // Add a small header annotation block first
  blocks.push({
    type: "annotated",
    props: { contextLabel, appendedAt: new Date().toISOString() },
    content: [{ type: "text", text: "" }], // Empty content, just the label
  });
  
  // Then add all parsed blocks as native types
  for (const block of parsed) {
    if (block.type === "table" && block.tableData) {
      blocks.push({
        type: "table",
        content: {
          type: "tableContent",
          rows: block.tableData.rows.map((row) => ({ cells: row.cells })),
          ...(block.tableData.headerRows !== undefined
            ? { headerRows: block.tableData.headerRows }
            : {}),
        },
      });
    } else {
      blocks.push({
        type: block.type,
        props: block.props ?? {},
        content: block.content,
      });
    }
  }
  
  return blocks;
}
