"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import {
  Send,
  ChevronDown,
  ChevronRight,
  Paperclip,
  MessageSquare,
  Square,
  AlertCircle,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { ScrivaWordmark } from "@/components/ui/ScrivaWordmark";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/atom-one-dark.css";
import { SKILL_PROMPTS, parseSkillMessage } from "@/lib/skills";
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

interface ChatPanelProps {
  sidebarOpen?: boolean;
  onExpandSidebar?: () => void;
}

export default function ChatPanel({
  sidebarOpen = true,
  onExpandSidebar,
}: ChatPanelProps) {
  const {
    activeSessionId,
    sessions,
    chatMessages,
    saveChatMessages,
    setPendingAppend,
    pendingChatPrompt,
    clearPendingChatPrompt,
    pendingChatDraft,
    clearPendingChatDraft,
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
    id: sessionId, // Use session ID to maintain separate chat states
    initialMessages: storedMessages,
    body: { model },
    onFinish: (message) => {
      // Save all messages including the new one
      if (activeSessionId) {
        const allMessages = [...messages, message];
        saveChatMessages(activeSessionId, allMessages as StoredMessage[]);
      }
    },
  });

  // Handle block text drafted from notepad drag handle → prefill chat input
  useEffect(() => {
    if (!pendingChatDraft || pendingChatDraft.sessionId !== activeSessionId)
      return;
    setInput(pendingChatDraft.text);
    clearPendingChatDraft();
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, [pendingChatDraft, activeSessionId, setInput, clearPendingChatDraft]);

  // Handle incoming skill prompts from notepad selection
  useEffect(() => {
    if (!pendingChatPrompt || pendingChatPrompt.sessionId !== activeSessionId)
      return;

    const { selectedText, skill } = pendingChatPrompt;
    const { userMessage, systemInjection } = SKILL_PROMPTS[skill](selectedText);

    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    append(
      { role: "user", content: userMessage },
      { body: { model, systemInjection } },
    );
    clearPendingChatPrompt();
  }, [
    pendingChatPrompt,
    activeSessionId,
    append,
    clearPendingChatPrompt,
    model,
  ]);

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
      {/* Top bar — model selector (+ collapsed sidebar expand trigger) */}
      <div
        className="flex items-center justify-between px-4 h-14 flex-shrink-0 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        {/* Expand trigger — only when sidebar is hidden */}
        {!sidebarOpen && (
          <button
            onClick={onExpandSidebar}
            className="flex items-center gap-2 pr-3 py-1.5 rounded-lg transition-colors duration-150 hover:bg-[rgba(13,148,136,0.08)] group mr-1"
            title="Expand sidebar"
          >
            <ChevronRight
              className="w-3.5 h-3.5 transition-colors duration-150 group-hover:text-[var(--color-scriva-accent)]"
              style={{ color: "var(--muted-foreground)" }}
            />
            <ScrivaWordmark size="md" />
          </button>
        )}

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
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5 scriva-scroll">
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
              parseSkillMessage(message.content) ? (
                <SkillMessageBubble content={message.content} />
              ) : (
                <div
                  className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed"
                  style={{
                    backgroundColor: "var(--secondary)",
                    color: "var(--foreground)",
                  }}
                >
                  {message.content}
                </div>
              )
            ) : (
              <div className="max-w-[92%] group/msg relative">
                <div
                  className="text-sm leading-7 assistant-message-content prose-scriva"
                  style={{ color: "var(--foreground)" }}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                    components={{
                      p: ({ children }) => (
                        <p className="mb-3 last:mb-0">{children}</p>
                      ),
                      strong: ({ children }) => (
                        <strong
                          className="font-semibold"
                          style={{ color: "var(--foreground)" }}
                        >
                          {children}
                        </strong>
                      ),
                      em: ({ children }) => (
                        <em className="italic">{children}</em>
                      ),
                      ul: ({ children }) => (
                        <ul className="mb-3 space-y-1 pl-4 list-disc">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="mb-3 space-y-1 pl-4 list-decimal">
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => (
                        <li className="leading-relaxed">{children}</li>
                      ),
                      h1: ({ children }) => (
                        <h1 className="text-base font-bold mb-2 mt-3">
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-sm font-bold mb-2 mt-3">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-sm font-semibold mb-1 mt-2">
                          {children}
                        </h3>
                      ),
                      pre: ({ children }) => {
                        const codeEl = children as React.ReactElement<{
                          className?: string;
                        }>;
                        const cls = codeEl?.props?.className ?? "";
                        const lang =
                          cls
                            .split(" ")
                            .find((c) => c.startsWith("language-"))
                            ?.replace("language-", "") ?? "";
                        return (
                          <div
                            className="my-3 rounded-lg overflow-hidden border"
                            style={{
                              borderColor: "rgba(255,255,255,0.08)",
                              backgroundColor: "#282c34",
                            }}
                          >
                            {lang && (
                              <div
                                className="flex items-center px-4 py-1.5 border-b text-[11px] font-mono"
                                style={{
                                  borderColor: "rgba(255,255,255,0.08)",
                                  color: "var(--muted-foreground)",
                                  backgroundColor: "rgba(0,0,0,0.25)",
                                }}
                              >
                                {lang}
                              </div>
                            )}
                            <pre
                              className="overflow-x-auto px-4 py-3 text-xs"
                              style={{ margin: 0, background: "transparent" }}
                            >
                              {children}
                            </pre>
                          </div>
                        );
                      },
                      code: ({ children, className }) => {
                        if (className)
                          return <code className={className}>{children}</code>;
                        return (
                          <code
                            className="rounded px-1.5 py-0.5 text-xs font-mono"
                            style={{
                              backgroundColor: "rgba(255,255,255,0.08)",
                              color: "var(--foreground)",
                            }}
                          >
                            {children}
                          </code>
                        );
                      },
                      table: ({ children }) => (
                        <div className="overflow-x-auto my-3">
                          <table
                            className="w-full text-xs border-collapse"
                            style={{
                              borderColor: "rgba(255,255,255,0.08)",
                            }}
                          >
                            {children}
                          </table>
                        </div>
                      ),
                      thead: ({ children }) => (
                        <thead
                          style={{
                            backgroundColor: "rgba(255,255,255,0.04)",
                          }}
                        >
                          {children}
                        </thead>
                      ),
                      tbody: ({ children }) => <tbody>{children}</tbody>,
                      tr: ({ children }) => (
                        <tr
                          className="border-b"
                          style={{ borderColor: "rgba(255,255,255,0.06)" }}
                        >
                          {children}
                        </tr>
                      ),
                      th: ({ children }) => (
                        <th
                          className="px-3 py-2 text-left font-semibold border-r last:border-r-0"
                          style={{
                            borderColor: "rgba(255,255,255,0.06)",
                            color: "var(--foreground)",
                          }}
                        >
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td
                          className="px-3 py-2 border-r last:border-r-0"
                          style={{
                            borderColor: "rgba(255,255,255,0.06)",
                            color: "var(--foreground)",
                          }}
                        >
                          {children}
                        </td>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote
                          className="border-l-2 pl-3 my-2 italic opacity-70"
                          style={{ borderColor: "var(--color-scriva-accent)" }}
                        >
                          {children}
                        </blockquote>
                      ),
                      hr: () => <hr className="my-3 opacity-10" />,
                      a: ({ children, href }) => (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline underline-offset-2"
                          style={{ color: "var(--color-scriva-accent)" }}
                        >
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
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

function SkillMessageBubble({ content }: { content: string }) {
  const parsed = parseSkillMessage(content);
  if (!parsed) return null;

  const { skillName, selectedText } = parsed;
  const truncated =
    selectedText.length > 90 ? selectedText.slice(0, 90) + "..." : selectedText;

  return (
    <div
      className="max-w-[80%] rounded-xl border overflow-hidden"
      style={{
        borderColor: "rgba(13, 148, 136, 0.35)",
        backgroundColor: "var(--secondary)",
      }}
    >
      <div
        className="flex items-center gap-1.5 px-3 py-2 border-b"
        style={{
          borderColor: "rgba(13, 148, 136, 0.2)",
          backgroundColor: "rgba(13, 148, 136, 0.06)",
        }}
      >
        <Paperclip
          className="w-3 h-3 flex-shrink-0"
          style={{ color: "var(--color-scriva-accent)" }}
        />
        <span
          className="text-[11px] font-semibold tracking-wide"
          style={{ color: "var(--color-scriva-accent)" }}
        >
          From Notepad · {skillName}
        </span>
      </div>
      <div className="px-3 py-2.5">
        <p
          className="text-sm leading-relaxed italic"
          style={{ color: "var(--foreground)", opacity: 0.75 }}
        >
          &ldquo;{truncated}&rdquo;
        </p>
      </div>
    </div>
  );
}
