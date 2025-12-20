import { getMyProfile } from "./actions";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PentagonStats } from "@/components/pentagon-stats";
import { Trophy, Star, Users, Globe, UserCircle, BookOpen, ShieldCheck, MapPin } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/supabase/server";

export default async function MyProfilePage() {
  const profile = await getMyProfile();

  if (!profile) {
    // Basic redirect if something goes wrong or no user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return redirect("/sign-in");
    notFound();
  }

  const { user, globalProgress, fieldProgress, maxLevel, followersCount, followingCount } = profile;

  return (
    <div className="min-h-screen bg-black text-white px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Profile Header */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/40 backdrop-blur-xl p-8 sm:p-12">
          <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
            <div className="h-32 w-32 rounded-3xl bg-gradient-to-br from-teal-500/20 to-indigo-500/20 border border-white/10 flex items-center justify-center relative group">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.name} className="h-full w-full object-cover rounded-3xl" />
              ) : (
                <UserCircle className="h-16 w-16 text-white/20" />
              )}
            </div>

            <div className="flex-1 space-y-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">
                    {user.full_name || user.name}
                  </h1>
                  <Badge variant="outline" className="text-[10px] uppercase border-teal-500/30 text-teal-400 font-black bg-teal-500/10">
                    LVL {globalProgress?.global_level || 1}
                  </Badge>
                </div>
                <p className="text-white/70 font-mono text-sm">@{user.name}</p>
              </div>

              {user.bio && (
                <p className="text-white/80 text-sm max-w-xl leading-relaxed">
                  {user.bio}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 pt-2">
                <Link href="/profile/followers" className="flex items-center gap-2 group">
                  <Users className="h-4 w-4 text-white/60 group-hover:text-white transition-colors" />
                  <span className="text-sm font-bold text-white transition-colors">{followersCount} <span className="text-white/60 font-medium group-hover:text-white/80">Followers</span></span>
                </Link>
                <Link href="/profile/following" className="flex items-center gap-2 group">
                  <span className="text-sm font-bold text-white transition-colors">{followingCount} <span className="text-white/60 font-medium group-hover:text-white/80">Following</span></span>
                </Link>
                {user.website && (
                  <a href={user.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-teal-400 hover:text-teal-300 transition-colors text-sm font-bold">
                    <Globe className="h-4 w-4" />
                    Website
                  </a>
                )}
              </div>

              <div className="pt-4 flex flex-wrap items-center justify-center md:justify-start gap-4">
                <Button asChild variant="outline" className="border-white/20 bg-white/10 hover:bg-white/20 text-white font-bold uppercase tracking-widest text-[10px] backdrop-blur-md px-6">
                   <Link href="/dashboard/settings">Edit Profile</Link>
                </Button>
                <Button asChild variant="ghost" className="text-white/40 hover:text-white hover:bg-white/5 font-bold uppercase tracking-widest text-[10px]">
                   <Link href={`/u/${user.name}`}>View Public Profile</Link>
                </Button>
              </div>
            </div>

            {/* Global Stats Sidebar */}
            <div className="hidden lg:flex flex-col gap-4 min-w-[200px]">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/70 mb-1">League</p>
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <span className="font-black italic text-white uppercase tracking-tight">{globalProgress?.league || "Bronze"}</span>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/70 mb-1">Total Mastery</p>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-teal-400 fill-teal-400/20" />
                  <span className="font-black text-white">{globalProgress?.global_xp || 0} XP</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Performance Radar */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-teal-400" />
              Field Mastery Analysis
            </h2>
            <PentagonStats data={fieldProgress} maxLevel={maxLevel} />
          </div>

          {/* Unlocked Fields */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-indigo-400" />
              Active Fields
            </h2>
            <div className="grid gap-3">
              {fieldProgress.filter(f => f.unlocked).map(field => (
                <Card key={field.id} className="bg-zinc-900/40 border-white/10 hover:border-white/30 transition-all group rounded-2xl backdrop-blur-xl">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white group-hover:text-teal-400 transition-colors">{field.name}</p>
                      <p className="text-[10px] uppercase tracking-widest text-white/60 font-black">Level {field.level}</p>
                    </div>
                    <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 font-black text-[10px] px-3">
                      {field.xp} XP
                    </Badge>
                  </CardContent>
                </Card>
              ))}
              {fieldProgress.filter(f => f.unlocked).length === 0 && (
                <p className="text-center text-white/20 text-sm py-12 border border-dashed border-white/10 rounded-2xl">
                  No fields mastered yet
                </p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
