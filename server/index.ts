import "dotenv/config";
import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import aiChatRouter from "./routes/ai-chat";
import { handlePredict } from "./routes/predict";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Chat with Groq API
  app.post("/api/chat", async (req, res) => {
    try {
      const { message } = req.body;

      console.log("Received message:", message);
      console.log("API Key exists:", !!process.env.VITE_GROQ_API_URL);

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.VITE_GROQ_API_URL}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant", // Updated to available model
          messages: [
            {
              role: "system",
              content: "You are a helpful AI assistant for Green India, a recycling and sustainability platform. Help users with questions about recycling, waste management, environmental sustainability, and general inquiries."
            },
            { role: "user", content: message },
          ],
        }),
      });

      console.log("Groq API response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Groq API error:", errorText);
        return res.status(500).json({ error: "Failed to get AI response" });
      }

      const data = await response.json();

      const reply = data.choices?.[0]?.message?.content;

      res.json({
        reply: reply || "Sorry, I couldn't generate a response.",
      });

    } catch (err) {
      console.error("Groq API error:", err);
      res.status(500).json({ error: "Failed to get AI response" });
    }
  });

  // AI chat proxy route
  app.post("/api/ai-chat", aiChatRouter);

  // ML prediction endpoint (dev-friendly mock)
  app.post("/api/predict", handlePredict);

  return app;
}
