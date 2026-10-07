import { GroqChatError, requestGroqDisposalGuidance } from "../server/groq-proxy";

type ApiRequest = { method?: string; body?: unknown };
type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (body: unknown) => void;
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });

  try {
    return res.status(200).json(await requestGroqDisposalGuidance(req.body));
  } catch (error) {
    if (error instanceof GroqChatError) {
      return res.status(error.status).json({ error: error.message });
    }
    return res.status(502).json({ error: "Disposal guidance is temporarily unavailable." });
  }
}
