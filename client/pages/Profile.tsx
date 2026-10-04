import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../App';
import { useTheme } from '@/components/ThemeProvider';
import { supabase, useUserProfile } from '@/lib/supabase';

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useUserProfile(user?.id);
  const { theme, setTheme } = useTheme();
  const [name, setName] = useState('');
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setName(profile.full_name || '');
    setNotifications(profile.preferences?.notifications ?? true);
    setDarkMode(profile.preferences?.dark_mode ?? false);
  }, [profile]);

  const saveProfile = async (changes: { name?: string; notifications?: boolean; darkMode?: boolean }) => {
    if (!user?.id || !supabase) {
      setError('Profile storage is unavailable. Please sign in with a connected account and try again.');
      return;
    }
    if (!profile) {
      setError('Your profile record is unavailable, so changes cannot be saved yet.');
      return;
    }

    const nextName = changes.name ?? name;
    const nextNotifications = changes.notifications ?? notifications;
    const nextDarkMode = changes.darkMode ?? darkMode;

    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await updateProfile({
        full_name: nextName.trim(),
        preferences: {
          notifications: nextNotifications,
          dark_mode: nextDarkMode,
          language: profile?.preferences?.language || 'en',
        },
      });
      updateUser({
        name: nextName.trim(),
        preferences: {
          ...(user.preferences || { darkMode: false, notifications: true, language: 'en' }),
          darkMode: nextDarkMode,
          notifications: nextNotifications,
        },
      });
      setName(nextName.trim());
      setNotifications(nextNotifications);
      setDarkMode(nextDarkMode);
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save your profile.');
    } finally {
      setSaving(false);
    }
  };

  const saveName = () => {
    if (!name.trim()) {
      setError('Name cannot be empty.');
      return;
    }
    void saveProfile({ name });
  };

  const changeNotifications = (enabled: boolean) => {
    void saveProfile({ notifications: enabled });
  };

  const changeDarkMode = (enabled: boolean) => {
    setTheme(enabled ? 'dark' : 'light');
    void saveProfile({ darkMode: enabled });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Profile &amp; Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences.</p>
      </div>

      {(error || saved) && (
        <div role={error ? 'alert' : 'status'} className={`mb-4 rounded-md border p-3 text-sm ${error ? 'border-red-500/40 text-red-500' : 'border-green-500/40 text-green-600'}`}>
          {error || 'Profile changes saved.'}
        </div>
      )}
      {!supabase && (
        <div role="alert" className="mb-4 rounded-md border border-red-500/40 p-3 text-sm text-red-500">
          Persistent profile storage is unavailable because Supabase is not configured.
        </div>
      )}
      {!profileLoading && user?.id && supabase && !profile && (
        <div role="alert" className="mb-4 rounded-md border border-red-500/40 p-3 text-sm text-red-500">
          Your profile could not be loaded. Persistent profile updates are unavailable.
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your public information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-muted" />
              )}
              <div>
                <div className="font-semibold">{profile?.full_name || user?.name || 'Anonymous'}</div>
                <div className="text-sm text-muted-foreground">{user?.email}</div>
                <div className="mt-2"><Badge>{profile?.level || user?.level || 'Beginner'}</Badge></div>
              </div>
            </div>
            <div className="grid gap-3">
              <Label htmlFor="profile-name">Name</Label>
              <Input id="profile-name" value={name} onChange={(event) => setName(event.target.value)} disabled={profileLoading || saving} />
              <Label htmlFor="profile-email">Email</Label>
              <Input id="profile-email" value={user?.email || ''} disabled />
              <Button onClick={saveName} disabled={profileLoading || !profile || saving || !name.trim()}>
                {saving ? 'Saving…' : 'Save Profile'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>Personalize your experience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Dark Mode</div>
                <div className="text-sm text-muted-foreground">Toggle light/dark theme</div>
              </div>
              <Switch checked={theme === 'dark'} onCheckedChange={changeDarkMode} disabled={saving || profileLoading || !profile} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Notifications</div>
                <div className="text-sm text-muted-foreground">Receive reminders to recycle</div>
              </div>
              <Switch checked={notifications} onCheckedChange={changeNotifications} disabled={saving || profileLoading || !profile} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
