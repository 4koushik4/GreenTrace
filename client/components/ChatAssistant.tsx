import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { Bot, LoaderCircle, MessageCircle, Send, Sparkles, X } from "lucide-react";

type ChatMessage = {
  sender: "user" | "assistant";
  body: string;
};

const starterMessage: ChatMessage = {
  sender: "assistant",
  body: "Hi! I’m your Eco Assistant. Ask me anything about recycling, waste sorting, or living more sustainably.",
};

const suggestions = [
  "How do I recycle batteries?",
  "What can go in a compost bin?",
  "Share a quick sustainability tip",
];

const ChatAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([starterMessage]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const sendMessage = async (message: string) => {
    const body = message.trim();
    if (!body || isSending) return;

    const history = messages;
    setMessages((current) => [...current, { sender: "user", body }]);
    setInput("");
    setIsSending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: body, history }),
      });
      const data: { reply?: string; error?: string } = await response.json();
      const reply = response.ok
        ? data.reply
        : data.reply || data.error || "The assistant is unavailable right now. Please try again.";

      setMessages((current) => [
        ...current,
        { sender: "assistant", body: reply || "I couldn’t generate a response. Please try again." },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        { sender: "assistant", body: "I couldn’t connect just now. Please try again in a moment." },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage(input);
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage(input);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {isOpen && (
        <section
          aria-labelledby="eco-assistant-title"
          aria-modal="false"
          className="flex h-[min(640px,calc(100dvh-112px))] w-[min(390px,calc(100vw-40px))] flex-col overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-[0_24px_80px_-20px_rgba(15,61,39,0.38)] dark:border-slate-700 dark:bg-slate-950"
          role="dialog"
        >
          <header className="flex items-center justify-between bg-gradient-to-r from-emerald-700 to-green-600 px-5 py-4 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/20">
                <Bot aria-hidden="true" className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold tracking-tight" id="eco-assistant-title">Eco Assistant</h2>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-emerald-50">
                  <span className="h-1.5 w-1.5 rounded-full bg-lime-300" />
                  Here to help you make greener choices
                </p>
              </div>
            </div>
            <button
              aria-label="Close chat"
              className="rounded-full p-2 text-white/90 transition hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
          </header>

          <div
            aria-live="polite"
            aria-relevant="additions text"
            className="flex-1 space-y-4 overflow-y-auto bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-50/70 via-white to-white p-4 dark:from-emerald-950/30 dark:via-slate-950 dark:to-slate-950"
            role="log"
          >
            {messages.map((message, index) => (
              <div
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                key={`${index}-${message.sender}`}
              >
                {message.sender === "assistant" && (
                  <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                    <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
                  </div>
                )}
                <p
                  className={`max-w-[82%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    message.sender === "user"
                      ? "rounded-br-md bg-emerald-700 text-white shadow-sm"
                      : "rounded-bl-md border border-emerald-100 bg-white text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                  }`}
                >
                  {message.body}
                </p>
              </div>
            ))}
            {messages.length === 1 && !isSending && (
              <div className="ml-9 flex flex-col items-start gap-2 pt-1">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Try asking</p>
                {suggestions.map((suggestion) => (
                  <button
                    className="rounded-full border border-emerald-200 bg-white px-3 py-2 text-left text-xs text-emerald-800 transition hover:border-emerald-400 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-emerald-200 dark:hover:bg-slate-800"
                    key={suggestion}
                    onClick={() => void sendMessage(suggestion)}
                    type="button"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
            {isSending && (
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400" role="status">
                <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin text-emerald-600" />
                Eco Assistant is thinking…
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="border-t border-slate-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-950" onSubmit={handleSubmit}>
            <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 transition focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:focus-within:ring-emerald-900/40">
              <label className="sr-only" htmlFor="eco-assistant-input">Message Eco Assistant</label>
              <textarea
                className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100"
                id="eco-assistant-input"
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Ask anything…"
                ref={inputRef}
                rows={1}
                value={input}
              />
              <button
                aria-label="Send message"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                disabled={!input.trim() || isSending}
                type="submit"
              >
                <Send aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
            <p className="pt-2 text-center text-[10px] text-slate-400">Enter to send · Shift + Enter for a new line</p>
          </form>
        </section>
      )}

      <button
        aria-expanded={isOpen}
        aria-label={isOpen ? "Close Eco Assistant" : "Open Eco Assistant"}
        className="group flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-green-700 text-white shadow-[0_10px_30px_-8px_rgba(5,150,105,0.75)] ring-4 ring-white/80 transition duration-200 hover:-translate-y-1 hover:scale-105 hover:shadow-[0_14px_36px_-8px_rgba(5,150,105,0.8)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300 dark:ring-slate-950"
        onClick={() => setIsOpen((open) => !open)}
        type="button"
      >
        {isOpen ? <X aria-hidden="true" className="h-6 w-6" /> : <MessageCircle aria-hidden="true" className="h-6 w-6 transition-transform group-hover:scale-110" />}
      </button>
    </div>
  );
};

export default ChatAssistant;
