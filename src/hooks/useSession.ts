"use client";

import { useEffect, useCallback, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useWorkspaceStore, type StoredMessage } from "@/store/workspace";

interface SessionData {
  id: string;
  title: string;
  hasNotes: boolean;
  createdAt: string;
  document: { blocks: unknown[] } | null;
  messages: Array<{
    id: string;
    role: string;
    content: string;
    createdAt: string;
  }>;
}

export function useSession(sessionId: string | null) {
  const { isSignedIn } = useAuth();
  const { documents, chatMessages, saveDocument, saveChatMessages } = useWorkspaceStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch session data from cloud
  const fetchSession = useCallback(async () => {
    if (!isSignedIn || !sessionId) return;
    
    // Check if we already have data locally
    const hasLocalDoc = documents[sessionId] !== undefined;
    const hasLocalMessages = chatMessages[sessionId] !== undefined;
    
    if (hasLocalDoc && hasLocalMessages) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/sessions/${sessionId}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError("Session not found");
          return;
        }
        throw new Error("Failed to fetch session");
      }

      const data: SessionData = await res.json();

      // Save document to local store
      if (data.document?.blocks) {
        saveDocument(sessionId, data.document.blocks);
      } else if (!hasLocalDoc) {
        saveDocument(sessionId, []);
      }

      // Save messages to local store
      if (data.messages && data.messages.length > 0) {
        const storedMessages: StoredMessage[] = data.messages.map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
          createdAt: m.createdAt,
        }));
        saveChatMessages(sessionId, storedMessages);
      } else if (!hasLocalMessages) {
        saveChatMessages(sessionId, []);
      }
    } catch (err) {
      console.error("[useSession] Failed to fetch:", err);
      setError("Failed to load session");
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, sessionId, documents, chatMessages, saveDocument, saveChatMessages]);

  // Fetch on session change
  useEffect(() => {
    if (sessionId) {
      fetchSession();
    }
  }, [sessionId, fetchSession]);

  return {
    isLoading,
    error,
    document: sessionId ? documents[sessionId] : undefined,
    messages: sessionId ? chatMessages[sessionId] : undefined,
    refetch: fetchSession,
  };
}
