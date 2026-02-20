import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageCircle, Send, Bot, User, Clock, Loader2 } from "lucide-react";

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  body: string;
  timestamp: Date;
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const scrollBottom = () => {
    setTimeout(() => {
      listRef.current?.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 50);
  };

  const onSend = async () => {
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      sender: "user",
      body: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setText("");
    setIsLoading(true);
    scrollBottom();

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.body }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      const botMessage: ChatMessage = {
        id: crypto.randomUUID(),
        sender: "bot",
        body: data.reply || "Sorry, I couldn't process your message.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
      scrollBottom();
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        sender: "bot",
        body: "Sorry, I'm having trouble connecting. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      scrollBottom();
    } finally {
      setIsLoading(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.1,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 max-w-4xl mx-auto"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            <MessageCircle className="w-8 h-8 text-blue-400" />
            AI Chat Assistant
          </h1>
          <p className="text-gray-400 text-lg">
            Chat with our AI assistant powered by Groq
          </p>
        </div>
      </motion.div>

      {/* Chat Interface */}
      <motion.div variants={itemVariants}>
        <Card className="h-[70vh] flex flex-col border-0 bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm">
          <CardHeader className="border-b border-slate-700/50">
            <CardTitle className="text-white flex items-center gap-2">
              <Bot className="w-5 h-5 text-green-400" />
              Groq AI Assistant
            </CardTitle>
            <CardDescription className="text-gray-400">
              Ask me anything about recycling, sustainability, or general questions
            </CardDescription>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0">
            <div
              ref={listRef}
              className="flex-1 overflow-y-auto space-y-4 p-6 bg-slate-900/20"
            >
              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <MessageCircle className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">Start a conversation</p>
                  <p className="text-gray-500 text-sm">Ask me anything about recycling or sustainability</p>
                </motion.div>
              )}
              {messages.map((m, index) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex gap-3 ${
                    m.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {m.sender === "bot" && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[70%] p-4 rounded-2xl ${
                      m.sender === "user"
                        ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white"
                        : "bg-gradient-to-r from-slate-700 to-slate-800 text-white border border-slate-600"
                    }`}
                  >
                    <div className="text-sm leading-relaxed">{m.body}</div>
                    <div className={`text-[10px] opacity-70 mt-2 flex items-center gap-1 ${
                      m.sender === "user" ? "justify-end" : "justify-start"
                    }`}>
                      <Clock className="w-3 h-3" />
                      {m.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                  {m.sender === "user" && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </motion.div>
              ))}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 justify-start"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-gradient-to-r from-slate-700 to-slate-800 text-white border border-slate-600 p-4 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            <div className="p-6 border-t border-slate-700/50 bg-slate-800/30">
              <div className="flex gap-3">
                <Input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      onSend();
                    }
                  }}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder-gray-400 focus:border-blue-500 disabled:opacity-50"
                />
                <Button
                  onClick={onSend}
                  disabled={isLoading || !text.trim()}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg px-6 disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
