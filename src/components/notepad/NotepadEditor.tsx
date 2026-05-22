"use client";

import "@blocknote/react/style.css";
import { useEffect } from "react";
import { BlockNoteViewRaw, useCreateBlockNote } from "@blocknote/react";
import { scrivaSchema } from "@/lib/blocknote-schema";
import { useWorkspaceStore } from "@/store/workspace";
import { smartParseForAppend } from "@/lib/markdown-to-blocks";
import type { BlockNoteEditor, PartialBlock } from "@blocknote/core";
import type { ScrivaSchema } from "@/lib/blocknote-schema";

type ScrivaEditor = BlockNoteEditor<
  ScrivaSchema["blockSchema"],
  ScrivaSchema["inlineContentSchema"],
  ScrivaSchema["styleSchema"]
>;

interface NotepadEditorProps {
  sessionId: string;
  onEditorReady: (editor: ScrivaEditor) => void;
}

export default function NotepadEditor({
  sessionId,
  onEditorReady,
}: NotepadEditorProps) {
  const {
    documents,
    saveDocument,
    pendingAppend,
    clearPendingAppend,
    setHasNotes,
  } = useWorkspaceStore();

  const savedBlocks = documents[sessionId];

  const editor = useCreateBlockNote({
    schema: scrivaSchema,
    initialContent: savedBlocks as PartialBlock[] | undefined,
    defaultStyles: false,
    domAttributes: {
      editor: { class: "scriva-bn-inner" },
    },
  });

  useEffect(() => {
    onEditorReady(editor);
  }, [editor, onEditorReady]);

  useEffect(() => {
    if (!pendingAppend || pendingAppend.sessionId !== sessionId) return;

    const blocks = editor.document;
    const lastBlock = blocks[blocks.length - 1];

    // Smart parse: convert markdown to structured BlockNote blocks
    const parsedBlocks = smartParseForAppend(
      pendingAppend.content,
      pendingAppend.contextLabel,
    );

    editor.insertBlocks(parsedBlocks as PartialBlock[], lastBlock, "after");

    setHasNotes(sessionId, true);
    clearPendingAppend();
  }, [pendingAppend, sessionId, editor, clearPendingAppend, setHasNotes]);

  return (
    <BlockNoteViewRaw
      editor={editor}
      theme="dark"
      onChange={() => {
        saveDocument(sessionId, editor.document as unknown[]);
      }}
      className="scriva-bn-view"
    />
  );
}
