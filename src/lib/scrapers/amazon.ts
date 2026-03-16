import { ScrapedProduct } from "./types";
import * as cheerio from "cheerio";

export async function scrapeAmazon(url: string): Promise<ScrapedProduct> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Encoding": "gzip, deflate, br",
    },
  });

  const html = await res.text();
  const $ = cheerio.load(html);

  // Title
  const title = $("#productTitle").text().trim() || $("title").text().trim();

  // Price
  const priceText =
    $(".a-price .a-offscreen").first().text().trim() ||
    $("#priceblock_ourprice").text().trim() ||
    $(".a-price-whole").first().text().trim();
  const price = parseFloat(priceText.replace(/[^0-9.]/g, "")) || 0;

  // Compare at price
  const listPriceText =
    $(".basisPrice .a-offscreen").first().text().trim() ||
    $(".a-text-price .a-offscreen").first().text().trim();
  const compareAt = listPriceText
    ? parseFloat(listPriceText.replace(/[^0-9.]/g, "")) || undefined
    : undefined;

  // Images - extract from JavaScript data
  const images: { url: string; alt?: string }[] = [];

  // Method 1: Parse from colorImages/ImageBlockATF script
  $("script").each((_, el) => {
    const content = $(el).html() || "";
    const match = content.match(
      /'colorImages':\s*\{\s*'initial':\s*(\[[\s\S]*?\])\s*\}/
    );
    if (match) {
      try {
        const imgData = JSON.parse(match[1].replace(/'/g, '"'));
        for (const img of imgData) {
          if (img.hiRes || img.large) {
            images.push({
              url: img.hiRes || img.large,
              alt: title,
            });
          }
        }
      } catch {
        // ignore
      }
    }
  });

  // Method 2: Fallback to data-a-dynamic-image
  if (images.length === 0) {
    $("[data-a-dynamic-image]").each((_, el) => {
      try {
        const dynamicImages = JSON.parse(
          $(el).attr("data-a-dynamic-image") || "{}"
        );
        for (const imgUrl of Object.keys(dynamicImages)) {
          images.push({ url: imgUrl, alt: title });
        }
      } catch {
        // ignore
      }
    });
  }

  // Method 3: Fallback to img tags
  if (images.length === 0) {
    $("#imgTagWrapperId img, #imageBlock img").each((_, el) => {
      const src =
        $(el).attr("data-old-hires") ||
        $(el).attr("src");
      if (src && !src.includes("sprite") && !src.includes("grey-pixel")) {
        images.push({ url: src, alt: $(el).attr("alt") || title });
      }
    });
  }

  // Features (bullet points)
  const features: string[] = [];
  $("#feature-bullets li, #featurebullets_feature_div li").each((_, el) => {
    const text = $(el).text().trim();
    if (text && text.length > 5) {
      features.push(text);
    }
  });

  // Description
  const description =
    $("#productDescription").html()?.trim() ||
    $(".aplus-v2").html()?.trim() ||
    "";
  const descriptionText =
    $("#productDescription").text().trim() ||
    $(".aplus-v2").text().trim() ||
    features.join(". ");

  // Rating
  const ratingText = $('[data-hook="rating-out-of-text"]').text().trim() ||
    $("#acrPopover").attr("title") || "";
  const ratingMatch = ratingText.match(/([\d.]+)/);
  const ratingCountText = $("#acrCustomerReviewText").text().trim();
  const ratingCountMatch = ratingCountText.match(/([\d,]+)/);

  const rating =
    ratingMatch && ratingCountMatch
      ? {
          score: parseFloat(ratingMatch[1]),
          count: parseInt(ratingCountMatch[1].replace(/,/g, "")),
        }
      : undefined;

  // Vendor
  const vendor = $("#bylineInfo").text().trim().replace(/^(Visit the |Brand: )/, "");

  return {
    platform: "amazon",
    sourceUrl: url,
    title,
    description,
    descriptionText,
    price: { amount: price, currency: "USD", compareAt },
    images,
    variants: [],
    features,
    vendor: vendor || undefined,
    rating,
  };
}
