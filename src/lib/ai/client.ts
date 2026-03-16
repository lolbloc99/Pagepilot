// Supports: Groq, OpenRouter, Ollama, or any OpenAI-compatible API

const PROVIDER = process.env.AI_PROVIDER || "groq";
const API_KEY = process.env.AI_API_KEY || "";
const MODEL = process.env.AI_MODEL || "";

function getConfig() {
  switch (PROVIDER) {
    case "groq":
      return {
        baseUrl: process.env.AI_BASE_URL || "https://api.groq.com/openai/v1",
        model: MODEL || "llama-3.3-70b-versatile",
        apiKey: API_KEY,
      };
    case "openrouter":
      return {
        baseUrl: process.env.AI_BASE_URL || "https://openrouter.ai/api/v1",
        model: MODEL || "meta-llama/llama-3.1-8b-instruct:free",
        apiKey: API_KEY,
      };
    case "ollama":
      return {
        baseUrl: process.env.AI_BASE_URL || "http://localhost:11434/v1",
        model: MODEL || "llama3.1",
        apiKey: "ollama",
      };
    default:
      return {
        baseUrl: process.env.AI_BASE_URL || "https://api.groq.com/openai/v1",
        model: MODEL || "llama-3.3-70b-versatile",
        apiKey: API_KEY,
      };
  }
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenAIResponse {
  choices: { message: { content: string } }[];
}

export async function chatCompletion(
  system: string,
  userMessage: string
): Promise<string> {
  const config = getConfig();
  const messages: ChatMessage[] = [
    { role: "system", content: system },
    { role: "user", content: userMessage },
  ];

  const maxRetries = 2;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120000);

      const res = await fetch(`${config.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages,
          max_tokens: 8192,
          temperature: 0.7,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${PROVIDER} error ${res.status}: ${text}`);
      }

      const data = (await res.json()) as OpenAIResponse;
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("Empty response from AI");
      }
      return content;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error("AI request failed after retries");
}

/**
 * Parse JSON from AI response, handling markdown fences and malformed output
 */
export function parseAIJson<T>(text: string): T {
  let jsonStr = text.trim();

  // Remove markdown fences
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```json?\s*\n?/, "").replace(/\n?\s*```$/, "");
  }

  // Try direct parse first
  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    // Try to extract JSON object from the text
    const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      try {
        return JSON.parse(objectMatch[0]) as T;
      } catch {
        // Try fixing common JSON issues
        let fixed = objectMatch[0]
          .replace(/,\s*}/g, "}") // trailing commas
          .replace(/,\s*]/g, "]") // trailing commas in arrays
          .replace(/'/g, '"') // single quotes
          .replace(/\n/g, "\\n") // unescaped newlines in strings
          .replace(/\t/g, "\\t"); // unescaped tabs

        try {
          return JSON.parse(fixed) as T;
        } catch {
          throw new Error(
            "Failed to parse AI response as JSON. Raw output: " +
              jsonStr.slice(0, 500)
          );
        }
      }
    }
    throw new Error(
      "No JSON object found in AI response. Raw output: " +
        jsonStr.slice(0, 500)
    );
  }
}
