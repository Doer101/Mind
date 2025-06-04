"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Send, BookOpen, Flame, Sparkles } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { format, isToday, isYesterday, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";

interface JournalEntry {
  id: string;
  content: string;
  summary: string;
  created_at: string;
}

export default function JournalPage() {
  const [content, setContent] = useState("");
  const [summary, setSummary] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [journalHistory, setJournalHistory] = useState<JournalEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [streak, setStreak] = useState(0);
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    fetchJournalHistory();
  }, []);

  const fetchJournalHistory = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Database error:", error);
        throw error;
      }

      console.log("Fetched journal entries:", data);
      setJournalHistory(data || []);
      calculateStreak(data || []);
    } catch (error) {
      console.error("Error fetching journal history:", error);
      toast({
        title: "Error",
        description: "Failed to load journal history",
        variant: "destructive",
      });
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const calculateStreak = (entries: JournalEntry[]) => {
    if (entries.length === 0) {
      setStreak(0);
      return;
    }

    // Sort entries by date in descending order
    const sortedEntries = [...entries].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    let currentStreak = 0;
    let lastEntryDate = new Date(sortedEntries[0].created_at);
    lastEntryDate.setHours(0, 0, 0, 0);

    // Check if the last entry was today or yesterday
    if (!isToday(lastEntryDate) && !isYesterday(lastEntryDate)) {
      setStreak(0);
      return;
    }

    currentStreak = 1;

    // Check previous entries for consecutive days
    for (let i = 1; i < sortedEntries.length; i++) {
      const currentDate = new Date(sortedEntries[i].created_at);
      currentDate.setHours(0, 0, 0, 0);

      const daysDifference = differenceInDays(lastEntryDate, currentDate);

      if (daysDifference === 1) {
        currentStreak++;
        lastEntryDate = currentDate;
      } else {
        break;
      }
    }

    setStreak(currentStreak);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Generate summary using AI
      const response = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate summary");
      }

      const data = await response.json();
      console.log("Received summary:", data);
      const generatedSummary = data.summary;

      // Store in database
      const { data: insertData, error: insertError } = await supabase
        .from("journal_entries")
        .insert({
          user_id: user.id,
          content: content.trim(),
          summary: generatedSummary,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Database insert error:", insertError);
        throw insertError;
      }

      console.log("Inserted journal entry:", insertData);

      // Update local state
      setSummary(generatedSummary);

      // Refresh history and streak
      await fetchJournalHistory();

      toast({
        title: "Success",
        description: "Journal entry saved successfully",
      });

      // Clear form
      setContent("");
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to save journal entry",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-2">
        <BookOpen className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-semibold tracking-tight">Journal</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Journal Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Write Your Journal Entry</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Textarea
                  placeholder="How was your day? What's on your mind?"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[300px]"
                />
                <Button type="submit" disabled={isLoading || !content.trim()}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving Entry...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Save Entry
                    </>
                  )}
                </Button>
              </form>

              {summary && (
                <div className="mt-6 p-4 rounded-lg bg-muted">
                  <h3 className="font-semibold mb-2">Key Points:</h3>
                  <p className="whitespace-pre-wrap">{summary}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Journal History */}
          <Card>
            <CardHeader>
              <CardTitle>Journal History</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : journalHistory.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No journal entries yet
                </p>
              ) : (
                <div className="space-y-4">
                  {journalHistory.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="mb-2">
                        <h4 className="font-medium">Entry:</h4>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {entry.content}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium">Key Points:</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {entry.summary}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(new Date(entry.created_at), "MMMM d, yyyy")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Streak Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                Current Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-center">{streak}</div>
              <p className="text-center text-muted-foreground mt-2">
                {streak === 0
                  ? "Start your journaling streak today!"
                  : streak === 1
                    ? "First day of your streak!"
                    : `${streak} days and counting!`}
              </p>
            </CardContent>
          </Card>

          {/* Monthly Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                Monthly Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Entries this month:
                  </span>
                  <span className="font-medium">
                    {
                      journalHistory.filter(
                        (entry) =>
                          new Date(entry.created_at).getMonth() ===
                          new Date().getMonth()
                      ).length
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Average entry length:
                  </span>
                  <span className="font-medium">
                    {Math.round(
                      journalHistory.reduce(
                        (acc, entry) => acc + entry.content.length,
                        0
                      ) / (journalHistory.length || 1)
                    )}{" "}
                    chars
                  </span>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Keep up the great work! Your journaling journey is helping
                    you grow.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
