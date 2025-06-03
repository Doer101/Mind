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

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar />
      <Hero />

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Your Daily Mindfulness Journey
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              MindMuse combines AI technology with proven mindfulness practices
              to help you develop consistent mental wellness habits.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
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
              <div
                key={index}
                className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="text-teal-600 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-teal-600 text-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">
            How MindMuse Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">1</div>
              <div className="text-teal-100 font-medium text-xl mb-2">
                Receive Your Daily Prompt
              </div>
              <p className="text-teal-50">
                Each day, get a new mindfulness or creativity exercise tailored
                to your journey
              </p>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">2</div>
              <div className="text-teal-100 font-medium text-xl mb-2">
                Complete & Submit
              </div>
              <p className="text-teal-50">
                Take a few minutes to engage with the prompt and record your
                response
              </p>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">3</div>
              <div className="text-teal-100 font-medium text-xl mb-2">
                Get AI Feedback
              </div>
              <p className="text-teal-50">
                Receive personalized insights and suggestions to deepen your
                practice
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Begin Your Mindfulness Journey Today
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Join our community of mindfulness practitioners and start developing
            a consistent mental wellness practice.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center px-6 py-3 text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
          >
            Start Free Trial
            <ArrowUpRight className="ml-2 w-4 h-4" />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
