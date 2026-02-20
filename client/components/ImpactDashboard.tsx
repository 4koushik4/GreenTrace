import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Globe, Leaf, Recycle, TrendingUp } from 'lucide-react';

interface ImpactStats {
  totalWasteRecycled: number;
  co2Saved: number;
  treesPreserved: number;
  activeUsers: number;
  historicalData: Array<{
    date: string;
    wasteRecycled: number;
    co2Saved: number;
  }>;
}

export default function ImpactDashboard() {
  const [stats, setStats] = useState<ImpactStats>({
    totalWasteRecycled: 0,
    co2Saved: 0,
    treesPreserved: 0,
    activeUsers: 0,
    historicalData: [],
  });

  useEffect(() => {
    // TODO: Fetch real data from Supabase
    // Mock data for now
    const mockStats: ImpactStats = {
      totalWasteRecycled: 1250,
      co2Saved: 450,
      treesPreserved: 75,
      activeUsers: 520,
      historicalData: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toLocaleDateString(),
        wasteRecycled: Math.floor(Math.random() * 100 + 150),
        co2Saved: Math.floor(Math.random() * 40 + 60),
      })).reverse(),
    };
    setStats(mockStats);
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Waste Recycled
            </CardTitle>
            <Recycle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWasteRecycled}kg</div>
            <p className="text-xs text-muted-foreground">
              +20% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              CO₂ Emissions Saved
            </CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.co2Saved}kg</div>
            <p className="text-xs text-muted-foreground">
              Equivalent to {Math.floor(stats.co2Saved / 10)} car trips
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Trees Preserved
            </CardTitle>
            <Leaf className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.treesPreserved}</div>
            <p className="text-xs text-muted-foreground">
              Through paper recycling
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Users
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              Contributing to recycling
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recycling Trends</CardTitle>
          <CardDescription>
            Daily waste recycling and CO₂ savings over the past week
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.historicalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="wasteRecycled"
                  stroke="#2563eb"
                  name="Waste Recycled (kg)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="co2Saved"
                  stroke="#16a34a"
                  name="CO₂ Saved (kg)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <AlertTitle>Community Milestone!</AlertTitle>
        <AlertDescription>
          We've collectively recycled over 1 tonne of waste this month. Keep up the great work! 🌍
        </AlertDescription>
      </Alert>
    </div>
  );
}
