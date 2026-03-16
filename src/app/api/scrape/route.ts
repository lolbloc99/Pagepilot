import { NextRequest, NextResponse } from "next/server";
import { scrapeProduct, detectPlatform } from "@/lib/scrapers";
import { rateLimit, validateUrl } from "@/lib/utils/security";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "anonymous";
    const limited = rateLimit(ip, 15, 60000);
    if (limited) return limited;

    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const urlCheck = validateUrl(url);
    if (!urlCheck.valid) {
      return NextResponse.json({ error: urlCheck.error }, { status: 400 });
    }

    const platform = detectPlatform(url);
    if (!platform) {
      return NextResponse.json(
        { error: "Unsupported platform. Please provide a Shopify, AliExpress, or Amazon product URL." },
        { status: 400 }
      );
    }

    const product = await scrapeProduct(url);
    return NextResponse.json({ product });
  } catch (error) {
    console.error("Scrape error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to scrape product" },
      { status: 500 }
    );
  }
}
