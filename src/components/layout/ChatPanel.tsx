"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import {
  Send,
  ChevronDown,
  Paperclip,
  MessageSquare,
  Square,
  AlertCircle,
} from "lucide-react";
import { useChat } from "ai/react";
import type { Message } from "ai";
import { useWorkspaceStore } from "@/store/workspace";
import type { StoredMessage } from "@/store/workspace";

const MODELS = [
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
  { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
] as const;

type ModelId = (typeof MODELS)[number]["id"];

export default function ChatPanel() {
  const {
    activeSessionId,
    sessions,
    chatMessages,
    saveChatMessages,
    setPendingAppend,
    pendingChatPrompt,
    clearPendingChatPrompt,
  } = useWorkspaceStore();
  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const sessionId = activeSessionId ?? "";

  const [model, setModel] = useState<ModelId>("gemini-2.5-flash");
  const [modelOpen, setModelOpen] = useState(false);
  const modelRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const storedMessages = (chatMessages[sessionId] ?? []) as Message[];

  const {
    messages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    append,
    isLoading,
    stop,
    error,
  } = useChat({
    api: "/api/chat",
    initialMessages: storedMessages,
    body: { model },
    onFinish: () => {
      if (activeSessionId) {
        saveChatMessages(activeSessionId, messages as StoredMessage[]);
      }
    },
  });

  // Handle incoming prompts from notepad selection
  useEffect(() => {
    if (!pendingChatPrompt || pendingChatPrompt.sessionId !== activeSessionId)
      return;

    const { selectedText, action } = pendingChatPrompt;
    let prompt = selectedText;

    // Build action-specific prompts
    switch (action) {
      case "summarize":
        prompt = `Summarize the following text concisely:\n\n"${selectedText}"`;
        break;
      case "expand":
        prompt = `Expand on the following text with more detail and examples:\n\n"${selectedText}"`;
        break;
      case "rewrite":
        prompt = `Rewrite the following text to be clearer and more polished:\n\n"${selectedText}"`;
        break;
      case "ask":
      default:
        prompt = `Regarding this text from my notes:\n\n"${selectedText}"\n\nWhat are your thoughts?`;
        break;
    }

    // Auto-send the prompt
    append({ role: "user", content: prompt });
    clearPendingChatPrompt();
  }, [pendingChatPrompt, activeSessionId, append, clearPendingChatPrompt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) {
        setModelOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && input.trim()) {
        handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
      }
    }
  };

  const handleAppend = useCallback(
    (fullContent: string, messageElement?: HTMLElement) => {
      if (!activeSessionId) return;

      // Check if there's selected text within this message
      const selection = window.getSelection();
      let contentToAppend = fullContent;

      if (selection && !selection.isCollapsed && messageElement) {
        const selectedText = selection.toString().trim();
        // Verify selection is within this message element
        if (selectedText && messageElement.contains(selection.anchorNode)) {
          contentToAppend = selectedText;
        }
      }

      const label = `from chat \u2014 ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
      setPendingAppend(activeSessionId, contentToAppend, label);

      // Clear selection after append
      selection?.removeAllRanges();
    },
    [activeSessionId, setPendingAppend],
  );

  const isEmpty = messages.length === 0;

  return (
    <div
      className="flex flex-col h-full border-r"
      style={{
        backgroundColor: "var(--background)",
        borderColor: "var(--border)",
      }}
    >
      {/* Top bar — model selector */}
      <div
        className="flex items-center justify-between px-4 h-14 flex-shrink-0 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <div ref={modelRef} className="relative">
          <button
            onClick={() => setModelOpen((o) => !o)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150 hover:bg-white/5"
            style={{ color: "var(--foreground)" }}
          >
            {MODELS.find((m) => m.id === model)?.label ?? model}
            <ChevronDown
              className="w-3 h-3"
              style={{ color: "var(--muted-foreground)" }}
            />
          </button>

          {modelOpen && (
            <div
              className="absolute top-full left-0 mt-1 w-40 rounded-lg border shadow-xl z-50 overflow-hidden"
              style={{
                backgroundColor: "var(--color-scriva-sidebar)",
                borderColor: "var(--border)",
              }}
            >
              {MODELS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setModel(m.id);
                    setModelOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs transition-colors duration-100 hover:bg-white/5"
                  style={{
                    color:
                      m.id === model
                        ? "var(--color-scriva-accent)"
                        : "var(--foreground)",
                    fontWeight: m.id === model ? 600 : 400,
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
        {isEmpty && (
          <div className="flex flex-col items-center justify-center h-full gap-3 pb-8">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "rgba(13, 148, 136, 0.08)" }}
            >
              <MessageSquare
                className="w-5 h-5"
                style={{ color: "var(--color-scriva-accent)" }}
              />
            </div>
            <div className="text-center">
              <p
                className="text-sm font-medium mb-1"
                style={{ color: "var(--foreground)" }}
              >
                {activeSession?.title ?? "New Chat"}
              </p>
              <p
                className="text-xs"
                style={{ color: "var(--muted-foreground)" }}
              >
                Ask anything — ideas, analysis, explanations
              </p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {message.role === "user" ? (
              <div
                className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed"
                style={{
                  backgroundColor: "var(--secondary)",
                  color: "var(--foreground)",
                }}
              >
                {message.content}
              </div>
            ) : (
              <div className="max-w-[92%] group/msg relative">
                <div
                  className="text-sm leading-7 whitespace-pre-wrap assistant-message-content"
                  style={{ color: "var(--foreground)" }}
                >
                  {message.content}
                </div>
                {message.content && (
                  <div className="flex justify-end items-center gap-2 mt-2 opacity-0 group-hover/msg:opacity-100 transition-opacity duration-150">
                    <span
                      className="text-[10px]"
                      style={{ color: "var(--muted-foreground)", opacity: 0.6 }}
                    >
                      Select text for partial append
                    </span>
                    <button
                      onClick={(e) => {
                        const msgEl = (e.currentTarget as HTMLElement)
                          .closest(".group\\/msg")
                          ?.querySelector(
                            ".assistant-message-content",
                          ) as HTMLElement;
                        handleAppend(message.content, msgEl);
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors duration-150"
                      style={{
                        borderColor: "var(--color-scriva-accent)",
                        color: "var(--color-scriva-accent)",
                        backgroundColor: "rgba(13, 148, 136, 0.06)",
                      }}
                    >
                      <Paperclip className="w-3 h-3" />
                      Append to notepad
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Streaming indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1.5 px-3 py-2">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full animate-bounce"
                  style={{
                    backgroundColor: "var(--muted-foreground)",
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
            style={{
              backgroundColor: "rgba(239,68,68,0.08)",
              color: "#f87171",
            }}
          >
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            {error.message.includes("API key")
              ? "OpenAI API key not configured. Add OPENAI_API_KEY to .env.local."
              : "Something went wrong. Please try again."}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div
        className="flex-shrink-0 px-4 py-4 border-t"
        style={{ borderColor: "var(--border)" }}
      >
        <form
          onSubmit={handleSubmit}
          className="flex items-end gap-2 rounded-xl border px-4 py-3"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--secondary)",
          }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            rows={1}
            className="flex-1 bg-transparent text-sm resize-none outline-none leading-relaxed"
            style={{ color: "var(--foreground)", maxHeight: "160px" }}
          />
          {isLoading ? (
            <button
              type="button"
              onClick={stop}
              className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-150"
              style={{
                backgroundColor: "var(--secondary)",
                border: "1px solid var(--border)",
              }}
            >
              <Square
                className="w-3 h-3"
                style={{ color: "var(--muted-foreground)" }}
              />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 disabled:opacity-30"
              style={{
                backgroundColor: "var(--color-scriva-accent)",
                color: "#ffffff",
              }}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          )}
        </form>
        <p
          className="text-[10px] mt-1.5 text-center"
          style={{ color: "var(--muted-foreground)", opacity: 0.4 }}
        >
          Enter to send · Shift+Enter for newline
        </p>
      </div>
    </div>
  );
}
