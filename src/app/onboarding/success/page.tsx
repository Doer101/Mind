"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { completeOnboarding } from "../actions";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Trophy } from "lucide-react";

export default function OnboardingSuccessPage() {
  const [data, setData] = useState<{ fieldName: string; fieldId: string; initialLevel: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const saved = sessionStorage.getItem("onboarding_result");
    if (saved) {
      setData(JSON.parse(saved));
    } else {
      router.push("/onboarding/fields");
    }
  }, [router]);

  const handleStart = async () => {
    if (!data) return;
    setIsSubmitting(true);
    
    // Get user from supabase client (browser)
    // Wait, I can pass the userId from the server component if I make this a client child.
    // Actually, completeOnboarding needs userId, but I can get it from the session in the server action.
    // Let's check actions.ts
    // I need to update completeOnboarding to get userId from supabase.auth.getUser() if not provided.
    
    // For now, I'll pass a dummy or rely on the server action getting it.
    // Actually, the server action SHOULD get the userId themselves for security.
    
    try {
      await completeOnboarding(data.fieldId, data.initialLevel);
    } catch (error) {
      console.error("Initialization failed:", error);
      setIsSubmitting(false);
    }
  };

  if (!data) return null;

  return (
    <div className="min-h-screen bg-black text-white p-8 flex items-center justify-center">
      <div className="max-w-xl w-full">
        <Card className="border border-white/20 bg-black/50 text-center py-8">
          <CardHeader className="space-y-4">
            <div className="mx-auto w-20 h-20 bg-white/10 rounded-full flex items-center justify-center">
              <Trophy className="h-10 w-10 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold">Initialization Complete!</CardTitle>
            <CardDescription className="text-white/60 text-lg">
              Your profile has been synchronized.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <p className="text-sm uppercase tracking-widest text-white/40">Selected Field</p>
              <h3 className="text-2xl font-bold text-white">{data.fieldName}</h3>
              <div className="flex items-center justify-center gap-2 text-white">
                <Sparkles className="h-4 w-4" />
                <span className="font-semibold text-lg">Starting at Level {data.initialLevel}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleStart} 
              disabled={isSubmitting}
              className="w-full bg-white text-black hover:bg-white/90 py-6 text-lg font-bold"
            >
              {isSubmitting ? "Finalizing..." : "Start Journey"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
