"use client";

import { useState } from "react";
import { LANGUAGES } from "@/lib/constants";

interface CloneFormProps {
  onSubmit: (url: string, language: string) => void;
}

export function CloneForm({ onSubmit }: CloneFormProps) {
  const [url, setUrl] = useState("");
  const [language, setLanguage] = useState("Francais");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (url.trim()) {
      onSubmit(url.trim(), language);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2 text-[var(--muted-foreground)]">
          URL de la page a cloner
        </label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://competitor-store.com/products/their-product"
          className="w-full px-4 py-3.5 bg-[var(--card)] border border-[var(--border)] rounded-xl text-white placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2 text-[var(--muted-foreground)]">
          Langue du contenu genere
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

      <button
        type="submit"
        disabled={!url.trim()}
        className="w-full py-3.5 bg-[var(--primary)] hover:bg-[var(--primary)]/90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all text-lg"
      >
        Clone this Page
      </button>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 text-sm text-[var(--muted-foreground)] space-y-2">
        <p className="font-medium text-white">Comment ca marche :</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>On scrape le HTML et le CSS de la page cible</li>
          <li>L&apos;IA analyse le design et le contenu</li>
          <li>
            On genere une section Liquid Shopify complete (HTML + CSS + Schema)
          </li>
          <li>
            Vous copiez le fichier .liquid dans votre theme Shopify
          </li>
        </ol>
      </div>
    </form>
  );
}
