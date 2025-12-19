import { getLearningFields } from "./actions";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";

export default async function LearnPage() {
  const fields = await getLearningFields();

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="space-y-4 text-center sm:text-left">
          <h1 className="text-4xl font-bold tracking-tight text-white">Learning Path</h1>
          <p className="text-white/60 text-lg max-w-2xl">
            Choose a field to master. Each field has a structured path of modules and quests to help you grow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {fields.map((field: any) => {
            const isUnlocked = field.progress?.unlocked;
            const levelRequirement = field.unlock_global_level;
            
            return (
              <Card 
                key={field.id} 
                className={`border border-white/10 bg-zinc-900/40 backdrop-blur-xl transition-all group overflow-hidden ${
                  !isUnlocked ? "opacity-50 grayscale cursor-not-allowed" : "hover:border-white/20 hover:bg-zinc-900/60"
                }`}
              >
                <CardHeader className="relative">
                  <div className={`p-3 rounded-xl w-fit mb-4 transition-colors ${!isUnlocked ? "bg-white/5" : "bg-gradient-to-br from-teal-500/20 to-indigo-500/20"}`}>
                    <BookOpen className={`h-6 w-6 ${!isUnlocked ? "text-white/40" : "text-teal-400"}`} />
                  </div>
                  <CardTitle className="text-2xl text-white font-bold">{field.name}</CardTitle>
                  <CardDescription className="text-white/50">{field.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!isUnlocked ? (
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-center">
                      <p className="text-xs uppercase tracking-widest text-white/40 font-bold">
                        Unlocks at Global Level {levelRequirement}
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold block">Field Mastery</span>
                        <span className="text-white font-bold">Level {field.progress?.field_level || 1}</span>
                      </div>
                      <div className="h-8 w-px bg-white/10" />
                      <div className="text-right">
                        <ArrowRight className="h-5 w-5 text-teal-500/50 group-hover:text-teal-400 transition-colors ml-auto" />
                      </div>
                    </div>
                  )}

                  <Button 
                    asChild 
                    disabled={!isUnlocked}
                    className={`w-full h-11 text-sm font-bold uppercase tracking-wider transition-all duration-300 ${
                      !isUnlocked 
                        ? "bg-white/5 text-white/20 border border-white/5" 
                        : "bg-gradient-to-r from-teal-500 to-indigo-500 text-white hover:opacity-90 hover:scale-[1.02] shadow-[0_0_20px_rgba(20,184,166,0.3)]"
                    }`}
                  >
                    {isUnlocked ? (
                      <Link href={`/learn/${field.id}`} className="flex items-center justify-center gap-2">
                        Start Journey
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        Locked
                      </span>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
