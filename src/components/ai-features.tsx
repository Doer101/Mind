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
        "h-full transition-all",
        "hover:shadow-lg hover:shadow-primary/5",
        "border-none",
        "bg-black/70 text-white",
        "backdrop-blur-sm"
      )}
    >
      <CardHeader className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {icon && (
            <div className="p-2 rounded-lg bg-white/10 text-white self-start sm:self-center">
              {icon}
            </div>
          )}
          <div className="text-center sm:text-left">
            <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {title}
            </CardTitle>
            <CardDescription className="text-sm sm:text-base mt-1 text-white">
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
            className="min-h-[80px] sm:min-h-[100px] resize-none bg-black/50 text-white placeholder-white/60 border-white/20 text-sm sm:text-base"
          />
        )}

        {type === "daily-prompt" ? (
          <div className="flex justify-center">
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className={cn(
                "px-4 sm:px-8 py-4 sm:py-6",
                "bg-gradient-to-r from-primary to-primary/90",
                "hover:from-primary/90 hover:to-primary",
                "text-base sm:text-lg font-semibold",
                "rounded-full",
                "transition-all duration-300",
                "hover:scale-105 hover:shadow-lg hover:shadow-primary/20",
                "active:scale-95",
                "w-full sm:w-auto"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Get Today's Prompt
                </>
              )}
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={loading || !content}
            className="w-full border border-white text-white hover:bg-white hover:text-black py-3 sm:py-2"
            variant="secondary"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />
                Processing...
              </>
            ) : (
              "Generate"
            )}
          </Button>
        )}

        {error && (
          <p className="text-sm text-destructive mt-2 text-center">{error}</p>
        )}

        {response && (
          <div
            className={cn(
              "mt-4 p-4 sm:p-6 rounded-xl",
              "bg-black/50",
              "backdrop-blur-sm",
              "border border-white/20",
              "max-h-[300px] sm:max-h-[400px] overflow-y-auto",
              "transition-all duration-300",
              "hover:shadow-md hover:shadow-primary/5 text-white"
            )}
          >
            <h4 className="font-medium mb-3 text-sm text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-white" />
              <span className="text-xs sm:text-sm">
                Today's Creative Prompt:
              </span>
            </h4>
            <p className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed text-white">
              {response}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
