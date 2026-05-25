"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useExport } from "@/hooks/useExport";
import { AlertTriangle, Loader2, CheckCircle2 } from "lucide-react";

interface DeleteWithExportDialogProps {
  open: boolean;
  sessionTitle: string;
  hasNotes: boolean;
  onDelete: () => void;
  onCancel: () => void;
}

export function DeleteWithExportDialog({
  open,
  sessionTitle,
  hasNotes,
  onDelete,
  onCancel,
}: DeleteWithExportDialogProps) {
  const { handleExport, isExporting } = useExport();
  const [exported, setExported] = useState(false);

  const onExport = async (format: "docx" | "pdf") => {
    const success = await handleExport(format);
    if (success) setExported(true);
  };

  return (
    <Dialog open={open}>
      <DialogContent
        className="w-full max-w-sm rounded-2xl border p-6"
        style={{
          backgroundColor: "var(--color-scriva-sidebar)",
          borderColor: "var(--border)",
        }}
      >
        {/* Icon + title row */}
        <div className="flex items-center gap-3 mb-1">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "rgba(239,68,68,0.1)" }}
          >
            <AlertTriangle className="w-4 h-4" style={{ color: "#f87171" }} />
          </div>
          <DialogTitle
            className="text-sm font-semibold leading-snug"
            style={{ color: "var(--foreground)" }}
          >
            Delete &ldquo;{sessionTitle}&rdquo;?
          </DialogTitle>
        </div>

        <DialogDescription
          className="text-xs"
          style={{ color: "var(--muted-foreground)" }}
        >
          This action cannot be undone.
        </DialogDescription>

        {/* Export offer — only if notes exist and not yet exported */}
        {hasNotes && !exported && (
          <div
            className="mt-4 p-3 rounded-xl border"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "rgba(255,255,255,0.02)",
            }}
          >
            <p
              className="text-xs mb-3"
              style={{ color: "var(--muted-foreground)" }}
            >
              This chat has notes. Save them before deleting?
            </p>
            <div className="flex gap-2">
              {(["docx", "pdf"] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => onExport(fmt)}
                  disabled={isExporting}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors duration-150 disabled:opacity-40 hover:border-[var(--color-scriva-accent)] hover:bg-[rgba(13,148,136,0.06)]"
                  style={{
                    borderColor: "var(--border)",
                    color: "var(--foreground)",
                  }}
                >
                  {isExporting ? (
                    <Loader2
                      className="w-3 h-3 animate-spin"
                      style={{ color: "var(--color-scriva-accent)" }}
                    />
                  ) : null}
                  Export {fmt.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Exported confirmation */}
        {exported && (
          <div
            className="mt-4 flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs"
            style={{
              backgroundColor: "rgba(13,148,136,0.08)",
              color: "var(--color-scriva-accent)",
            }}
          >
            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
            Document saved. Safe to delete.
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-lg border text-xs font-medium transition-colors duration-150 hover:bg-white/5"
            style={{
              borderColor: "var(--border)",
              color: "var(--muted-foreground)",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onDelete}
            className="flex-1 px-4 py-2 rounded-lg text-xs font-medium transition-colors duration-150 hover:opacity-90"
            style={{
              backgroundColor: "rgba(239,68,68,0.15)",
              color: "#f87171",
              border: "1px solid rgba(239,68,68,0.25)",
            }}
          >
            Delete chat
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
