"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Send, Lightbulb } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface IdeaEntry {
  id: string;
  title: string;
  description: string;
  created_at: string;
}

export default function IdeasPage() {
  const [idea, setIdea] = useState("");
  const [expandedIdea, setExpandedIdea] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [ideaHistory, setIdeaHistory] = useState<IdeaEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    fetchIdeaHistory();
  }, []);

  const fetchIdeaHistory = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("ideas")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setIdeaHistory(data || []);
    } catch (error) {
      console.error("Error fetching idea history:", error);
      toast({
        title: "Error",
        description: "Failed to load idea history",
        variant: "destructive",
      });
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent duplicate submissions
    if (isSubmitting || !idea.trim()) return;

    setIsSubmitting(true);
    setIsLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check if this idea already exists
      const { data: existingIdeas } = await supabase
        .from("ideas")
        .select("id")
        .eq("user_id", user.id)
        .eq("title", idea.substring(0, 100) + "...")
        .limit(1);

      if (existingIdeas && existingIdeas.length > 0) {
        toast({
          title: "Duplicate Idea",
          description:
            "This idea has already been expanded. Please try a different idea.",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch("/api/ai/expand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: idea }),
      });

      if (!response.ok) {
        throw new Error("Failed to expand idea");
      }

      const data = await response.json();
      setExpandedIdea(data.expansion);

      // Store in database
      const { error: insertError } = await supabase
        .from("ideas")
        .insert({
          user_id: user.id,
          title: idea.substring(0, 100) + "...",
          description: data.expansion,
        })
        .select()
        .single();

      if (insertError) {
        if (insertError.code === "23505") {
          // Unique violation error code
          toast({
            title: "Duplicate Idea",
            description:
              "This idea has already been expanded. Please try a different idea.",
            variant: "destructive",
          });
        } else {
          throw insertError;
        }
        return;
      }

      // Refresh history
      await fetchIdeaHistory();

      toast({
        title: "Success",
        description: "Idea expanded successfully",
      });

      // Clear form
      setIdea("");
      setExpandedIdea("");
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to expand idea",
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
        <Lightbulb className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-semibold tracking-tight">Idea Vault</h1>
      </div>

      <div className="space-y-6">
        {/* Idea Form */}
        <Card>
          <CardHeader>
            <CardTitle>Expand Your Ideas</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Textarea
                placeholder="Enter your idea here..."
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                className="min-h-[200px]"
                disabled={isLoading}
              />
              <Button
                type="submit"
                disabled={isLoading || !idea.trim() || isSubmitting}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Expanding Idea...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Expand Idea
                  </>
                )}
              </Button>
            </form>

            {expandedIdea && (
              <div className="mt-6 p-4 rounded-lg bg-muted">
                <h3 className="font-semibold mb-2">Expanded Idea:</h3>
                <p className="whitespace-pre-wrap">{expandedIdea}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Idea History */}
        <Card>
          <CardHeader>
            <CardTitle>Idea History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : ideaHistory.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No ideas yet
              </p>
            ) : (
              <div className="space-y-4">
                {ideaHistory.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="mb-2">
                      <h4 className="font-medium">Original Idea:</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {entry.title}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium">Expanded Idea:</h4>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {entry.description}
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
