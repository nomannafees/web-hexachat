import OpenAI from "openai";
import { createSocketLimiter } from "../utils/socketRateLimit.js";

const MAX_MESSAGES = 12; // how much history is sent to the model
const MAX_CHARS = 2000; // per message
const HOUR = 60 * 60 * 1000;

const SYSTEM_PROMPT = `You are HexaBot, the friendly assistant inside HexaChat, a chat app with
one-to-one and group chats, voice/video calls, status updates and chat requests.
Help users with questions, writing messages, ideas and how to use the app.
Keep answers short, clear and polite. If you do not know something, say so.
Never claim to be able to read the user's chats or contacts; you cannot.`;

let client;

function getClient() {
  const apiKey = process.env.ASSISTANT_API_KEY?.trim();
  if (!apiKey || !process.env.ASSISTANT_MODEL?.trim()) return null;

  if (!client) {
    client = new OpenAI({
      apiKey,
      baseURL:
        process.env.ASSISTANT_BASE_URL?.trim() ||
        "https://api.groq.com/openai/v1",
    });
  }

  return client;
}

// userId -> { count, resetAt }  (in memory; resets when the server restarts)
const usage = new Map();

function takeQuota(userId) {
  const limit = Number(process.env.ASSISTANT_HOURLY_LIMIT) || 30;
  const now = Date.now();
  const entry = usage.get(userId);

  if (!entry || now > entry.resetAt) {
    usage.set(userId, { count: 1, resetAt: now + HOUR });
    return true;
  }

  if (entry.count >= limit) return false;

  entry.count += 1;
  return true;
}

// Drop expired entries now and then so the map never grows forever.
setInterval(() => {
  const now = Date.now();
  for (const [userId, entry] of usage) {
    if (now > entry.resetAt) usage.delete(userId);
  }
}, 10 * 60 * 1000).unref();

// Never trust what the browser sends: keep only valid roles and short text.
function cleanHistory(raw) {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string"
    )
    .map((m) => ({ role: m.role, content: m.content.trim().slice(0, MAX_CHARS) }))
    .filter((m) => m.content)
    .slice(-MAX_MESSAGES);
}

export default function registerAssistantHandlers(io, socket) {
  const userId = String(socket.data.userId);
  const allowBurst = createSocketLimiter({ max: 5, windowMs: 10_000 });
  let active = null; // AbortController of the answer being streamed

  socket.on("assistant:ask", async (payload) => {
    const requestId = String(payload?.requestId || "").slice(0, 64);
    if (!requestId) return;

    const fail = (message) =>
      socket.emit("assistant:error", { requestId, message });

    if (!allowBurst()) return fail("You are sending messages too quickly.");
    if (active) return fail("Please wait for the current answer to finish.");

    const ai = getClient();
    if (!ai) return fail("The assistant is not set up yet.");

    const messages = cleanHistory(payload?.messages);
    if (!messages.length || messages[messages.length - 1].role !== "user") {
      return fail("Please type a message first.");
    }

    if (!takeQuota(userId)) {
      return fail("You have reached the hourly assistant limit. Try again later.");
    }

    const controller = new AbortController();
    active = controller;

    try {
      const stream = await ai.chat.completions.create(
        {
          model: process.env.ASSISTANT_MODEL.trim(),
          messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
          max_tokens: 600,
          temperature: 0.6,
          stream: true,
        },
        { signal: controller.signal }
      );

      for await (const part of stream) {
        const text = part.choices?.[0]?.delta?.content;
        if (text) socket.emit("assistant:chunk", { requestId, text });
      }

      socket.emit("assistant:done", { requestId });
    } catch (error) {
      if (controller.signal.aborted) {
        socket.emit("assistant:done", { requestId, stopped: true });
      } else {
        console.error("Assistant error:", error.status || "", error.message);
        fail(
          error.status === 429
            ? "The assistant is busy right now. Please try again in a minute."
            : "The assistant is unavailable right now."
        );
      }
    } finally {
      active = null;
    }
  });

  socket.on("assistant:stop", () => active?.abort());
  socket.on("disconnect", () => active?.abort());
}