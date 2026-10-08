const REQUEST_TIMEOUT_MS = 20_000;

export class GroqChatError extends Error {
  readonly status: number;
  readonly reply: string;

  constructor(status: number, message: string) {
    super(message);
    this.name = "GroqChatError";
    this.status = status;
    this.reply = message;
  }
}

type GroqMessage = { role: "system" | "user" | "assistant"; content: string };

async function requestGroqReply(messages: GroqMessage[], maxTokens: number) {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    console.error("GROQ_API_KEY is not available to the server function.");
    throw new GroqChatError(503, "Groq API key is unavailable to this deployment. Check its Vercel environment scope and redeploy.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages,
        temperature: 0.7,
        max_tokens: maxTokens,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new GroqChatError(502, "Sorry, the AI service is temporarily unavailable. Please try again in a moment.");
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content;
    if (typeof reply !== "string" || !reply.trim()) {
      throw new GroqChatError(502, "The AI service did not return a response. Please try again.");
    }

    return reply.trim();
  } catch (error) {
    if (error instanceof GroqChatError) throw error;
    if (controller.signal.aborted) {
      throw new GroqChatError(504, "The Eco Assistant took too long to respond. Please try again.");
    }
    throw new GroqChatError(502, "Sorry, the AI service is temporarily unavailable. Please try again in a moment.");
  } finally {
    clearTimeout(timeout);
  }
}

export async function requestGroqChat(input: unknown) {
  if (!input || typeof input !== "object") {
    throw new GroqChatError(400, "Send a message to the Eco Assistant.");
  }

  const { message, history } = input as Record<string, unknown>;
  if (typeof message !== "string" || !message.trim() || message.length > 4000) {
    throw new GroqChatError(400, "Enter a message of up to 4,000 characters.");
  }

  const messages: GroqMessage[] = [
    {
      role: "system",
      content: "You are Green India AI Assistant, a helpful, concise assistant for waste sorting, recycling, sustainability, and app guidance. Be friendly and practical. For disposal questions, give item-specific instructions based on the exact item or classifier-predicted material the user provides. Do not answer with generic recycling or disposal advice; if the item is unclear, ask what it is.",
    },
  ];

  if (Array.isArray(history)) {
    for (const item of history.slice(-10)) {
      if (
        item && typeof item === "object" &&
        ((item as Record<string, unknown>).sender === "user" || (item as Record<string, unknown>).sender === "assistant") &&
        typeof (item as Record<string, unknown>).body === "string"
      ) {
        messages.push({
          role: (item as Record<string, unknown>).sender as "user" | "assistant",
          content: ((item as Record<string, unknown>).body as string).slice(0, 2000),
        });
      }
    }
  }
  messages.push({ role: "user", content: message });

  return { reply: await requestGroqReply(messages, 1024) };
}

export async function requestGroqDisposalGuidance(input: unknown) {
  if (!input || typeof input !== "object") {
    throw new GroqChatError(400, "Waste material details are required.");
  }

  const { material, category } = input as Record<string, unknown>;
  if (
    typeof material !== "string" || !material.trim() || material.length > 100 ||
    typeof category !== "string" || !category.trim() || category.length > 50
  ) {
    throw new GroqChatError(400, "A valid waste material and category are required.");
  }

  const reply = await requestGroqReply([
    {
      role: "system",
      content: "Give concise, safe household disposal instructions tailored specifically to the classifier prediction provided by the user. Use both the predicted material and category to determine the steps, and explicitly name the predicted material in the guidance. Do not give generic waste-sorting tips or advice that could apply to unrelated materials. If the prediction is too broad to support item-specific steps, state that limitation and request a more precise identification rather than guessing. When recycling acceptance may vary, briefly advise checking local council rules; never invent collection locations. Return 2 or 3 actionable short bullet points and no other text.",
    },
    {
      role: "user",
      content: `Classifier prediction: material = ${material.trim()}; category = ${category.trim()}. Give disposal instructions specifically for this predicted material and category.`,
    },
  ], 250);

  const tips = reply
    .split(/\n+/)
    .map((tip) => tip.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 3);

  if (tips.length === 0) {
    throw new GroqChatError(502, "The AI service did not return disposal instructions. Please try again.");
  }

  return { tips };
}
