import { create } from "zustand";

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

export interface PendingChatPrompt {
  id: string;
  sessionId: string;
  selectedText: string;
  action?: "ask" | "summarize" | "expand" | "rewrite";
}

interface WorkspaceStore {
  sessions: Session[];
  activeSessionId: string | null;
  documents: Record<string, unknown[]>;
  chatMessages: Record<string, StoredMessage[]>;
  pendingAppend: PendingAppend | null;
  pendingChatPrompt: PendingChatPrompt | null;

  createSession: () => string;
  deleteSession: (id: string) => void;
  renameSession: (id: string, title: string) => void;
  setActiveSession: (id: string) => void;
  setHasNotes: (id: string, hasNotes: boolean) => void;
  saveDocument: (sessionId: string, blocks: unknown[]) => void;
  saveChatMessages: (sessionId: string, messages: StoredMessage[]) => void;
  setPendingAppend: (sessionId: string, content: string, contextLabel: string) => void;
  clearPendingAppend: () => void;
  setPendingChatPrompt: (sessionId: string, selectedText: string, action?: PendingChatPrompt["action"]) => void;
  clearPendingChatPrompt: () => void;
}

const INITIAL_DOCUMENTS: Record<string, unknown[]> = {
  "session-1": [
    {
      type: "heading",
      props: { level: 1 },
      content: "Competitive Analysis — Thinking Tools",
    },
    {
      type: "annotated",
      props: {
        contextLabel: "from chat — May 22",
        appendedAt: new Date().toISOString(),
      },
      content: "A strong competitive analysis covers four dimensions: feature parity, positioning, pricing, and target audience.",
    },
    {
      type: "heading",
      props: { level: 2 },
      content: "Key Dimensions",
    },
    {
      type: "annotated",
      props: {
        contextLabel: "from chat — May 22",
        appendedAt: new Date().toISOString(),
      },
      content: "Direct competitors solve the exact same problem. Indirect competitors are tools users might choose instead. Map each on a positioning axis to find where you win.",
    },
  ],
};

const INITIAL_SESSIONS: Session[] = [
  {
    id: "session-1",
    title: "Product roadmap brainstorm",
    hasNotes: true,
    createdAt: new Date(),
  },
  {
    id: "session-2",
    title: "Competitive analysis",
    hasNotes: false,
    createdAt: new Date(),
  },
  {
    id: "session-3",
    title: "System design deep dive",
    hasNotes: true,
    createdAt: new Date(Date.now() - 86400000),
  },
  {
    id: "session-4",
    title: "User research synthesis",
    hasNotes: true,
    createdAt: new Date(Date.now() - 86400000),
  },
  {
    id: "session-5",
    title: "Feature prioritization",
    hasNotes: false,
    createdAt: new Date(Date.now() - 86400000),
  },
];

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
  sessions: INITIAL_SESSIONS,
  activeSessionId: "session-1",
  documents: INITIAL_DOCUMENTS,
  chatMessages: {},
  pendingAppend: null,
  pendingChatPrompt: null,

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

  setPendingChatPrompt: (sessionId, selectedText, action = "ask") => {
    set({
      pendingChatPrompt: {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        sessionId,
        selectedText,
        action,
      },
    });
  },

  clearPendingChatPrompt: () => {
    set({ pendingChatPrompt: null });
  },
}));
