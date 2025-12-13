import { redirect } from "next/navigation";
import { createClient } from "@/supabase/server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, UserCircle, Sliders } from "lucide-react";
import ProfileForm from "./ProfileForm";
import PreferencesForm from "./PreferencesForm";

const DEFAULT_TYPES = [
  "creative",
  "journal",
  "mindset",
  "reflection",
  "challenge",
];

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Fetch current profile and preferences
  const { data: userData } = await supabase
    .from("users")
    .select("full_name, bio, website, quest_preference, notifications_enabled, email")
    .eq("id", user.id)
    .single();

  const questPreference: string[] = userData?.quest_preference || [];
  const selected = questPreference.filter((t) => DEFAULT_TYPES.includes(t));
  const custom = questPreference.find((t) => !DEFAULT_TYPES.includes(t)) || "";
  const notificationsEnabled = userData?.notifications_enabled ?? true;

  return (
    <div className="container mx-auto px-4 py-8 bg-black text-white min-h-[calc(100vh-4rem)]">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Settings
          </h1>
          <p className="text-white/60">
            Manage your account settings and preferences.
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-white/10 p-1 border border-white/10">
            <TabsTrigger 
              value="profile"
              className="data-[state=active]:bg-white data-[state=active]:text-black text-white/70 hover:text-white"
            >
              <UserCircle className="mr-2 h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger 
              value="preferences"
              className="data-[state=active]:bg-white data-[state=active]:text-black text-white/70 hover:text-white"
            >
              <Sliders className="mr-2 h-4 w-4" />
              Preferences
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4 animate-in fade-in-50 slide-in-from-bottom-2">
            <ProfileForm 
              user={user} 
              profile={{
                full_name: userData?.full_name,
                bio: userData?.bio,
                website: userData?.website
              }} 
            />
          </TabsContent>

          <TabsContent value="preferences" className="space-y-4 animate-in fade-in-50 slide-in-from-bottom-2">
            <PreferencesForm 
              selected={selected} 
              custom={custom} 
              notificationsEnabled={notificationsEnabled}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
