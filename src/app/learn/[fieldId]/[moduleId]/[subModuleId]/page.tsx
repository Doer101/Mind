import { getSubModuleDetails, getSubModuleQuests, startSubModule } from "../../../actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { BookOpen, ChevronRight, Target, Trophy } from "lucide-react";
import { QuestSystem } from "@/components/quest-system";
import { createClient } from "@/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: Promise<{
    fieldId: string;
    moduleId: string;
    subModuleId: string;
  }>;
}

export default async function SubModulePage({ params }: PageProps) {
  const { fieldId, moduleId, subModuleId } = await params;
  const subModule = await getSubModuleDetails(subModuleId);
  const quests = await getSubModuleQuests(subModuleId);
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !subModule) {
    return redirect("/learn");
  }

  async function handleStartLesson() {
    "use server";
    await startSubModule(subModuleId);
    revalidatePath(`/learn/${fieldId}/${moduleId}/${subModuleId}`);
  }

  return (
    <div className="min-h-screen bg-black text-white px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Navigation Breadcrumbs - Simple Custom Implementation */}
        <nav className="flex items-center gap-2 text-sm text-white/40">
          <Link href="/learn" className="hover:text-white transition-colors">Path</Link>
          <ChevronRight className="h-4 w-4" />
          <Link href={`/learn/${fieldId}`} className="hover:text-white transition-colors">
            {subModule.modules?.title || "Field"}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-white font-bold">{subModule.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Header Section */}
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge className="bg-white text-black font-bold uppercase tracking-widest text-[10px] px-3">
                  Core Module
                </Badge>
                <Badge variant="outline" className="text-white border-white/20 uppercase tracking-widest text-[10px] px-3">
                  Sequence {subModule.order_index}
                </Badge>
              </div>
              <h1 className="text-5xl font-black tracking-tighter uppercase text-white">{subModule.title}</h1>
              <p className="text-white/60 text-xl leading-relaxed">
                {subModule.description}
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3 text-white">
                <Target className="h-6 w-6 text-teal-400" />
                <h2 className="text-2xl font-bold uppercase tracking-tight text-white">Active Assignments</h2>
              </div>
              
              {/* Reuse the existing QuestSystem component but filtered for this submodule? */}
              {/* Actually, sub-module quests are distinct from daily ones. */}
              {/* I'll use the QuestSystem component props if they allow custom fetching or just list them here. */}
              <div className="space-y-4">
                {quests.length > 0 ? (
                  <QuestSystem 
                    userId={user.id} 
                    apiUrl={`/api/learn/quests?sub_module_id=${subModuleId}`} 
                    allowGeneration={false}
                  />
                ) : (
                  <Card className="bg-white/5 border-dashed border-white/10 p-12 text-center space-y-6">
                    <Trophy className="h-12 w-12 text-white/20 mx-auto" />
                    <div className="space-y-2">
                       <p className="text-white/60 font-medium text-lg text-center w-full">Ready to start your lesson?</p>
                       <p className="text-white/40 text-sm max-w-xs mx-auto text-center w-full">
                         This sub-module has core assignments that will test your mastery and unlock the next stage.
                       </p>
                    </div>
                    <form action={handleStartLesson} className="flex justify-center">
                      <Button 
                        type="submit"
                        className="bg-gradient-to-r from-teal-500 to-indigo-500 text-white hover:opacity-90 px-8 py-6 text-lg font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(20,184,166,0.3)] transition-all hover:scale-[1.02]"
                      >
                        Start Lesson
                      </Button>
                    </form>
                  </Card>
                )}
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <Card className="bg-white/5 border-white/10 p-6 space-y-6">
              <h3 className="text-lg text-white font-bold uppercase tracking-tight flex items-center gap-2">
                <BookOpen className="text-white h-5 w-5" />
                Knowledge Base
              </h3>
              <div className="space-y-4 text-sm text-white/50 leading-relaxed">
                <p>
                  Complete all mandatory quests in this section to unlock the next part of your learning path.
                </p>
                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                  <span className="text-white font-bold block mb-1">XP WEIGHTING</span>
                  Core modules contribute directly to your Field Mastery and provide 25% weighted Global XP.
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
