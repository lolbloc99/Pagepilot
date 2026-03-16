import { NextResponse } from "next/server";

// Simple in-memory rate limiter
const requestCounts = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  ip: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): NextResponse | null {
  const now = Date.now();
  const record = requestCounts.get(ip);

  if (!record || now > record.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + windowMs });
    return null;
  }

  record.count++;
  if (record.count > maxRequests) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 }
    );
  }

  return null;
}

// Validate URL to prevent SSRF
const BLOCKED_HOSTS = [
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "169.254.",
  "10.",
  "172.16.",
  "172.17.",
  "172.18.",
  "172.19.",
  "172.20.",
  "172.21.",
  "172.22.",
  "172.23.",
  "172.24.",
  "172.25.",
  "172.26.",
  "172.27.",
  "172.28.",
  "172.29.",
  "172.30.",
  "172.31.",
  "192.168.",
  "metadata.google",
  "metadata.aws",
];

export function validateUrl(url: string): { valid: boolean; error?: string } {
  try {
    const parsed = new URL(url);

    // Must be http or https
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return { valid: false, error: "URL must use HTTP or HTTPS" };
    }

    // Block internal/private IPs
    const hostname = parsed.hostname.toLowerCase();
    for (const blocked of BLOCKED_HOSTS) {
      if (hostname.includes(blocked)) {
        return { valid: false, error: "Internal URLs are not allowed" };
      }
    }

    // Must have a valid TLD (basic check)
    if (!hostname.includes(".")) {
      return { valid: false, error: "Invalid URL hostname" };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }
}
