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
import devRouter from "./routes/dev";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // =====================================================
  // Groq AI Chat endpoint
  // =====================================================
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history } = req.body;

      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Message is required" });
      }

      const apiKey = process.env.GROQ_API_KEY;
      console.log("[Groq] Received message:", message.slice(0, 80));
      console.log("[Groq] API Key exists:", !!apiKey);

      if (!apiKey) {
        return res.status(500).json({
          error: "GROQ_API_KEY not configured",
          reply: "AI chat is not configured. Please add GROQ_API_KEY to .env file.",
        });
      }

      // Build message history for context
      const chatMessages: any[] = [
        {
          role: "system",
          content: `You are Green India AI Assistant — a helpful, concise, emoji-friendly assistant for a recycling & sustainability platform.
You help users with: waste segregation, buyback orders, marketplace, eco points, pickup scheduling, recycling guidance, environmental laws, app navigation, sustainability tips.
Rules: Be short and helpful. Use emojis sparingly. You are NOT ChatGPT — you are Green India AI.`,
        },
      ];

      // Append conversation history if provided
      if (Array.isArray(history)) {
        for (const h of history.slice(-10)) {
          chatMessages.push({
            role: h.sender === "user" ? "user" : "assistant",
            content: h.body,
          });
        }
      }

      chatMessages.push({ role: "user", content: message });

      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: chatMessages,
            temperature: 0.7,
            max_tokens: 1024,
          }),
        }
      );

      console.log("[Groq] Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[Groq] API error body:", errorText);
        return res.status(502).json({
          error: "Groq API returned an error",
          reply: "Sorry, the AI service is temporarily unavailable. Please try again in a moment.",
        });
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content;

      res.json({
        reply: reply || "Sorry, I couldn't generate a response.",
      });
    } catch (err: any) {
      console.error("[Groq] Server error:", err?.message || err);
      res.status(500).json({
        error: "Internal server error",
        reply: "Sorry, something went wrong on our end. Please try again.",
      });
    }
  });

  // AI chat proxy route
  app.post("/api/ai-chat", aiChatRouter);

  // ML prediction endpoint (dev-friendly mock)
  app.post("/api/predict", handlePredict);

  // =====================================================
  // Developer Auth — hardcoded INDIA/BHARAT
  // =====================================================

  app.post("/api/dev/login", (req, res) => {
    const { username, password } = req.body;
    if (username === "INDIA" && password === "BHARAT") {
      return res.json({
        success: true,
        role: "developer",
        username: "INDIA",
        token: Buffer.from(`INDIA:${Date.now()}`).toString("base64"),
      });
    }
    return res.status(401).json({ error: "Invalid credentials" });
  });

  // Mount dev CRUD routes (service role — bypasses RLS)
  app.use("/api/dev", devRouter);

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
