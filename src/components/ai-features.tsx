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
        "border-2 border-border/50",
        "bg-gradient-to-br from-background to-background/95",
        "backdrop-blur-sm"
      )}
    >
      <CardHeader className="space-y-4">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              {icon}
            </div>
          )}
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              {title}
            </CardTitle>
            <CardDescription className="text-base mt-1">
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
            className="min-h-[100px] resize-none"
          />
        )}

        {type === "daily-prompt" ? (
          <div className="flex justify-center">
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className={cn(
                "px-8 py-6",
                "bg-gradient-to-r from-primary to-primary/90",
                "hover:from-primary/90 hover:to-primary",
                "text-lg font-semibold",
                "rounded-full",
                "transition-all duration-300",
                "hover:scale-105 hover:shadow-lg hover:shadow-primary/20",
                "active:scale-95"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Get Today's Prompt
                </>
              )}
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={loading || !content}
            className="w-full"
            variant="secondary"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
              "mt-4 p-6 rounded-xl",
              "bg-gradient-to-br from-muted/50 to-muted/30",
              "backdrop-blur-sm",
              "border border-border/50",
              "max-h-[400px] overflow-y-auto",
              "transition-all duration-300",
              "hover:shadow-md hover:shadow-primary/5"
            )}
          >
            <h4 className="font-medium mb-3 text-sm text-muted-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Today's Creative Prompt:
            </h4>
            <p className="whitespace-pre-wrap text-base leading-relaxed">
              {response}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
