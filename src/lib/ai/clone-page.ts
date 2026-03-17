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
  // But preserve <video-*> as they might be standard
  cleaned = cleaned.replace(
    /<([\w-]+(?:-[\w-]+)+)(\s[^>]*)?>/gi,
    (match, tag, attrs) => {
      const lower = tag.toLowerCase();
      // Keep standard/media tags
      const keepTags = ["font-face", "clip-path", "video-js", "x-video"];
      if (keepTags.some(t => lower.includes(t))) return match;
      return `<div${attrs || ""}>`;
    }
  );
  cleaned = cleaned.replace(
    /<\/([\w-]+(?:-[\w-]+)+)>/gi,
    (match, tag) => {
      const lower = tag.toLowerCase();
      const keepTags = ["font-face", "clip-path", "video-js", "x-video"];
      if (keepTags.some(t => lower.includes(t))) return match;
      return "</div>";
    }
  );

  // Replace hardcoded template/section IDs with dynamic Shopify IDs
  cleaned = cleaned.replace(
    /template--\d+__\w+/g,
    "{{ section.id }}"
  );

  // Make relative URLs absolute for src, poster, href on media
  if (baseUrl) {
    // src attributes
    cleaned = cleaned.replace(
      /src="\/(?!\/|http|data)([^"]*?)"/gi,
      `src="${baseUrl}/$1"`
    );
    // poster attributes
    cleaned = cleaned.replace(
      /poster="\/(?!\/|http|data)([^"]*?)"/gi,
      `poster="${baseUrl}/$1"`
    );
    // srcset
    cleaned = cleaned.replace(
      /srcset="([^"]*?)"/gi,
      (match, srcset) => {
        const fixed = srcset.replace(
          /(?<!=:)\/\/([^\s,]+)/g,
          "https://$1"
        );
        return `srcset="${fixed}"`;
      }
    );
    // Protocol-relative src
    cleaned = cleaned.replace(
      /src="\/\/([^"]+)"/gi,
      'src="https://$1"'
    );
  }

  // Remove empty onclick/onload handlers
  cleaned = cleaned.replace(/\son\w+="[^"]*"/gi, "");

  // Fix double protocol in URLs
  cleaned = cleaned.replace(/https:https:\/\//g, "https://");
  cleaned = cleaned.replace(/http:https:\/\//g, "https://");

  return cleaned;
}

/**
 * Clean CSS: minimal cleaning for maximum visual fidelity.
 */
function cleanCss(css: string): string {
  const cleaned = css
    .replace(/@charset[^;]*;/gi, "")
    .replace(/@import[^;]*;/gi, "")
    .replace(/@media\s+print[^{]*\{(?:[^{}]*\{[^}]*\})*[^}]*\}/gi, "")
    .replace(/\n{3,}/g, "\n")
    .trim();

  return cleaned;
}

export async function clonePage(
  html: string,
  css: string,
  language: string,
  baseUrl: string = ""
): Promise<ClonedPage> {
  // Step 1: Server-side HTML cleaning (no AI needed)
  const processedHtml = cleanHtmlForShopify(html, baseUrl);

  // Step 2: Clean CSS
  const relevantCss = cleanCss(css);

  // Step 3: AI — minimal "find & replace" approach
  // The AI ONLY returns targeted replacements, not the full HTML
  const system = `You are an expert Shopify Liquid developer. Your job is to analyze an HTML page and return MINIMAL, PRECISE text replacements to convert specific product data into Shopify Liquid tags.

CRITICAL RULES:
- You MUST NOT change the HTML structure, classes, IDs, or layout
- You MUST NOT touch image URLs, video URLs, or any media src attributes — they are already absolute and correct
- You ONLY replace dynamic TEXT CONTENT (product title, price, description, button labels)
- Each "find" string must be EXACTLY copied from the HTML (character-perfect)
- Keep replacements to a MINIMUM (typically 5-15 replacements max)
- NEVER replace CSS classes, HTML attributes, or structural markup`;

  // Send a smart sample of the HTML
  const maxHtml = 20000;
  let sampleHtml: string;
  if (processedHtml.length <= maxHtml) {
    sampleHtml = processedHtml;
  } else {
    const first = processedHtml.slice(0, 13000);
    const rest = processedHtml.slice(13000);
    // Find important product sections
    const priceIdx = rest.search(/class="[^"]*price[^"]*"|class='[^']*price[^']*'/i);
    const cartIdx = rest.search(/add[_-]?to[_-]?cart|warenkorb|panier|ajouter/i);
    const descIdx = rest.search(/class="[^"]*description[^"]*"/i);
    const indices = [priceIdx, cartIdx, descIdx].filter(i => i >= 0);
    if (indices.length > 0) {
      const importantIdx = Math.min(...indices);
      const start = Math.max(0, importantIdx - 500);
      const section = rest.slice(start, start + 6000);
      sampleHtml = first + "\n<!-- ... middle content ... -->\n" + section;
    } else {
      sampleHtml = first + "\n<!-- ... remaining " + (processedHtml.length - 13000) + " chars ... -->";
    }
  }

  const userMessage = `Analyze this product page HTML and return MINIMAL replacements to make it Shopify-compatible.

## HTML (${processedHtml.length} chars total):
${sampleHtml}

## Return a JSON object with these fields:

### 1. "replacements" — array of {"find": "exact text", "replace": "Liquid code"}
Only replace these types of content:
- **Product title text** → {{ product.title }}
- **Price text** (e.g. "€29,99" or "$149.00" or "29,99 €") → {{ product.price | money }}
- **Compare-at price / original price** → {{ product.compare_at_price | money }}
- **"Add to cart" button text** → {{ 'products.product.add_to_cart' | t }}
- **Product description text** (if clearly visible as a paragraph) → {{ product.description }}
- **Quantity label** → keep as static text in ${language}

DO NOT replace:
- Image URLs or src attributes (they are already correct absolute URLs)
- Video/media URLs
- CSS classes or HTML structure
- Navigation, breadcrumbs, or footer content
- Generic text that isn't product-specific

### 2. "translations" — array of {"find": "original text", "replace": "text in ${language}"}
Only translate UI labels and buttons that are NOT product data:
- "Add to Cart" → translated to ${language}
- "Description", "Reviews", "Specifications" → translated
- Tab labels, section headings

### 3. "sectionSchema" — valid JSON string for Shopify {% schema %}:
{
  "name": "section name in ${language}",
  "settings": [
    {"type": "text", "id": "title", "label": "title label in ${language}", "default": "..."},
    {"type": "richtext", "id": "description", "label": "description label in ${language}"}
  ],
  "presets": [{"name": "preset name in ${language}"}]
}

IMPORTANT:
- Return ONLY valid JSON, no markdown
- "find" must be EXACTLY as it appears in the HTML (copy-paste)
- Typically 5-15 replacements total, not more
- Do NOT touch any src="...", href="...", poster="...", srcset="..." attributes`;

  const text = await chatCompletion(system, userMessage, 8192);
  const raw = parseAIJson<Record<string, unknown>>(text);

  // Apply replacements to the full processed HTML
  let liquidCode = processedHtml;

  const replacements = Array.isArray(raw.replacements) ? raw.replacements : [];
  const translations = Array.isArray(raw.translations) ? raw.translations : [];

  let appliedCount = 0;
  for (const r of [...replacements, ...translations]) {
    const find = String(r.find || "");
    const replace = String(r.replace || "");
    if (find && replace && find !== replace && find.length > 1) {
      // Safety: skip if "find" looks like it contains HTML attributes we shouldn't touch
      if (find.includes('src="') || find.includes('href="') || find.includes('poster="')) {
        console.warn(`[Clone] Skipping unsafe replacement: "${find.slice(0, 50)}..."`);
        continue;
      }

      const before = liquidCode;
      if (translations.includes(r)) {
        // Replace all occurrences for translations
        liquidCode = liquidCode.split(find).join(replace);
      } else {
        // Replace first occurrence for product-specific content
        liquidCode = liquidCode.replace(find, replace);
      }
      if (liquidCode !== before) appliedCount++;
    }
  }

  // Validate sectionSchema
  let sectionSchema = "";
  const rawSchema = String(raw.sectionSchema || raw.section_schema || raw.schema || "");
  if (rawSchema) {
    try {
      JSON.parse(rawSchema);
      sectionSchema = rawSchema;
    } catch {
      console.warn("[Clone] Invalid sectionSchema JSON from AI, using fallback");
    }
  }

  console.log(`[Clone] Applied ${appliedCount}/${replacements.length + translations.length} replacements. HTML: ${processedHtml.length} → ${liquidCode.length} chars`);

  // Assemble final .liquid file
  const fullSection = `<style>
${relevantCss}
</style>

${liquidCode}

{% schema %}
${sectionSchema || '{"name":"Cloned Section","settings":[],"presets":[{"name":"Cloned Section"}]}'}
{% endschema %}`;

  return {
    fullSection,
    liquidCode,
    cssCode: relevantCss,
    sectionSchema: sectionSchema || '{"name":"Cloned Section","settings":[],"presets":[{"name":"Cloned Section"}]}',
  };
}
