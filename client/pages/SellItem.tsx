import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  createListing,
  ListingCategory,
  ListingCondition,
} from "@/lib/marketplace";
import { useAuth } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Package, Upload, DollarSign, FileText, Tag } from "lucide-react";

export default function SellItemPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const nav = useNavigate();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ListingCategory>("electronics");
  const [condition, setCondition] = useState<ListingCondition>("used");
  const [price, setPrice] = useState<number>(0);
  const [desc, setDesc] = useState("");
  const [images, setImages] = useState<string[]>([]);

  const onImage = async (file: File) => {
    const url = await new Promise<string>((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.readAsDataURL(file);
    });
    setImages((prev) => [...prev, url]);
  };

  const submit = async () => {
  if (!user) {
    toast({ title: "Please login first", variant: "destructive" });
    return;
  }

  if (!title || price <= 0) {
    toast({ title: "Please fill title and price" });
    return;
  }

  try {
    const listing = await createListing({
      user_id: user.id,
      title,
      category,
      condition,
      description: desc,
      price,
      images,
    });

    toast({ title: "Listing created", description: listing.title });
    nav("/marketplace");
  } catch (err: any) {
    toast({
      title: "Create failed",
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
          <h1 className="text-3xl font-bold text-white mb-2">📦 Sell an Item</h1>
          <p className="text-gray-400 text-lg">List your pre-loved item for sale in our marketplace</p>
        </div>
      </motion.div>

      {/* Form */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Package className="w-6 h-6 text-green-400" />
              Item Details
            </CardTitle>
            <CardDescription className="text-gray-400">
              Fill in the details about your item
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <motion.div variants={itemVariants} className="space-y-2">
              <label className="text-white font-medium flex items-center gap-2">
                <Tag className="w-4 h-4 text-blue-400" />
                Title
              </label>
              <Input
                placeholder="What are you selling?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-slate-700/50 border-slate-600 text-white placeholder-gray-400 focus:border-blue-500"
              />
            </motion.div>

            {/* Category, Condition, Price */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-white font-medium">Category</label>
                <Select
                  value={category}
                  onValueChange={(v) => setCategory(v as any)}
                >
                  <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="electronics" className="text-white hover:bg-slate-700">Electronics</SelectItem>
                    <SelectItem value="furniture" className="text-white hover:bg-slate-700">Furniture</SelectItem>
                    <SelectItem value="books" className="text-white hover:bg-slate-700">Books</SelectItem>
                    <SelectItem value="clothes" className="text-white hover:bg-slate-700">Clothes</SelectItem>
                    <SelectItem value="other" className="text-white hover:bg-slate-700">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-white font-medium">Condition</label>
                <Select
                  value={condition}
                  onValueChange={(v) => setCondition(v as any)}
                >
                  <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="new" className="text-white hover:bg-slate-700">New</SelectItem>
                    <SelectItem value="used" className="text-white hover:bg-slate-700">Used</SelectItem>
                    <SelectItem value="repair" className="text-white hover:bg-slate-700">Repair Needed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-white font-medium flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  Price (₹)
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  value={price}
                  onChange={(e) => setPrice(parseFloat(e.target.value || "0") || 0)}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder-gray-400 focus:border-green-500"
                />
              </div>
            </motion.div>

            {/* Description */}
            <motion.div variants={itemVariants} className="space-y-2">
              <label className="text-white font-medium flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-400" />
                Description
              </label>
              <Textarea
                placeholder="Describe your item in detail..."
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="bg-slate-700/50 border-slate-600 text-white placeholder-gray-400 focus:border-purple-500 min-h-[100px]"
              />
            </motion.div>

            {/* Images */}
            <motion.div variants={itemVariants} className="space-y-4">
              <label className="text-white font-medium flex items-center gap-2">
                <Upload className="w-4 h-4 text-orange-400" />
                Images
              </label>
              <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center hover:border-orange-500 transition-colors">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-400 mb-2">Click to upload images</p>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onImage(f);
                  }}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Choose file
                </label>
              </div>
              {images.length > 0 && (
                <div className="flex gap-3 flex-wrap">
                  {images.map((src, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="relative group"
                    >
                      <img
                        src={src}
                        alt="preview"
                        className="w-24 h-24 object-cover rounded-lg border border-slate-600"
                      />
                      <button
                        onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Submit Button */}
            <motion.div variants={itemVariants} className="pt-4">
              <Button
                onClick={submit}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg py-3 text-lg font-semibold"
              >
                <Package className="w-5 h-5 mr-2" />
                Create Listing
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
