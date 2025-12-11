"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Send, MessageCircle, Bot, User } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  content: string;  // User's message
  response: string; // AI's response
  created_at: string;
}

export default function ChatPage() {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  // Initialize Supabase client only in browser using lazy initializer
  const [supabase] = useState(() => typeof window !== 'undefined' ? createClient() : null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchChatHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchChatHistory = async () => {
    try {
      if (!supabase) return;
      
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setChatHistory(data || []);
    } catch (error) {
      console.error("Error fetching chat history:", error);
      toast({
        title: "Error",
        description: "Failed to load chat history",
        variant: "destructive",
      });
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting || !message.trim() || !supabase) return;

    setIsSubmitting(true);
    setIsLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Call the API - it will handle saving to database
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get response");
      }

      const data = await response.json();

      // Refresh chat history to show the new message
      await fetchChatHistory();
      setMessage("");
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 h-[calc(100vh-4rem)] flex flex-col bg-black text-white">
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle className="h-6 w-6 text-white" />
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          MuseBot Chat
        </h1>
      </div>

      <Card className="flex-1 flex flex-col bg-black/70 border-none text-white">
        <CardContent className="flex-1 flex flex-col p-4">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {isLoadingHistory ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              </div>
            ) : chatHistory.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-white/70">
                  No messages yet. Start a conversation!
                </p>
              </div>
            ) : (
              chatHistory.map((entry) => (
                <div key={entry.id} className="space-y-4">
                  {/* User Message */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="bg-white/10 rounded-2xl rounded-tl-none px-4 py-2">
                        <p className="text-sm text-white">{entry.content}</p>
                      </div>
                      <p className="text-xs text-white/70 mt-1">
                        {new Date(entry.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  {/* Bot Response */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="bg-white/10 rounded-2xl rounded-tl-none px-4 py-2">
                        <p className="text-sm whitespace-pre-wrap text-white">
                          {entry.response}
                        </p>
                      </div>
                      <p className="text-xs text-white/70 mt-1">
                        {new Date(entry.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Textarea
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[60px] resize-none bg-black/50 text-white placeholder-white/60 border-white/20"
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <Button
              type="submit"
              size="icon"
              className="h-[60px] w-[60px] border border-white text-white hover:bg-white hover:text-black"
              disabled={isLoading || !message.trim() || isSubmitting}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-white" />
              ) : (
                <Send className="h-5 w-5 text-white" />
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
