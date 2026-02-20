import { supabase } from "@/lib/supabase";

const SYSTEM_PROMPT = `
You are Green India AI Assistant.

You help users with:
- Waste segregation
- Buyback orders
- Marketplace listings
- Eco points
- Pickup scheduling
- Recycling guidance
- Environmental laws
- App navigation help
- Sustainability tips

Rules:
- Be friendly
- Be concise
- Use emojis when helpful
- If user asks about app features, explain them.
- If user asks environmental question, answer scientifically.
- If unsure, say you will help find the answer.

You remember conversation context.
You are not ChatGPT — you are Green India AI.
`;

export async function getAIReply(userMessage: string, context?: string) {
  const payload = {
    system: SYSTEM_PROMPT,
    context,
    message: userMessage,
  };

  const { data, error } = await supabase.functions.invoke("ai-chat", {
    body: payload,
  });

  if (error) {
    console.error(error);
    return null;
  }

  return data.reply;
}
