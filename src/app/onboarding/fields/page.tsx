import { getFields, initializeUserProgress } from "../actions";
import { createClient } from "@/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock } from "lucide-react";
import Link from "next/link";

export default async function OnboardingFieldsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Ensure global progress exists
  await initializeUserProgress();

  const fields = await getFields();

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Choose Your Field</h1>
          <p className="text-white/60 text-lg">
            Select a field to begin your growth journey. Some fields require a higher global level to unlock.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {fields.map((field) => (
            <Card 
              key={field.id} 
              className={`relative overflow-hidden border border-white/20 bg-black/50 transition-all ${
                field.isLocked ? "opacity-50 grayscale" : "hover:border-white/40 hover:bg-black/60"
              }`}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl text-white">{field.name}</CardTitle>
                  {field.isLocked && (
                    <Badge variant="outline" className="text-white border-white/20 bg-white/5 uppercase text-[10px] py-0.5 px-2">
                      Locked
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-white/60">
                  {field.isLocked ? `Unlocks at Level ${field.unlock_global_level}` : field.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {field.isLocked ? (
                  <div className="flex items-center gap-2 text-white/40 text-sm py-2">
                    <Lock className="h-4 w-4" />
                    <span>Requires Level {field.unlock_global_level}</span>
                  </div>
                ) : (
                  <Button asChild className="w-full bg-white text-black hover:bg-white/90">
                    <Link href={`/onboarding/survey/${field.id}`}>
                      Select Field
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
