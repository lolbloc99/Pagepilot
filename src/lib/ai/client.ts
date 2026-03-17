// Supports: Groq, OpenRouter, Ollama, or any OpenAI-compatible API
// Auto-fallback: if primary provider returns 429, tries fallback provider

const PROVIDER = process.env.AI_PROVIDER || "groq";
const API_KEY = process.env.AI_API_KEY || "";
const MODEL = process.env.AI_MODEL || "";

if (!API_KEY && PROVIDER !== "ollama") {
  console.warn("[AI] Warning: AI_API_KEY is not set. AI calls will fail.");
}

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
    case "anthropic":
      return {
        baseUrl: "https://api.anthropic.com",
        model: model || "claude-sonnet-4-20250514",
        apiKey,
        name: "anthropic",
      };
    case "openai":
      return {
        baseUrl: "https://api.openai.com/v1",
        model: model || "gpt-4o",
        apiKey,
        name: "openai",
      };
    case "openrouter":
      return {
        baseUrl: "https://openrouter.ai/api/v1",
        model: model || "anthropic/claude-sonnet-4-20250514",
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
  if (!FALLBACK_PROVIDER || !FALLBACK_API_KEY || FALLBACK_PROVIDER === "none" || FALLBACK_API_KEY === "none") return null;
  return getProviderConfig(FALLBACK_PROVIDER, FALLBACK_API_KEY, FALLBACK_MODEL);
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenAIResponse {
  choices: { message: { content: string } }[];
}

interface AnthropicResponse {
  content: { type: string; text: string }[];
}

async function callProvider(
  config: ProviderConfig,
  messages: ChatMessage[],
  maxTokens: number = 8192
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000);

  // Anthropic uses a different API format
  if (config.name === "anthropic") {
    const systemMsg = messages.find(m => m.role === "system")?.content || "";
    const userMsgs = messages.filter(m => m.role !== "system").map(m => ({
      role: m.role,
      content: m.content,
    }));

    const res = await fetch(`${config.baseUrl}/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: maxTokens,
        system: systemMsg,
        messages: userMsgs,
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

    const data = (await res.json()) as AnthropicResponse;
    const content = data.content?.find(c => c.type === "text")?.text;
    if (!content) throw new Error(`Empty response from ${config.name}`);
    return content;
  }

  // OpenAI-compatible providers (Groq, OpenAI, OpenRouter, Ollama)
  const res = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      max_tokens: maxTokens,
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
  userMessage: string,
  maxTokens: number = 8192
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
      return await callProvider(primary, messages, maxTokens);
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
        return await callProvider(fallback, messages, maxTokens);
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
        // Try fixing common JSON issues: escape control chars inside string values
        let fixed = objectMatch[0];
        // Fix unescaped newlines/tabs inside JSON string values
        fixed = fixed.replace(/"(?:[^"\\]|\\.)*"/g, (match) => {
          return match
            .replace(/(?<!\\)\n/g, "\\n")
            .replace(/(?<!\\)\t/g, "\\t")
            .replace(/(?<!\\)\r/g, "\\r");
        });
        // Fix trailing commas
        fixed = fixed.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]");

        try {
          return JSON.parse(fixed) as T;
        } catch {
          // Last resort: try to extract individual fields manually
          const result: Record<string, string> = {};
          const fieldPattern = /"(fullSection|full_section|liquidCode|liquid_code|liquid|cssCode|css_code|css|sectionSchema|section_schema|schema)"\s*:\s*"/g;
          let match;
          const fields: { name: string; start: number }[] = [];

          while ((match = fieldPattern.exec(fixed)) !== null) {
            fields.push({ name: match[1], start: match.index + match[0].length });
          }

          for (let i = 0; i < fields.length; i++) {
            const start = fields[i].start;
            const endDelimiter = i < fields.length - 1
              ? fixed.lastIndexOf('"', fields[i + 1].start - fields[i + 1].name.length - 5)
              : fixed.lastIndexOf('"');
            if (endDelimiter > start) {
              result[fields[i].name] = fixed.slice(start, endDelimiter)
                .replace(/\\n/g, "\n")
                .replace(/\\t/g, "\t")
                .replace(/\\"/g, '"');
            }
          }

          if (Object.keys(result).length > 0) {
            return result as T;
          }

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
