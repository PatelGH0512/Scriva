"use client";

import { AlertTriangle, Download, Trash2, X } from "lucide-react";

interface DeleteSessionDialogProps {
  sessionTitle: string;
  hasNotes: boolean;
  onExportAndDelete: (format: "pdf" | "docx") => void;
  onDeleteAnyway: () => void;
  onCancel: () => void;
}

export default function DeleteSessionDialog({
  sessionTitle,
  hasNotes,
  onExportAndDelete,
  onDeleteAnyway,
  onCancel,
}: DeleteSessionDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div
        className="relative w-full max-w-md mx-4 rounded-xl border shadow-2xl"
        style={{
          backgroundColor: "var(--popover)",
          borderColor: "var(--border)",
        }}
      >
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1 rounded-md transition-colors hover:bg-white/5"
        >
          <X className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
        </button>

        <div className="p-6">
          {/* Icon + Title */}
          <div className="flex items-start gap-3 mb-4">
            <div
              className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center mt-0.5"
              style={{ backgroundColor: "rgba(239, 68, 68, 0.12)" }}
            >
              <Trash2 className="w-4 h-4" style={{ color: "#EF4444" }} />
            </div>
            <div>
              <h2
                className="text-base font-semibold mb-1"
                style={{ color: "var(--foreground)" }}
              >
                Delete Chat
              </h2>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--muted-foreground)" }}
              >
                <span
                  className="font-medium"
                  style={{ color: "var(--foreground)" }}
                >
                  &quot;{sessionTitle}&quot;
                </span>{" "}
                will be permanently deleted.
              </p>
            </div>
          </div>

          {/* Warning — only shown if there are notes */}
          {hasNotes && (
            <div
              className="flex items-start gap-2.5 px-3.5 py-3 rounded-lg mb-5"
              style={{
                backgroundColor: "rgba(245, 158, 11, 0.08)",
                border: "1px solid rgba(245, 158, 11, 0.2)",
              }}
            >
              <AlertTriangle
                className="w-4 h-4 flex-shrink-0 mt-0.5"
                style={{ color: "#F59E0B" }}
              />
              <p className="text-sm" style={{ color: "#F59E0B" }}>
                This session has notepad content that will also be lost. Export
                your document before deleting.
              </p>
            </div>
          )}

          {/* Export options — only shown if there are notes */}
          {hasNotes && (
            <div className="mb-4">
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ color: "var(--muted-foreground)" }}
              >
                Export before deleting
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onExportAndDelete("docx")}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors duration-150 hover:bg-white/5"
                  style={{
                    borderColor: "var(--border)",
                    color: "var(--foreground)",
                  }}
                >
                  <Download className="w-3.5 h-3.5" />
                  Export as DOCX
                </button>
                <button
                  onClick={() => onExportAndDelete("pdf")}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors duration-150 hover:bg-white/5"
                  style={{
                    borderColor: "var(--border)",
                    color: "var(--foreground)",
                  }}
                >
                  <Download className="w-3.5 h-3.5" />
                  Export as PDF
                </button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors duration-150 hover:bg-white/5"
              style={{
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
            >
              Cancel
            </button>
            <button
              onClick={onDeleteAnyway}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150"
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.15)",
                color: "#EF4444",
                border: "1px solid rgba(239, 68, 68, 0.25)",
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
