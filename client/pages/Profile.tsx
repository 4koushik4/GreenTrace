import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../App';
import { useTheme } from '@/components/ThemeProvider';

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Profile & Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences.</p>
      </div>

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
                <div className="font-semibold">{user?.name || 'Anonymous'}</div>
                <div className="text-sm text-muted-foreground">{user?.email}</div>
                <div className="mt-2"><Badge>{user?.level || 'Beginner'}</Badge></div>
              </div>
            </div>
            <div className="grid gap-3">
              <Label>Name</Label>
              <Input defaultValue={user?.name} onBlur={(e) => updateUser({ name: e.target.value })} />
              <Label>Email</Label>
              <Input defaultValue={user?.email} disabled />
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
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={(v) => setTheme(v ? 'dark' : 'light')}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Notifications</div>
                <div className="text-sm text-muted-foreground">Receive reminders to recycle</div>
              </div>
              <Switch
                checked={user?.preferences?.notifications ?? true}
                onCheckedChange={(v) => updateUser({ preferences: { ...(user?.preferences || { darkMode: false, notifications: true, language: 'en' }), notifications: v } })}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;

