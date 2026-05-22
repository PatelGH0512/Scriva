"use client";

import {
  Download,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  FileText,
} from "lucide-react";
import { useWorkspaceStore } from "@/store/workspace";

const TOOLBAR_ITEMS = [
  { icon: Bold, label: "Bold" },
  { icon: Italic, label: "Italic" },
  { icon: Underline, label: "Underline" },
];

const MOCK_BLOCKS: Record<
  string,
  {
    id: string;
    type: string;
    content?: string;
    items?: string[];
    contextLabel: string | null;
  }[]
> = {
  "session-1": [
    {
      id: "1",
      type: "heading",
      content: "Competitive Analysis — Thinking Tools",
      contextLabel: "from chat — May 22",
    },
    {
      id: "2",
      type: "paragraph",
      content:
        "A strong competitive analysis for a productivity tool should cover four dimensions: feature parity, positioning, pricing, and target audience.",
      contextLabel: "from chat — May 22",
    },
    {
      id: "3",
      type: "heading-2",
      content: "Key Dimensions",
      contextLabel: null,
    },
    {
      id: "4",
      type: "bullet",
      items: [
        "Direct Competitors — tools solving the exact same problem",
        "Indirect Competitors — tools users might use instead",
        "Feature Matrix — side-by-side comparison of key capabilities",
        "Positioning Map — where each product sits on key axes",
      ],
      contextLabel: "from chat — May 22",
    },
  ],
};

export default function NotepadPanel() {
  const { activeSessionId, sessions } = useWorkspaceStore();
  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const blocks = (activeSessionId ? MOCK_BLOCKS[activeSessionId] : null) ?? [];
  const hasContent = blocks.length > 0;

  return (
    <div
      className="flex flex-col h-full"
      style={{ backgroundColor: "var(--color-scriva-notepad)" }}
    >
      {/* Fixed Toolbar */}
      <div
        className="flex items-center justify-between px-4 h-14 flex-shrink-0 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-1">
          {/* Heading selectors */}
          {["H1", "H2", "H3"].map((h) => (
            <button
              key={h}
              className="px-2 py-1 rounded text-xs font-semibold transition-colors duration-150 hover:bg-white/5"
              style={{ color: "var(--muted-foreground)" }}
            >
              {h}
            </button>
          ))}

          <div
            className="w-px h-4 mx-1"
            style={{ backgroundColor: "var(--border)" }}
          />

          {/* Format buttons */}
          {TOOLBAR_ITEMS.map(({ icon: Icon, label }) => (
            <button
              key={label}
              className="p-1.5 rounded transition-colors duration-150 hover:bg-white/5"
              title={label}
            >
              <Icon
                className="w-3.5 h-3.5"
                style={{ color: "var(--muted-foreground)" }}
              />
            </button>
          ))}

          <div
            className="w-px h-4 mx-1"
            style={{ backgroundColor: "var(--border)" }}
          />

          {/* Font size */}
          <button
            className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors duration-150 hover:bg-white/5"
            style={{ color: "var(--muted-foreground)" }}
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Export button */}
        <button
          className="p-1.5 rounded-md transition-colors duration-150 hover:bg-white/5"
          title="Export document"
        >
          <Download
            className="w-4 h-4"
            style={{ color: "var(--muted-foreground)" }}
          />
        </button>
      </div>

      {/* Document area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-8 py-10">
          {!hasContent && (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "rgba(13, 148, 136, 0.08)" }}
              >
                <FileText
                  className="w-5 h-5"
                  style={{ color: "var(--color-scriva-accent)" }}
                />
              </div>
              <div className="text-center">
                <p
                  className="text-sm font-medium mb-1"
                  style={{
                    color: "var(--foreground)",
                    fontFamily: "var(--font-lora)",
                  }}
                >
                  {activeSession?.title ?? "Untitled"}
                </p>
                <p
                  className="text-xs"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Append from chat to start building your document
                </p>
              </div>
            </div>
          )}
          {blocks.map((block) => (
            <div key={block.id} className="mb-5 group/block">
              {/* Context label */}
              {block.contextLabel && (
                <p
                  className="text-[10px] mb-1 font-medium tracking-wide"
                  style={{ color: "var(--muted-foreground)", opacity: 0.5 }}
                >
                  {block.contextLabel}
                </p>
              )}

              {/* Block content */}
              {block.type === "heading" && (
                <h1
                  className="text-2xl font-bold leading-tight mb-1"
                  style={{
                    color: "var(--foreground)",
                    fontFamily: "var(--font-lora)",
                  }}
                >
                  {block.content}
                </h1>
              )}

              {block.type === "heading-2" && (
                <h2
                  className="text-lg font-semibold leading-snug mb-1"
                  style={{
                    color: "var(--foreground)",
                    fontFamily: "var(--font-lora)",
                  }}
                >
                  {block.content}
                </h2>
              )}

              {block.type === "paragraph" && (
                <p
                  className="text-sm leading-7"
                  style={{
                    color: "var(--foreground)",
                    fontFamily: "var(--font-lora)",
                  }}
                >
                  {block.content}
                </p>
              )}

              {block.type === "bullet" && block.items && (
                <ul
                  className="space-y-1.5 pl-4"
                  style={{ fontFamily: "var(--font-lora)" }}
                >
                  {block.items.map((item, i) => (
                    <li
                      key={i}
                      className="text-sm leading-6 list-disc"
                      style={{ color: "var(--foreground)" }}
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          {/* Empty state cursor */}
          <div
            className="mt-4 text-sm opacity-30"
            style={{
              color: "var(--muted-foreground)",
              fontFamily: "var(--font-lora)",
            }}
          >
            Continue writing...
          </div>
        </div>
      </div>
    </div>
  );
}
