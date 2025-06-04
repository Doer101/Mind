import Footer from "@/components/footer";
import Hero from "@/components/hero";
import Navbar from "@/components/navbar";
import {
  ArrowUpRight,
  Brain,
  Sparkles,
  MessageSquare,
  Leaf,
} from "lucide-react";
import { createClient } from "../../supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />

      {/* Features Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl font-bold tracking-tight">
              Your Daily Mindfulness Journey
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              MindMuse combines AI technology with proven mindfulness practices
              to help you develop consistent mental wellness habits.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Sparkles className="w-6 h-6" />,
                title: "Daily Prompts",
                description: "Fresh mindfulness exercises delivered daily",
              },
              {
                icon: <Brain className="w-6 h-6" />,
                title: "Personalized Feedback",
                description: "AI-powered insights on your responses",
              },
              {
                icon: <MessageSquare className="w-6 h-6" />,
                title: "Mindfulness Assistant",
                description: "Chat with our AI guide for tips and advice",
              },
              {
                icon: <Leaf className="w-6 h-6" />,
                title: "Progress Tracking",
                description: "Watch your mindfulness practice grow over time",
              },
            ].map((feature, index) => (
              <Card
                key={index}
                className="border-none shadow-none hover:shadow-md transition-all duration-300"
              >
                <CardHeader>
                  <div className="text-primary mb-2">{feature.icon}</div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold mb-12 text-center tracking-tight">
            How MindMuse Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Receive Your Daily Prompt",
                description:
                  "Each day, get a new mindfulness or creativity exercise tailored to your journey",
              },
              {
                step: "2",
                title: "Complete & Submit",
                description:
                  "Take a few minutes to engage with the prompt and record your response",
              },
              {
                step: "3",
                title: "Get AI Feedback",
                description:
                  "Receive personalized insights and suggestions to deepen your practice",
              },
            ].map((step, index) => (
              <Card
                key={index}
                className="border-none bg-background/50 backdrop-blur-sm"
              >
                <CardHeader>
                  <div className="text-4xl font-bold text-primary mb-2">
                    {step.step}
                  </div>
                  <CardTitle className="text-xl">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {step.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center space-y-6">
          <h2 className="text-4xl font-bold tracking-tight">
            Begin Your Mindfulness Journey Today
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Join our community of mindfulness practitioners and start developing
            a consistent mental wellness practice.
          </p>
          <Button size="lg" className="mt-4" asChild>
            <a href="/dashboard" className="inline-flex items-center">
              Start Free Trial
              <ArrowUpRight className="ml-2 w-4 h-4" />
            </a>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
