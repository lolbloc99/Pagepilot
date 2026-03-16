import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { clonePage } from "@/lib/ai/clone-page";
import { rateLimit, validateUrl } from "@/lib/utils/security";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "anonymous";
    const limited = rateLimit(ip, 5, 60000);
    if (limited) return limited;

    const { url, language } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const urlCheck = validateUrl(url);
    if (!urlCheck.valid) {
      return NextResponse.json({ error: urlCheck.error }, { status: 400 });
    }

    // Fetch page with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const pageRes = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9,fr;q=0.8",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!pageRes.ok) {
      return NextResponse.json(
        { error: `Failed to fetch page: ${pageRes.status}` },
        { status: 400 }
      );
    }

    const html = await pageRes.text();
    const $ = cheerio.load(html);

    // Remove non-content elements
    $(
      "script, noscript, iframe, nav, footer, header, [role='navigation'], [role='banner'], [role='contentinfo'], .shopify-section-header, .shopify-section-footer, svg"
    ).remove();

    // Extract inline styles
    const cssBlocks: string[] = [];
    $("style").each((_, el) => {
      const content = $(el).html();
      if (content) cssBlocks.push(content);
    });

    // Fetch up to 2 external stylesheets with timeout
    const stylesheetUrls: string[] = [];
    $('link[rel="stylesheet"]').each((_, el) => {
      const href = $(el).attr("href");
      if (href) {
        try {
          const fullUrl = href.startsWith("http")
            ? href
            : href.startsWith("//")
              ? "https:" + href
              : new URL(href, url).toString();
          stylesheetUrls.push(fullUrl);
        } catch {
          // invalid URL, skip
        }
      }
    });

    const externalCss = await Promise.all(
      stylesheetUrls.slice(0, 2).map(async (cssUrl) => {
        try {
          const ctrl = new AbortController();
          const t = setTimeout(() => ctrl.abort(), 5000);
          const res = await fetch(cssUrl, {
            headers: { "User-Agent": "Mozilla/5.0" },
            signal: ctrl.signal,
          });
          clearTimeout(t);
          if (res.ok) return await res.text();
          return "";
        } catch {
          return "";
        }
      })
    );
    cssBlocks.push(...externalCss.filter(Boolean));

    // Get cleaned body content
    let mainContent =
      $("main").html() ||
      $('[role="main"]').html() ||
      $(".product").html() ||
      $('[class*="product"]').first().html() ||
      $("body").html() ||
      "";

    mainContent = mainContent
      .replace(/\s+/g, " ")
      .replace(/<!--[\s\S]*?-->/g, "")
      .trim();

    const combinedCss = cssBlocks
      .join("\n")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\s+/g, " ")
      .trim();

    // Extract images
    const images: { src: string; alt: string }[] = [];
    $("img").each((_, el) => {
      const src = $(el).attr("src") || $(el).attr("data-src");
      if (src) {
        images.push({
          src: src.startsWith("//") ? "https:" + src : src,
          alt: $(el).attr("alt") || "",
        });
      }
    });

    const lang = language || "Francais";
    const result = await clonePage(mainContent, combinedCss, lang);

    return NextResponse.json({
      ...result,
      sourceUrl: url,
      imagesFound: images.length,
      images: images.slice(0, 20),
    });
  } catch (error) {
    console.error("Clone error:", error);
    const message =
      error instanceof Error
        ? error.name === "AbortError"
          ? "Page took too long to load (timeout 15s)"
          : error.message
        : "Failed to clone page";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
