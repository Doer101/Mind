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
import { Loader2 } from "lucide-react";
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

      const res = await fetch("/api/ai", {
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
    <Card className="h-full transition-all hover:shadow-md">
      <CardHeader>
        <div className="flex items-center gap-2">
          {icon && <div className="text-primary">{icon}</div>}
          <CardTitle className="text-xl">{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {type !== "daily-prompt" && (
          <Textarea
            placeholder="Enter your text here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[100px] resize-none"
          />
        )}

        <Button
          onClick={handleSubmit}
          disabled={loading || (type !== "daily-prompt" && !content)}
          className="w-full"
          variant={type === "daily-prompt" ? "default" : "secondary"}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : type === "daily-prompt" ? (
            "Get Prompt"
          ) : (
            "Generate"
          )}
        </Button>

        {error && <p className="text-sm text-destructive mt-2">{error}</p>}

        {response && (
          <div
            className={cn(
              "mt-4 p-4 rounded-lg",
              "bg-muted/50 backdrop-blur-sm",
              "border border-border/50"
            )}
          >
            <h4 className="font-medium mb-2 text-sm text-muted-foreground">
              Response:
            </h4>
            <p className="whitespace-pre-wrap text-sm">{response}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
