import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/supabase";
import {
  createBuybackOrder,
  listBuybackOrders,
  MaterialType,
  getPriceQuote,
  BuybackOrder,
} from "@/lib/buyback";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { awardPoints } from "@/lib/voucher-operations";
import { Recycle, DollarSign, Package, TrendingUp } from "lucide-react";

export default function BuyBackPage() {
  const { user } = useAuth();
  const [material, setMaterial] = useState<MaterialType>("plastic");
  const [weight, setWeight] = useState(1);
  const [orders, setOrders] = useState<BuybackOrder[]>([]);
  const { toast } = useToast();
  const quote = getPriceQuote(material, weight);

  useEffect(() => {
    if (user) load();
  }, [user]);

  const load = async () => {
    if (!user) return;
    const data = await listBuybackOrders(user.id);
    setOrders(data);
  };

  const submit = async () => {
    if (!user) {
      toast({ title: "Please login first", variant: "destructive" });
      return;
    }

    try {
      const order = await createBuybackOrder({
        user_id: user.id,
        material_type: material,
        weight_kg: weight,
      });

      await load();

      const pts = Math.max(1, Math.round(order.total_amount / 10));
      await awardPoints(
        user.id,
        pts,
        `Buy-back order for ${order.material_type}`
      );

      toast({
        title: "Order created",
        description: `Quote: ₹${order.total_amount}`,
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Order failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.1,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 max-w-4xl mx-auto"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            💰 Sell Recyclables
          </h1>
          <p className="text-gray-400 text-lg">
            Get instant price quotes and schedule a pickup with partners
          </p>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="border-0 bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Recycle className="w-6 h-6 text-green-400" />
              Create Buy-Back Order
            </CardTitle>
            <CardDescription className="text-gray-400">
              Select your material and weight to get an instant price quote
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Material Type</Label>
                <Select
                  value={material}
                  onValueChange={(v) => setMaterial(v as MaterialType)}
                >
                  <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="plastic" className="text-white hover:bg-slate-700">Plastic</SelectItem>
                    <SelectItem value="paper" className="text-white hover:bg-slate-700">Paper</SelectItem>
                    <SelectItem value="metal" className="text-white hover:bg-slate-700">Metal</SelectItem>
                    <SelectItem value="glass" className="text-white hover:bg-slate-700">Glass</SelectItem>
                    <SelectItem value="e-waste" className="text-white hover:bg-slate-700">E-waste</SelectItem>
                    <SelectItem value="other" className="text-white hover:bg-slate-700">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Weight (kg)</Label>
                <Input
                  type="number"
                  min={0.1}
                  step={0.1}
                  value={weight}
                  onChange={(e) =>
                    setWeight(parseFloat(e.target.value || "0") || 0)
                  }
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2 md:col-span-3">
                <Label className="text-gray-300">Estimated Payout</Label>
                <motion.div
                  key={quote}
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  className="p-4 rounded-lg bg-gradient-to-r from-green-600/20 to-blue-600/20 border border-green-500/30"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-400" />
                      <span className="text-white font-semibold">₹{quote}</span>
                    </div>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      Instant Quote
                    </Badge>
                  </div>
                </motion.div>
              </div>
            </div>

            <Button
              onClick={submit}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg"
            >
              <Package className="w-4 h-4 mr-2" />
              Create Buy-Back Order
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="border-0 bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-blue-400" />
              My Buy-Back Orders
            </CardTitle>
            <CardDescription className="text-gray-400">
              Track your recycling sales and earnings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {orders.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No orders yet. Start selling your recyclables!</p>
              </div>
            ) : (
              orders.map((o, index) => (
                <motion.div
                  key={o.id}
                  variants={itemVariants}
                  className="p-4 rounded-lg bg-slate-800/30 border border-slate-700 hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-lg flex items-center justify-center">
                        <Recycle className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <div className="text-white font-medium">
                          {o.material_type.charAt(0).toUpperCase() + o.material_type.slice(1)} • {o.weight_kg}kg
                        </div>
                        <div className="text-gray-400 text-sm">
                          ₹{o.total_amount} • {new Date(o.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <Badge className={`${
                      o.status === 'completed' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                      o.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                      'bg-gray-500/20 text-gray-400 border-gray-500/30'
                    }`}>
                      {o.status.charAt(0).toUpperCase() + o.status.slice(1)}
                    </Badge>
                  </div>
                </motion.div>
              ))
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
