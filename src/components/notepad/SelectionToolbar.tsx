"use client";

import { useEffect, useState, useCallback } from "react";
import { MessageSquare, Sparkles, Expand, RefreshCw } from "lucide-react";
import { useWorkspaceStore } from "@/store/workspace";

interface SelectionToolbarProps {
  editorRef: HTMLElement | null;
}

interface Position {
  x: number;
  y: number;
}

export default function SelectionToolbar({ editorRef }: SelectionToolbarProps) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState("");
  
  const { activeSessionId, setPendingChatPrompt } = useWorkspaceStore();

  const handleSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !editorRef) {
      setVisible(false);
      return;
    }

    const text = selection.toString().trim();
    if (!text || text.length < 3) {
      setVisible(false);
      return;
    }

    // Check if selection is within the editor
    const range = selection.getRangeAt(0);
    if (!editorRef.contains(range.commonAncestorContainer)) {
      setVisible(false);
      return;
    }

    const rect = range.getBoundingClientRect();
    const editorRect = editorRef.getBoundingClientRect();
    
    // Position toolbar above selection, centered
    setPosition({
      x: rect.left + rect.width / 2 - editorRect.left,
      y: rect.top - editorRect.top - 8,
    });
    setSelectedText(text);
    setVisible(true);
  }, [editorRef]);

  useEffect(() => {
    if (!editorRef) return;

    const handleMouseUp = () => {
      // Small delay to let selection finalize
      setTimeout(handleSelection, 10);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.shiftKey) {
        setTimeout(handleSelection, 10);
      }
    };

    const handleMouseDown = () => {
      setVisible(false);
    };

    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("keyup", handleKeyUp);
    editorRef.addEventListener("mousedown", handleMouseDown);

    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("keyup", handleKeyUp);
      editorRef.removeEventListener("mousedown", handleMouseDown);
    };
  }, [editorRef, handleSelection]);

  const handleAction = (action: "ask" | "summarize" | "expand" | "rewrite") => {
    if (!activeSessionId || !selectedText) return;
    setPendingChatPrompt(activeSessionId, selectedText, action);
    setVisible(false);
    window.getSelection()?.removeAllRanges();
  };

  if (!visible) return null;

  return (
    <div
      className="absolute z-50 flex items-center gap-0.5 px-1 py-1 rounded-lg shadow-xl border"
      style={{
        left: position.x,
        top: position.y,
        transform: "translate(-50%, -100%)",
        backgroundColor: "var(--color-scriva-sidebar)",
        borderColor: "var(--border)",
      }}
    >
      <ToolbarButton
        icon={<MessageSquare className="w-3.5 h-3.5" />}
        label="Ask AI"
        onClick={() => handleAction("ask")}
      />
      <ToolbarButton
        icon={<Sparkles className="w-3.5 h-3.5" />}
        label="Summarize"
        onClick={() => handleAction("summarize")}
      />
      <ToolbarButton
        icon={<Expand className="w-3.5 h-3.5" />}
        label="Expand"
        onClick={() => handleAction("expand")}
      />
      <ToolbarButton
        icon={<RefreshCw className="w-3.5 h-3.5" />}
        label="Rewrite"
        onClick={() => handleAction("rewrite")}
      />
    </div>
  );
}

function ToolbarButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors duration-100 hover:bg-white/10"
      style={{ color: "var(--foreground)" }}
      title={label}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
