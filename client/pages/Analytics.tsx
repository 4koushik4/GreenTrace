import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  Leaf,
  Recycle,
  TreePine,
  Users,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Share2,
  Globe,
  Droplet,
  Zap,
  Wind,
  Flame,
  Target,
  Award,
  Clock,
  MapPin,
  PieChart,
  LineChart,
  Activity,
  Sparkles,
  Eye,
  ArrowUp,
  ArrowDown,
  Info,
  CheckCircle,
  AlertTriangle,
  Heart,
  Factory,
  Car,
  Home,
  Building,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { useGamification } from "@/lib/gamification";

// Custom chart components (simplified for demo)
const SimpleChart = ({
  data,
  type = "bar",
}: {
  data: any[];
  type?: "bar" | "line" | "pie";
}) => (
  <div className="h-64 flex items-end justify-center gap-2 p-4">
    {data.map((item, index) => (
      <motion.div
        key={index}
        initial={{ height: 0 }}
        animate={{ height: `${item.value}%` }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        className={`w-8 ${item.color || "bg-eco-primary"} rounded-t-md relative group`}
        style={{ height: `${Math.max(item.value, 5)}%` }}
      >
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          {item.label}: {item.value}%
        </div>
      </motion.div>
    ))}
  </div>
);

const MetricCard = ({
  title,
  value,
  unit,
  icon: Icon,
  trend,
  trendValue,
  color = "text-eco-primary",
  bgColor = "bg-eco-primary/10",
}: {
  title: string;
  value: string | number;
  unit?: string;
  icon: any;
  trend?: "up" | "down";
  trendValue?: string;
  color?: string;
  bgColor?: string;
}) => (
  <motion.div
    initial={{ scale: 0.95, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ duration: 0.3 }}
    whileHover={{ scale: 1.02 }}
    className="h-full"
  >
    <Card
      className={`h-full border-0 ${bgColor} hover:shadow-lg transition-all duration-300`}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-1 mt-2">
              <span className={`text-3xl font-bold ${color}`}>{value}</span>
              {unit && (
                <span className="text-sm text-muted-foreground">{unit}</span>
              )}
            </div>
            {trend && trendValue && (
              <div
                className={`flex items-center gap-1 mt-2 text-sm ${
                  trend === "up" ? "text-green-600" : "text-red-600"
                }`}
              >
                {trend === "up" ? (
                  <ArrowUp className="w-4 h-4" />
                ) : (
                  <ArrowDown className="w-4 h-4" />
                )}
                <span>{trendValue} from last month</span>
              </div>
            )}
          </div>
          <div
            className={`w-12 h-12 rounded-xl ${bgColor} flex items-center justify-center`}
          >
            <Icon className={`w-6 h-6 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const Analytics: React.FC = () => {
  const { userProfile, loading } = useGamification();
  const [timeframe, setTimeframe] = useState("month");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Mock analytics data
  const environmentalImpact = {
    co2Saved: { value: 45.7, trend: "up", trendValue: "+8.3kg", unit: "kg" },
    energySaved: {
      value: 234.5,
      trend: "up",
      trendValue: "+42kWh",
      unit: "kWh",
    },
    waterSaved: { value: 1250, trend: "up", trendValue: "+180L", unit: "L" },
    treesEquivalent: {
      value: 8.3,
      trend: "up",
      trendValue: "+1.2",
      unit: "trees",
    },
    plasticReduced: {
      value: 24.7,
      trend: "up",
      trendValue: "+3.8kg",
      unit: "kg",
    },
    landfillDiverted: {
      value: 156.2,
      trend: "up",
      trendValue: "+28kg",
      unit: "kg",
    },
  };

  const classificationBreakdown = [
    { label: "Biodegradable", value: 42, color: "bg-green-500", count: 623 },
    { label: "Recyclable", value: 38, color: "bg-blue-500", count: 731 },
    { label: "Hazardous", value: 20, color: "bg-red-500", count: 193 },
  ];

  const monthlyTrends = [
    { month: "Jan", classifications: 85, accuracy: 92, co2: 3.2 },
    { month: "Feb", classifications: 120, accuracy: 94, co2: 4.8 },
    { month: "Mar", classifications: 156, accuracy: 95, co2: 6.1 },
    { month: "Apr", classifications: 189, accuracy: 96, co2: 7.5 },
    { month: "May", classifications: 234, accuracy: 97, co2: 8.9 },
  ];

  const globalComparison = {
    userRank: 42,
    totalUsers: 12847,
    percentile: 96.8,
    cityRank: 8,
    cityUsers: 1247,
    countryRank: 23,
    countryUsers: 5847,
  };

  const sustainabilityGoals = [
    {
      name: "Monthly Classification Goal",
      current: 234,
      target: 300,
      category: "Activity",
      icon: Target,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
    },
    {
      name: "CO₂ Reduction Target",
      current: 45.7,
      target: 60,
      category: "Environment",
      icon: Leaf,
      color: "text-green-500",
      bgColor: "bg-green-50",
    },
    {
      name: "Accuracy Improvement",
      current: 94.7,
      target: 96,
      category: "Performance",
      icon: TrendingUp,
      color: "text-purple-500",
      bgColor: "bg-purple-50",
    },
  ];

  const facilityImpact = [
    { name: "Green Recycling Hub", visits: 8, impact: "High", co2Saved: 12.3 },
    { name: "EcoCenter Downtown", visits: 3, impact: "Medium", co2Saved: 5.8 },
    { name: "Community Compost Site", visits: 1, impact: "Low", co2Saved: 2.1 },
  ];

  const predictions = {
    nextMonthClassifications: 278,
    yearEndCO2: 156.8,
    costSavings: 145.5,
    wasteReduction: "23%",
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center min-h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-eco-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-eco-primary to-eco-secondary bg-clip-text text-transparent">
            Environmental Impact Analytics
          </h1>
          <p className="text-muted-foreground mt-2">
            Track your environmental contributions and see the global impact of
            your actions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </motion.div>

      {/* Overview Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
      >
        <MetricCard
          title="CO₂ Saved"
          value={environmentalImpact.co2Saved.value}
          unit={environmentalImpact.co2Saved.unit}
          icon={Leaf}
          trend={environmentalImpact.co2Saved.trend as "up"}
          trendValue={environmentalImpact.co2Saved.trendValue}
          color="text-green-600"
          bgColor="bg-green-50"
        />
        <MetricCard
          title="Energy Saved"
          value={environmentalImpact.energySaved.value}
          unit={environmentalImpact.energySaved.unit}
          icon={Zap}
          trend={environmentalImpact.energySaved.trend as "up"}
          trendValue={environmentalImpact.energySaved.trendValue}
          color="text-yellow-600"
          bgColor="bg-yellow-50"
        />
        <MetricCard
          title="Water Saved"
          value={environmentalImpact.waterSaved.value}
          unit={environmentalImpact.waterSaved.unit}
          icon={Droplet}
          trend={environmentalImpact.waterSaved.trend as "up"}
          trendValue={environmentalImpact.waterSaved.trendValue}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <MetricCard
          title="Trees Equivalent"
          value={environmentalImpact.treesEquivalent.value}
          unit={environmentalImpact.treesEquivalent.unit}
          icon={TreePine}
          trend={environmentalImpact.treesEquivalent.trend as "up"}
          trendValue={environmentalImpact.treesEquivalent.trendValue}
          color="text-emerald-600"
          bgColor="bg-emerald-50"
        />
        <MetricCard
          title="Plastic Reduced"
          value={environmentalImpact.plasticReduced.value}
          unit={environmentalImpact.plasticReduced.unit}
          icon={Recycle}
          trend={environmentalImpact.plasticReduced.trend as "up"}
          trendValue={environmentalImpact.plasticReduced.trendValue}
          color="text-cyan-600"
          bgColor="bg-cyan-50"
        />
        <MetricCard
          title="Landfill Diverted"
          value={environmentalImpact.landfillDiverted.value}
          unit={environmentalImpact.landfillDiverted.unit}
          icon={Trash2}
          trend={environmentalImpact.landfillDiverted.trend as "up"}
          trendValue={environmentalImpact.landfillDiverted.trendValue}
          color="text-orange-600"
          bgColor="bg-orange-50"
        />
      </motion.div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Classification Breakdown */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Waste Classification Breakdown
                </CardTitle>
                <CardDescription>
                  Distribution of your {userProfile?.stats.totalClassifications}{" "}
                  total classifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {classificationBreakdown.map((item) => (
                    <div key={item.label} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{item.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {item.count} items
                          </span>
                          <span className="font-medium">{item.value}%</span>
                        </div>
                      </div>
                      <Progress value={item.value} className="h-3" />
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Overall Performance
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">
                        Accuracy Rate
                      </span>
                      <div className="font-bold text-green-600">
                        {userProfile?.stats.accuracy}%
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Total Impact
                      </span>
                      <div className="font-bold text-eco-primary">High</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Global Impact Comparison */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Global Comparison
                </CardTitle>
                <CardDescription>How you rank among all users</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-gradient-to-br from-eco-primary/10 to-eco-secondary/10 rounded-lg">
                  <div className="text-3xl font-bold text-eco-primary">
                    #{globalComparison.userRank}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Global Rank
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Top {(100 - globalComparison.percentile).toFixed(1)}% of
                    users
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">City Rank</span>
                    <Badge variant="outline">
                      #{globalComparison.cityRank}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Country Rank</span>
                    <Badge variant="outline">
                      #{globalComparison.countryRank}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Users</span>
                    <span className="text-sm font-medium">
                      {globalComparison.totalUsers.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Facility Impact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Recycling Facility Impact
              </CardTitle>
              <CardDescription>
                Your contributions at different facilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {facilityImpact.map((facility) => (
                  <div key={facility.name} className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">{facility.name}</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Visits</span>
                        <span className="font-medium">{facility.visits}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Impact</span>
                        <Badge
                          variant={
                            facility.impact === "High"
                              ? "default"
                              : facility.impact === "Medium"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {facility.impact}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">CO₂ Saved</span>
                        <span className="font-medium text-green-600">
                          {facility.co2Saved}kg
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sustainabilityGoals.map((goal) => (
              <Card key={goal.name} className={`border-0 ${goal.bgColor}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{goal.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {goal.category}
                      </p>
                    </div>
                    <goal.icon className={`w-8 h-8 ${goal.color}`} />
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span className="font-medium">
                        {goal.current} / {goal.target}
                      </span>
                    </div>
                    <Progress
                      value={(goal.current / goal.target) * 100}
                      className="h-3"
                    />
                    <div className="text-xs text-muted-foreground">
                      {((goal.current / goal.target) * 100).toFixed(1)}%
                      complete
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                AI-Powered Predictions
              </CardTitle>
              <CardDescription>
                Based on your current patterns and behavior trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {predictions.nextMonthClassifications}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Predicted classifications next month
                  </div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {predictions.yearEndCO2}kg
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Year-end CO₂ savings projection
                  </div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    ${predictions.costSavings}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Estimated cost savings this year
                  </div>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600 mb-1">
                    {predictions.wasteReduction}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Household waste reduction
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;
