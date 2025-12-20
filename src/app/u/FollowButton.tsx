"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toggleFollow } from "./actions";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface FollowButtonProps {
  followingId: string;
  initialIsFollowing: boolean;
}

export function FollowButton({ followingId, initialIsFollowing }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleToggle = () => {
    startTransition(async () => {
      const result = await toggleFollow(followingId);
      if (result.success) {
        setIsFollowing(!isFollowing);
        toast({
          title: isFollowing ? "Unfollowed" : "Following",
          description: isFollowing ? "You have unfollowed this user." : "You are now following this user.",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update follow status",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Button
      onClick={handleToggle}
      disabled={isPending}
      variant={isFollowing ? "outline" : "default"}
      className={`min-w-[120px] font-bold uppercase tracking-wider transition-all duration-300 ${
        isFollowing 
          ? "border-white/40 text-black hover:text-white hover:bg-white/10 backdrop-blur-md" 
          : "bg-gradient-to-r from-teal-500 to-indigo-500 text-white hover:opacity-90 shadow-[0_0_20px_rgba(20,184,166,0.3)]"
      }`}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isFollowing ? (
        <>
          <UserMinus className="mr-2 h-4 w-4" />
          Unfollow
        </>
      ) : (
        <>
          <UserPlus className="mr-2 h-4 w-4" />
          Follow
        </>
      )}
    </Button>
  );
}
