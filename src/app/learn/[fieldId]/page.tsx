import { getFieldLearningPath } from "../actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { CheckCircle2, Lock, Play, Star, ArrowRight } from "lucide-react";
import { redirect } from "next/navigation";
import { Progress } from "@/components/ui/progress";

interface PageProps {
  params: Promise<{
    fieldId: string;
  }>;
}

export default async function FieldPathPage({ params }: PageProps) {
  const { fieldId } = await params;
  const path = await getFieldLearningPath(fieldId);

  if (!path) {
    return redirect("/learn");
  }

  return (
    <div className="min-h-screen bg-black text-white px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="space-y-6">
          <div className="text-center space-y-4">
            <Badge variant="outline" className="text-white border-white/20 uppercase tracking-widest px-4 py-1 text-[10px] bg-white/5">
              Learning Path
            </Badge>
            <h1 className="text-5xl font-bold tracking-tighter text-white">Your Journey</h1>
            <p className="text-white/40 text-lg">
              Master this field by completing core modules in sequence.
            </p>
          </div>

          {/* Field Progress Header */}
          <Card className="max-w-xl mx-auto bg-white/5 border-white/10 p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-teal-400 font-black">Field Mastery</p>
                <h2 className="text-2xl font-bold text-white">LVL {path.currentLevel}</h2>
              </div>
              <div className="text-right space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Field XP</p>
                <p className="text-sm font-bold text-white">{path.currentXP} / {path.nextXP}</p>
              </div>
            </div>
            <Progress value={(path.currentXP / path.nextXP) * 100} className="h-2 bg-white/10" />
            <p className="text-[10px] text-white/30 mt-3 text-center uppercase tracking-widest font-bold">
              {path.nextXP - path.currentXP} XP to Level {path.currentLevel + 1}
            </p>
          </Card>
        </div>

        <div className="relative space-y-24">
          {/* Vertical line connecting modules */}
          <div className="absolute left-[27px] top-10 bottom-10 w-0.5 bg-gradient-to-b from-teal-500/50 via-indigo-500/50 to-transparent shadow-[0_0_15px_rgba(255,255,255,0.1)]" />

          {path.modules.map((module: any, mIdx: number) => (
            <div key={module.id} className="relative z-10 space-y-8">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-indigo-500 text-white flex items-center justify-center font-bold text-xl shadow-[0_0_30px_rgba(20,184,166,0.3)]">
                  {mIdx + 1}
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold tracking-tight uppercase text-white">{module.title}</h2>
                    <Badge variant="secondary" className="bg-white/10 text-white/70 border-none text-[10px] uppercase tracking-widest font-bold">
                      Quests {module.moduleStats.completed}/{module.moduleStats.total}
                    </Badge>
                  </div>
                  <p className="text-white/40 text-sm">{module.description}</p>
                </div>
              </div>

              <div className="pl-14 space-y-4">
                {module.sub_modules.map((sm: any) => (
                  <Card 
                    key={sm.id} 
                    className={`p-6 border transition-all duration-300 ${
                      sm.isUnlocked 
                        ? "bg-zinc-900/60 border-white/10 hover:border-teal-500/30 hover:bg-zinc-900/80" 
                        : "bg-transparent border-white/5 opacity-40 grayscale"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg transition-colors ${sm.isCompleted ? "bg-green-500/20 text-green-400 font-bold" : sm.isUnlocked ? "bg-teal-500/20 text-teal-400" : "bg-white/5 text-white/20"}`}>
                          {sm.isCompleted ? <CheckCircle2 className="h-5 w-5" /> : sm.isUnlocked ? <Play className="h-5 w-5 fill-current" /> : <Lock className="h-5 w-5" />}
                        </div>
                        <div>
                          <h3 className={`font-bold text-lg ${sm.isUnlocked ? "text-white" : "text-white/40"}`}>{sm.title}</h3>
                          {!sm.isUnlocked && (
                            <p className="text-white/30 text-[10px] uppercase tracking-widest mt-1 font-bold">
                              Locked • Requires Field Mastery LVL {sm.unlock_field_level}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {sm.isUnlocked && (
                        <Button 
                          asChild 
                          className="bg-gradient-to-r from-teal-500 to-indigo-500 text-white hover:opacity-90 hover:scale-[1.02] border-none font-bold uppercase tracking-wider text-[10px] px-6 transition-all"
                        >
                          <Link href={`/learn/${fieldId}/${module.id}/${sm.id}`} className="flex items-center gap-2">
                            {sm.isCompleted ? "Review" : "Start"}
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
