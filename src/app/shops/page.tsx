"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Shop {
  shopId: string;
  name: string;
  domain: string;
  addedAt: string;
  hasToken: boolean;
}

export default function ShopsPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [activeDomain, setActiveDomain] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [domain, setDomain] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchShops = useCallback(async () => {
    try {
      const res = await fetch("/api/shops");
      if (res.ok) {
        const data = await res.json();
        setShops(data.shops);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShops();
    setActiveDomain(localStorage.getItem("pageforge_active_domain"));
  }, [fetchShops]);

  async function handleConnect() {
    if (!domain) return;
    setConnecting(true);
    setError("");

    try {
      const cleanDomain = domain
        .replace(/^https?:\/\//, "")
        .replace(/\/$/, "");

      // Direct connect via client_credentials (no OAuth redirect needed)
      const res = await fetch("/api/shopify/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop: cleanDomain }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Connection failed");

      setSuccess(`${data.shopName} connected successfully!`);
      localStorage.setItem("pageforge_active_domain", data.domain);
      setActiveDomain(data.domain);
      setShowAdd(false);
      setDomain("");
      await fetchShops();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setConnecting(false);
    }
  }

  async function handleRemove(shopDomain: string) {
    try {
      await fetch("/api/shops", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: shopDomain }),
      });
      if (activeDomain === shopDomain) {
        localStorage.removeItem("pageforge_active_domain");
        setActiveDomain(null);
      }
      await fetchShops();
      setDeleteConfirm(null);
    } catch {
      setError("Failed to remove shop");
    }
  }

  function handleSelect(shopDomain: string) {
    localStorage.setItem("pageforge_active_domain", shopDomain);
    setActiveDomain(shopDomain);
  }

  return (
    <main className="min-h-screen">
      <header className="border-b border-[var(--border)] px-6 py-4">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center text-white font-bold text-sm">
                PP
              </div>
              <h1 className="text-xl font-semibold">PagePilot</h1>
            </Link>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/" className="text-sm text-[var(--muted-foreground)] hover:text-white transition-colors">
              Generator
            </Link>
            <Link href="/shops" className="text-sm text-white font-medium">
              Shops
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold">Shopify Stores</h2>
            <p className="text-[var(--muted-foreground)] mt-1">
              Connect your Shopify stores to push templates directly.
            </p>
          </div>
          <button
            onClick={() => { setShowAdd(true); setError(""); setSuccess(""); }}
            className="px-5 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary)]/90 rounded-lg text-sm font-medium transition-colors"
          >
            + Add Store
          </button>
        </div>

        {success && (
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 mb-6">
            <p className="text-green-400 font-medium">{success}</p>
          </div>
        )}

        {showAdd && (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 mb-8">
            <h3 className="text-lg font-bold mb-4">Connect a Shopify Store</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Store domain</label>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="my-store.myshopify.com"
                  className="w-full px-4 py-2.5 bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-sm placeholder:text-[var(--muted-foreground)]"
                  onKeyDown={(e) => e.key === "Enter" && handleConnect()}
                />
              </div>
              <div className="p-4 rounded-lg bg-[var(--secondary)] border border-[var(--border)]">
                <p className="text-sm font-medium mb-2">How it works:</p>
                <ol className="text-xs text-[var(--muted-foreground)] space-y-1 list-decimal list-inside">
                  <li>Make sure the PagePilot app is installed on your store</li>
                  <li>Enter your store domain above (e.g. my-store.myshopify.com)</li>
                  <li>Click &quot;Connect Store&quot; — we&apos;ll authenticate automatically</li>
                </ol>
              </div>
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setShowAdd(false); setError(""); setDomain(""); }}
                  className="px-5 py-2.5 bg-[var(--secondary)] hover:bg-[var(--muted)] rounded-lg text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConnect}
                  disabled={connecting || !domain}
                  className="px-5 py-2.5 bg-[#96bf48] hover:bg-[#7fa93d] disabled:opacity-50 rounded-lg text-sm font-medium text-white transition-colors"
                >
                  {connecting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Redirecting to Shopify...
                    </span>
                  ) : (
                    "Connect Store"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
          </div>
        )}

        {!loading && shops.length === 0 && !showAdd && (
          <div className="bg-[var(--card)] border border-[var(--border)] border-dashed rounded-xl p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--secondary)] flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">No stores connected</h3>
            <p className="text-[var(--muted-foreground)] text-sm mb-6">
              Add your Shopify store to push generated templates directly.
            </p>
            <button
              onClick={() => setShowAdd(true)}
              className="px-5 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary)]/90 rounded-lg text-sm font-medium transition-colors"
            >
              + Add Your First Store
            </button>
          </div>
        )}

        <div className="space-y-4">
          {shops.map((shop) => (
            <div
              key={shop.domain}
              className={`bg-[var(--card)] border rounded-xl p-5 transition-colors ${
                activeDomain === shop.domain
                  ? "border-[#96bf48] ring-1 ring-[#96bf48]/30"
                  : "border-[var(--border)]"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#96bf48]/10 flex items-center justify-center">
                    <svg className="w-6 h-6 text-[#96bf48]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M15.337 3.415c-.072-.014-.133.032-.152.096-.019.063-.353.676-.353.676s-.735-.152-.919-.19c-.019-.38-.095-.653-.209-.88-.316-.6-.783-.917-1.348-.917-.039 0-.078.002-.117.006-.019-.022-.039-.044-.059-.066-.225-.252-.514-.374-.862-.362-.672.023-1.339.504-1.879 1.355-.38.599-.669 1.352-.751 1.934l-1.565.485c-.461.145-.476.16-.537.595-.045.33-1.247 9.592-1.247 9.592l9.933 1.863L18.725 16s-3.326-12.351-3.355-12.496a.131.131 0 00-.033-.089z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{shop.name}</h3>
                    <p className="text-sm text-[var(--muted-foreground)]">{shop.domain}</p>
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                      Added {new Date(shop.addedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {activeDomain === shop.domain ? (
                    <span className="px-3 py-1.5 rounded-full bg-[#96bf48]/10 text-[#96bf48] text-xs font-medium">Active</span>
                  ) : (
                    <button onClick={() => handleSelect(shop.domain)} className="px-4 py-2 bg-[var(--secondary)] hover:bg-[var(--muted)] rounded-lg text-sm transition-colors">
                      Select
                    </button>
                  )}
                  {deleteConfirm === shop.domain ? (
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleRemove(shop.domain)} className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs font-medium transition-colors">Confirm</button>
                      <button onClick={() => setDeleteConfirm(null)} className="px-3 py-2 bg-[var(--secondary)] hover:bg-[var(--muted)] rounded-lg text-xs transition-colors">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteConfirm(shop.domain)} className="px-3 py-2 text-[var(--muted-foreground)] hover:text-red-400 hover:bg-red-500/10 rounded-lg text-sm transition-colors" title="Remove store">&times;</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
