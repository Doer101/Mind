"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Search, UserCircle, Loader2, ArrowRight } from "lucide-react";
import { searchUsers } from "../u/actions";
import Link from "next/link";
import { useDebounce } from "@/hooks/use-debounce"; // Assuming this exists or I'll create it

export function Discovery() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function performSearch() {
      const searchTerm = debouncedQuery.trim();
      if (searchTerm.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const users = await searchUsers(searchTerm);
        setResults(users);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsLoading(false);
      }
    }

    performSearch();
  }, [debouncedQuery]);

  return (
    <Card className="bg-black/50 border-white/20 backdrop-blur-sm overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-white text-xl">
          <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm">
            <Search className="h-5 w-5 text-white" />
          </div>
          Global Discovery
        </CardTitle>
        <CardDescription className="text-white/60">
          Search for other masters by their username
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/40" />
          <Input
            placeholder="Search usernames..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 bg-white/5 border-white/10 text-white placeholder-white/20 focus:border-white/30"
          />
        </div>

        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 text-teal-500 animate-spin" />
            </div>
          )}

          {!isLoading && results.length > 0 && results.map((user) => (
            <Link 
              key={user.id} 
              href={`/u/${user.name}`}
              className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/30 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.name} className="h-full w-full object-cover rounded-xl" />
                  ) : (
                    <UserCircle className="h-6 w-6 text-white/40" />
                  )}
                </div>
                <div>
                  <p className="font-bold text-white group-hover:text-teal-400 transition-colors">
                    {user.full_name || user.name}
                  </p>
                  <p className="text-[10px] uppercase tracking-widest text-white/40 font-black">
                    @{user.name}
                  </p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-white/20 group-hover:text-teal-500 transition-all group-hover:translate-x-1" />
            </Link>
          ))}

          {!isLoading && query.length >= 2 && results.length === 0 && (
            <p className="text-center text-white/20 text-sm py-8">
              No masters found matching that handle
            </p>
          )}

          {query.length < 2 && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-2 opacity-20">
              <Search className="h-12 w-12 text-white" />
              <p className="text-xs font-black uppercase tracking-widest">Type to search</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
