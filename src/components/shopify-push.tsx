"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface ShopifyTheme {
  id: number;
  name: string;
  role: string;
}

interface ShopInfo {
  shopId: string;
  name: string;
  domain: string;
}

interface ShopifyPushProps {
  template: Record<string, unknown>;
  productTitle: string;
}

export function ShopifyPush({ template, productTitle }: ShopifyPushProps) {
  const [open, setOpen] = useState(false);
  const [shops, setShops] = useState<ShopInfo[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [themes, setThemes] = useState<ShopifyTheme[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<number | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingShops, setFetchingShops] = useState(false);
  const [fetchingThemes, setFetchingThemes] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (productTitle) {
      setTemplateName(
        productTitle
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
          .slice(0, 40)
      );
    }
  }, [productTitle]);

  async function fetchShopsList() {
    setFetchingShops(true);
    try {
      const res = await fetch("/api/shops");
      if (res.ok) {
        const data = await res.json();
        setShops(data.shops);
        // Pre-select the active shop from localStorage
        const active = localStorage.getItem("pageforge_active_domain");
        if (active && data.shops.some((s: ShopInfo) => s.domain === active)) {
          setSelectedDomain(active);
          fetchThemes(active);
        } else if (data.shops.length === 1) {
          setSelectedDomain(data.shops[0].domain);
          fetchThemes(data.shops[0].domain);
        }
      }
    } catch {
      // ignore
    } finally {
      setFetchingShops(false);
    }
  }

  async function fetchThemes(domain: string) {
    setFetchingThemes(true);
    setError("");
    setThemes([]);
    setSelectedTheme(null);
    try {
      const res = await fetch("/api/shopify/themes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch themes");
      }
      const data = await res.json();
      setThemes(data.themes);
      const main = data.themes.find((t: ShopifyTheme) => t.role === "main");
      if (main) setSelectedTheme(main.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setFetchingThemes(false);
    }
  }

  function handleShopChange(domain: string) {
    setSelectedDomain(domain);
    setResult(null);
    setError("");
    if (domain) {
      localStorage.setItem("pageforge_active_domain", domain);
      fetchThemes(domain);
    }
  }

  async function handlePush() {
    if (!selectedDomain || !selectedTheme || !templateName) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      // Extract liquidContent if present (for cloned sections)
      const { liquidContent, ...cleanTemplate } = template as Record<string, unknown>;
      const res = await fetch("/api/shopify/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: selectedDomain,
          themeId: selectedTheme,
          templateName,
          template: liquidContent ? undefined : cleanTemplate,
          liquidContent: liquidContent || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Push failed");
      setResult({ success: true, message: data.message });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Push failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleOpen() {
    setOpen(true);
    setResult(null);
    setError("");
    setThemes([]);
    setSelectedDomain(null);
    fetchShopsList();
  }

  const selectedShop = shops.find((s) => s.domain === selectedDomain);

  return (
    <>
      <button
        onClick={handleOpen}
        className="px-5 py-2.5 bg-[#96bf48] hover:bg-[#7fa93d] rounded-lg transition-colors text-sm font-medium text-white"
      >
        Push to Shopify
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Push to Shopify</h3>
              <button
                onClick={() => setOpen(false)}
                className="text-[var(--muted-foreground)] hover:text-white text-xl leading-none"
              >
                &times;
              </button>
            </div>

            {fetchingShops && (
              <div className="flex items-center gap-3 py-8 justify-center">
                <div className="w-5 h-5 rounded-full border-2 border-[#96bf48] border-t-transparent animate-spin" />
                <span className="text-sm text-[var(--muted-foreground)]">Loading stores...</span>
              </div>
            )}

            {!fetchingShops && shops.length === 0 && (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-[var(--secondary)] flex items-center justify-center mx-auto">
                  <svg className="w-7 h-7 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium mb-1">No store connected</p>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Add a Shopify store first to push templates.
                  </p>
                </div>
                <Link href="/shops" className="inline-block px-5 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary)]/90 rounded-lg text-sm font-medium transition-colors">
                  Go to Shops
                </Link>
              </div>
            )}

            {!fetchingShops && shops.length > 0 && (
              <div className="space-y-4">
                {/* Shop selector */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">Store</label>
                  <select
                    value={selectedDomain || ""}
                    onChange={(e) => handleShopChange(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-sm"
                  >
                    <option value="">Select a store...</option>
                    {shops.map((shop) => (
                      <option key={shop.domain} value={shop.domain}>
                        {shop.name} ({shop.domain})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Loading themes */}
                {selectedDomain && fetchingThemes && (
                  <div className="flex items-center gap-3 py-4 justify-center">
                    <div className="w-4 h-4 rounded-full border-2 border-[#96bf48] border-t-transparent animate-spin" />
                    <span className="text-sm text-[var(--muted-foreground)]">
                      Loading themes from {selectedShop?.name || selectedDomain}...
                    </span>
                  </div>
                )}

                {/* Theme selector + template name */}
                {selectedDomain && !fetchingThemes && themes.length > 0 && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Theme</label>
                      <select
                        value={selectedTheme || ""}
                        onChange={(e) => setSelectedTheme(Number(e.target.value))}
                        className="w-full px-3 py-2.5 bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-sm"
                      >
                        {themes.map((theme) => (
                          <option key={theme.id} value={theme.id}>
                            {theme.name} {theme.role === "main" ? "(Live)" : theme.role === "unpublished" ? "(Draft)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1.5">Template name</label>
                      <div className="flex items-center gap-0">
                        <span className="px-3 py-2.5 bg-[var(--muted)] border border-r-0 border-[var(--border)] rounded-l-lg text-sm text-[var(--muted-foreground)]">product.</span>
                        <input type="text" value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="my-product" className="flex-1 px-3 py-2.5 bg-[var(--secondary)] border border-[var(--border)] text-sm" />
                        <span className="px-3 py-2.5 bg-[var(--muted)] border border-l-0 border-[var(--border)] rounded-r-lg text-sm text-[var(--muted-foreground)]">.json</span>
                      </div>
                    </div>
                  </>
                )}

                {result && result.success && (
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                    <p className="text-green-400 text-sm font-medium">{result.message}</p>
                    <p className="text-green-400/70 text-xs mt-1">Assign this template to your product in Shopify admin.</p>
                  </div>
                )}

                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setOpen(false)} className="flex-1 px-4 py-2.5 bg-[var(--secondary)] hover:bg-[var(--muted)] rounded-lg text-sm transition-colors">Cancel</button>
                  <button
                    onClick={handlePush}
                    disabled={loading || !selectedDomain || !templateName || !selectedTheme || fetchingThemes}
                    className="flex-1 px-4 py-2.5 bg-[#96bf48] hover:bg-[#7fa93d] disabled:opacity-50 rounded-lg text-sm font-medium text-white transition-colors"
                  >
                    {loading ? "Pushing..." : result?.success ? "Push Again" : "Push Template"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
