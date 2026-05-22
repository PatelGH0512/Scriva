import { google } from "@ai-sdk/google";
import { streamText } from "ai";

const SYSTEM_PROMPT = `You are a brilliant thinking partner embedded in Scriva, a workspace for deep thinking and document creation. Help the user think clearly, explore ideas rigorously, and develop their thoughts with depth and precision. Be concise but insightful — avoid padding. When responding to analysis or research requests, structure your answers clearly. The user can append any of your responses directly to their working document.`;

export async function POST(req: Request) {
  const { messages, model } = await req.json();

  console.log("[/api/chat] Using model:", model ?? "gemini-2.5-flash");
  console.log("[/api/chat] API key set:", !!process.env.GOOGLE_GENERATIVE_AI_API_KEY);

  const result = streamText({
    model: google(model ?? "gemini-2.5-flash"),
    system: SYSTEM_PROMPT,
    messages,
    onError: (err) => {
      console.error("[/api/chat] Stream error:", err);
    },
  });

  return result.toDataStreamResponse();
}
