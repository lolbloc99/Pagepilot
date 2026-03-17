/**
 * Validate required and optional environment variables at startup.
 * Import this file early (e.g., in layout.tsx or instrumentation.ts)
 * so issues are caught immediately.
 */

const REQUIRED_VARS = [
  "MONGODB_URI",
  "AI_PROVIDER",
  "AI_API_KEY",
] as const;

const OPTIONAL_VARS = [
  "AI_MODEL",
  "AI_BASE_URL",
  "AI_FALLBACK_PROVIDER",
  "AI_FALLBACK_API_KEY",
  "AI_FALLBACK_MODEL",
  "SHOPIFY_API_VERSION",
] as const;

function validateEnv() {
  const missing: string[] = [];

  for (const key of REQUIRED_VARS) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    console.error(
      `[ENV] FATAL: Missing required environment variables: ${missing.join(", ")}. ` +
      `The application may not function correctly.`
    );
  }

  // Special case: AI_API_KEY not needed for ollama
  if (
    !process.env.AI_API_KEY &&
    process.env.AI_PROVIDER === "ollama"
  ) {
    // Remove AI_API_KEY from missing since ollama doesn't need it
    const idx = missing.indexOf("AI_API_KEY");
    if (idx !== -1) missing.splice(idx, 1);
  }

  for (const key of OPTIONAL_VARS) {
    if (!process.env[key]) {
      console.warn(`[ENV] Optional variable ${key} is not set.`);
    }
  }

  if (missing.length > 0 && process.env.NODE_ENV === "production") {
    console.error(
      `[ENV] CRITICAL: Missing required environment variables: ${missing.join(", ")}. API routes will fail.`
    );
  }
}

// Only run at runtime, not during build
if (typeof window === "undefined" && process.env.NEXT_PHASE !== "phase-production-build") {
  validateEnv();
}
