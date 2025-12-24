"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveSurveyAnswers } from "../../actions";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SurveyFormProps {
  fieldId: string;
  fieldName: string;
}

export interface SurveyData {
  frequency: string;
  location: string;
  workoutType: string;
  consistency: string;
  blocker: string;
}

export default function SurveyForm({ fieldId, fieldName }: SurveyFormProps) {
  const [answers, setAnswers] = useState<SurveyData>({
    frequency: "",
    location: "",
    workoutType: "",
    consistency: "",
    blocker: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleChange = (key: keyof SurveyData, value: string) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const isComplete = Object.values(answers).every(val => val !== "");

  const handleSubmit = async () => {
    if (!isComplete) return;
    setIsSubmitting(true);
    try {
      // Calculate level client-side or server-side? Server-side is safer/better.
      // We pass the structured data to the server action.
      const initialLevel = await saveSurveyAnswers(fieldId, answers);
      
      // Store in session storage to show on success page
      sessionStorage.setItem("onboarding_result", JSON.stringify({
        fieldName,
        fieldId,
        initialLevel
      }));

      router.push("/onboarding/success");
    } catch (error) {
      console.error("Survey submission failed:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border border-white/20 bg-black/50 overflow-hidden max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-white">Assessment: {fieldName}</CardTitle>
        <CardDescription className="text-white/60">
          Help us design your starting cycle. Select the options that best confirm to your current lifestyle.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        
        {/* Q1: Frequency */}
        <div className="space-y-3">
          <Label className="text-white text-lg font-medium">How often do you exercise per week?</Label>
          <RadioGroup value={answers.frequency} onValueChange={(v) => handleChange("frequency", v)} className="grid grid-cols-3 gap-4">
            {["1-2 times", "3-4 times", "5+ times"].map((opt) => (
              <div key={opt}>
                <RadioGroupItem value={opt} id={`freq-${opt}`} className="peer sr-only" />
                <Label
                  htmlFor={`freq-${opt}`}
                  className="flex flex-col items-center justify-between rounded-xl border-2 border-white/10 bg-white/5 p-4 text-white/80 hover:bg-white/10 hover:text-white peer-data-[state=checked]:border-teal-500 peer-data-[state=checked]:bg-teal-500/10 peer-data-[state=checked]:text-teal-400 cursor-pointer transition-all"
                >
                  {opt}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Q2: Location */}
        <div className="space-y-3">
          <Label className="text-white text-lg font-medium">Where do you usually work out?</Label>
           <Select value={answers.location} onValueChange={(v) => handleChange("location", v)}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gym">Commercial Gym</SelectItem>
              <SelectItem value="home">Home Gym / Living Room</SelectItem>
              <SelectItem value="outdoor">Outdoor / Park</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Q3: Workout Type */}
        <div className="space-y-3">
          <Label className="text-white text-lg font-medium">Primary training style?</Label>
          <Select value={answers.workoutType} onValueChange={(v) => handleChange("workoutType", v)}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Select style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="strength">Strength / Hypertrophy</SelectItem>
              <SelectItem value="cardio">Cardio / Endurance</SelectItem>
              <SelectItem value="mixed">Mixed / CrossFit</SelectItem>
              <SelectItem value="yoga">Yoga / Mobility</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Q4: Consistency */}
        <div className="space-y-3">
          <Label className="text-white text-lg font-medium">Longest consistency streak?</Label>
          <Select value={answers.consistency} onValueChange={(v) => handleChange("consistency", v)}>
             <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">Just starting</SelectItem>
              <SelectItem value="1month">Less than 1 month</SelectItem>
              <SelectItem value="6months">1 - 6 months</SelectItem>
              <SelectItem value="years">6+ months / Years</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Q5: Blocker */}
        <div className="space-y-3">
          <Label className="text-white text-lg font-medium">Biggest blocker?</Label>
           <RadioGroup value={answers.blocker} onValueChange={(v) => handleChange("blocker", v)} className="grid grid-cols-2 gap-4">
            {["Time", "Motivation", "Energy", "Knowledge"].map((opt) => (
              <div key={opt}>
                <RadioGroupItem value={opt} id={`blocker-${opt}`} className="peer sr-only" />
                <Label
                  htmlFor={`blocker-${opt}`}
                  className="flex flex-col items-center justify-between rounded-xl border-2 border-white/10 bg-white/5 p-3 text-white/80 hover:bg-white/10 hover:text-white peer-data-[state=checked]:border-indigo-500 peer-data-[state=checked]:bg-indigo-500/10 peer-data-[state=checked]:text-indigo-400 cursor-pointer transition-all"
                >
                  {opt}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting || !isComplete}
          className="w-full bg-gradient-to-r from-teal-500 to-indigo-500 text-white border-none py-6 text-lg font-bold uppercase tracking-wider"
        >
          {isSubmitting ? "Designing Cycle..." : "Generate Starting Cycle"}
        </Button>
      </CardFooter>
    </Card>
  );
}
