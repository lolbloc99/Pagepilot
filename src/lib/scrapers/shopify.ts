import { ScrapedProduct } from "./types";
import * as cheerio from "cheerio";

export async function scrapeShopify(url: string): Promise<ScrapedProduct> {
  // Normalize URL to get .json endpoint
  let productUrl = url.split("?")[0].replace(/\/$/, "");
  if (!productUrl.endsWith(".json")) {
    productUrl += ".json";
  }

  const res = await fetch(productUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    // Fallback: try scraping the HTML page directly
    return scrapeShopifyHTML(url);
  }

  const data = await res.json();
  const product = data.product;

  const descriptionText = cheerio
    .load(product.body_html || "")
    .text()
    .trim();

  return {
    platform: "shopify",
    sourceUrl: url,
    title: product.title || "",
    description: product.body_html || "",
    descriptionText,
    price: {
      amount: parseFloat(product.variants?.[0]?.price || "0"),
      currency: "USD",
      compareAt: product.variants?.[0]?.compare_at_price
        ? parseFloat(product.variants[0].compare_at_price)
        : undefined,
    },
    images: (product.images || []).map(
      (img: { src: string; alt?: string }) => ({
        url: img.src,
        alt: img.alt || product.title,
      })
    ),
    variants: (product.variants || []).map(
      (v: {
        title: string;
        price: string;
        option1?: string;
        option2?: string;
        option3?: string;
      }) => ({
        title: v.title,
        price: parseFloat(v.price || "0"),
        options: {
          ...(v.option1 ? { option1: v.option1 } : {}),
          ...(v.option2 ? { option2: v.option2 } : {}),
          ...(v.option3 ? { option3: v.option3 } : {}),
        },
      })
    ),
    features: extractFeatures(descriptionText),
    vendor: product.vendor,
    tags: product.tags,
  };
}

async function scrapeShopifyHTML(url: string): Promise<ScrapedProduct> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    },
  });
  const html = await res.text();
  const $ = cheerio.load(html);

  // Try to find product JSON in script tags
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let productData: any = undefined;
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).html() || "");
      if (json["@type"] === "Product") {
        productData = json;
      }
    } catch {
      // ignore parse errors
    }
  });

  const title =
    productData?.name?.toString() ||
    $("h1").first().text().trim() ||
    $("title").text().trim();
  const description =
    productData?.description?.toString() ||
    $('[class*="product-description"], [class*="product__description"]')
      .html() ||
    "";
  const descriptionText = cheerio.load(description).text().trim();

  const images: { url: string; alt?: string }[] = [];
  $('[class*="product"] img, [data-product-image] img').each((_, el) => {
    const src = $(el).attr("src");
    if (src) {
      images.push({
        url: src.startsWith("//") ? "https:" + src : src,
        alt: $(el).attr("alt") || title,
      });
    }
  });

  const offers = productData?.offers;
  const price =
    typeof offers === "object" && offers !== null
      ? parseFloat(offers.price || offers.lowPrice || "0")
      : 0;

  return {
    platform: "shopify",
    sourceUrl: url,
    title,
    description,
    descriptionText,
    price: { amount: price, currency: "USD" },
    images,
    variants: [],
    features: extractFeatures(descriptionText),
  };
}

function extractFeatures(text: string): string[] {
  return text
    .split(/[\n•●✓✔★▶►➤➜→-]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10 && s.length < 200)
    .slice(0, 10);
}
