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

export async function requestGroqChat(input: unknown) {
  if (!input || typeof input !== "object") {
    throw new GroqChatError(400, "Send a message to the Eco Assistant.");
  }

  const { message, history } = input as Record<string, unknown>;
  if (typeof message !== "string" || !message.trim() || message.length > 4000) {
    throw new GroqChatError(400, "Enter a message of up to 4,000 characters.");
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new GroqChatError(503, "Eco Assistant is not configured yet. Please try again later.");
  }

  const messages = [
    {
      role: "system",
      content: "You are Green India AI Assistant, a helpful, concise assistant for waste sorting, recycling, sustainability, and app guidance. Be friendly and practical.",
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
        model: "openai/gpt-oss-20b",
        messages,
        temperature: 0.7,
        max_tokens: 1024,
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

    return { reply };
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
