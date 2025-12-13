"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Send, History } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import RippleLoader from "@/components/ui/rippleLoader";

interface FeedbackEntry {
  id: string;
  content: string;
  feedback: string;
  created_at: string;
}

export default function FeedbackPage() {
  const [content, setContent] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackHistory, setFeedbackHistory] = useState<FeedbackEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    fetchFeedbackHistory();
  }, []);

  const fetchFeedbackHistory = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("writing_feedback")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFeedbackHistory(data || []);
    } catch (error) {
      console.error("Error fetching feedback history:", error);
      toast({
        title: "Error",
        description: "Failed to load feedback history",
        variant: "destructive",
      });
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent duplicate submissions
    if (isSubmitting || !content.trim()) return;

    setIsSubmitting(true);
    setIsLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check if this content already exists
      const { data: existingFeedback } = await supabase
        .from("writing_feedback")
        .select("id")
        .eq("user_id", user.id)
        .eq("content", content.trim())
        .limit(1);

      if (existingFeedback && existingFeedback.length > 0) {
        toast({
          title: "Duplicate Content",
          description:
            "You've already received feedback for this content. Please try different content.",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch("/api/ai/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error("Failed to get feedback");
      }

      const data = await response.json();
      setFeedback(data.feedback);

      // Store in database
      const { error: insertError } = await supabase
        .from("writing_feedback")
        .insert({
          user_id: user.id,
          content: content.trim(),
          feedback: data.feedback,
        })
        .select()
        .single();

      if (insertError) {
        if (insertError.code === "23505") {
          // Unique violation error code
          toast({
            title: "Duplicate Content",
            description:
              "You've already received feedback for this content. Please try different content.",
            variant: "destructive",
          });
        } else {
          throw insertError;
        }
        return;
      }

      // Refresh history
      await fetchFeedbackHistory();

      toast({
        title: "Success",
        description: "Feedback generated successfully",
      });

      // Clear form
      setContent("");
      setFeedback("");
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to generate feedback",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6 bg-black text-white">
      <div className="flex items-center gap-2">
        <History className="h-6 w-6 text-white" />
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Writing Feedback
        </h1>
      </div>

      <div className="space-y-6">
        {/* Feedback Form */}
        <Card className="bg-black/70 border-none text-white">
          <CardHeader>
            <CardTitle className="text-white">Get Writing Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Textarea
                placeholder="Paste your writing here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[200px] bg-black/50 text-white placeholder-white/60 border-white/20"
                disabled={isLoading}
              />
              <Button
                type="submit"
                disabled={isLoading || !content.trim() || isSubmitting}
                className="border border-white text-white hover:bg-white hover:text-black"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />
                    Generating Feedback...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4 text-white" />
                    Get Feedback
                  </>
                )}
              </Button>
            </form>

            {feedback && (
              <div className="mt-6 p-4 rounded-lg bg-black/50 border border-white/20">
                <h3 className="font-semibold mb-2 text-white">Feedback:</h3>
                <p className="whitespace-pre-wrap text-white">{feedback}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Feedback History */}
        <Card className="bg-black/70 border-none text-white">
          <CardHeader>
            <CardTitle className="text-white">Feedback History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <RippleLoader icon={<History />} size={150} duration={2} logoColor="white" />
              </div>
            ) : feedbackHistory.length === 0 ? (
              <p className="text-white/70 text-center py-8">
                No feedback history yet
              </p>
            ) : (
              <div className="space-y-4">
                {feedbackHistory.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-4 rounded-lg border border-white/20 bg-black/50 hover:bg-white/10 transition-colors"
                  >
                    <div className="mb-2">
                      <h4 className="font-medium text-white">Your Writing:</h4>
                      <p className="text-sm text-white/80 line-clamp-2">
                        {entry.content}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-white">Feedback:</h4>
                      <p className="text-sm text-white/80 line-clamp-3">
                        {entry.feedback}
                      </p>
                    </div>
                    <p className="text-xs text-white/70 mt-2">
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
