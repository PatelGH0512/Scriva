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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserButton, useAuth } from "@clerk/nextjs";
import {
  useWorkspaceStore,
  getSessionGroup,
  type Session,
} from "@/store/workspace";
import DeleteSessionDialog from "./DeleteSessionDialog";
import { useCloudSync } from "@/hooks/useCloudSync";

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

export default function Sidebar({ onCollapse }: SidebarProps) {
  const { isSignedIn } = useAuth();
  const {
    sessions,
    activeSessionId,
    createSession,
    deleteSession,
    renameSession,
    setActiveSession,
  } = useWorkspaceStore();

  const {
    isCloudEnabled,
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

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      deleteSession(deleteTarget.id);
      setDeleteTarget(null);
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
            onClick={async () => {
              if (isCloudEnabled) {
                const cloudId = await createCloudSession();
                if (cloudId) {
                  // Refresh from cloud
                  window.location.reload();
                }
              } else {
                createSession();
              }
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium border transition-colors duration-150 hover:bg-white/5"
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
        <div className="flex-1 overflow-y-auto px-2 pb-2">
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
                    onRename={(title) => renameSession(session.id, title)}
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
              <div className="flex items-center gap-1.5">
                {isCloudEnabled ? (
                  <Cloud
                    className="w-3.5 h-3.5"
                    style={{ color: "var(--color-scriva-accent)" }}
                  />
                ) : (
                  <CloudOff
                    className="w-3.5 h-3.5"
                    style={{ color: "var(--muted-foreground)" }}
                  />
                )}
                <span
                  className="text-xs"
                  style={{
                    color: isCloudEnabled
                      ? "var(--color-scriva-accent)"
                      : "var(--muted-foreground)",
                  }}
                >
                  {isCloudEnabled ? "Synced" : "Local"}
                </span>
              </div>
            </div>
            <button
              className="p-1.5 rounded-md transition-colors duration-150 hover:bg-white/5"
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
