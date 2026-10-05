import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageCircle, Send, User, Clock, Loader2 } from "lucide-react";
import { useAuth, supabase } from "@/lib/supabase";
import { listMessages, sendMessage, type Message } from "@/lib/messages";

export default function MessagesPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const recipientId = searchParams.get("recipientId");
  const listingId = searchParams.get("listingId");
  const listingTitle = searchParams.get("listingTitle");
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    const loadMessages = async () => {
      if (!user?.id) {
        setAllMessages([]);
        setError("Sign in to access your messages.");
        setIsLoading(false);
        return;
      }
      if (!supabase) {
        setAllMessages([]);
        setError("Persistent messaging is unavailable because Supabase is not configured.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const result = await listMessages({ user_id: user.id });
        if (active) setAllMessages(result);
      } catch (cause) {
        if (active) {
          setAllMessages([]);
          setError(cause instanceof Error ? `Messages are unavailable: ${cause.message}` : "Messages are unavailable because message storage could not be reached.");
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void loadMessages();
    return () => {
      active = false;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!supabase || !user?.id) return;
    const appendMessage = (message: Message) => {
      setAllMessages((current) => current.some((existing) => existing.id === message.id)
        ? current
        : [...current, message].sort((a, b) => a.created_at.localeCompare(b.created_at)));
    };
    const channel = supabase.channel(`user-messages-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `to_user_id=eq.${user.id}` }, ({ new: row }) => appendMessage(row as Message))
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `from_user_id=eq.${user.id}` }, ({ new: row }) => appendMessage(row as Message))
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [user?.id]);

  const threadMessages = useMemo(
    () => recipientId
      ? allMessages.filter((message) =>
          (message.from_user_id === user?.id && message.to_user_id === recipientId) ||
          (message.from_user_id === recipientId && message.to_user_id === user?.id)
        )
      : [],
    [allMessages, recipientId, user?.id],
  );

  const conversations = useMemo(() => {
    if (!user?.id) return [];
    return [...new Set(allMessages
      .map((message) => message.from_user_id === user.id ? message.to_user_id : message.from_user_id)
      .filter((id): id is string => Boolean(id && id !== user.id)))];
  }, [allMessages, user?.id]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [threadMessages.length]);

  const onSend = async () => {
    const body = text.trim();
    if (!body || isSending) return;
    if (!user?.id || !recipientId || !supabase) {
      setError("Select a valid conversation and sign in before sending.");
      return;
    }
    if (recipientId === user.id) {
      setError("You cannot send a message to your own account.");
      return;
    }

    setIsSending(true);
    setError(null);
    try {
      const hasListingContext = listingId && listingTitle;
      const alreadyContextualized = threadMessages.some((message) =>
        message.body.includes(`Regarding listing "${listingTitle}" (${listingId})`)
      );
      const storedBody = hasListingContext && !alreadyContextualized
        ? `Regarding listing "${listingTitle}" (${listingId})\n\n${body}`
        : body;
      const sent = await sendMessage({
        from_user_id: user.id,
        to_user_id: recipientId,
        body: storedBody,
      });
      setAllMessages((current) => [...current, sent]);
      setText("");
    } catch (cause) {
      setError(cause instanceof Error ? `Message was not sent: ${cause.message}` : "Message was not sent because message storage is unavailable.");
    } finally {
      setIsSending(false);
    }
  };

  const openConversation = (id: string) => setSearchParams({ recipientId: id });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { delayChildren: 0.1, staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" as const } },
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 max-w-4xl mx-auto">
      <motion.div variants={itemVariants}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            <MessageCircle className="w-8 h-8 text-blue-400" />
            Messages
          </h1>
          <p className="text-gray-400 text-lg">Private conversations with other EcoSort users</p>
        </div>
      </motion.div>

      {error && <div role="alert" className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}

      <motion.div variants={itemVariants}>
        <Card className="h-[70vh] flex flex-col border-0 bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm">
          <CardHeader className="border-b border-slate-700/50">
            <CardTitle className="text-white flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-green-400" />
              {recipientId ? `Conversation with ${recipientId}` : "Your conversations"}
            </CardTitle>
            <CardDescription className="text-gray-400">
              {listingId
                ? `About listing: ${listingTitle || listingId}. Listing context is included in your first message.`
                : recipientId
                  ? "Messages are saved to your account and this conversation."
                  : "Choose a conversation to view its saved messages."}
            </CardDescription>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0 min-h-0">
            {!recipientId ? (
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2 py-8 text-gray-400"><Loader2 className="w-4 h-4 animate-spin" />Loading conversations…</div>
                ) : conversations.length ? conversations.map((id) => (
                  <Button key={id} variant="outline" onClick={() => openConversation(id)} className="w-full justify-start border-slate-600 bg-slate-800/40 text-white hover:bg-slate-700">
                    <User className="w-4 h-4 mr-2" /> {id}
                  </Button>
                )) : (
                  <div className="text-center py-12">
                    <MessageCircle className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">No conversations yet</p>
                    <p className="text-gray-500 text-sm">Open a marketplace listing and choose Message Seller to start a saved conversation.</p>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div ref={listRef} className="flex-1 overflow-y-auto space-y-4 p-6 bg-slate-900/20">
                  <Button variant="ghost" onClick={() => setSearchParams({})} className="text-gray-300">← All conversations</Button>
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2 py-8 text-gray-400"><Loader2 className="w-4 h-4 animate-spin" />Loading messages…</div>
                  ) : threadMessages.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">Start this conversation with a message.</div>
                  ) : threadMessages.map((message) => {
                    const ownMessage = message.from_user_id === user?.id;
                    return (
                      <div key={message.id} className={`flex gap-3 ${ownMessage ? "justify-end" : "justify-start"}`}>
                        {!ownMessage && <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0"><User className="w-4 h-4 text-white" /></div>}
                        <div className={`max-w-[80%] p-4 rounded-2xl ${ownMessage ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white" : "bg-gradient-to-r from-slate-700 to-slate-800 text-white border border-slate-600"}`}>
                          <div className="text-sm leading-relaxed whitespace-pre-wrap">{message.body}</div>
                          <div className={`text-[10px] opacity-70 mt-2 flex items-center gap-1 ${ownMessage ? "justify-end" : "justify-start"}`}>
                            <Clock className="w-3 h-3" />{new Date(message.created_at).toLocaleString()}
                          </div>
                        </div>
                        {ownMessage && <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0"><User className="w-4 h-4 text-white" /></div>}
                      </div>
                    );
                  })}
                </div>
                <div className="p-6 border-t border-slate-700/50 bg-slate-800/30">
                  <div className="flex gap-3">
                    <Input
                      value={text}
                      onChange={(event) => setText(event.target.value)}
                      placeholder="Type your message…"
                      disabled={isSending || isLoading || !user?.id || !supabase}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          void onSend();
                        }
                      }}
                      className="bg-slate-700/50 border-slate-600 text-white placeholder-gray-400 focus:border-blue-500 disabled:opacity-50"
                    />
                    <Button onClick={() => void onSend()} disabled={isSending || isLoading || !text.trim() || !user?.id || !supabase} className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg px-6">
                      {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
