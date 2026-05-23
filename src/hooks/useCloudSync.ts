"use client";

import { useEffect, useCallback, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { useWorkspaceStore } from "@/store/workspace";
import type { Session, StoredMessage } from "@/store/workspace";

interface CloudSession {
  id: string;
  title: string;
  hasNotes: boolean;
  createdAt: string;
  document?: { blocks: unknown[] } | null;
  messages?: Array<{ id: string; role: string; content: string; createdAt: string }>;
}

export function useCloudSync() {
  const { isSignedIn, isLoaded } = useAuth();
  const store = useWorkspaceStore();
  const {
    isCloudMode,
    isInitialized,
    activeSessionId,
    documents,
    chatMessages,
    setCloudMode,
    setInitialized,
    setSyncStatus,
    setSessions,
    saveDocument,
    saveChatMessages,
  } = store;
  
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncedRef = useRef<{ documents: string; messages: string }>({
    documents: "",
    messages: "",
  });
  const initRef = useRef(false);

  // Initialize: fetch all sessions from cloud
  const initialize = useCallback(async () => {
    if (!isSignedIn || initRef.current) return;
    initRef.current = true;

    setSyncStatus("syncing");

    try {
      const res = await fetch("/api/sessions");
      if (!res.ok) {
        console.error("[CloudSync] API returned:", res.status, await res.text());
        throw new Error("Failed to fetch sessions");
      }

      const cloudSessions: CloudSession[] = await res.json();

      // Convert to local Session format
      const sessions: Session[] = cloudSessions.map((cs) => ({
        id: cs.id,
        title: cs.title,
        hasNotes: cs.hasNotes,
        createdAt: new Date(cs.createdAt),
      }));

      // Load documents and messages for all sessions
      for (const cs of cloudSessions) {
        if (cs.document?.blocks) {
          saveDocument(cs.id, cs.document.blocks);
        }
        if (cs.messages && cs.messages.length > 0) {
          const storedMessages: StoredMessage[] = cs.messages.map((m) => ({
            id: m.id,
            role: m.role as "user" | "assistant" | "system",
            content: m.content,
            createdAt: m.createdAt,
          }));
          saveChatMessages(cs.id, storedMessages);
        }
      }

      setSessions(sessions);
      setCloudMode(true);
      setInitialized(true);
      setSyncStatus("synced");
    } catch (err) {
      console.error("[CloudSync] Failed to initialize:", err);
      setSyncStatus("error");
      setInitialized(true); // Still mark as initialized so UI can render
    }
  }, [isSignedIn, setSyncStatus, setSessions, setCloudMode, setInitialized, saveDocument, saveChatMessages]);

  // Sync document to cloud (debounced)
  const syncDocument = useCallback(
    async (sessionId: string, blocks: unknown[]) => {
      if (!isCloudMode) return;

      const key = JSON.stringify({ sessionId, len: blocks.length });
      if (lastSyncedRef.current.documents === key) return;

      setSyncStatus("syncing");

      try {
        await fetch(`/api/sessions/${sessionId}/document`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blocks }),
        });
        lastSyncedRef.current.documents = key;
        setSyncStatus("synced");
      } catch (err) {
        console.error("[CloudSync] Failed to sync document:", err);
        setSyncStatus("error");
      }
    },
    [isCloudMode, setSyncStatus]
  );

  // Sync messages to cloud
  const syncMessages = useCallback(
    async (sessionId: string, messages: StoredMessage[]) => {
      if (!isCloudMode) return;

      const key = JSON.stringify({ sessionId, len: messages.length });
      if (lastSyncedRef.current.messages === key) return;

      setSyncStatus("syncing");

      try {
        await fetch(`/api/sessions/${sessionId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages }),
        });
        lastSyncedRef.current.messages = key;
        setSyncStatus("synced");
      } catch (err) {
        console.error("[CloudSync] Failed to sync messages:", err);
        setSyncStatus("error");
      }
    },
    [isCloudMode, setSyncStatus]
  );

  // Create session in cloud and add to local state
  const createCloudSession = useCallback(
    async (title?: string): Promise<string | null> => {
      if (!isCloudMode) return null;

      setSyncStatus("syncing");

      try {
        const res = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: title || "New Chat" }),
        });

        if (!res.ok) throw new Error("Failed to create session");
        
        const data = await res.json();
        const newSession: Session = {
          id: data.id,
          title: data.title,
          hasNotes: false,
          createdAt: new Date(data.createdAt),
        };

        // Add to local state
        useWorkspaceStore.setState((state) => ({
          sessions: [newSession, ...state.sessions],
          activeSessionId: newSession.id,
          documents: { ...state.documents, [newSession.id]: [] },
          chatMessages: { ...state.chatMessages, [newSession.id]: [] },
        }));

        setSyncStatus("synced");
        return newSession.id;
      } catch (err) {
        console.error("[CloudSync] Failed to create session:", err);
        setSyncStatus("error");
        return null;
      }
    },
    [isCloudMode, setSyncStatus]
  );

  // Delete session from cloud and local state
  const deleteCloudSession = useCallback(
    async (sessionId: string): Promise<boolean> => {
      if (!isCloudMode) return false;

      setSyncStatus("syncing");

      try {
        await fetch(`/api/sessions/${sessionId}`, { method: "DELETE" });

        // Remove from local state
        useWorkspaceStore.setState((state) => {
          const remaining = state.sessions.filter((s) => s.id !== sessionId);
          const newDocs = { ...state.documents };
          const newMsgs = { ...state.chatMessages };
          delete newDocs[sessionId];
          delete newMsgs[sessionId];

          return {
            sessions: remaining,
            activeSessionId: state.activeSessionId === sessionId 
              ? (remaining[0]?.id ?? null) 
              : state.activeSessionId,
            documents: newDocs,
            chatMessages: newMsgs,
          };
        });

        setSyncStatus("synced");
        return true;
      } catch (err) {
        console.error("[CloudSync] Failed to delete session:", err);
        setSyncStatus("error");
        return false;
      }
    },
    [isCloudMode, setSyncStatus]
  );

  // Rename session in cloud and local state
  const renameCloudSession = useCallback(
    async (sessionId: string, title: string): Promise<boolean> => {
      if (!isCloudMode) return false;

      setSyncStatus("syncing");

      try {
        await fetch(`/api/sessions/${sessionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title }),
        });

        // Update local state
        useWorkspaceStore.setState((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? { ...s, title } : s
          ),
        }));

        setSyncStatus("synced");
        return true;
      } catch (err) {
        console.error("[CloudSync] Failed to rename session:", err);
        setSyncStatus("error");
        return false;
      }
    },
    [isCloudMode, setSyncStatus]
  );

  // Initialize on auth ready
  useEffect(() => {
    if (isLoaded && isSignedIn && !isInitialized) {
      initialize();
    }
  }, [isLoaded, isSignedIn, isInitialized, initialize]);

  // Watch for document changes and sync (debounced)
  useEffect(() => {
    if (!isCloudMode || !activeSessionId) return;

    const currentDoc = documents[activeSessionId];
    if (!currentDoc || currentDoc.length === 0) return;

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(() => {
      syncDocument(activeSessionId, currentDoc);
    }, 2000); // 2s debounce

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [isCloudMode, activeSessionId, documents, syncDocument]);

  // Watch for message changes and sync (debounced)
  useEffect(() => {
    if (!isCloudMode || !activeSessionId) return;

    const currentMessages = chatMessages[activeSessionId];
    if (!currentMessages || currentMessages.length === 0) return;

    // Debounce message sync too
    const timeout = setTimeout(() => {
      syncMessages(activeSessionId, currentMessages);
    }, 1000);

    return () => clearTimeout(timeout);
  }, [isCloudMode, activeSessionId, chatMessages, syncMessages]);

  return {
    isCloudEnabled: isCloudMode,
    isInitialized,
    isLoading: !isInitialized && isSignedIn,
    createCloudSession,
    deleteCloudSession,
    renameCloudSession,
    syncDocument,
    syncMessages,
  };
}
