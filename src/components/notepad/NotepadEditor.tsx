"use client";

import "@blocknote/react/style.css";
import "@blocknote/shadcn/style.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BlockNoteView } from "@blocknote/shadcn";
import {
  useCreateBlockNote,
  useBlockNoteEditor,
  useEditorState,
  SideMenuController,
  SideMenu,
  DragHandleMenu,
  RemoveBlockItem,
  BlockColorsItem,
  SuggestionMenuController,
  getDefaultReactSlashMenuItems,
  FormattingToolbarController,
  FormattingToolbar,
  getFormattingToolbarItems,
} from "@blocknote/react";
import type { DefaultReactSuggestionItem } from "@blocknote/react";
import { filterSuggestionItems } from "@blocknote/core/extensions";
import { scrivaSchema } from "@/lib/blocknote-schema";
import { useWorkspaceStore } from "@/store/workspace";
import { useThemeStore } from "@/store/theme";
import { smartParseForAppend } from "@/lib/markdown-to-blocks";
import type { BlockNoteEditor, PartialBlock } from "@blocknote/core";
import type { ScrivaSchema } from "@/lib/blocknote-schema";
import { Sparkles, ChevronDown } from "lucide-react";
import { SKILL_NAMES, SKILL_DESCRIPTIONS, SKILL_ORDER } from "@/lib/skills";
import { SendToChatItem } from "./SendToChatItem";

function extractBlockText(block: any): string {
  if (!block) return "";
  const content = block.content;
  if (!content) return "";
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((item: any) => {
        if (!item) return "";
        if (item.type === "text") return item.text ?? "";
        if (item.type === "link" && Array.isArray(item.content))
          return item.content.map((c: any) => c.text ?? "").join("");
        return "";
      })
      .join("");
  }
  return "";
}

function ScrivaSkillsButton() {
  const editor = useBlockNoteEditor<any, any, any>();
  const { activeSessionId, setPendingChatPrompt } = useWorkspaceStore();
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedText = useEditorState({
    editor,
    selector: ({ editor }) => editor.getSelectedText(),
    on: "selection",
  });

  const handleOpen = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 4, left: rect.left });
    }
    setOpen((o) => !o);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        !buttonRef.current?.contains(e.target as Node) &&
        !dropdownRef.current?.contains(e.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (!selectedText?.trim()) return null;

  const dropdown = open
    ? createPortal(
        <div
          ref={dropdownRef}
          className="w-52 rounded-xl border shadow-2xl overflow-hidden"
          style={{
            position: "fixed",
            top: dropdownPos.top,
            left: dropdownPos.left,
            backgroundColor: "var(--color-scriva-sidebar)",
            borderColor: "var(--border)",
            zIndex: 99999,
          }}
        >
          {SKILL_ORDER.map((skillId, i) => (
            <button
              key={skillId}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                if (activeSessionId && selectedText.trim()) {
                  setPendingChatPrompt(
                    activeSessionId,
                    selectedText.trim(),
                    skillId,
                  );
                }
                setOpen(false);
              }}
              className="w-full text-left px-3.5 py-2.5 flex flex-col gap-0.5 transition-colors duration-100 hover:bg-white/5"
              style={{
                borderBottom:
                  i < SKILL_ORDER.length - 1
                    ? "1px solid var(--border)"
                    : "none",
              }}
            >
              <span
                className="text-xs font-semibold"
                style={{ color: "var(--foreground)" }}
              >
                {SKILL_NAMES[skillId]}
              </span>
              <span
                className="text-[10px] leading-tight"
                style={{ color: "var(--muted-foreground)" }}
              >
                {SKILL_DESCRIPTIONS[skillId]}
              </span>
            </button>
          ))}
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      <button
        ref={buttonRef}
        onMouseDown={(e) => e.preventDefault()}
        onClick={handleOpen}
        className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors duration-100"
        style={{
          color: "var(--color-scriva-accent)",
          backgroundColor: open ? "rgba(13,148,136,0.12)" : "transparent",
        }}
      >
        <Sparkles style={{ width: "12px", height: "12px" }} />
        Skills
        <ChevronDown
          style={{
            width: "11px",
            height: "11px",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 150ms",
          }}
        />
      </button>
      {dropdown}
    </>
  );
}

const ScrivaFormattingToolbar = () => (
  <FormattingToolbar>
    <ScrivaSkillsButton key="scrivaSkillsButton" />
    {getFormattingToolbarItems()}
  </FormattingToolbar>
);

const CustomDragHandleMenu = () => (
  <DragHandleMenu>
    <SendToChatItem />
    <RemoveBlockItem>Delete</RemoveBlockItem>
    <BlockColorsItem>Colors</BlockColorsItem>
  </DragHandleMenu>
);

const CustomSideMenu = () => <SideMenu dragHandleMenu={CustomDragHandleMenu} />;

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
    activeSessionId,
    setPendingChatPrompt,
  } = useWorkspaceStore();
  const { theme } = useThemeStore();

  const savedBlocks = documents[sessionId];

  // Provide default content if no saved blocks exist
  const initialContent =
    savedBlocks && savedBlocks.length > 0
      ? (savedBlocks as PartialBlock[])
      : undefined; // Let BlockNote create default empty paragraph

  const editor = useCreateBlockNote({
    schema: scrivaSchema,
    initialContent,
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

  const getSlashItems = useCallback(
    async (query: string): Promise<DefaultReactSuggestionItem[]> => {
      const defaults = getDefaultReactSlashMenuItems(editor);
      const skillItems: DefaultReactSuggestionItem[] = SKILL_ORDER.map(
        (skillId) => ({
          title: SKILL_NAMES[skillId],
          subtext: SKILL_DESCRIPTIONS[skillId],
          aliases: [skillId.toLowerCase()],
          group: "Scriva Skills",
          icon: (
            <Sparkles
              style={{
                width: "14px",
                height: "14px",
                color: "var(--color-scriva-accent)",
              }}
            />
          ),
          onItemClick: () => {
            try {
              const block = editor.getTextCursorPosition().block;
              const text = extractBlockText(block);
              if (text.trim() && activeSessionId) {
                setPendingChatPrompt(activeSessionId, text.trim(), skillId);
              }
            } catch {}
          },
        }),
      );
      return filterSuggestionItems([...defaults, ...skillItems], query);
    },
    [editor, activeSessionId, setPendingChatPrompt],
  );

  return (
    <BlockNoteView
      editor={editor}
      theme={theme}
      onChange={() => {
        saveDocument(sessionId, editor.document as unknown[]);
      }}
      className="scriva-bn-view"
      sideMenu={false}
      slashMenu={false}
      formattingToolbar={false}
    >
      <FormattingToolbarController
        formattingToolbar={ScrivaFormattingToolbar}
      />
      <SideMenuController sideMenu={CustomSideMenu} />
      <SuggestionMenuController triggerCharacter="/" getItems={getSlashItems} />
    </BlockNoteView>
  );
}
