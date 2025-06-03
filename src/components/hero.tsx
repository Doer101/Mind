import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  Sparkles,
  Brain,
  MessageSquare,
} from "lucide-react";

export default function Hero() {
  return (
    <div className="relative overflow-hidden bg-white">
      {/* Background gradient - softer, more calming colors for mindfulness */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-white to-indigo-50 opacity-70" />

      <div className="relative pt-24 pb-32 sm:pt-32 sm:pb-40">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-8 tracking-tight">
              Find{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-indigo-500">
                Mindfulness
              </span>{" "}
              with AI-Powered Guidance
            </h1>

            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
              Daily prompts and creative exercises personalized to your journey,
              with AI feedback to help you develop consistent mental wellness
              practices.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center px-8 py-4 text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors text-lg font-medium"
              >
                Start Your Journey
                <ArrowUpRight className="ml-2 w-5 h-5" />
              </Link>

              <Link
                href="#pricing"
                className="inline-flex items-center px-8 py-4 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-lg font-medium"
              >
                View Premium
              </Link>
            </div>

            <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-teal-500" />
                <span>Daily mindfulness prompts</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-teal-500" />
                <span>AI personalized feedback</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-teal-500" />
                <span>Track your progress</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
