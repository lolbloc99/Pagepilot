const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || "2025-01";

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

export async function pushAsset(
  domain: string,
  accessToken: string,
  themeId: number,
  key: string,
  value: string
): Promise<{ key: string }> {
  const data = await shopifyFetch<{ asset: { key: string } }>(
    domain,
    accessToken,
    `/themes/${themeId}/assets.json`,
    {
      method: "PUT",
      body: JSON.stringify({
        asset: { key, value },
      }),
    }
  );
  return { key: data.asset.key };
}

export async function pushTemplate(
  domain: string,
  accessToken: string,
  themeId: number,
  templateKey: string,
  templateJson: object,
  liquidContent?: string
): Promise<{ key: string; sectionKey?: string }> {
  const sectionName = templateKey.replace(/\.json$/, "").replace(/^product\./, "");

  // If there's liquid content, push the section file first
  if (liquidContent) {
    const sectionKey = `sections/${sectionName}.liquid`;
    await pushAsset(domain, accessToken, themeId, sectionKey, liquidContent);

    // Then push the JSON template that references this section
    const jsonTemplate = {
      layout: "theme",
      sections: {
        [sectionName]: {
          type: sectionName,
          settings: {},
        },
      },
      order: [sectionName],
    };
    const tplKey = `templates/${templateKey}`;
    await pushAsset(domain, accessToken, themeId, tplKey, JSON.stringify(jsonTemplate, null, 2));

    return { key: tplKey, sectionKey };
  }

  // No liquid — push as plain JSON template
  const tplKey = `templates/${templateKey}`;
  await pushAsset(domain, accessToken, themeId, tplKey, JSON.stringify(templateJson, null, 2));
  return { key: tplKey };
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
