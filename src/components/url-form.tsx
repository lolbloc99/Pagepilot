"use client";

import { useState } from "react";
import { LANGUAGES } from "@/lib/constants";

const TONES = [
  { value: "professional", label: "Professionnel" },
  { value: "luxury", label: "Luxe" },
  { value: "casual", label: "Decontracte" },
  { value: "urgency", label: "Urgence / FOMO" },
  { value: "friendly", label: "Amical" },
  { value: "technical", label: "Technique" },
];

interface UrlFormProps {
  onSubmit: (url: string, language: string, tone: string) => void;
}

export function UrlForm({ onSubmit }: UrlFormProps) {
  const [url, setUrl] = useState("");
  const [language, setLanguage] = useState("Francais");
  const [tone, setTone] = useState("professional");

  const detectedPlatform = detectPlatform(url);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (url.trim()) {
      onSubmit(url.trim(), language, tone);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* URL Input */}
      <div>
        <label className="block text-sm font-medium mb-2 text-[var(--muted-foreground)]">
          Product URL
        </label>
        <div className="relative">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://store.com/products/example or AliExpress/Amazon link..."
            className="w-full px-4 py-3.5 bg-[var(--card)] border border-[var(--border)] rounded-xl text-white placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all"
            required
          />
          {detectedPlatform && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-[var(--primary)]/20 text-[var(--primary)] text-xs font-medium rounded-full">
              {detectedPlatform}
            </span>
          )}
        </div>
      </div>

      {/* Language & Tone Row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-[var(--muted-foreground)]">
            Language
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-4 py-3 bg-[var(--card)] border border-[var(--border)] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all appearance-none cursor-pointer"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-[var(--muted-foreground)]">
            Tone
          </label>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="w-full px-4 py-3 bg-[var(--card)] border border-[var(--border)] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all appearance-none cursor-pointer"
          >
            {TONES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!url.trim()}
        className="w-full py-3.5 bg-[var(--primary)] hover:bg-[var(--primary)]/90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all text-lg"
      >
        Generate Product Page
      </button>

      {/* Supported platforms */}
      <div className="flex items-center justify-center gap-6 text-sm text-[var(--muted-foreground)]">
        <span>Supported:</span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          Shopify
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-orange-500"></span>
          AliExpress
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          Amazon
        </span>
      </div>
    </form>
  );
}

function detectPlatform(url: string): string | null {
  if (!url) return null;
  const u = url.toLowerCase();
  if (u.includes("aliexpress")) return "AliExpress";
  if (u.includes("amazon.") || u.includes("amzn.")) return "Amazon";
  if (u.includes("myshopify.com") || u.includes("/products/"))
    return "Shopify";
  return null;
}
