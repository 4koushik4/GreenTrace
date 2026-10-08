import express from "express";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

router.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [
          { role: "system", content: "You are Green India recycling assistant. Keep answers concise and practical. For disposal questions, give instructions specific to the item or classifier-predicted material; do not give generic disposal advice. If the material is unclear, ask for clarification." },
          { role: "user", content: message },
        ],
      }),
    });

    const data = await response.json();

    res.json({
      reply: data.choices?.[0]?.message?.content || "No response",
    });

  } catch (err) {
    res.status(500).json({ error: "Groq API failed" });
  }
});

export default router;
