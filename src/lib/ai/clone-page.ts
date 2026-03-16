import { chatCompletion, parseAIJson } from "./client";

export interface ClonedPage {
  liquidCode: string;
  cssCode: string;
  sectionSchema: string;
  fullSection: string;
}

/**
 * Server-side HTML cleaning: convert custom web components to standard divs,
 * replace hardcoded IDs, make image URLs absolute, etc.
 */
function cleanHtmlForShopify(html: string, baseUrl: string): string {
  let cleaned = html;

  // Replace custom web components with standard divs (keep classes & inner content)
  // e.g. <product-gallery class="foo"> → <div class="foo">
  cleaned = cleaned.replace(
    /<([\w-]+(?:-[\w-]+)+)(\s[^>]*)?>/gi,
    (match, tag, attrs) => {
      // Keep standard tags that happen to have hyphens (unlikely but safe)
      const standardTags = ["font-face", "clip-path"];
      if (standardTags.includes(tag.toLowerCase())) return match;
      return `<div${attrs || ""}>`;
    }
  );
  // Close custom tags → </div>
  cleaned = cleaned.replace(
    /<\/([\w-]+(?:-[\w-]+)+)>/gi,
    (match, tag) => {
      const standardTags = ["font-face", "clip-path"];
      if (standardTags.includes(tag.toLowerCase())) return match;
      return "</div>";
    }
  );

  // Replace hardcoded template/section IDs with dynamic Shopify IDs
  cleaned = cleaned.replace(
    /template--\d+__\w+/g,
    "{{ section.id }}"
  );

  // Make relative image URLs absolute
  if (baseUrl) {
    cleaned = cleaned.replace(
      /src="\/([^"]*?)"/gi,
      `src="${baseUrl}/$1"`
    );
    cleaned = cleaned.replace(
      /srcset="([^"]*?)"/gi,
      (match, srcset) => {
        const fixed = srcset.replace(
          /\/\/([^\s,]+)/g,
          "https://$1"
        );
        return `srcset="${fixed}"`;
      }
    );
  }

  // Remove empty onclick/onload handlers
  cleaned = cleaned.replace(/\son\w+="[^"]*"/gi, "");

  return cleaned;
}

/**
 * Extract class names used in HTML to filter CSS
 */
function extractUsedClasses(html: string): Set<string> {
  const classes = new Set<string>();
  const classRegex = /class="([^"]*)"/gi;
  let match;
  while ((match = classRegex.exec(html)) !== null) {
    match[1].split(/\s+/).forEach((cls) => {
      if (cls) classes.add(cls);
    });
  }
  return classes;
}

/**
 * Filter CSS to keep only rules that match classes used in HTML.
 * Also keeps @media rules, CSS variables, and universal selectors.
 */
function filterRelevantCss(css: string, usedClasses: Set<string>): string {
  // Remove comments, @font-face, @keyframes, print styles
  let cleaned = css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/@font-face\s*\{[^}]*\}/gi, "")
    .replace(/@keyframes[^{]*\{(?:[^{}]*\{[^}]*\})*[^}]*\}/gi, "")
    .replace(/@media\s+print[^{]*\{(?:[^{}]*\{[^}]*\})*[^}]*\}/gi, "");

  // Parse CSS into top-level blocks (handles nested @media correctly)
  const blocks: string[] = [];
  let depth = 0;
  let current = "";

  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    current += ch;
    if (ch === "{") depth++;
    if (ch === "}") {
      depth--;
      if (depth <= 0) {
        blocks.push(current.trim());
        current = "";
        depth = 0;
      }
    }
  }

  const kept: string[] = [];

  for (const block of blocks) {
    if (!block) continue;

    const selector = block.split("{")[0].trim();

    // Always keep: :root, html, body, *, @media (keep entire media block)
    if (/^(:root|html|body|\*|@media)/i.test(selector)) {
      kept.push(block);
      continue;
    }

    // Check if any used class appears in the selector
    let isRelevant = false;
    for (const cls of usedClasses) {
      if (selector.includes("." + cls)) {
        isRelevant = true;
        break;
      }
    }

    if (isRelevant) {
      kept.push(block);
    }
  }

  const result = kept.join("\n").replace(/\s{2,}/g, " ").trim();

  // Safety: if CSS is still huge (>100k), truncate but keep it valid
  if (result.length > 100000) {
    return result.slice(0, 100000);
  }

  return result;
}

export async function clonePage(
  html: string,
  css: string,
  language: string,
  baseUrl: string = ""
): Promise<ClonedPage> {
  // Step 1: Server-side HTML cleaning (no AI needed)
  let processedHtml = cleanHtmlForShopify(html, baseUrl);

  // Step 2: Extract used CSS classes and filter CSS
  const usedClasses = extractUsedClasses(processedHtml);
  const relevantCss = filterRelevantCss(css, usedClasses);

  // Step 3: AI — minimal task: inject Liquid tags for dynamic content + translate text + create schema
  const system = `You are an expert Shopify Liquid developer. You receive pre-cleaned HTML and make minimal, surgical changes to convert it to a working Shopify Liquid section.

ABSOLUTE RULES:
1. Output the COMPLETE HTML — every single line. Never abbreviate or skip content.
2. Never write "<!-- rest of content -->", "<!-- more sections -->", or any placeholder comments.
3. Keep ALL class names, IDs, and HTML structure EXACTLY as provided.
4. Do NOT output any CSS or <style> tags.
5. Make ONLY these specific changes:
   - Replace the product title text with {{ product.title }}
   - Replace prices with {{ product.price | money }}
   - Replace product description with {{ product.description }}
   - Replace main product image src with {{ product.featured_image | image_url: width: 1200 }}
   - Replace other image src with {{ section.settings.image_N | image_url: width: 800 }} where N is a number
   - Replace heading/text content with {{ section.settings.heading_N }} or {{ section.settings.text_N }}
   - Translate button text and UI labels to ${language}
6. The HTML you receive is ALREADY cleaned. Do not restructure it.
7. If the HTML is long, you MUST output ALL of it. Completeness is critical.`;

  // Limit HTML sent to AI — but keep more since we only ask for surgical changes
  const maxHtml = 30000;
  const trimmedHtml = processedHtml.length > maxHtml
    ? processedHtml.slice(0, maxHtml)
    : processedHtml;

  const userMessage = `Make minimal Liquid changes to this HTML. Output the COMPLETE HTML back with only Liquid tags added where appropriate.

## Pre-cleaned HTML:
${trimmedHtml}

## Task:
1. Replace product-specific content with Liquid objects ({{ product.title }}, {{ product.price | money }}, etc.)
2. Replace editable text/images with {{ section.settings.xxx }}
3. Translate visible UI text to ${language}
4. Create a schema JSON with settings for all replaceable content

Return JSON:
{
  "liquidCode": "The COMPLETE HTML with Liquid tags injected (NO CSS, NO style tags)",
  "sectionSchema": "The schema JSON for {% schema %}...{% endschema %}"
}

CRITICAL: Output the ENTIRE HTML, not a summary. Every div, every class, every element.
Return ONLY valid JSON.`;

  const text = await chatCompletion(system, userMessage, 32768);
  const raw = parseAIJson<Record<string, unknown>>(text);

  let liquidCode = String(raw.liquidCode || raw.liquid_code || raw.liquid || "");
  const sectionSchema = String(raw.sectionSchema || raw.section_schema || raw.schema || "");

  // If AI truncated/shortened the HTML (common issue), use the server-cleaned HTML as fallback
  // and just prepend the Liquid assignments
  if (liquidCode.length < processedHtml.length * 0.3) {
    console.log(`[Clone] AI output too short (${liquidCode.length} vs ${processedHtml.length}). Using server-cleaned HTML with basic Liquid.`);
    liquidCode = processedHtml;
  }

  // Assemble final .liquid file
  const fullSection = `<style>
${relevantCss}
</style>

<div id="section-{{ section.id }}" class="cloned-section">
${liquidCode}
</div>

{% schema %}
${sectionSchema || '{"name":"Cloned Section","settings":[]}'}
{% endschema %}`;

  return {
    fullSection,
    liquidCode,
    cssCode: relevantCss,
    sectionSchema: sectionSchema || '{"name":"Cloned Section","settings":[]}',
  };
}
