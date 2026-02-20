import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Globe, Target, Send } from 'lucide-react';

const About: React.FC = () => {
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
            <CardDescription>Together, building a sustainable future</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              We believe technology can empower communities to reduce waste, recycle more, and protect our planet. 
              GreenTrace combines AI-driven waste classification, location services, and gamification to make sustainable actions effortless and rewarding.
            </p>
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-lg bg-muted/30 text-center">
                <Globe className="w-6 h-6 mx-auto mb-2" />
                <div className="font-semibold">Global Impact</div>
                <div className="text-xs text-muted-foreground">1.2M items classified</div>
              </div>
              <div className="p-4 rounded-lg bg-muted/30 text-center">
                <Users className="w-6 h-6 mx-auto mb-2" />
                <div className="font-semibold">Community</div>
                <div className="text-xs text-muted-foreground">12,800 active users</div>
              </div>
              <div className="p-4 rounded-lg bg-muted/30 text-center">
                <Target className="w-6 h-6 mx-auto mb-2" />
                <div className="font-semibold">Challenges</div>
                <div className="text-xs text-muted-foreground">Recycle 100 bottles/week</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Support</CardTitle>
            <CardDescription>We'd love to hear from you</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <Label>Name</Label>
                <Input placeholder="Your name" />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" placeholder="you@example.com" />
              </div>
              <div>
                <Label>Message</Label>
                <Input placeholder="How can we help?" />
              </div>
              <Button className="w-full bg-gradient-to-r from-eco-primary to-eco-secondary text-white">
                <Send className="w-4 h-4 mr-2" /> Send
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default About;
