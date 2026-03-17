import { getShopByDomain, upsertShop } from "@/lib/db/shops";

// In-memory lock to prevent concurrent token refreshes per domain
const refreshLocks = new Map<string, Promise<string>>();

/**
 * Get a valid access token for a shop.
 * Uses client_credentials to refresh if the stored token might be expired (24h).
 */
export async function getValidToken(domain: string): Promise<string> {
  const shop = await getShopByDomain(domain);
  if (!shop) throw new Error("Shop not connected");

  // Check if token might be expired (stored more than 23h ago)
  const tokenAge = Date.now() - new Date(shop.updatedAt).getTime();
  const TWENTY_THREE_HOURS = 23 * 60 * 60 * 1000;

  if (tokenAge < TWENTY_THREE_HOURS) {
    return shop.accessToken;
  }

  // Refresh token using per-shop credentials from DB
  const { clientId, clientSecret } = shop;

  if (!clientId || !clientSecret) {
    throw new Error(
      `Cannot refresh token for ${domain}: missing clientId or clientSecret. Please reconnect the shop.`
    );
  }

  // Use a lock to prevent concurrent refreshes for the same domain
  const existingRefresh = refreshLocks.get(domain);
  if (existingRefresh) {
    return existingRefresh;
  }

  const refreshPromise = (async () => {
    try {
      const tokenRes = await fetch(
        `https://${domain}/admin/oauth/access_token`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "client_credentials",
            client_id: clientId,
            client_secret: clientSecret,
          }),
        }
      );

      if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        throw new Error(
          `Token refresh failed for ${domain} (${tokenRes.status}): ${errText}`
        );
      }

      const tokenData = await tokenRes.json();
      const newToken = tokenData.access_token;

      if (!newToken) {
        throw new Error(`Token refresh for ${domain} returned empty access_token`);
      }

      // Update in DB — exclude _id and updatedAt from MongoDB doc
      const { _id, updatedAt, ...shopData } = shop;
      void _id; void updatedAt;
      try {
        await upsertShop({
          ...shopData,
          accessToken: newToken,
        });
      } catch (err) {
        console.error("[Token] Failed to save refreshed token:", err);
        // Still return the new token even if DB save failed
      }

      return newToken;
    } finally {
      refreshLocks.delete(domain);
    }
  })();

  refreshLocks.set(domain, refreshPromise);
  return refreshPromise;
}
