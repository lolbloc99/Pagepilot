"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ShopifyShop,
  getShops,
  addShop,
  removeShop,
  getActiveShopId,
  setActiveShop,
} from "@/lib/shopify/store";

export default function ShopsPage() {
  const [shops, setShops] = useState<ShopifyShop[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [domain, setDomain] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    setShops(getShops());
    setActiveId(getActiveShopId());

    // Handle OAuth callback
    const connected = searchParams.get("connected");
    const errorParam = searchParams.get("error");

    if (connected) {
      try {
        const data = JSON.parse(decodeURIComponent(connected));
        const shop: ShopifyShop = {
          id: crypto.randomUUID(),
          name: data.name,
          domain: data.domain,
          accessToken: data.accessToken,
          addedAt: new Date().toISOString(),
        };
        addShop(shop);
        setShops(getShops());
        setActiveId(getActiveShopId());
        setSuccess(`${data.name} connected successfully!`);

        // Clean URL
        window.history.replaceState({}, "", "/shops");
      } catch (err) {
        console.error("Failed to parse connected data:", err);
        setError("Failed to save shop connection");
      }
    }

    if (errorParam) {
      const messages: Record<string, string> = {
        missing_params: "OAuth callback missing parameters",
        missing_config: "Server missing SHOPIFY_CLIENT_ID or SHOPIFY_CLIENT_SECRET",
        token_exchange_failed: "Failed to exchange OAuth code for token",
        callback_failed: "OAuth callback failed",
      };
      setError(messages[errorParam] || "Connection failed");
      window.history.replaceState({}, "", "/shops");
    }
  }, [searchParams]);

  async function handleConnect() {
    if (!domain) return;
    setConnecting(true);
    setError("");

    try {
      const cleanDomain = domain
        .replace(/^https?:\/\//, "")
        .replace(/\/$/, "");

      // Get OAuth URL from our API
      const res = await fetch("/api/shopify/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop: cleanDomain }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Auth failed");

      // Store nonce for verification
      sessionStorage.setItem("shopify_oauth_nonce", data.nonce);

      // Redirect to Shopify OAuth
      window.location.href = data.authUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
      setConnecting(false);
    }
  }

  function handleRemove(id: string) {
    removeShop(id);
    setShops(getShops());
    setActiveId(getActiveShopId());
    setDeleteConfirm(null);
  }

  function handleSelect(id: string) {
    setActiveShop(id);
    setActiveId(id);
  }

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-[var(--border)] px-6 py-4">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center text-white font-bold text-sm">
                PF
              </div>
              <h1 className="text-xl font-semibold">PageForge</h1>
            </Link>
          </div>
          <nav className="flex items-center gap-6">
            <Link
              href="/"
              className="text-sm text-[var(--muted-foreground)] hover:text-white transition-colors"
            >
              Generator
            </Link>
            <Link
              href="/shops"
              className="text-sm text-white font-medium"
            >
              Shops
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-12">
        {/* Title */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold">Shopify Stores</h2>
            <p className="text-[var(--muted-foreground)] mt-1">
              Connect your Shopify stores to push templates directly.
            </p>
          </div>
          <button
            onClick={() => {
              setShowAdd(true);
              setError("");
              setSuccess("");
            }}
            className="px-5 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary)]/90 rounded-lg text-sm font-medium transition-colors"
          >
            + Add Store
          </button>
        </div>

        {/* Success message */}
        {success && (
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 mb-6">
            <p className="text-green-400 font-medium">{success}</p>
          </div>
        )}

        {/* Add Store Form */}
        {showAdd && (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 mb-8">
            <h3 className="text-lg font-bold mb-4">Connect a Shopify Store</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Store domain
                </label>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="my-store.myshopify.com"
                  className="w-full px-4 py-2.5 bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-sm placeholder:text-[var(--muted-foreground)]"
                  onKeyDown={(e) => e.key === "Enter" && handleConnect()}
                />
              </div>

              {/* Instructions */}
              <div className="p-4 rounded-lg bg-[var(--secondary)] border border-[var(--border)]">
                <p className="text-sm font-medium mb-2">How it works:</p>
                <ol className="text-xs text-[var(--muted-foreground)] space-y-1 list-decimal list-inside">
                  <li>Enter your store domain above</li>
                  <li>Click &quot;Connect Store&quot; — you&apos;ll be redirected to Shopify</li>
                  <li>Authorize PageForge to access your themes</li>
                  <li>You&apos;ll be redirected back here with your store connected</li>
                </ol>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowAdd(false);
                    setError("");
                    setDomain("");
                  }}
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

        {/* Shops List */}
        {shops.length === 0 && !showAdd && (
          <div className="bg-[var(--card)] border border-[var(--border)] border-dashed rounded-xl p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--secondary)] flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-[var(--muted-foreground)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35"
                />
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
              key={shop.id}
              className={`bg-[var(--card)] border rounded-xl p-5 transition-colors ${
                activeId === shop.id
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
                    <p className="text-sm text-[var(--muted-foreground)]">
                      {shop.domain}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                      Added {new Date(shop.addedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {activeId === shop.id ? (
                    <span className="px-3 py-1.5 rounded-full bg-[#96bf48]/10 text-[#96bf48] text-xs font-medium">
                      Active
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSelect(shop.id)}
                      className="px-4 py-2 bg-[var(--secondary)] hover:bg-[var(--muted)] rounded-lg text-sm transition-colors"
                    >
                      Select
                    </button>
                  )}

                  {deleteConfirm === shop.id ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRemove(shop.id)}
                        className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs font-medium transition-colors"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-3 py-2 bg-[var(--secondary)] hover:bg-[var(--muted)] rounded-lg text-xs transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(shop.id)}
                      className="px-3 py-2 text-[var(--muted-foreground)] hover:text-red-400 hover:bg-red-500/10 rounded-lg text-sm transition-colors"
                      title="Remove store"
                    >
                      &times;
                    </button>
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
