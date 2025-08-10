import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  Sparkles,
  Brain,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function Hero() {
  return (
    <div className="relative overflow-hidden bg-black/70">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />

      <div className="relative pt-24 pb-32 sm:pt-32 sm:pb-40">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-white">
                Find <span className="text-white">Mindfulness</span> with
                AI-Powered Guidance
              </h1>

              <p className="text-xl text-white max-w-2xl mx-auto leading-relaxed">
                Daily prompts and creative exercises personalized to your
                journey, with AI feedback to help you develop consistent mental
                wellness practices.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                className="bg-white text-black hover:bg-black hover:text-white border border-white"
                asChild
              >
                <Link href="/dashboard" className="inline-flex items-center">
                  Start Your Journey
                  <ArrowUpRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="bg-white text-black hover:bg-black hover:text-white border border-white"
                asChild
              >
                <Link href="#pricing" className="inline-flex items-center">
                  View Premium
                </Link>
              </Button>
            </div>

            <Card className="mt-16 p-6 bg-black/50 backdrop-blur-sm border-none shadow-none">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-white">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-white" />
                  <span>Daily mindfulness prompts</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-white" />
                  <span>AI personalized feedback</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-white" />
                  <span>Track your progress</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
