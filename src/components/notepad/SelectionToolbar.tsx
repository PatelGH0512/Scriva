"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Sparkles, ChevronDown } from "lucide-react";
import { useWorkspaceStore } from "@/store/workspace";
import { SKILL_NAMES, SKILL_DESCRIPTIONS, type SkillId } from "@/lib/skills";

interface SelectionToolbarProps {
  editorRef: HTMLElement | null;
}

interface Position {
  x: number;
  y: number;
}

const SKILL_ORDER: SkillId[] = [
  "devilsAdvocate",
  "connectTheDots",
  "firstPrinciples",
  "makeItAStory",
  "whatsMissing",
];

export default function SelectionToolbar({ editorRef }: SelectionToolbarProps) {
  const [visible, setVisible] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { activeSessionId, setPendingChatPrompt } = useWorkspaceStore();

  const handleSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !editorRef) {
      setVisible(false);
      setDropdownOpen(false);
      return;
    }

    const text = selection.toString().trim();
    if (!text || text.length < 3) {
      setVisible(false);
      setDropdownOpen(false);
      return;
    }

    const range = selection.getRangeAt(0);
    if (!editorRef.contains(range.commonAncestorContainer)) {
      setVisible(false);
      setDropdownOpen(false);
      return;
    }

    const rect = range.getBoundingClientRect();
    const editorRect = editorRef.getBoundingClientRect();

    setPosition({
      x: rect.left + rect.width / 2 - editorRect.left,
      y: rect.top - editorRect.top + editorRef.scrollTop - 8,
    });
    setSelectedText(text);
    setVisible(true);
    setDropdownOpen(false);
  }, [editorRef]);

  useEffect(() => {
    if (!editorRef) return;

    const handleMouseUp = (e: MouseEvent) => {
      if (dropdownRef.current?.contains(e.target as Node)) return;
      setTimeout(handleSelection, 10);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.shiftKey) setTimeout(handleSelection, 10);
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (dropdownRef.current?.contains(e.target as Node)) return;
      setVisible(false);
      setDropdownOpen(false);
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("keyup", handleKeyUp);
    document.addEventListener("mousedown", handleClickOutside);
    editorRef.addEventListener("mousedown", handleMouseDown);

    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("keyup", handleKeyUp);
      document.removeEventListener("mousedown", handleClickOutside);
      editorRef.removeEventListener("mousedown", handleMouseDown);
    };
  }, [editorRef, handleSelection]);

  const handleSkill = (skill: SkillId) => {
    if (!activeSessionId || !selectedText) return;
    setPendingChatPrompt(activeSessionId, selectedText, skill);
    setVisible(false);
    setDropdownOpen(false);
    window.getSelection()?.removeAllRanges();
  };

  if (!visible) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute z-50"
      style={{
        left: position.x,
        top: position.y,
        transform: "translate(-50%, -100%)",
      }}
    >
      {/* Trigger button */}
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setDropdownOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium shadow-xl border transition-colors duration-100 hover:bg-white/10"
        style={{
          backgroundColor: "var(--color-scriva-sidebar)",
          borderColor: "var(--color-scriva-accent)",
          color: "var(--color-scriva-accent)",
        }}
      >
        <Sparkles className="w-3 h-3" />
        Scriva Skills
        <ChevronDown
          className="w-3 h-3 transition-transform duration-150"
          style={{
            transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {/* Dropdown */}
      {dropdownOpen && (
        <div
          className="absolute left-1/2 mt-1.5 w-52 rounded-xl border shadow-2xl overflow-hidden"
          style={{
            transform: "translateX(-50%)",
            backgroundColor: "var(--color-scriva-sidebar)",
            borderColor: "var(--border)",
          }}
        >
          {SKILL_ORDER.map((skillId, i) => (
            <button
              key={skillId}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSkill(skillId)}
              className="w-full text-left px-3.5 py-2.5 transition-colors duration-100 hover:bg-white/8 flex flex-col gap-0.5"
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
        </div>
      )}
    </div>
  );
}
