"use client";

import { useState } from "react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const plans = [
    {
      name: "Free",
      description: "Essential mindfulness tools to get started",
      price: "Free",
      originalPrice: null,
      period: null,
      features: [
        { name: "Journal & Daily Prompt", included: true },
        { name: "To-Do List", included: true },
        { name: "Creativity Mirror", included: true },
        { name: "5 Chats per Day", included: true },
        { name: "Quest Generation", included: false },
        { name: "5 Tries/Day (25/Month)", included: true },
      ],
      cta: "Get Started",
      popular: false,
    },
    {
      name: "Premium",
      description: "Deepen your practice with enhanced features",
      price: billingCycle === "monthly" ? "₹299" : "₹2,870",
      originalPrice: billingCycle === "yearly" ? "₹3,588" : null,
      secondaryPrice: billingCycle === "monthly" ? "$3.49" : "$33.50",
      secondaryOriginalPrice: billingCycle === "yearly" ? "$41.88" : null,
      period: billingCycle === "monthly" ? "/month" : "/year",
      features: [
        { name: "Journal & Daily Prompts", included: true },
        { name: "To-Do List", included: true },
        { name: "Creativity Mirror (20/Day)", included: true },
        { name: "20 Chats per Day", included: true },
        { name: "Quest: 2 Sets of 6 Quests Daily", included: true },
        { name: "Unlimited Tries", included: true },
      ],
      cta: "Upgrade to Premium",
      popular: true,
    },
    {
      name: "Premium Plus",
      description: "Ultimate access for total mindfulness",
      price: billingCycle === "monthly" ? "₹399" : "₹3,830",
      originalPrice: billingCycle === "yearly" ? "₹4,788" : null,
      secondaryPrice: billingCycle === "monthly" ? "$4.59" : "$44.00",
      secondaryOriginalPrice: billingCycle === "yearly" ? "$55.08" : null,
      period: billingCycle === "monthly" ? "/month" : "/year",
      features: [
        { name: "Journal & Daily Prompts", included: true },
        { name: "To-Do List", included: true },
        { name: "Creativity Mirror (Unlimited)", included: true },
        { name: "50 Chats per Day", included: true },
        { name: "Quest: 3 Sets of 9 Quests Daily", included: true },
        { name: "Unlimited Tries", included: true },
      ],
      cta: "Go Premium Plus",
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-white/20">
      <Navbar />
      
      {/* Background Pattern */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.03]" />
         <div className="absolute inset-0 bg-gradient-to-b from-black via-black/90 to-black pointer-events-none" />
      </div>

      <main className="flex-grow py-24 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-6">
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white backdrop-blur-xl">
             <Sparkles className="mr-2 h-4 w-4 text-purple-400" />
             <span>Invest in your mind</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400 pb-2">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-gray-400 max-w-xl mx-auto">
            Choose the perfect plan for your mindfulness journey. Unlock your full potential with our premium features.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center mt-8 space-x-4">
            <Label 
              htmlFor="billing-mode" 
              className={cn("text-sm font-medium cursor-pointer transition-colors", billingCycle === "monthly" ? "text-white" : "text-gray-500")}
              onClick={() => setBillingCycle("monthly")}
            >
              Monthly
            </Label>
            <Switch 
              id="billing-mode" 
              checked={billingCycle === "yearly"}
              onCheckedChange={(checked) => setBillingCycle(checked ? "yearly" : "monthly")}
              className="data-[state=checked]:bg-white data-[state=unchecked]:bg-zinc-700"
            />
            <Label 
              htmlFor="billing-mode" 
              className={cn("text-sm font-medium cursor-pointer transition-colors flex items-center gap-2", billingCycle === "yearly" ? "text-white" : "text-gray-500")}
              onClick={() => setBillingCycle("yearly")}
            >
              Yearly 
              <span className="inline-flex items-center rounded-full bg-green-400/10 px-2 py-0.5 text-xs font-medium text-green-400 ring-1 ring-inset ring-green-400/20">
                -20%
              </span>
            </Label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={cn(
                "flex flex-col relative overflow-hidden transition-all duration-300 hover:translate-y-[-4px]",
                plan.popular 
                  ? "bg-zinc-900/80 border-purple-500/50 shadow-[0_0_30px_-10px_rgba(168,85,247,0.3)] ring-1 ring-purple-500/50" 
                  : "bg-zinc-900/40 border-white/10 hover:border-white/20 hover:bg-zinc-900/60"
              )}
            >
              {plan.popular && (
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-75" />
              )}
              {plan.popular && (
                <div className="absolute top-4 right-4 bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-md">
                  Most Popular
                </div>
              )}
              
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-white">{plan.name}</CardTitle>
                <CardDescription className="text-gray-400">{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="mb-6">
                    <div className="flex items-baseline flex-wrap gap-2">
                        <span className="text-4xl font-bold text-white tracking-tight">{plan.price}</span>
                        {plan.secondaryPrice && (
                            <span className="text-xl text-gray-400 font-medium">/ {plan.secondaryPrice}</span>
                        )}
                        {plan.period && (
                            <span className="text-gray-500 text-sm">{plan.period}</span>
                        )}
                    </div>
                    {plan.originalPrice && (
                        <div className="mt-1 text-sm text-gray-500 line-through">
                             {plan.originalPrice} / {plan.secondaryOriginalPrice}
                        </div>
                    )}
                </div>
                
                <div className="h-px bg-white/10 w-full mb-6" />

                <ul className="space-y-4">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start text-sm group">
                      {feature.included ? (
                        <div className="rounded-full bg-green-500/10 p-1 mr-3 shrink-0 group-hover:bg-green-500/20 transition-colors">
                            <Check className="h-3 w-3 text-green-400" />
                        </div>
                      ) : (
                        <div className="rounded-full bg-red-500/10 p-1 mr-3 shrink-0 group-hover:bg-red-500/20 transition-colors">
                            <X className="h-3 w-3 text-red-400" />
                        </div>
                      )}
                      <span className={cn(
                          "transition-colors",
                          feature.included ? "text-gray-300 group-hover:text-white" : "text-gray-600"
                        )}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="pt-0">
                <Button 
                  className={cn(
                    "w-full h-12 text-base font-semibold tracking-wide transition-all duration-300",
                    plan.popular 
                      ? "bg-white text-black hover:bg-white/90 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-[1.02]" 
                      : "bg-white/10 text-white hover:bg-white/20 hover:scale-[1.02] border border-white/5"
                  )}
                >
                  {plan.cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        <div className="mt-16 text-center">
            <p className="text-gray-500 text-sm">
                Prices are subject to change. VAT may apply based on your location.
                <br />
                Need help? <Link href="/contact" className="text-white hover:underline underline-offset-4 decoration-white/30">Contact Support</Link>
            </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
