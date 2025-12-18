import { createClient } from "@/supabase/server";
import { redirect } from "next/navigation";
import SurveyForm from "./survey-form";

interface SurveyPageProps {
  params: {
    fieldId: string;
  };
}

export default async function OnboardingSurveyPage({ params }: SurveyPageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const { fieldId } = await params;

  // Fetch field name
  const { data: field } = await supabase
    .from("fields")
    .select("name")
    .eq("id", fieldId)
    .single();

  if (!field) {
    return redirect("/onboarding/fields");
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Initial Assessment</h1>
          <p className="text-white/60 text-lg">
            Tell us about your current proficiency in {field.name}.
          </p>
        </div>

        <SurveyForm 
          fieldId={fieldId} 
          fieldName={field.name} 
        />
      </div>
    </div>
  );
}
