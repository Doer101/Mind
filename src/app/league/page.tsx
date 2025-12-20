import { getLeagueData, getLeagueLeaderboard } from "./actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, ArrowUp, ArrowDown, Clock, UserCircle, Star } from "lucide-react";
import { redirect } from "next/navigation";
import { LeagueCountdown } from "./league-countdown";

export default async function LeaguePage() {
  const userData = await getLeagueData();
  
  if (!userData) {
    return redirect("/dashboard");
  }

  const leaderboard = await getLeagueLeaderboard(userData.league);

  // promotion/demotion zone thresholds (visual only)
  const totalUsers = leaderboard.length;
  const promotionThreshold = Math.ceil(totalUsers * 0.2); // Top 20%
  const demotionThreshold = Math.floor(totalUsers * 0.8); // Bottom 20%

  // League hierarchy
  const hierarchy = ["Bronze", "Silver", "Gold", "Platinum", "Diamond"];
  const currentIndex = hierarchy.findIndex(l => l.toLowerCase() === userData.league.toLowerCase());
  const nextLeague = currentIndex < hierarchy.length - 1 ? hierarchy[currentIndex + 1] : null;
  const prevLeague = currentIndex > 0 ? hierarchy[currentIndex - 1] : null;

  return (
    <div className="min-h-screen bg-black text-white px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <Badge variant="outline" className="text-white border-white/20 uppercase tracking-widest px-4 py-1 text-[10px] bg-white/5">
            Competitive League
          </Badge>
          <h1 className="text-5xl font-bold tracking-tighter text-white uppercase italic">{userData.league} League</h1>
          <div className="flex items-center justify-center pt-2">
            <LeagueCountdown />
          </div>
        </div>

        {/* User Overview Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-black/30 backdrop-blur-xl">
            <CardHeader className="pb-2">
              <CardDescription className="text-teal-400 font-bold uppercase tracking-widest text-[10px]">Your Rank</CardDescription>
              <CardTitle className="text-4xl font-black text-white">#{userData.rank}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-white/60 text-xs">
                {userData.rank <= promotionThreshold ? (
                  <ArrowUp className="h-4 w-4 text-green-400" />
                ) : userData.rank > demotionThreshold ? (
                  <ArrowDown className="h-4 w-4 text-red-400" />
                ) : null}
                <span>{userData.fullName}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
            <CardHeader className="pb-2">
              <CardDescription className="text-white/40 font-bold uppercase tracking-widest text-[10px]">Global Progression</CardDescription>
              <CardTitle className="text-4xl font-black text-white">LVL {userData.global_level}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-white/60 text-xs">
                <Star className="h-3 w-3 fill-teal-500 text-teal-400" />
                <span>{userData.global_xp} Total XP</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
            <CardHeader className="pb-2">
              <CardDescription className="text-white/40 font-bold uppercase tracking-widest text-[10px]">Status</CardDescription>
              <CardTitle className="text-4xl font-black text-white italic uppercase">
                {userData.rank <= promotionThreshold ? "Promotion" : userData.rank > demotionThreshold ? "Demotion" : "Safe"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-white/60 text-xs font-medium">Keep grinding to move up!</span>
            </CardContent>
          </Card>
        </div>

        {/* Leaderboard Section */}
        <Card className="bg-zinc-900/40 border-white/10 backdrop-blur-xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-3">
              <Trophy className="h-6 w-6 text-yellow-500" />
              League Leaderboard
            </CardTitle>
            <CardDescription className="text-white/40">
              Competing against others in the {userData.league} League
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            <div className="rounded-xl border border-white/5 overflow-hidden">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="w-[80px] text-white/40 uppercase tracking-widest text-[10px] font-black">Rank</TableHead>
                    <TableHead className="text-white/40 uppercase tracking-widest text-[10px] font-black">User</TableHead>
                    <TableHead className="text-white/40 uppercase tracking-widest text-[10px] font-black text-center">LVL</TableHead>
                    <TableHead className="text-right text-white/40 uppercase tracking-widest text-[10px] font-black text-teal-400">Total XP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboard.map((user) => {
                    const isPromotion = user.rank <= promotionThreshold;
                    const isDemotion = user.rank > demotionThreshold;
                    
                    return (
                      <TableRow 
                        key={user.userId} 
                        className={`border-white/5 hover:bg-white/5 transition-colors ${user.userId === (userData as any).userId ? "bg-teal-500/10" : ""}`}
                      >
                        <TableCell className="font-black text-lg">
                          <div className="flex items-center gap-2">
                            {user.rank === 1 && <Trophy className="h-4 w-4 text-yellow-500" />}
                            {user.rank}
                            {isPromotion && user.rank !== 1 && <ArrowUp className="h-3 w-3 text-green-400 mt-0.5" />}
                            {isDemotion && <ArrowDown className="h-3 w-3 text-red-400 mt-0.5" />}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center ring-1 ring-white/10">
                              <UserCircle className="h-5 w-5 text-white/60" />
                            </div>
                            <span className={`font-bold ${isPromotion ? "text-white" : "text-white/70"}`}>{user.fullName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-white/5 text-white/60 border-white/10 font-bold">
                            {user.globalLevel}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-black text-teal-400">
                          {user.globalXP.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Legend / Info Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/10 flex items-start gap-3">
            <ArrowUp className="h-5 w-5 text-green-400 shrink-0 mt-1" />
            <div>
              <p className="text-sm font-bold text-white">Promotion Zone</p>
              <p className="text-xs text-white/40 mt-1">
                {nextLeague 
                  ? `Top players in this league will be promoted to ${nextLeague} League at the end of the week.`
                  : "You are in the highest league! Top players maintain their elite status."}
              </p>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 flex items-start gap-3">
            <ArrowDown className="h-5 w-5 text-red-400 shrink-0 mt-1" />
            <div>
              <p className="text-sm font-bold text-white">Demotion Zone</p>
              <p className="text-xs text-white/40 mt-1">
                {prevLeague 
                  ? `Players in the bottom tier will drop to ${prevLeague} League. Keep up the daily flow!`
                  : "You are in the entry league. Bottom players will remain in Bronze."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
