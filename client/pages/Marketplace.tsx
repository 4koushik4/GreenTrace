import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  listListings,
  Listing,
  ListingCategory,
  ListingCondition,
} from "@/lib/marketplace";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ShoppingBag, Search, Filter, Plus } from "lucide-react";

export default function MarketplacePage() {
  const [items, setItems] = useState<Listing[]>([]);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<ListingCategory | "all">("all");
  const [condition, setCondition] = useState<ListingCondition | "all">("all");

  const load = async () => {
    const res = await listListings({
      q: q || undefined,
      category: category === "all" ? undefined : category,
      condition: condition === "all" ? undefined : condition,
    });
    setItems(res);
  };

  useEffect(() => {
    load();
  }, []);

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
      className="space-y-6 max-w-7xl mx-auto"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">🛒 Marketplace</h1>
            <p className="text-gray-400 text-lg">Buy pre-loved items or list yours for sale</p>
          </div>
          <Link to="/sell-item">
            <Button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg">
              <Plus className="w-4 h-4 mr-2" />
              Sell an Item
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Filter className="w-6 h-6 text-purple-400" />
              Search & Filters
            </CardTitle>
            <CardDescription className="text-gray-400">
              Find the perfect items in our marketplace
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search items..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9 bg-slate-700/50 border-slate-600 text-white placeholder-gray-400"
              />
            </div>
            <Select value={category} onValueChange={(v) => setCategory(v as any)}>
              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all" className="text-white hover:bg-slate-700">All Categories</SelectItem>
                <SelectItem value="electronics" className="text-white hover:bg-slate-700">Electronics</SelectItem>
                <SelectItem value="furniture" className="text-white hover:bg-slate-700">Furniture</SelectItem>
                <SelectItem value="books" className="text-white hover:bg-slate-700">Books</SelectItem>
                <SelectItem value="clothes" className="text-white hover:bg-slate-700">Clothes</SelectItem>
                <SelectItem value="other" className="text-white hover:bg-slate-700">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={condition}
              onValueChange={(v) => setCondition(v as any)}
            >
              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                <SelectValue placeholder="Condition" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all" className="text-white hover:bg-slate-700">All Conditions</SelectItem>
                <SelectItem value="new" className="text-white hover:bg-slate-700">New</SelectItem>
                <SelectItem value="used" className="text-white hover:bg-slate-700">Used</SelectItem>
                <SelectItem value="repair" className="text-white hover:bg-slate-700">Repair Needed</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={load}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
            >
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Listings */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((it) => (
            <motion.div
              key={it.id}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link to={`/listing/${it.id}`} className="block">
                <Card className="overflow-hidden border-0 bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
                  {it.images?.[0] && (
                    <div className="relative overflow-hidden">
                      <img
                        src={it.images[0]}
                        alt={it.title}
                        className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  )}
                  <CardContent className="p-4 space-y-2">
                    <div className="font-semibold text-white text-lg">{it.title}</div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-slate-700/50 text-gray-300 border-slate-600">
                        {it.category}
                      </Badge>
                      <Badge variant="outline" className="border-slate-600 text-gray-400">
                        {it.condition}
                      </Badge>
                    </div>
                    <div className="text-green-400 font-bold text-xl">₹{it.price}</div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
          {items.length === 0 && (
            <motion.div
              variants={itemVariants}
              className="col-span-full text-center py-12"
            >
              <ShoppingBag className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No listings found.</p>
              <p className="text-gray-500 text-sm">Try adjusting your search filters.</p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
