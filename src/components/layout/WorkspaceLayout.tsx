"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { PanelLeft } from "lucide-react";
import Sidebar from "./Sidebar";
import ChatPanel from "./ChatPanel";
import NotepadPanel from "./NotepadPanel";
import ResizeHandle from "./ResizeHandle";
import { useWorkspaceStore } from "@/store/workspace";

const SIDEBAR_WIDTH = 260;
const MIN_CHAT_WIDTH = 300;
const MIN_NOTEPAD_WIDTH = 320;
const DEFAULT_CHAT_RATIO = 0.45;

export default function WorkspaceLayout() {
  const { activeSessionId } = useWorkspaceStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);
  const chatPanelRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);

  const getChatWidth = useCallback((): number => {
    if (!chatPanelRef.current) return 0;
    return chatPanelRef.current.offsetWidth;
  }, []);

  const setChatWidth = useCallback((width: number) => {
    if (chatPanelRef.current) {
      chatPanelRef.current.style.width = `${width}px`;
    }
  }, []);

  /* Initialize chat panel to 45% of content area on mount and sidebar toggle */
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (contentRef.current && chatPanelRef.current) {
        const contentWidth = contentRef.current.offsetWidth;
        const initialWidth = Math.round(contentWidth * DEFAULT_CHAT_RATIO);
        chatPanelRef.current.style.width = `${initialWidth}px`;
        chatPanelRef.current.style.flexShrink = "0";
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [sidebarOpen]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      isDragging.current = true;
      dragStartX.current = e.clientX;
      dragStartWidth.current = getChatWidth();
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [getChatWidth],
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !contentRef.current) return;
      const delta = e.clientX - dragStartX.current;
      const contentWidth = contentRef.current.offsetWidth;
      const newWidth = Math.max(
        MIN_CHAT_WIDTH,
        Math.min(
          dragStartWidth.current + delta,
          contentWidth - MIN_NOTEPAD_WIDTH - 4,
        ),
      );
      setChatWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [setChatWidth]);

  return (
    <div
      className="flex h-full w-full overflow-hidden"
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* Sidebar — animated width transition */}
      <div
        className="flex-shrink-0 overflow-hidden transition-all duration-200 ease-in-out"
        style={{ width: sidebarOpen ? SIDEBAR_WIDTH : 0 }}
      >
        <Sidebar onCollapse={() => setSidebarOpen(false)} />
      </div>

      {/* Content area */}
      <div ref={contentRef} className="flex flex-1 overflow-hidden relative">
        {/* Expand sidebar button — shown when sidebar is collapsed */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute top-3 left-3 z-10 p-1.5 rounded-md transition-colors duration-150 hover:bg-white/5"
            title="Expand sidebar"
          >
            <PanelLeft
              className="w-4 h-4"
              style={{ color: "var(--muted-foreground)" }}
            />
          </button>
        )}

        {/* Chat Panel */}
        <div
          ref={chatPanelRef}
          className="flex-shrink-0 overflow-hidden"
          style={{ width: "45%" }}
        >
          <ChatPanel key={activeSessionId ?? "empty"} />
        </div>

        {/* Resize Handle */}
        <ResizeHandle onMouseDown={handleMouseDown} />

        {/* Notepad Panel */}
        <div className="flex-1 overflow-hidden min-w-0">
          <NotepadPanel />
        </div>
      </div>
    </div>
  );
}
