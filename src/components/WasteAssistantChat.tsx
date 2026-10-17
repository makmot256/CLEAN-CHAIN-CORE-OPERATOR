import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send } from "lucide-react";
import { askAssistant, type ChatMessage } from "@/lib/assistant";

const GREETING: ChatMessage = {
  role: "assistant",
  content:
    "Hello! I'm your waste management assistant. Ask me about sorting plastics, recycling, or how CleanChain rewards work.",
};

const SUGGESTIONS = [
  "How do I properly sort plastic waste?",
  "How do I earn sats on CleanChain?",
  "Which plastics can be recycled?",
];

const WasteAssistantChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || loading) return;

    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      // The greeting is UI-only; don't send it as model history.
      const reply = await askAssistant(next.slice(1));
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send(input);
  };

  return (
    <div>
      <div
        ref={scrollRef}
        className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 h-80 mb-4 overflow-y-auto"
        aria-live="polite"
      >
        <div className="space-y-3">
          {messages.map((m, i) => (
            <div
              key={i}
              className={
                m.role === "assistant"
                  ? "bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg max-w-[85%]"
                  : "bg-white dark:bg-gray-700 p-3 rounded-lg max-w-[85%] ml-auto"
              }
            >
              <p className="text-sm whitespace-pre-wrap dark:text-gray-200">
                {m.content}
              </p>
            </div>
          ))}
          {loading && (
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg w-fit">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
            </div>
          )}
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
        </div>
      </div>

      {messages.length === 1 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {SUGGESTIONS.map((s) => (
            <Button
              key={s}
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => send(s)}
              disabled={loading}
            >
              {s}
            </Button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex space-x-2">
        <Input
          placeholder="Ask about waste management..."
          className="flex-1"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={2000}
          disabled={loading}
        />
        <Button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700"
          disabled={loading || !input.trim()}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          <span className="ml-2">Send</span>
        </Button>
      </form>
    </div>
  );
};

export default WasteAssistantChat;
