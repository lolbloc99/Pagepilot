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

    const { product, language, tone, stream } = await req.json();

    if (!product) {
      return NextResponse.json(
        { error: "Product data is required" },
        { status: 400 }
      );
    }

    const validatedProduct = ScrapedProductSchema.parse(product);
    const lang = language || "English";
    const toneValue = tone || "professional";

    // SSE streaming mode — sends keep-alive pings to prevent timeout
    if (stream) {
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          // Send keep-alive every 5s while AI is working
          const keepAlive = setInterval(() => {
            try {
              controller.enqueue(encoder.encode(`data: {"status":"generating"}\n\n`));
            } catch { /* stream closed */ }
          }, 5000);

          try {
            controller.enqueue(encoder.encode(`data: {"status":"started"}\n\n`));

            const content = await generateContent(validatedProduct, lang, toneValue);
            controller.enqueue(encoder.encode(`data: {"status":"building"}\n\n`));

            const template = buildShopifyTemplate(content);

            const result = { content, template, product: validatedProduct };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: "done", result })}\n\n`));
          } catch (error) {
            const msg = error instanceof Error ? error.message : "Failed to generate";
            controller.enqueue(encoder.encode(`data: {"status":"error","error":${JSON.stringify(msg)}}\n\n`));
          } finally {
            clearInterval(keepAlive);
            controller.close();
          }
        },
      });

      return new Response(readable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Non-streaming fallback
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
