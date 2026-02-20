import { serve } from "std/http/server.ts";

serve(async (req) => {
  try {
    const { message, system, context } = await req.json();

    const prompt = `
${system || "You are GreenTrace AI assistant."}

Context:
${context || "None"}

User:
${message}
`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("GROQ_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [
          { role: "user", content: prompt }
        ],
      }),
    });

    const data = await res.json();

    return new Response(
      JSON.stringify({
        reply: data.choices?.[0]?.message?.content || "No reply",
      }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
});
