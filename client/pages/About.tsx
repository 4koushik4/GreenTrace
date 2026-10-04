import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Globe, Target, Send } from 'lucide-react';

const About: React.FC = () => {
  const openEmailDraft = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const subject = `GreenTrace contact: ${String(formData.get('name') ?? '')}`;
    const body = [
      `Name: ${String(formData.get('name') ?? '')}`,
      `Email: ${String(formData.get('email') ?? '')}`,
      '',
      String(formData.get('message') ?? ''),
    ].join('\n');

    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">About & Community</h1>
        <p className="text-muted-foreground">Our mission, global impact, and how to get involved.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Mission & Vision</CardTitle>
            <CardDescription>Tools for making more informed waste-disposal choices</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              GreenTrace brings together image-based waste classification, facility discovery, and sustainability tools.
              Classification results depend on the configured service being available.
            </p>
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-lg bg-muted/30 text-center">
                <Globe className="w-6 h-6 mx-auto mb-2" />
                <div className="font-semibold">Waste guidance</div>
                <div className="text-xs text-muted-foreground">Classification and disposal information when available</div>
              </div>
              <div className="p-4 rounded-lg bg-muted/30 text-center">
                <Users className="w-6 h-6 mx-auto mb-2" />
                <div className="font-semibold">Facility discovery</div>
                <div className="text-xs text-muted-foreground">Explore listed recycling locations</div>
              </div>
              <div className="p-4 rounded-lg bg-muted/30 text-center">
                <Target className="w-6 h-6 mx-auto mb-2" />
                <div className="font-semibold">Sustainability tools</div>
                <div className="text-xs text-muted-foreground">Explore available tracking and challenges</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
            <CardDescription>Your email app will open a draft. Add the recipient before sending.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={openEmailDraft}>
              <div>
                <Label htmlFor="contact-name">Name</Label>
                <Input id="contact-name" name="name" placeholder="Your name" required />
              </div>
              <div>
                <Label htmlFor="contact-email">Email</Label>
                <Input id="contact-email" name="email" type="email" placeholder="you@example.com" required />
              </div>
              <div>
                <Label htmlFor="contact-message">Message</Label>
                <textarea
                  id="contact-message"
                  name="message"
                  placeholder="How can we help?"
                  required
                  className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-eco-primary to-eco-secondary text-white">
                <Send className="w-4 h-4 mr-2" /> Open email draft
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default About;
