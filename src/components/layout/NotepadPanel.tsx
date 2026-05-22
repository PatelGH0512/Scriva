"use client";

import { useState, useCallback, useRef } from "react";
import { Download, Bold, Italic, Underline } from "lucide-react";
import { useWorkspaceStore } from "@/store/workspace";
import dynamic from "next/dynamic";
import type { BlockNoteEditor } from "@blocknote/core";
import SelectionToolbar from "@/components/notepad/SelectionToolbar";

const NotepadEditor = dynamic(
  () => import("@/components/notepad/NotepadEditor"),
  {
    ssr: false,
    loading: () => null,
  },
);

export default function NotepadPanel() {
  const { activeSessionId } = useWorkspaceStore();
  const [editor, setEditor] = useState<BlockNoteEditor<any, any, any> | null>(
    null,
  );
  const editorContainerRef = useRef<HTMLDivElement>(null);

  const handleEditorReady = useCallback(
    (ed: BlockNoteEditor<any, any, any>) => {
      setEditor(ed);
    },
    [],
  );

  const handleHeading = (level: 1 | 2 | 3) => {
    if (!editor) return;
    try {
      const currentBlock = editor.getTextCursorPosition().block;
      editor.updateBlock(currentBlock, { type: "heading", props: { level } });
    } catch {
      const blocks = editor.document;
      editor.insertBlocks(
        [{ type: "heading", props: { level }, content: "" }],
        blocks[blocks.length - 1],
        "after",
      );
    }
    editor.focus();
  };

  const handleStyle = (style: "bold" | "italic" | "underline") => {
    if (!editor) return;
    editor.toggleStyles({ [style]: true });
    editor.focus();
  };

  if (!activeSessionId) {
    return (
      <div
        className="flex flex-col h-full items-center justify-center"
        style={{ backgroundColor: "var(--color-scriva-notepad)" }}
      >
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          No session selected
        </p>
      </div>
    );
  }

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
          {([1, 2, 3] as const).map((level) => (
            <button
              key={level}
              onClick={() => handleHeading(level)}
              className="px-2 py-1 rounded text-xs font-semibold transition-colors duration-150 hover:bg-white/5"
              style={{ color: "var(--muted-foreground)" }}
              title={`Heading ${level}`}
            >
              H{level}
            </button>
          ))}

          <div
            className="w-px h-4 mx-1"
            style={{ backgroundColor: "var(--border)" }}
          />

          {[
            { icon: Bold, style: "bold" as const, label: "Bold" },
            { icon: Italic, style: "italic" as const, label: "Italic" },
            {
              icon: Underline,
              style: "underline" as const,
              label: "Underline",
            },
          ].map(({ icon: Icon, style, label }) => (
            <button
              key={style}
              onClick={() => handleStyle(style)}
              className="p-1.5 rounded transition-colors duration-150 hover:bg-white/5"
              title={label}
            >
              <Icon
                className="w-3.5 h-3.5"
                style={{ color: "var(--muted-foreground)" }}
              />
            </button>
          ))}
        </div>

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

      {/* BlockNote Editor */}
      <div
        ref={editorContainerRef}
        className="flex-1 overflow-y-auto scriva-editor-scroll relative"
      >
        <NotepadEditor
          key={activeSessionId}
          sessionId={activeSessionId}
          onEditorReady={handleEditorReady}
        />
        <SelectionToolbar editorRef={editorContainerRef.current} />
      </div>
    </div>
  );
}
