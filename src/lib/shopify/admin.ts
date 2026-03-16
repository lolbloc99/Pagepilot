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
  const url = `https://${cleanDomain}/admin/api/2024-10${endpoint}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      "X-Shopify-Access-Token": accessToken,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Shopify API ${res.status}: ${body}`);
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
