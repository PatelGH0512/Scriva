"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useExport } from "@/hooks/useExport";
import type { ExportFormat } from "@/hooks/useExport";
import { FileText, FileOutput, Loader2, AlertCircle } from "lucide-react";

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  sessionTitle: string;
}

export function ExportDialog({
  open,
  onClose,
  sessionTitle,
}: ExportDialogProps) {
  const { handleExport, isExporting, exportError, canExport } = useExport();

  const onExport = async (format: ExportFormat) => {
    const success = await handleExport(format);
    if (success) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="w-full max-w-sm rounded-2xl border p-6"
        style={{
          backgroundColor: "var(--color-scriva-sidebar)",
          borderColor: "var(--border)",
        }}
      >
        <DialogTitle
          className="text-base font-semibold"
          style={{ color: "var(--foreground)" }}
        >
          Export Document
        </DialogTitle>
        <DialogDescription
          className="text-xs mt-0.5 truncate"
          style={{ color: "var(--muted-foreground)" }}
        >
          &ldquo;{sessionTitle}&rdquo;
        </DialogDescription>

        {!canExport && (
          <p
            className="text-xs mt-2"
            style={{ color: "var(--muted-foreground)" }}
          >
            Nothing to export yet. Add some notes first.
          </p>
        )}

        <div className="flex gap-3 mt-4">
          {(
            [
              {
                format: "docx" as ExportFormat,
                Icon: FileText,
                label: "DOCX",
                sub: "Word document · editable",
              },
              {
                format: "pdf" as ExportFormat,
                Icon: FileOutput,
                label: "PDF",
                sub: "PDF file · universal",
              },
            ] as const
          ).map(({ format, Icon, label, sub }) => (
            <button
              key={format}
              onClick={() => onExport(format)}
              disabled={isExporting || !canExport}
              className="flex flex-col items-center gap-2 flex-1 py-4 px-3 rounded-xl border transition-colors duration-150 disabled:opacity-40 hover:border-[var(--color-scriva-accent)] hover:bg-[rgba(13,148,136,0.06)]"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "rgba(255,255,255,0.02)",
              }}
            >
              {isExporting ? (
                <Loader2
                  className="animate-spin"
                  size={22}
                  style={{ color: "var(--color-scriva-accent)" }}
                />
              ) : (
                <Icon
                  size={22}
                  style={{ color: "var(--color-scriva-accent)" }}
                />
              )}
              <span
                className="text-sm font-semibold"
                style={{ color: "var(--foreground)" }}
              >
                {label}
              </span>
              <span
                className="text-[10px] text-center leading-tight"
                style={{ color: "var(--muted-foreground)" }}
              >
                {sub}
              </span>
            </button>
          ))}
        </div>

        {exportError && (
          <div
            className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg text-xs"
            style={{
              backgroundColor: "rgba(239,68,68,0.08)",
              color: "#f87171",
            }}
          >
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            {exportError}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
