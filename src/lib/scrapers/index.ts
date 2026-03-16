import { ScrapedProduct } from "./types";
import { scrapeShopify } from "./shopify";
import { scrapeAliExpress } from "./aliexpress";
import { scrapeAmazon } from "./amazon";

export type Platform = "shopify" | "aliexpress" | "amazon";

export function detectPlatform(url: string): Platform | null {
  const u = url.toLowerCase();
  if (
    u.includes("aliexpress.com") ||
    u.includes("aliexpress.us") ||
    u.includes("ali express")
  )
    return "aliexpress";
  if (u.includes("amazon.") || u.includes("amzn.")) return "amazon";
  // Shopify stores can be on any domain, but check common patterns
  if (u.includes("myshopify.com") || u.includes("/products/"))
    return "shopify";
  return null;
}

export async function scrapeProduct(url: string): Promise<ScrapedProduct> {
  const platform = detectPlatform(url);
  if (!platform) {
    throw new Error(
      "Could not detect platform. Supported: Shopify, AliExpress, Amazon."
    );
  }

  switch (platform) {
    case "shopify":
      return scrapeShopify(url);
    case "aliexpress":
      return scrapeAliExpress(url);
    case "amazon":
      return scrapeAmazon(url);
  }
}
