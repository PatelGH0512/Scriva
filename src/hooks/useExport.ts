import { useState } from "react";
import { useWorkspaceStore } from "@/store/workspace";
import { exportToDocx } from "@/lib/export/docx";
import { exportToPdf } from "@/lib/export/pdf";
import { scrivaSchema } from "@/lib/blocknote-schema";
import type { Block } from "@blocknote/core";

export type ExportFormat = "docx" | "pdf";

export function useExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const { activeSessionId, sessions, documents } = useWorkspaceStore();

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const blocks = (
    documents[activeSessionId ?? ""] ?? []
  ) as Block<any, any, any>[];

  const handleExport = async (format: ExportFormat): Promise<boolean> => {
    if (!blocks || blocks.length === 0) {
      setExportError("Nothing to export yet.");
      return false;
    }

    setIsExporting(true);
    setExportError(null);

    const title = activeSession?.title ?? "Scriva Export";

    try {
      if (format === "docx") {
        await exportToDocx(blocks, title);
      } else {
        await exportToPdf(blocks, scrivaSchema, title);
      }
      return true;
    } catch (err) {
      console.error("Export failed:", err);
      setExportError("Export failed. Please try again.");
      return false;
    } finally {
      setIsExporting(false);
    }
  };

  const canExport = blocks.length > 0;

  return { handleExport, isExporting, exportError, canExport };
}
