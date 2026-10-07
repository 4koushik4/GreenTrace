import { GroqChatError, requestGroqChat } from "../server/groq-proxy.js";

type ApiRequest = { method?: string; body?: unknown };
type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (body: unknown) => void;
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });

  try {
    return res.status(200).json(await requestGroqChat(req.body));
  } catch (error) {
    if (error instanceof GroqChatError) {
      return res.status(error.status).json({ error: error.message, reply: error.reply });
    }
    return res.status(502).json({
      error: "The AI service is temporarily unavailable.",
      reply: "Sorry, the AI service is temporarily unavailable. Please try again in a moment.",
    });
  }
}
