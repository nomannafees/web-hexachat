import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const SYSTEM_PROMPT = `You are HexaBot, the friendly assistant inside HexaChat.
Help users with questions, writing and ideas. Keep answers short and clear.`;

export async function streamBotReply(history, onChunk) {
  const stream = await client.chat.completions.create({
    model: process.env.BOT_MODEL,
    messages: [{ role: "system", content: SYSTEM_PROMPT }, ...history],
    max_tokens: 600,
    stream: true,
  });

  let full = "";
  for await (const part of stream) {
    const text = part.choices[0]?.delta?.content || "";
    if (text) {
      full += text;
      onChunk(text);
    }
  }
  return full;
}