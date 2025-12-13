"use client";

import { useActionState } from "react";
import { updatePreferences } from "./actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Loader2, Bell, Tag } from "lucide-react";
import { useFormStatus } from "react-dom";

const DEFAULT_TYPES = [
  "creative",
  "journal",
  "mindset",
  "reflection",
  "challenge",
];

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
          Saving Preferences...
        </>
      ) : (
        "Save Preferences"
      )}
    </Button>
  );
}

export default function PreferencesForm({
  selected,
  custom,
  notificationsEnabled = true,
}: {
  selected: string[];
  custom: string;
  notificationsEnabled?: boolean;
}) {
  const [formState, formAction] = useActionState(
    updatePreferences,
    initialState
  );

  return (
    <form action={formAction} className="space-y-6">
      {/* Quest Preferences */}
      <Card className="bg-black/50 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-white/70" />
            <CardTitle className="text-white">Quest Preferences</CardTitle>
          </div>
          <CardDescription className="text-white/60">
            Customize the types of daily quests you receive.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {DEFAULT_TYPES.map((type) => (
              <div
                key={type}
                className="flex items-center space-x-3 rounded-lg border border-white/10 p-4 bg-white/5 transition-colors hover:bg-white/10"
              >
                <Checkbox
                  id={`type-${type}`}
                  name="quest_type"
                  value={type}
                  defaultChecked={selected.includes(type)}
                  className="border-white/30 data-[state=checked]:bg-white data-[state=checked]:text-black"
                />
                <Label
                  htmlFor={`type-${type}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white capitalize cursor-pointer flex-1"
                >
                  {type}
                </Label>
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-2">
            <Label htmlFor="custom" className="text-white">Custom Quest Type</Label>
            <Input
              type="text"
              id="custom"
              name="custom"
              defaultValue={custom}
              placeholder="e.g. Fitness, coding, meditation"
              className="bg-black/50 border-white/20 text-white placeholder-white/30 focus:border-white/50"
            />
            <p className="text-[0.8rem] text-white/60">
              Add a specific topic you'd like to focus on.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="bg-black/50 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-white/70" />
            <CardTitle className="text-white">Notifications</CardTitle>
          </div>
          <CardDescription className="text-white/60">
            Manage your email and push notification settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border border-white/10 p-4 bg-white/5">
            <div className="space-y-0.5">
              <Label htmlFor="notifications" className="text-white text-base">
                Enable Notifications
              </Label>
              <p className="text-sm text-white/60">
                Receive updates about your quests and progress.
              </p>
            </div>
            <Switch
              id="notifications"
              name="notifications"
              defaultChecked={notificationsEnabled}
              className="data-[state=checked]:bg-white data-[state=unchecked]:bg-white/20"
            />
          </div>
        </CardContent>
      </Card>

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
  );
}
