import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load .env from project root (works both in dev & prod)
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

import express from "express";
import cors from "cors";
import aiChatRouter from "./routes/ai-chat";
import { handlePredict } from "./routes/predict";
import { requestRoboflowPrediction, RoboflowProxyError } from "./roboflow-proxy";
import { NearbySearchError, requestNearbyFacilities } from "./overpass-proxy";
import { GroqChatError, requestGroqChat, requestGroqDisposalGuidance } from "./groq-proxy";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.text({ type: "text/plain", limit: "14mb" }));

  app.post("/api/roboflow/predict", async (req, res) => {
    try {
      if (typeof req.body !== "string") {
        return res.status(400).json({ error: "invalid_request", message: "Choose a supported image smaller than 10 MB." });
      }
      return res.json(await requestRoboflowPrediction(req.body));
    } catch (error) {
      if (error instanceof RoboflowProxyError) {
        return res.status(error.status).json({ error: error.code, message: error.message });
      }
      return res.status(500).json({ error: "proxy_error", message: "Unable to analyze this image. Please try again." });
    }
  });

  app.post("/api/nearby-centres", async (req, res) => {
    try {
      return res.json(await requestNearbyFacilities(req.body));
    } catch (error) {
      if (error instanceof NearbySearchError) {
        return res.status(error.status).json({ error: "nearby_search_failed", message: error.message });
      }
      return res.status(502).json({ error: "nearby_search_failed", message: "Nearby map search is temporarily unavailable. Please try again shortly." });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      return res.json(await requestGroqChat(req.body));
    } catch (error) {
      if (error instanceof GroqChatError) {
        return res.status(error.status).json({ error: error.message, reply: error.reply });
      }
      return res.status(502).json({
        error: "The AI service is temporarily unavailable.",
        reply: "Sorry, the AI service is temporarily unavailable. Please try again in a moment.",
      });
    }
  });

  app.post("/api/disposal-guidance", async (req, res) => {
    try {
      return res.json(await requestGroqDisposalGuidance(req.body));
    } catch (error) {
      if (error instanceof GroqChatError) {
        return res.status(error.status).json({ error: error.message });
      }
      return res.status(502).json({ error: "Disposal guidance is temporarily unavailable." });
    }
  });

  // AI chat proxy route
  app.post("/api/ai-chat", aiChatRouter);

  // ML prediction endpoint (dev-friendly mock)
  app.post("/api/predict", handlePredict);

  // =====================================================
  // Admin Auth API endpoints
  // =====================================================

  // Admin/Supervisor login
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { email, password, role } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }

      // Import supabase for server-side
      const { createClient } = await import("@supabase/supabase-js");
      const supabaseUrl = process.env.VITE_SUPABASE_URL;
      const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        return res.status(500).json({ error: "Supabase not configured" });
      }

      const supabase = createClient(supabaseUrl, supabaseKey);

      // Sign in with Supabase auth
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({ email, password });

      if (authError) {
        return res.status(401).json({ error: authError.message });
      }

      // Check admin_users table for role
      const { data: adminUser, error: adminError } = await supabase
        .from("admin_users")
        .select("*")
        .eq("user_id", authData.user.id)
        .single();

      if (adminError || !adminUser) {
        return res.status(403).json({ error: "You are not authorized as admin/supervisor" });
      }

      if (role && adminUser.role !== role && adminUser.role !== "super_admin") {
        return res.status(403).json({ error: `You are not authorized as ${role}` });
      }

      res.json({
        user: authData.user,
        session: authData.session,
        adminProfile: adminUser,
      });
    } catch (err: any) {
      console.error("[Admin Login] Error:", err?.message);
      res.status(500).json({ error: "Login failed" });
    }
  });

  return app;
}
