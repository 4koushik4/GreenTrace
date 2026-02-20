import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth as useAppAuth } from "../App";
import { useAuth as useSbAuth, useUserProfile } from "@/lib/supabase";

export default function Settings() {
  const { user: appUser, updateUser } = useAppAuth();
  const { user: sbUser } = useSbAuth();
  const { profile, updateProfile } = useUserProfile(sbUser?.id);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("en");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setEmail(profile.email || appUser?.email || "");
      setNotifications(profile.preferences?.notifications ?? true);
      setDarkMode(profile.preferences?.dark_mode ?? false);
      setLanguage(profile.preferences?.language || "en");
      return;
    }
    if (appUser) {
      setFullName(appUser.name || "");
      setEmail(appUser.email || "");
    }
  }, [profile, appUser]);

  const onSave = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      if (sbUser?.id && updateProfile) {
        await updateProfile({
          full_name: fullName || email.split("@")[0],
          preferences: {
            notifications,
            dark_mode: darkMode,
            language,
          },
        });
      } else {
        updateUser({
          name: fullName || email.split("@")[0],
        });
      }
      setMessage("Settings saved successfully");
    } catch (e: any) {
      setError(e?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card
        className="bg-slate-800/50 border-slate-700/50"
        style={{ backgroundColor: "rgb(15, 23, 42)" }}
      >
        <CardHeader>
          <CardTitle className="text-white">Account Settings</CardTitle>
          <CardDescription className="text-gray-400">
            Manage your profile and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {message && (
            <div className="p-3 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              {message}
            </div>
          )}
          {error && (
            <div className="p-3 rounded bg-red-500/10 border border-red-500/30 text-red-400">
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-gray-300">Full Name</Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Email</Label>
              <Input
                value={email}
                disabled
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg border border-slate-700/50 bg-slate-700/30 p-4">
              <div>
                <div className="font-medium text-white">
                  Email Notifications
                </div>
                <div className="text-sm text-gray-400">
                  Receive updates about activity
                </div>
              </div>
              <Switch
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-700/50 bg-slate-700/30 p-4">
              <div>
                <div className="font-medium text-white">Dark Mode</div>
                <div className="text-sm text-gray-400">Prefer dark theme</div>
              </div>
              <Switch checked={darkMode} onCheckedChange={setDarkMode} />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 text-white border-slate-700">
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">Hindi</SelectItem>
                <SelectItem value="te">Telugu</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={onSave}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700"
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
