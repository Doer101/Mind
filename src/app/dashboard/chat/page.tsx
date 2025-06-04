"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Send, MessageCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface ChatMessage {
  id: string;
  content: string;
  response: string;
  created_at: string;
}

export default function ChatPage() {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    fetchChatHistory();
  }, []);

  const fetchChatHistory = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

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

    // Prevent duplicate submissions
    if (isSubmitting || !message.trim()) return;

    setIsSubmitting(true);
    setIsLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check if this message already exists
      const { data: existingMessage } = await supabase
        .from("chat_messages")
        .select("id")
        .eq("user_id", user.id)
        .eq("content", message.trim())
        .limit(1);

      if (existingMessage && existingMessage.length > 0) {
        toast({
          title: "Duplicate Message",
          description:
            "You've already sent this message. Please try a different message.",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      setResponse(data.response);

      // Store in database
      const { error: insertError } = await supabase
        .from("chat_messages")
        .insert({
          user_id: user.id,
          content: message.trim(),
          response: data.response,
        })
        .select()
        .single();

      if (insertError) {
        if (insertError.code === "23505") {
          // Unique violation error code
          toast({
            title: "Duplicate Message",
            description:
              "You've already sent this message. Please try a different message.",
            variant: "destructive",
          });
        } else {
          throw insertError;
        }
        return;
      }

      // Refresh history
      await fetchChatHistory();

      toast({
        title: "Success",
        description: "Message sent successfully",
      });

      // Clear form
      setMessage("");
      setResponse("");
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-semibold tracking-tight">MuseBot Chat</h1>
      </div>

      <div className="space-y-6">
        {/* Chat Form */}
        <Card>
          <CardHeader>
            <CardTitle>Chat with MuseBot</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Textarea
                placeholder="Type your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[100px]"
                disabled={isLoading}
              />
              <Button
                type="submit"
                disabled={isLoading || !message.trim() || isSubmitting}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Message
                  </>
                )}
              </Button>
            </form>

            {response && (
              <div className="mt-6 p-4 rounded-lg bg-muted">
                <h3 className="font-semibold mb-2">MuseBot's Response:</h3>
                <p className="whitespace-pre-wrap">{response}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat History */}
        <Card>
          <CardHeader>
            <CardTitle>Chat History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : chatHistory.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No chat history yet
              </p>
            ) : (
              <div className="space-y-4">
                {chatHistory.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="mb-2">
                      <h4 className="font-medium">Your Message:</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {entry.content}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium">MuseBot's Response:</h4>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {entry.response}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
