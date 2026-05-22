"use client";

import { Send, ChevronDown, Paperclip } from "lucide-react";

const MOCK_MESSAGES = [
  {
    id: "1",
    role: "user",
    content: "Can you help me structure a competitive analysis for a new productivity tool?",
  },
  {
    id: "2",
    role: "assistant",
    content:
      "Absolutely. A strong competitive analysis for a productivity tool should cover four dimensions: feature parity, positioning, pricing, and target audience. Here's how I'd structure it:\n\n1. **Direct Competitors** — tools solving the exact same problem\n2. **Indirect Competitors** — tools users might use instead\n3. **Feature Matrix** — side-by-side comparison of key capabilities\n4. **Positioning Map** — where each product sits on key axes\n5. **Your Differentiation** — where you win and why\n\nWant me to start filling this in for your specific tool?",
  },
  {
    id: "3",
    role: "user",
    content: "Yes, let's focus on the thinking-to-document workflow space.",
  },
];

export default function ChatPanel() {
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
        <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
          Chat
        </span>
        <button
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors duration-150 hover:bg-white/5"
          style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
        >
          Claude 3.5 Sonnet
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {MOCK_MESSAGES.map((message) => (
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
                  className="text-sm leading-7 whitespace-pre-wrap"
                  style={{ color: "var(--foreground)" }}
                >
                  {message.content}
                </div>
                {/* Append button — visible on hover */}
                <div className="flex justify-end mt-2 opacity-0 group-hover/msg:opacity-100 transition-opacity duration-150">
                  <button
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors duration-150"
                    style={{
                      borderColor: "var(--color-scriva-accent)",
                      color: "var(--color-scriva-accent)",
                      backgroundColor: "rgba(13, 148, 136, 0.06)",
                    }}
                    title="Append to notepad"
                  >
                    <Paperclip className="w-3 h-3" />
                    Append to notepad
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input area */}
      <div
        className="flex-shrink-0 px-4 py-4 border-t"
        style={{ borderColor: "var(--border)" }}
      >
        <div
          className="flex items-end gap-2 rounded-xl border px-4 py-3"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--secondary)",
          }}
        >
          <textarea
            placeholder="Ask anything..."
            rows={1}
            className="flex-1 bg-transparent text-sm resize-none outline-none leading-relaxed"
            style={{ color: "var(--foreground)" }}
          />
          <button
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-150"
            style={{
              backgroundColor: "var(--color-scriva-accent)",
              color: "#FFFFFF",
            }}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
