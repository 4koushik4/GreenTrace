import { requestRoboflowPrediction, RoboflowProxyError } from "../../server/roboflow-proxy";

type ApiRequest = AsyncIterable<Uint8Array | string> & { method?: string };
type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (body: unknown) => void;
};

export const config = { api: { bodyParser: false }, maxDuration: 45 };

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });

  const chunks: Uint8Array[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  try {
    const result = await requestRoboflowPrediction(Buffer.concat(chunks).toString("utf8"));
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof RoboflowProxyError) {
      return res.status(error.status).json({ error: error.code, message: error.message });
    }
    return res.status(500).json({ error: "proxy_error", message: "Unable to analyze this image. Please try again." });
  }
}
