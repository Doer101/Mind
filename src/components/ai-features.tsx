"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIFeaturesProps {
  type: "daily-prompt" | "feedback" | "chat" | "mirror" | "idea-expand";
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export default function AIFeatures({
  type,
  title,
  description,
  icon,
}: AIFeaturesProps) {
  const [content, setContent] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError("");

      let endpoint = "/api/ai";
      if (type === "feedback") {
        endpoint = "/api/ai/feedback";
      } else if (type === "mirror") {
        endpoint = "/api/ai/mirror";
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          content,
          context: [], // For chat, we'll need to implement context management
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to get AI response");
      }

      const data = await res.json();

      // Handle different response types
      switch (type) {
        case "daily-prompt":
          setResponse(data.prompt);
          break;
        case "feedback":
          setResponse(data.feedback);
          break;
        case "chat":
          setResponse(data.response);
          break;
        case "mirror":
          setResponse(data.reflection);
          break;
        case "idea-expand":
          setResponse(data.expansion);
          break;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      className={cn(
        "group relative overflow-hidden",
        "border border-white/20 bg-black/50 backdrop-blur-sm",
        "transition-all duration-300",
        "hover:border-white/40 hover:shadow-xl hover:shadow-white/5 hover:-translate-y-1"
      )}
    >
      <CardHeader className="space-y-4">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm group-hover:bg-white/15 transition-colors">
              {icon}
            </div>
          )}
          <div className="flex-1">
            <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {title}
            </CardTitle>
            <CardDescription className="text-sm sm:text-base mt-1.5 text-white/70">
              {description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {type !== "daily-prompt" && (
          <Textarea
            placeholder="Enter your text here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[100px] sm:min-h-[120px] resize-none bg-black/50 text-white placeholder-white/50 border-white/20 focus:border-white/40 transition-colors text-sm sm:text-base rounded-lg"
          />
        )}

        {type === "daily-prompt" ? (
          <div className="flex justify-center pt-2">
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className={cn(
                "px-6 sm:px-10 py-5 sm:py-6",
                "bg-white/10 hover:bg-white/15",
                "border border-white/20 hover:border-white/30",
                "text-white",
                "text-base sm:text-lg font-semibold",
                "rounded-xl",
                "transition-all duration-300",
                "hover:scale-[1.02] hover:shadow-lg hover:shadow-white/10",
                "active:scale-95",
                "w-full sm:w-auto",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              )}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Generating...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  <span>Get Today's Prompt</span>
                </div>
              )}
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={loading || !content}
            className={cn(
              "w-full",
              "bg-white/10 hover:bg-white/15",
              "border border-white/20 hover:border-white/30",
              "text-white",
              "py-3 sm:py-3.5",
              "rounded-lg",
              "transition-all duration-300",
              "hover:scale-[1.01]",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            variant="outline"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing...</span>
              </div>
            ) : (
              "Generate"
            )}
          </Button>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-400 text-center">{error}</p>
          </div>
        )}

        {response && (
          <div
            className={cn(
              "mt-4 p-5 sm:p-6 rounded-xl",
              "bg-white/5",
              "backdrop-blur-sm",
              "border border-white/20",
              "max-h-[300px] sm:max-h-[400px] overflow-y-auto",
              "transition-all duration-300",
              "animate-in fade-in-50 slide-in-from-bottom-3"
            )}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-white/10">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <h4 className="font-semibold text-sm sm:text-base text-white">
                Today's Creative Prompt
              </h4>
            </div>
            <p className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed text-white/90">
              {response}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
