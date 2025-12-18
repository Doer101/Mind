"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveSurveyAnswers, completeOnboarding } from "../../actions";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface Skill {
  id: string;
  name: string;
}

interface SurveyFormProps {
  fieldId: string;
  fieldName: string;
}

const SKILLS: Skill[] = [
  { id: "consistency", name: "Consistency" },
  { id: "energy", name: "Energy" },
  { id: "focus", name: "Focus" },
];

export default function SurveyForm({ fieldId, fieldName }: SurveyFormProps) {
  const [scores, setScores] = useState<Record<string, number>>(
    SKILLS.reduce((acc, skill) => ({ ...acc, [skill.id]: 50 }), {})
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSliderChange = (id: string, value: number[]) => {
    setScores((prev) => ({ ...prev, [id]: value[0] }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const skillScores = SKILLS.map(skill => ({
        skill: skill.name,
        score: scores[skill.id]
      }));

      const initialLevel = await saveSurveyAnswers(fieldId, skillScores);
      
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
    <Card className="border border-white/20 bg-black/50 overflow-hidden">
      <CardHeader>
        <CardTitle className="text-2xl text-white">Assessment: {fieldName}</CardTitle>
        <CardDescription className="text-white/60">
          This helps us determine your starting level. Be honest!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {SKILLS.map((skill) => (
          <div key={skill.id} className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-white text-lg font-medium tracking-tight uppercase border-l-2 border-white/40 pl-3">
                {skill.name}
              </Label>
              <span className="text-white font-bold bg-white/10 px-3 py-1 rounded-full text-sm">
                {scores[skill.id]}%
              </span>
            </div>
            <Slider
              value={[scores[skill.id]]}
              onValueChange={(val) => handleSliderChange(skill.id, val)}
              max={100}
              step={1}
              className="py-4"
            />
            <div className="flex justify-between text-[10px] text-white/40 uppercase tracking-widest font-semibold">
              <span>Beginner</span>
              <span>Master</span>
            </div>
          </div>
        ))}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting}
          className="w-full bg-white text-black hover:bg-white/90 py-6 text-lg font-bold"
        >
          {isSubmitting ? "Processing..." : "Finish Assessment"}
        </Button>
      </CardFooter>
    </Card>
  );
}
