import { ScrapedProduct } from "./types";
import * as cheerio from "cheerio";

export async function scrapeAliExpress(url: string): Promise<ScrapedProduct> {
  // AliExpress pages are heavily JS-rendered. We use fetch + parse embedded JSON.
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });

  const html = await res.text();
  const $ = cheerio.load(html);

  // Try to extract data from window.__INIT_DATA__ or similar embedded JSON
  let initData: Record<string, unknown> | null = null;

  $("script").each((_, el) => {
    const content = $(el).html() || "";
    // Look for window.runParams or __INIT_DATA__
    const patterns = [
      /window\.runParams\s*=\s*(\{[\s\S]*?\});/,
      /window\.__INIT_DATA__\s*=\s*(\{[\s\S]*?\});/,
      /data:\s*(\{[\s\S]*?"actionModule"[\s\S]*?\})\s*[,;]/,
    ];
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        try {
          initData = JSON.parse(match[1]);
        } catch {
          // try to fix common JSON issues
        }
      }
    }
  });

  // Extract from structured data as fallback
  let ldData: Record<string, unknown> | null = null;
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).html() || "");
      if (json["@type"] === "Product") {
        ldData = json;
      }
    } catch {
      // ignore
    }
  });

  // Extract from initData if available
  if (initData) {
    return extractFromInitData(initData, url);
  }

  // Fallback to LD+JSON
  if (ldData) {
    return extractFromLdJson(ldData, url, $);
  }

  // Final fallback: basic HTML scraping
  return extractFromHtml($, url);
}

function extractFromInitData(
  data: Record<string, unknown>,
  url: string
): ScrapedProduct {
  // Navigate nested AliExpress data structure
  const pageModule =
    (data as Record<string, Record<string, unknown>>).pageModule || {};
  const priceModule =
    (data as Record<string, Record<string, unknown>>).priceModule || {};
  const titleModule =
    (data as Record<string, Record<string, unknown>>).titleModule || {};
  const imageModule =
    (data as Record<string, Record<string, unknown>>).imageModule || {};
  const descriptionModule =
    (data as Record<string, Record<string, unknown>>).descriptionModule || {};

  const title =
    (titleModule.subject as string) ||
    (pageModule.title as string) ||
    "";
  const images = ((imageModule.imagePathList as string[]) || []).map(
    (imgUrl) => ({
      url: imgUrl.startsWith("//") ? "https:" + imgUrl : imgUrl,
      alt: title,
    })
  );

  const minPrice = parseFloat(
    ((priceModule.minPrice as Record<string, unknown>)?.value as string) ||
      (priceModule.minAmount as string) ||
      "0"
  );
  const maxPrice = parseFloat(
    ((priceModule.maxPrice as Record<string, unknown>)?.value as string) ||
      (priceModule.maxAmount as string) ||
      "0"
  );

  return {
    platform: "aliexpress",
    sourceUrl: url,
    title,
    description:
      (descriptionModule.descriptionUrl as string) || "",
    descriptionText: title,
    price: {
      amount: minPrice || maxPrice,
      currency: "USD",
      compareAt:
        maxPrice > minPrice ? maxPrice : undefined,
    },
    images,
    variants: [],
    features: [],
  };
}

function extractFromLdJson(
  data: Record<string, unknown>,
  url: string,
  $: cheerio.CheerioAPI
): ScrapedProduct {
  const title = (data.name as string) || "";
  const description = (data.description as string) || "";
  const offers = data.offers as Record<string, unknown> | undefined;
  const images = Array.isArray(data.image)
    ? (data.image as string[]).map((u) => ({ url: u, alt: title }))
    : typeof data.image === "string"
      ? [{ url: data.image, alt: title }]
      : [];

  const price = offers
    ? parseFloat(
        (offers.price as string) || (offers.lowPrice as string) || "0"
      )
    : 0;

  // Try to get features from page
  const features: string[] = [];
  $(".product-overview .attr-item, .product-property-list li").each(
    (_, el) => {
      const text = $(el).text().trim();
      if (text) features.push(text);
    }
  );

  return {
    platform: "aliexpress",
    sourceUrl: url,
    title,
    description,
    descriptionText: description,
    price: { amount: price, currency: "USD" },
    images,
    variants: [],
    features,
  };
}

function extractFromHtml(
  $: cheerio.CheerioAPI,
  url: string
): ScrapedProduct {
  const title =
    $("h1").first().text().trim() ||
    $("title").text().trim();
  const images: { url: string; alt?: string }[] = [];

  $(".images-view-item img, .product-img img, [class*='gallery'] img").each(
    (_, el) => {
      const src = $(el).attr("src") || $(el).attr("data-src");
      if (src) {
        images.push({
          url: src.startsWith("//") ? "https:" + src : src,
          alt: $(el).attr("alt") || title,
        });
      }
    }
  );

  const priceText =
    $(".product-price-value, [class*='price'] .uniform-banner-box-price")
      .first()
      .text()
      .trim();
  const price = parseFloat(priceText.replace(/[^0-9.]/g, "")) || 0;

  return {
    platform: "aliexpress",
    sourceUrl: url,
    title,
    description: "",
    descriptionText: "",
    price: { amount: price, currency: "USD" },
    images,
    variants: [],
    features: [],
  };
}
