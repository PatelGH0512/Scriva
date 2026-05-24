"use client";

import { SideMenuExtension } from "@blocknote/core/extensions";
import { useBlockNoteEditor, useExtensionState } from "@blocknote/react";
import { useWorkspaceStore } from "@/store/workspace";

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

export function SendToChatItem() {
  const editor = useBlockNoteEditor<any, any, any>();
  const { activeSessionId, setPendingChatDraft } = useWorkspaceStore();

  const block = useExtensionState(SideMenuExtension, {
    editor,
    selector: (state) => state?.block,
  });

  if (!block) return null;

  return (
    <div
      role="menuitem"
      className="bn-menu-item"
      style={{ cursor: "pointer" }}
      onClick={() => {
        const text = extractBlockText(block);
        if (text.trim() && activeSessionId) {
          setPendingChatDraft(activeSessionId, text.trim());
        }
      }}
    >
      Send to chat
    </div>
  );
}
