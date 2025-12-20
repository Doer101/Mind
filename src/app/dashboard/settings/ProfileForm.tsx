"use client";

import { useActionState } from "react";
import { updateProfile } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { User, Globe, PenLine, Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

const initialState = { error: "", success: "" };

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full sm:w-auto bg-white text-black hover:bg-white/90"
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Saving...
        </>
      ) : (
        "Save Profile"
      )}
    </Button>
  );
}

export default function ProfileForm({
  user,
  profile,
}: {
  user: any;
  profile: any;
}) {
  const [formState, formAction] = useActionState(updateProfile, initialState);

  return (
    <Card className="bg-black/50 border-white/10 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white">Public Profile</CardTitle>
        <CardDescription className="text-white/60">
          Manage how you appear to others on Mind.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white">Email</Label>
            <Input
              id="email"
              disabled
              defaultValue={user.email}
              className="bg-white/5 border-white/10 text-white/50"
            />
            <p className="text-[0.8rem] text-white/40">
              Email cannot be changed here.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name" className="text-white">Username</Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-white/40 font-mono text-sm">@</span>
              <Input
                id="name"
                name="name"
                placeholder="username"
                defaultValue={profile?.name || ""}
                className="pl-8 bg-black/50 border-white/20 text-white placeholder-white/30 focus:border-white/50"
                pattern="^[a-z0-9_]+$"
                title="Username can only contain lowercase letters, numbers, and underscores."
              />
            </div>
            <p className="text-[0.8rem] text-white/40">
              Your unique public handle. Lowercase, numbers, and underscores only.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_name" className="text-white">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-white/40" />
              <Input
                id="full_name"
                name="full_name"
                placeholder="Your full name"
                defaultValue={profile?.full_name || ""}
                className="pl-9 bg-black/50 border-white/20 text-white placeholder-white/30 focus:border-white/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio" className="text-white">Bio</Label>
            <div className="relative">
              <Textarea
                id="bio"
                name="bio"
                placeholder="Tell us a little about yourself"
                defaultValue={profile?.bio || ""}
                className="min-h-[100px] bg-black/50 border-white/20 text-white placeholder-white/30 focus:border-white/50"
              />
              <PenLine className="absolute right-3 top-3 h-4 w-4 text-white/40" />
            </div>
            <p className="text-[0.8rem] text-white/60">
              You can @mention other users and organizations to link to them.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website" className="text-white">Website</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-2.5 h-4 w-4 text-white/40" />
              <Input
                id="website"
                name="website"
                type="url"
                placeholder="https://your-website.com"
                defaultValue={profile?.website || ""}
                className="pl-9 bg-black/50 border-white/20 text-white placeholder-white/30 focus:border-white/50"
              />
            </div>
          </div>

          {formState.error && (
            <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {formState.error}
            </div>
          )}
          
          {formState.success && (
            <div className="p-3 rounded bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
              {formState.success}
            </div>
          )}

          <div className="flex justify-end">
            <SubmitButton />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
