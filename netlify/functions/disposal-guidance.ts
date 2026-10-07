import { GroqChatError, requestGroqDisposalGuidance } from "../../server/groq-proxy";

export const handler = async (event: { httpMethod: string; body: string | null; isBase64Encoded: boolean }) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "method_not_allowed" }) };
  }

  let input: unknown;
  try {
    const body = event.isBase64Encoded
      ? Buffer.from(event.body ?? "", "base64").toString("utf8")
      : event.body ?? "";
    input = JSON.parse(body);
  } catch {
    input = null;
  }

  try {
    return { statusCode: 200, body: JSON.stringify(await requestGroqDisposalGuidance(input)) };
  } catch (error) {
    if (error instanceof GroqChatError) {
      return { statusCode: error.status, body: JSON.stringify({ error: error.message }) };
    }
    return { statusCode: 502, body: JSON.stringify({ error: "Disposal guidance is temporarily unavailable." }) };
  }
};
