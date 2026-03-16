const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || "2024-10";

export interface ShopifyShop {
  id: string;
  name: string;
  domain: string;
  accessToken: string;
  addedAt: string;
}

export interface ShopifyTheme {
  id: number;
  name: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export async function shopifyFetch<T>(
  domain: string,
  accessToken: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const url = `https://${cleanDomain}/admin/api/${SHOPIFY_API_VERSION}${endpoint}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      "X-Shopify-Access-Token": accessToken,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    let errorMsg = `Shopify API ${res.status}`;
    try {
      const body = await res.json();
      const details = body.errors || body.error || JSON.stringify(body);
      errorMsg += `: ${typeof details === "string" ? details : JSON.stringify(details)}`;
    } catch {
      const text = await res.text().catch(() => "");
      if (text) errorMsg += `: ${text.slice(0, 200)}`;
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

export async function listThemes(
  domain: string,
  accessToken: string
): Promise<ShopifyTheme[]> {
  const data = await shopifyFetch<{ themes: ShopifyTheme[] }>(
    domain,
    accessToken,
    "/themes.json"
  );
  return data.themes;
}

export async function pushTemplate(
  domain: string,
  accessToken: string,
  themeId: number,
  templateKey: string,
  templateJson: object
): Promise<{ key: string }> {
  const key = `templates/${templateKey}`;
  const data = await shopifyFetch<{ asset: { key: string } }>(
    domain,
    accessToken,
    `/themes/${themeId}/assets.json`,
    {
      method: "PUT",
      body: JSON.stringify({
        asset: {
          key,
          value: JSON.stringify(templateJson, null, 2),
        },
      }),
    }
  );
  return { key: data.asset.key };
}

export async function getShopInfo(
  domain: string,
  accessToken: string
): Promise<{ name: string }> {
  const data = await shopifyFetch<{ shop: { name: string } }>(
    domain,
    accessToken,
    "/shop.json"
  );
  return { name: data.shop.name };
}
