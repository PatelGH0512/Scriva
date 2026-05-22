"use client";

import { useEffect, useCallback, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { useWorkspaceStore } from "@/store/workspace";
import type { StoredMessage } from "@/store/workspace";

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
  const {
    sessions,
    documents,
    chatMessages,
    activeSessionId,
  } = useWorkspaceStore();
  
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncedRef = useRef<{ documents: string; messages: string }>({
    documents: "",
    messages: "",
  });

  // Fetch sessions from cloud on mount
  const fetchSessions = useCallback(async () => {
    if (!isSignedIn) return;

    try {
      const res = await fetch("/api/sessions");
      if (!res.ok) return;

      const cloudSessions: CloudSession[] = await res.json();
      const store = useWorkspaceStore.getState();

      // Merge cloud sessions into local state
      const mergedSessions = cloudSessions.map((cs) => ({
        id: cs.id,
        title: cs.title,
        hasNotes: cs.hasNotes,
        createdAt: new Date(cs.createdAt),
      }));

      // Load documents and messages
      const newDocuments: Record<string, unknown[]> = {};
      const newMessages: Record<string, StoredMessage[]> = {};

      for (const cs of cloudSessions) {
        if (cs.document?.blocks) {
          newDocuments[cs.id] = cs.document.blocks as unknown[];
        }
        if (cs.messages) {
          newMessages[cs.id] = cs.messages.map((m) => ({
            id: m.id,
            role: m.role as "user" | "assistant" | "system",
            content: m.content,
            createdAt: m.createdAt,
          }));
        }
      }

      // Only update if we have cloud data
      if (mergedSessions.length > 0) {
        useWorkspaceStore.setState({
          sessions: mergedSessions,
          documents: { ...store.documents, ...newDocuments },
          chatMessages: { ...store.chatMessages, ...newMessages },
          activeSessionId: mergedSessions[0]?.id ?? null,
        });
      }
    } catch (err) {
      console.error("[CloudSync] Failed to fetch sessions:", err);
    }
  }, [isSignedIn]);

  // Sync document to cloud (debounced)
  const syncDocument = useCallback(
    async (sessionId: string, blocks: unknown[]) => {
      if (!isSignedIn) return;

      const key = JSON.stringify({ sessionId, blocks });
      if (lastSyncedRef.current.documents === key) return;
      lastSyncedRef.current.documents = key;

      try {
        await fetch(`/api/sessions/${sessionId}/document`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blocks }),
        });
      } catch (err) {
        console.error("[CloudSync] Failed to sync document:", err);
      }
    },
    [isSignedIn]
  );

  // Sync messages to cloud
  const syncMessages = useCallback(
    async (sessionId: string, messages: StoredMessage[]) => {
      if (!isSignedIn) return;

      const key = JSON.stringify({ sessionId, messages });
      if (lastSyncedRef.current.messages === key) return;
      lastSyncedRef.current.messages = key;

      try {
        await fetch(`/api/sessions/${sessionId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages }),
        });
      } catch (err) {
        console.error("[CloudSync] Failed to sync messages:", err);
      }
    },
    [isSignedIn]
  );

  // Create session in cloud
  const createCloudSession = useCallback(
    async (title?: string): Promise<string | null> => {
      if (!isSignedIn) return null;

      try {
        const res = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title }),
        });

        if (!res.ok) return null;
        const session = await res.json();
        return session.id;
      } catch (err) {
        console.error("[CloudSync] Failed to create session:", err);
        return null;
      }
    },
    [isSignedIn]
  );

  // Delete session from cloud
  const deleteCloudSession = useCallback(
    async (sessionId: string) => {
      if (!isSignedIn) return;

      try {
        await fetch(`/api/sessions/${sessionId}`, { method: "DELETE" });
      } catch (err) {
        console.error("[CloudSync] Failed to delete session:", err);
      }
    },
    [isSignedIn]
  );

  // Rename session in cloud
  const renameCloudSession = useCallback(
    async (sessionId: string, title: string) => {
      if (!isSignedIn) return;

      try {
        await fetch(`/api/sessions/${sessionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title }),
        });
      } catch (err) {
        console.error("[CloudSync] Failed to rename session:", err);
      }
    },
    [isSignedIn]
  );

  // Initial fetch on auth
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchSessions();
    }
  }, [isLoaded, isSignedIn, fetchSessions]);

  // Watch for document changes and sync (debounced)
  useEffect(() => {
    if (!isSignedIn || !activeSessionId) return;

    const currentDoc = documents[activeSessionId];
    if (!currentDoc) return;

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
  }, [isSignedIn, activeSessionId, documents, syncDocument]);

  // Watch for message changes and sync
  useEffect(() => {
    if (!isSignedIn || !activeSessionId) return;

    const currentMessages = chatMessages[activeSessionId];
    if (!currentMessages || currentMessages.length === 0) return;

    syncMessages(activeSessionId, currentMessages);
  }, [isSignedIn, activeSessionId, chatMessages, syncMessages]);

  return {
    isCloudEnabled: isSignedIn,
    fetchSessions,
    createCloudSession,
    deleteCloudSession,
    renameCloudSession,
    syncDocument,
    syncMessages,
  };
}
