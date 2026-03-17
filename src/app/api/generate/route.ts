import { NextRequest, NextResponse } from "next/server";
import { generateContent } from "@/lib/ai/generate-content";
import { buildShopifyTemplate } from "@/lib/templates/builder";
import { ScrapedProductSchema } from "@/lib/scrapers/types";
import { rateLimit } from "@/lib/utils/security";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "anonymous";
    const limited = rateLimit(ip, 10, 60000);
    if (limited) return limited;

    const { product, language, tone } = await req.json();

    if (!product) {
      return NextResponse.json(
        { error: "Product data is required" },
        { status: 400 }
      );
    }

    const validatedProduct = ScrapedProductSchema.parse(product);
    const lang = language || "English";
    const toneValue = tone || "professional";

    const content = await generateContent(validatedProduct, lang, toneValue);
    const template = buildShopifyTemplate(content);

    return NextResponse.json({
      content,
      template,
      product: validatedProduct,
    });
  } catch (error) {
    console.error("Generate error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate content" },
      { status: 500 }
    );
  }
}
