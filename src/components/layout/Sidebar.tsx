"use client";

import {
  FileText,
  MessageSquare,
  Plus,
  Settings,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  onCollapse: () => void;
}

const MOCK_SESSIONS = [
  {
    id: "1",
    title: "Product roadmap brainstorm",
    hasNotes: true,
    group: "Today",
  },
  { id: "2", title: "Competitive analysis", hasNotes: false, group: "Today" },
  { id: "3", title: "System design deep dive", hasNotes: true, group: "Today" },
  {
    id: "4",
    title: "User research synthesis",
    hasNotes: true,
    group: "Yesterday",
  },
  {
    id: "5",
    title: "Feature prioritization",
    hasNotes: false,
    group: "Yesterday",
  },
  {
    id: "6",
    title: "Q3 planning session",
    hasNotes: false,
    group: "Yesterday",
  },
];

const SESSION_GROUPS = ["Today", "Yesterday"];

export default function Sidebar({ onCollapse }: SidebarProps) {
  const activeSessionId = "1";

  return (
    <div
      className="flex flex-col h-full w-[260px] border-r"
      style={{
        backgroundColor: "var(--sidebar)",
        borderColor: "var(--border)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 h-14 flex-shrink-0 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: "var(--color-scriva-accent)" }}
          >
            S
          </div>
          <span
            className="font-semibold text-sm tracking-tight"
            style={{ color: "var(--foreground)" }}
          >
            Scriva
          </span>
        </div>
        <button
          onClick={onCollapse}
          className="p-1.5 rounded-md transition-colors duration-150 hover:bg-white/5"
          title="Collapse sidebar"
        >
          <ChevronLeft
            className="w-4 h-4"
            style={{ color: "var(--muted-foreground)" }}
          />
        </button>
      </div>

      {/* New Chat Button */}
      <div className="px-3 py-3 flex-shrink-0">
        <button
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium border transition-colors duration-150 hover:bg-white/5"
          style={{
            borderColor: "var(--border)",
            color: "var(--foreground)",
          }}
        >
          <Plus
            className="w-4 h-4"
            style={{ color: "var(--color-scriva-accent)" }}
          />
          New Chat
        </button>
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {SESSION_GROUPS.map((group) => {
          const sessions = MOCK_SESSIONS.filter((s) => s.group === group);
          return (
            <div key={group} className="mb-4">
              <p
                className="px-2 py-1 text-xs font-semibold uppercase tracking-wider mb-1"
                style={{ color: "var(--muted-foreground)" }}
              >
                {group}
              </p>
              {sessions.map((session) => (
                <button
                  key={session.id}
                  className={cn(
                    "w-full flex items-center justify-between px-2 py-2 rounded-md text-sm transition-colors duration-150 group/session",
                    activeSessionId === session.id
                      ? "border-l-2 pl-[6px]"
                      : "hover:bg-white/5",
                  )}
                  style={
                    activeSessionId === session.id
                      ? {
                          backgroundColor: "rgba(13, 148, 136, 0.08)",
                          borderLeftColor: "var(--color-scriva-accent)",
                          color: "var(--foreground)",
                        }
                      : { color: "var(--muted-foreground)" }
                  }
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 opacity-50" />
                    <span className="truncate text-left">{session.title}</span>
                  </div>
                  {session.hasNotes && (
                    <span
                      title="Has notepad content"
                      className="flex-shrink-0 ml-1"
                    >
                      <FileText
                        className="w-3.5 h-3.5"
                        style={{ color: "var(--color-scriva-accent)" }}
                      />
                    </span>
                  )}
                </button>
              ))}
            </div>
          );
        })}
      </div>

      {/* Settings */}
      <div
        className="flex-shrink-0 border-t px-3 py-3"
        style={{ borderColor: "var(--border)" }}
      >
        <button
          className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm transition-colors duration-150 hover:bg-white/5"
          style={{ color: "var(--muted-foreground)" }}
        >
          <Settings className="w-4 h-4" />
          Settings
        </button>
      </div>
    </div>
  );
}
