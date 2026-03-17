const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || "2025-01";

// Shopify asset size limit is 256KB
const SHOPIFY_ASSET_LIMIT = 250000; // 250KB with margin

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

/**
 * Aggressively reduce CSS size to fit within Shopify's 256KB limit.
 * Removes in order: comments, @font-face, @keyframes, print media,
 * duplicate rules, and finally truncates if still too large.
 */
function compressCss(css: string, targetBytes: number = SHOPIFY_ASSET_LIMIT): string {
  let result = css;

  // Step 1: Remove comments
  result = result.replace(/\/\*[\s\S]*?\*\//g, "");

  if (Buffer.byteLength(result, "utf8") <= targetBytes) return result;

  // Step 2: Remove @font-face (they reference external fonts that won't work)
  result = result.replace(/@font-face\s*\{[^}]*\}/gi, "");

  if (Buffer.byteLength(result, "utf8") <= targetBytes) return result;

  // Step 3: Remove @keyframes (animations — nice but not essential)
  result = result.replace(/@keyframes\s+[\w-]+\s*\{(?:[^{}]*\{[^}]*\})*[^}]*\}/gi, "");

  if (Buffer.byteLength(result, "utf8") <= targetBytes) return result;

  // Step 4: Remove print media queries
  result = result.replace(/@media\s+print[^{]*\{(?:[^{}]*\{[^}]*\})*[^}]*\}/gi, "");

  if (Buffer.byteLength(result, "utf8") <= targetBytes) return result;

  // Step 5: Remove @charset, empty rules, excessive whitespace
  result = result
    .replace(/@charset[^;]*;/gi, "")
    .replace(/[^{}]+\{\s*\}/g, "")  // empty rules
    .replace(/\n{2,}/g, "\n")
    .replace(/\s{2,}/g, " ");

  if (Buffer.byteLength(result, "utf8") <= targetBytes) return result;

  // Step 6: Remove media queries for very large/small screens (keep standard responsive)
  result = result.replace(/@media[^{]*(?:min-width:\s*(?:1[5-9]\d{2}|[2-9]\d{3})px)[^{]*\{(?:[^{}]*\{[^}]*\})*[^}]*\}/gi, "");
  result = result.replace(/@media[^{]*(?:max-width:\s*(?:[12]\d{2}|3[0-5]\d)px)[^{]*\{(?:[^{}]*\{[^}]*\})*[^}]*\}/gi, "");

  if (Buffer.byteLength(result, "utf8") <= targetBytes) return result;

  // Step 7: Last resort — truncate at last complete rule before limit
  const bytes = Buffer.from(result, "utf8");
  if (bytes.length > targetBytes) {
    const truncated = bytes.slice(0, targetBytes).toString("utf8");
    // Find last complete rule (ends with })
    const lastBrace = truncated.lastIndexOf("}");
    if (lastBrace > 0) {
      result = truncated.slice(0, lastBrace + 1);
    } else {
      result = truncated;
    }
    console.warn(`[Shopify] CSS truncated from ${bytes.length} to ${Buffer.byteLength(result, "utf8")} bytes`);
  }

  return result;
}

/**
 * Compress HTML/Liquid to fit within Shopify's 256KB limit.
 * Removes redundant whitespace and empty attributes while preserving structure.
 */
function compressLiquid(liquid: string, targetBytes: number = SHOPIFY_ASSET_LIMIT): string {
  let result = liquid;

  // Check if already under limit
  if (Buffer.byteLength(result, "utf8") <= targetBytes) return result;

  // Step 1: Collapse multiple whitespace/newlines (preserve single spaces and newlines)
  result = result.replace(/\n{3,}/g, "\n\n");
  result = result.replace(/[ \t]{2,}/g, " ");

  if (Buffer.byteLength(result, "utf8") <= targetBytes) return result;

  // Step 2: Remove empty alt="" and title="" attributes
  result = result.replace(/\s+alt=""\s*/g, " ");
  result = result.replace(/\s+title=""\s*/g, " ");

  if (Buffer.byteLength(result, "utf8") <= targetBytes) return result;

  // Step 3: Remove inline styles that are duplicated by CSS classes
  // (only remove if there's a class attribute on the same element)
  result = result.replace(/(<[^>]+class="[^"]+")[^>]*style="[^"]*"/g, "$1");

  if (Buffer.byteLength(result, "utf8") <= targetBytes) return result;

  // Step 4: Aggressively reduce whitespace
  result = result.replace(/\n\s*\n/g, "\n");
  result = result.replace(/>\s+</g, ">\n<");

  if (Buffer.byteLength(result, "utf8") <= targetBytes) return result;

  // Step 5: Last resort — truncate before schema tag
  const schemaIdx = result.indexOf("{% schema %}");
  if (schemaIdx > 0) {
    const schemaBlock = result.slice(schemaIdx);
    const contentBudget = targetBytes - Buffer.byteLength(schemaBlock, "utf8") - 100;
    const contentPart = result.slice(0, schemaIdx);
    const contentBytes = Buffer.from(contentPart, "utf8");
    if (contentBytes.length > contentBudget) {
      const truncContent = contentBytes.slice(0, contentBudget).toString("utf8");
      const lastTag = truncContent.lastIndexOf("</div>");
      result = (lastTag > 0 ? truncContent.slice(0, lastTag + 6) : truncContent) + "\n" + schemaBlock;
      console.warn(`[Shopify] Liquid truncated to fit 256KB limit`);
    }
  }

  return result;
}

export async function pushTemplate(
  domain: string,
  accessToken: string,
  themeId: number,
  templateKey: string,
  templateJson: object,
  liquidContent?: string
): Promise<{ key: string; sectionKey?: string; cssKey?: string }> {
  const sectionName = templateKey.replace(/\.json$/, "").replace(/^product\./, "");

  if (liquidContent) {
    let finalLiquid = liquidContent;
    let cssKey: string | undefined;

    // Extract <style> blocks into separate CSS asset
    const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    const styles: string[] = [];
    let match;
    while ((match = styleRegex.exec(liquidContent)) !== null) {
      styles.push(match[1]);
    }

    if (styles.length > 0) {
      const allCss = styles.join("\n");

      // Remove <style> blocks from liquid
      finalLiquid = liquidContent.replace(styleRegex, "");

      // Add CSS asset reference at the top
      const cssRef = `{{ '${sectionName}.css' | asset_url | stylesheet_tag }}`;
      finalLiquid = cssRef + "\n" + finalLiquid;

      // Compress CSS to fit Shopify limit
      const compressedCss = compressCss(allCss);

      // If CSS is STILL too large after compression, split into multiple files
      const cssBytes = Buffer.byteLength(compressedCss, "utf8");
      if (cssBytes > SHOPIFY_ASSET_LIMIT) {
        // Split into part1 and part2
        const midPoint = Math.floor(compressedCss.length / 2);
        const splitAt = compressedCss.indexOf("}", midPoint);
        const part1 = compressedCss.slice(0, splitAt + 1);
        const part2 = compressedCss.slice(splitAt + 1);

        cssKey = `assets/${sectionName}.css`;
        const cssKey2 = `assets/${sectionName}-2.css`;
        await pushAsset(domain, accessToken, themeId, cssKey, compressCss(part1));
        await pushAsset(domain, accessToken, themeId, cssKey2, compressCss(part2));

        // Add second CSS reference
        const cssRef2 = `{{ '${sectionName}-2.css' | asset_url | stylesheet_tag }}`;
        finalLiquid = cssRef2 + "\n" + finalLiquid;

        console.log(`[Shopify] CSS split into 2 files: ${Buffer.byteLength(part1, "utf8")} + ${Buffer.byteLength(part2, "utf8")} bytes`);
      } else {
        cssKey = `assets/${sectionName}.css`;
        await pushAsset(domain, accessToken, themeId, cssKey, compressedCss);
      }
    }

    // Compress liquid if needed
    finalLiquid = compressLiquid(finalLiquid);

    const sectionKey = `sections/${sectionName}.liquid`;
    await pushAsset(domain, accessToken, themeId, sectionKey, finalLiquid);

    // Push JSON template
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

    return { key: tplKey, sectionKey, cssKey };
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
