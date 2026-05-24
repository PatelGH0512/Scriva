"use client";

import { useState, useRef, useEffect } from "react";
import {
  FileText,
  MessageSquare,
  Plus,
  Settings,
  ChevronLeft,
  Trash2,
  Pencil,
  Cloud,
  CloudOff,
  Sun,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserButton, useAuth } from "@clerk/nextjs";
import {
  useWorkspaceStore,
  getSessionGroup,
  type Session,
  type SyncStatus,
} from "@/store/workspace";
import DeleteSessionDialog from "./DeleteSessionDialog";
import { useCloudSync } from "@/hooks/useCloudSync";
import { useThemeStore } from "@/store/theme";

interface SidebarProps {
  onCollapse: () => void;
}

function SessionItem({
  session,
  isActive,
  onSelect,
  onRename,
  onDeleteRequest,
}: {
  session: Session;
  isActive: boolean;
  onSelect: () => void;
  onRename: (title: string) => void;
  onDeleteRequest: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(session.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const commitRename = () => {
    setIsEditing(false);
    onRename(editValue);
  };

  return (
    <div
      className={cn(
        "group/item relative flex items-center rounded-md text-sm transition-colors duration-150 mb-0.5",
        isActive ? "border-l-2" : "hover:bg-white/5",
      )}
      style={
        isActive
          ? {
              backgroundColor: "rgba(13, 148, 136, 0.08)",
              borderLeftColor: "var(--color-scriva-accent)",
            }
          : {}
      }
    >
      {isEditing ? (
        <input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitRename();
            if (e.key === "Escape") {
              setEditValue(session.title);
              setIsEditing(false);
            }
          }}
          className="flex-1 bg-transparent text-sm px-2 py-2 outline-none"
          style={{ color: "var(--foreground)" }}
        />
      ) : (
        <button
          onClick={onSelect}
          className="flex-1 flex items-center gap-2 min-w-0 px-2 py-2 text-left"
          style={{
            color: isActive ? "var(--foreground)" : "var(--muted-foreground)",
          }}
        >
          <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 opacity-50" />
          <span className="truncate">{session.title}</span>
          {session.hasNotes && (
            <span
              title="Has notepad content"
              className="flex-shrink-0 ml-auto pl-1"
            >
              <FileText
                className="w-3 h-3"
                style={{ color: "var(--color-scriva-accent)" }}
              />
            </span>
          )}
        </button>
      )}

      {!isEditing && (
        <div className="absolute right-1 flex items-center gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity duration-150">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditValue(session.title);
              setIsEditing(true);
            }}
            className="p-1 rounded transition-colors hover:bg-white/10"
          >
            <Pencil
              className="w-3 h-3"
              style={{ color: "var(--muted-foreground)" }}
            />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteRequest();
            }}
            className="p-1 rounded transition-colors hover:bg-white/10"
          >
            <Trash2
              className="w-3 h-3"
              style={{ color: "var(--muted-foreground)" }}
            />
          </button>
        </div>
      )}
    </div>
  );
}

function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <button
      onClick={toggleTheme}
      className="p-1.5 rounded-md transition-colors duration-150 hover:bg-black/5 dark:hover:bg-white/5"
      title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
    >
      {theme === "light" ? (
        <Moon
          className="w-4 h-4"
          style={{ color: "var(--muted-foreground)" }}
        />
      ) : (
        <Sun className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
      )}
    </button>
  );
}

function SyncStatusIndicator({
  isCloudEnabled,
  syncStatus,
  isLoading,
}: {
  isCloudEnabled: boolean;
  syncStatus: SyncStatus;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-1.5">
        <div
          className="w-3.5 h-3.5 border-2 border-t-transparent rounded-full animate-spin"
          style={{
            borderColor: "var(--color-scriva-accent)",
            borderTopColor: "transparent",
          }}
        />
        <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
          Loading...
        </span>
      </div>
    );
  }

  if (!isCloudEnabled) {
    return (
      <div className="flex items-center gap-1.5">
        <CloudOff
          className="w-3.5 h-3.5"
          style={{ color: "var(--muted-foreground)" }}
        />
        <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
          Local
        </span>
      </div>
    );
  }

  const statusConfig = {
    idle: { color: "var(--muted-foreground)", text: "Ready" },
    syncing: { color: "var(--color-scriva-accent)", text: "Syncing..." },
    synced: { color: "var(--color-scriva-accent)", text: "Synced" },
    error: { color: "#ef4444", text: "Sync error" },
  };

  const config = statusConfig[syncStatus];

  return (
    <div className="flex items-center gap-1.5">
      {syncStatus === "syncing" ? (
        <div
          className="w-3.5 h-3.5 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: config.color, borderTopColor: "transparent" }}
        />
      ) : (
        <Cloud className="w-3.5 h-3.5" style={{ color: config.color }} />
      )}
      <span className="text-xs" style={{ color: config.color }}>
        {config.text}
      </span>
    </div>
  );
}

export default function Sidebar({ onCollapse }: SidebarProps) {
  const { isSignedIn } = useAuth();
  const {
    sessions,
    activeSessionId,
    isCloudMode,
    isInitialized,
    syncStatus,
    createSession,
    deleteSession,
    renameSession,
    setActiveSession,
  } = useWorkspaceStore();

  const {
    isCloudEnabled,
    isLoading,
    createCloudSession,
    deleteCloudSession,
    renameCloudSession,
  } = useCloudSync();

  const [deleteTarget, setDeleteTarget] = useState<Session | null>(null);

  const groupedSessions = sessions.reduce<Record<string, Session[]>>(
    (acc, session) => {
      const group = getSessionGroup(session.createdAt);
      if (!acc[group]) acc[group] = [];
      acc[group].push(session);
      return acc;
    },
    {},
  );

  const groupOrder = [
    "Today",
    "Yesterday",
    ...Object.keys(groupedSessions).filter(
      (g) => g !== "Today" && g !== "Yesterday",
    ),
  ];

  const handleCreateSession = async () => {
    if (isCloudEnabled) {
      await createCloudSession();
    } else {
      createSession();
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteTarget) {
      if (isCloudEnabled) {
        await deleteCloudSession(deleteTarget.id);
      } else {
        deleteSession(deleteTarget.id);
      }
      setDeleteTarget(null);
    }
  };

  const handleRename = async (id: string, title: string) => {
    if (isCloudEnabled) {
      await renameCloudSession(id, title);
    } else {
      renameSession(id, title);
    }
  };

  const handleExportAndDelete = (_format: "pdf" | "docx") => {
    handleDeleteConfirm();
  };

  return (
    <>
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
            onClick={handleCreateSession}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium border transition-colors duration-150 hover:bg-black/5 dark:hover:bg-white/5"
            style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
          >
            <Plus
              className="w-4 h-4"
              style={{ color: "var(--color-scriva-accent)" }}
            />
            New Chat
          </button>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto px-2 pb-2 scriva-scroll">
          {groupOrder.map((group) => {
            const groupSessions = groupedSessions[group];
            if (!groupSessions?.length) return null;
            return (
              <div key={group} className="mb-4">
                <p
                  className="px-2 py-1 text-xs font-semibold uppercase tracking-wider mb-1"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {group}
                </p>
                {groupSessions.map((session) => (
                  <SessionItem
                    key={session.id}
                    session={session}
                    isActive={session.id === activeSessionId}
                    onSelect={() => setActiveSession(session.id)}
                    onRename={(title) => handleRename(session.id, title)}
                    onDeleteRequest={() => setDeleteTarget(session)}
                  />
                ))}
              </div>
            );
          })}
        </div>

        {/* User & Settings */}
        <div
          className="flex-shrink-0 border-t px-3 py-3"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isSignedIn ? (
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "w-7 h-7",
                    },
                  }}
                />
              ) : (
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium"
                  style={{
                    backgroundColor: "var(--secondary)",
                    color: "var(--muted-foreground)",
                  }}
                >
                  ?
                </div>
              )}
              <SyncStatusIndicator
                isCloudEnabled={isCloudEnabled}
                syncStatus={syncStatus}
                isLoading={isLoading ?? false}
              />
            </div>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <button
                className="p-1.5 rounded-md transition-colors duration-150 hover:bg-black/5 dark:hover:bg-white/5"
                title="Settings"
              >
                <Settings
                  className="w-4 h-4"
                  style={{ color: "var(--muted-foreground)" }}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {deleteTarget && (
        <DeleteSessionDialog
          sessionTitle={deleteTarget.title}
          hasNotes={deleteTarget.hasNotes}
          onExportAndDelete={handleExportAndDelete}
          onDeleteAnyway={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}
