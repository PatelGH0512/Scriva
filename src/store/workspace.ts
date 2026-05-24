import { create } from "zustand";
import type { SkillId } from "@/lib/skills";

export type SyncStatus = "idle" | "syncing" | "synced" | "error";

export interface Session {
  id: string;
  title: string;
  hasNotes: boolean;
  createdAt: Date;
}

export interface StoredMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt?: string;
}

export interface PendingAppend {
  id: string;
  sessionId: string;
  content: string;
  contextLabel: string;
}

export interface PendingChatDraft {
  id: string;
  sessionId: string;
  text: string;
}

export interface PendingChatPrompt {
  id: string;
  sessionId: string;
  selectedText: string;
  skill: SkillId;
}

interface WorkspaceStore {
  // Auth & sync state
  isCloudMode: boolean;
  isInitialized: boolean;
  syncStatus: SyncStatus;
  
  // Data
  sessions: Session[];
  activeSessionId: string | null;
  documents: Record<string, unknown[]>;
  chatMessages: Record<string, StoredMessage[]>;
  pendingAppend: PendingAppend | null;
  pendingChatPrompt: PendingChatPrompt | null;
  pendingChatDraft: PendingChatDraft | null;

  // Actions
  setCloudMode: (enabled: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  setSyncStatus: (status: SyncStatus) => void;
  setSessions: (sessions: Session[]) => void;
  createSession: () => string;
  deleteSession: (id: string) => void;
  renameSession: (id: string, title: string) => void;
  setActiveSession: (id: string) => void;
  setHasNotes: (id: string, hasNotes: boolean) => void;
  saveDocument: (sessionId: string, blocks: unknown[]) => void;
  saveChatMessages: (sessionId: string, messages: StoredMessage[]) => void;
  setPendingAppend: (sessionId: string, content: string, contextLabel: string) => void;
  clearPendingAppend: () => void;
  setPendingChatPrompt: (sessionId: string, selectedText: string, skill: SkillId) => void;
  clearPendingChatPrompt: () => void;
  setPendingChatDraft: (sessionId: string, text: string) => void;
  clearPendingChatDraft: () => void;
  reset: () => void;
}

// Initial state - empty until loaded from cloud or local fallback
const INITIAL_STATE = {
  isCloudMode: false,
  isInitialized: false,
  syncStatus: "idle" as SyncStatus,
  sessions: [] as Session[],
  activeSessionId: null as string | null,
  documents: {} as Record<string, unknown[]>,
  chatMessages: {} as Record<string, StoredMessage[]>,
  pendingAppend: null as PendingAppend | null,
  pendingChatPrompt: null as PendingChatPrompt | null,
  pendingChatDraft: null as PendingChatDraft | null,
};

function generateId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function getSessionGroup(createdAt: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const sessionDay = new Date(
    createdAt.getFullYear(),
    createdAt.getMonth(),
    createdAt.getDate()
  );

  if (sessionDay.getTime() === today.getTime()) return "Today";
  if (sessionDay.getTime() === yesterday.getTime()) return "Yesterday";

  return sessionDay.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
}

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
  ...INITIAL_STATE,

  setCloudMode: (enabled: boolean) => {
    set({ isCloudMode: enabled });
  },

  setInitialized: (initialized: boolean) => {
    set({ isInitialized: initialized });
  },

  setSyncStatus: (status: SyncStatus) => {
    set({ syncStatus: status });
  },

  setSessions: (sessions: Session[]) => {
    set({ 
      sessions,
      activeSessionId: sessions[0]?.id ?? null,
    });
  },

  createSession: () => {
    const id = generateId();
    const newSession: Session = {
      id,
      title: "New Chat",
      hasNotes: false,
      createdAt: new Date(),
    };
    set((state) => ({
      sessions: [newSession, ...state.sessions],
      activeSessionId: id,
    }));
    return id;
  },

  deleteSession: (id: string) => {
    set((state) => {
      const remaining = state.sessions.filter((s) => s.id !== id);
      const newActive =
        state.activeSessionId === id
          ? (remaining[0]?.id ?? null)
          : state.activeSessionId;
      return { sessions: remaining, activeSessionId: newActive };
    });
  },

  renameSession: (id: string, title: string) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === id ? { ...s, title: title.trim() || "New Chat" } : s
      ),
    }));
  },

  setActiveSession: (id: string) => {
    set({ activeSessionId: id });
  },

  setHasNotes: (id: string, hasNotes: boolean) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === id ? { ...s, hasNotes } : s
      ),
    }));
  },

  saveDocument: (sessionId: string, blocks: unknown[]) => {
    set((state) => ({
      documents: { ...state.documents, [sessionId]: blocks },
    }));
  },

  saveChatMessages: (sessionId: string, messages: StoredMessage[]) => {
    set((state) => ({
      chatMessages: { ...state.chatMessages, [sessionId]: messages },
    }));
  },

  setPendingAppend: (sessionId: string, content: string, contextLabel: string) => {
    set({
      pendingAppend: {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        sessionId,
        content,
        contextLabel,
      },
    });
  },

  clearPendingAppend: () => {
    set({ pendingAppend: null });
  },

  setPendingChatPrompt: (sessionId, selectedText, skill) => {
    set({
      pendingChatPrompt: {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        sessionId,
        selectedText,
        skill,
      },
    });
  },

  clearPendingChatPrompt: () => {
    set({ pendingChatPrompt: null });
  },

  setPendingChatDraft: (sessionId, text) => {
    set({
      pendingChatDraft: {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        sessionId,
        text,
      },
    });
  },

  clearPendingChatDraft: () => {
    set({ pendingChatDraft: null });
  },

  reset: () => {
    set(INITIAL_STATE);
  },
}));
