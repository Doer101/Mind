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

// Force dynamic rendering to always fetch fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

          {path.modules.map((module: any, mIdx: number) => {
            const isModuleLocked = path.currentLevel < (module.unlock_field_level || 0);
            
            return (
              <div key={module.id} className={`relative z-10 space-y-8 transition-opacity duration-500 ${isModuleLocked ? "opacity-50 grayscale" : "opacity-100"}`}>
                <div className="flex items-center gap-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl shadow-[0_0_30px_rgba(20,184,166,0.3)] ${
                    isModuleLocked 
                      ? "bg-white/10 text-white/20 shadow-none border border-white/5" 
                      : "bg-gradient-to-br from-teal-500 to-indigo-500 text-white"
                  }`}>
                    {isModuleLocked ? <Lock className="h-6 w-6" /> : mIdx + 1}
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold tracking-tight uppercase text-white">
                          {module.skill || module.title}
                        </h2>
                        {isModuleLocked && (
                          <Badge variant="outline" className="border-red-500/30 text-red-400 bg-red-500/10 text-[10px] uppercase tracking-widest font-bold">
                            Locked • LVL {module.unlock_field_level}
                          </Badge>
                        )}
                        {!isModuleLocked && module.difficulty && (
                          <Badge variant="outline" className={`border-white/10 text-[10px] uppercase tracking-widest font-bold ${
                            module.difficulty >= 8 ? "text-red-400 bg-red-500/10" :
                            module.difficulty >= 5 ? "text-yellow-400 bg-yellow-500/10" :
                            "text-teal-400 bg-teal-500/10"
                          }`}>
                            Difficulty: {module.difficulty}/10
                          </Badge>
                        )}
                      </div>
                      <Badge variant="secondary" className="bg-white/10 text-white/70 border-none text-[10px] uppercase tracking-widest font-bold">
                        Quests {module.moduleStats.completed}/{module.moduleStats.total}
                      </Badge>
                    </div>
                    <p className="text-white/40 text-sm">{module.description}</p>
                  </div>
                </div>

              <div className="pl-14 space-y-4">
                {module.sub_modules.map((sm: any) => {
                  // Calculate completion percentage
                  const totalQuests = sm.questStats?.total || 0;
                  const completedQuests = sm.questStats?.completed || 0;
                  const completionPercentage = totalQuests > 0 
                    ? Math.round((completedQuests / totalQuests) * 100) 
                    : 0;
                  
                  // Determine button label
                  let buttonLabel = "Start";
                  if (completionPercentage === 100) {
                    buttonLabel = "Review";
                  } else if (completionPercentage > 0 && completionPercentage < 100) {
                    buttonLabel = "Continue";
                  }
                  
                  return (
                    <Card 
                      key={sm.id} 
                      className={`p-6 border transition-all duration-300 ${
                        sm.isUnlocked 
                          ? completionPercentage === 100
                            ? "bg-zinc-900/60 border-green-500/30 hover:border-green-500/50 hover:bg-zinc-900/80"
                            : "bg-zinc-900/60 border-white/10 hover:border-teal-500/30 hover:bg-zinc-900/80"
                          : "bg-transparent border-white/5 opacity-40 grayscale"
                      }`}
                    >
                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-6">
                          <div className="flex items-center gap-4 flex-1">
                            <div className={`p-2 rounded-lg transition-colors ${
                              completionPercentage === 100 
                                ? "bg-green-500/20 text-green-400 font-bold" 
                                : sm.isUnlocked 
                                  ? "bg-teal-500/20 text-teal-400" 
                                  : "bg-white/5 text-white/20"
                            }`}>
                              {completionPercentage === 100 
                                ? <CheckCircle2 className="h-5 w-5" /> 
                                : sm.isUnlocked 
                                  ? <Play className="h-5 w-5 fill-current" /> 
                                  : <Lock className="h-5 w-5" />
                              }
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <h3 className={`font-bold text-lg ${sm.isUnlocked ? "text-white" : "text-white/40"}`}>
                                  {sm.title}
                                </h3>
                                {completionPercentage === 100 && sm.isUnlocked && (
                                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px] uppercase tracking-widest font-bold">
                                    Completed
                                  </Badge>
                                )}
                              </div>
                              {!sm.isUnlocked && (
                                <p className="text-white/30 text-[10px] uppercase tracking-widest mt-1 font-bold">
                                  Locked • Requires Field Mastery LVL {sm.unlock_field_level}
                                </p>
                              )}
                              {sm.isUnlocked && completionPercentage > 0 && completionPercentage < 100 && (
                                <p className="text-white/50 text-xs mt-1">
                                  {completedQuests} of {totalQuests} quests completed
                                </p>
                              )}
                            </div>
                          </div>
                          
                          {sm.isUnlocked && (
                            <Button 
                              asChild 
                              className={`${
                                completionPercentage === 100
                                  ? "bg-gradient-to-r from-green-500 to-emerald-500"
                                  : "bg-gradient-to-r from-teal-500 to-indigo-500"
                              } text-white hover:opacity-90 hover:scale-[1.02] border-none font-bold uppercase tracking-wider text-[10px] px-6 transition-all`}
                            >
                              <Link href={`/learn/${fieldId}/${module.id}/${sm.id}`} className="flex items-center gap-2">
                                {buttonLabel}
                                <ArrowRight className="h-3 w-3" />
                              </Link>
                            </Button>
                          )}
                        </div>
                        
                        {/* Progress bar for in-progress sub-modules */}
                        {sm.isUnlocked && completionPercentage > 0 && completionPercentage < 100 && (
                          <div className="space-y-2">
                            <Progress 
                              value={completionPercentage} 
                              className="h-1.5 bg-white/10" 
                            />
                            <p className="text-[10px] text-white/40 text-right uppercase tracking-widest font-bold">
                              {completionPercentage}% Complete
                            </p>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}
