// Supports: Groq, OpenRouter, Ollama, or any OpenAI-compatible API
// Auto-fallback: if primary provider returns 429, tries fallback provider

const PROVIDER = process.env.AI_PROVIDER || "groq";
const API_KEY = process.env.AI_API_KEY || "";
const MODEL = process.env.AI_MODEL || "";

const FALLBACK_PROVIDER = process.env.AI_FALLBACK_PROVIDER || "";
const FALLBACK_API_KEY = process.env.AI_FALLBACK_API_KEY || "";
const FALLBACK_MODEL = process.env.AI_FALLBACK_MODEL || "";

interface ProviderConfig {
  baseUrl: string;
  model: string;
  apiKey: string;
  name: string;
}

function getProviderConfig(provider: string, apiKey: string, model: string): ProviderConfig {
  switch (provider) {
    case "groq":
      return {
        baseUrl: "https://api.groq.com/openai/v1",
        model: model || "llama-3.3-70b-versatile",
        apiKey,
        name: "groq",
      };
    case "openrouter":
      return {
        baseUrl: "https://openrouter.ai/api/v1",
        model: model || "meta-llama/llama-3.1-70b-instruct:free",
        apiKey,
        name: "openrouter",
      };
    case "ollama":
      return {
        baseUrl: "http://localhost:11434/v1",
        model: model || "llama3.1",
        apiKey: "ollama",
        name: "ollama",
      };
    default:
      return {
        baseUrl: process.env.AI_BASE_URL || "https://api.groq.com/openai/v1",
        model: model || "llama-3.3-70b-versatile",
        apiKey,
        name: provider,
      };
  }
}

function getPrimaryConfig(): ProviderConfig {
  return getProviderConfig(PROVIDER, API_KEY, MODEL);
}

function getFallbackConfig(): ProviderConfig | null {
  if (!FALLBACK_PROVIDER || !FALLBACK_API_KEY) return null;
  return getProviderConfig(FALLBACK_PROVIDER, FALLBACK_API_KEY, FALLBACK_MODEL);
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenAIResponse {
  choices: { message: { content: string } }[];
}

async function callProvider(
  config: ProviderConfig,
  messages: ChatMessage[]
): Promise<string> {
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
    const error = new Error(`${config.name} error ${res.status}: ${text}`);
    (error as Error & { status: number }).status = res.status;
    throw error;
  }

  const data = (await res.json()) as OpenAIResponse;
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error(`Empty response from ${config.name}`);
  }
  return content;
}

export async function chatCompletion(
  system: string,
  userMessage: string
): Promise<string> {
  const primary = getPrimaryConfig();
  const fallback = getFallbackConfig();
  const messages: ChatMessage[] = [
    { role: "system", content: system },
    { role: "user", content: userMessage },
  ];

  const maxRetries = 2;
  let lastError: Error | null = null;

  // Try primary provider
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await callProvider(primary, messages);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const status = (err as Error & { status?: number }).status;

      // If rate limited (429) and we have a fallback, switch immediately
      if (status === 429 && fallback) {
        console.log(`[AI] ${primary.name} rate limited, switching to ${fallback.name}`);
        break;
      }

      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }

  // Try fallback provider if available
  if (fallback) {
    console.log(`[AI] Trying fallback: ${fallback.name} (${fallback.model})`);
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await callProvider(fallback, messages);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        }
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
        const fixed = objectMatch[0]
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
