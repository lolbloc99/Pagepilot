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

    const baseUrl = new URL(url).origin;

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

    // Remove non-content elements (keep small inline SVGs for icons)
    $(
      "script, noscript, iframe, nav, footer, header, [role='navigation'], [role='banner'], [role='contentinfo'], .shopify-section-header, .shopify-section-footer"
    ).remove();

    // Remove large SVGs (>2000 chars) but keep small ones (icons)
    $("svg").each((_, el) => {
      const svgHtml = $.html(el);
      if (svgHtml && svgHtml.length > 2000) {
        $(el).remove();
      }
    });

    // Remove data-* attributes (reduce size, not needed for visual)
    $("*").each((_, el) => {
      const elem = $(el);
      const attribs = (el as unknown as { attribs: Record<string, string> }).attribs || {};
      Object.keys(attribs).forEach((attr) => {
        if (attr.startsWith("data-") && attr !== "data-src" && attr !== "data-srcset") {
          elem.removeAttr(attr);
        }
      });
    });

    // Make image src absolute
    $("img").each((_, el) => {
      const elem = $(el);
      const src = elem.attr("src");
      if (src) {
        if (src.startsWith("//")) {
          elem.attr("src", "https:" + src);
        } else if (src.startsWith("/")) {
          elem.attr("src", baseUrl + src);
        }
      }
      const srcset = elem.attr("srcset");
      if (srcset) {
        const fixed = srcset.replace(/\/\/([^\s,]+)/g, "https://$1");
        elem.attr("srcset", fixed);
      }
      // Promote data-src to src if no src
      if (!src && elem.attr("data-src")) {
        let dataSrc = elem.attr("data-src") || "";
        if (dataSrc.startsWith("//")) dataSrc = "https:" + dataSrc;
        else if (dataSrc.startsWith("/")) dataSrc = baseUrl + dataSrc;
        elem.attr("src", dataSrc);
      }
    });

    // Make background-image URLs absolute in inline styles
    $("[style]").each((_, el) => {
      const elem = $(el);
      let style = elem.attr("style") || "";
      style = style.replace(/url\((['"]?)\/([^)]+)\1\)/g, `url($1${baseUrl}/$2$1)`);
      elem.attr("style", style);
    });

    // Extract inline styles
    const cssBlocks: string[] = [];
    $("style").each((_, el) => {
      const content = $(el).html();
      if (content) cssBlocks.push(content);
    });

    // Fetch external stylesheets with timeout
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
      stylesheetUrls.slice(0, 5).map(async (cssUrl) => {
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

    // Make CSS url() references absolute
    const combinedCss = cssBlocks
      .join("\n")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/url\((['"]?)\/([^)]+)\1\)/g, `url($1${baseUrl}/$2$1)`)
      .replace(/\s+/g, " ")
      .trim();

    // Get main content
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

    // Extract images list
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
    const result = await clonePage(mainContent, combinedCss, lang, baseUrl);

    // Build preview HTML from original scraped content (not Liquid)
    const previewHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<base href="${baseUrl}/">
<style>${combinedCss}</style>
<style>*, *::before, *::after { box-sizing: border-box; } body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }</style>
</head><body>${mainContent}</body></html>`;

    return NextResponse.json({
      ...result,
      sourceUrl: url,
      previewHtml,
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
