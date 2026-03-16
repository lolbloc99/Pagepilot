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

  // Make relative image URLs absolute (but don't touch protocol-relative // or absolute http URLs)
  if (baseUrl) {
    cleaned = cleaned.replace(
      /src="\/(?!\/|http)([^"]*?)"/gi,
      `src="${baseUrl}/$1"`
    );
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
  }

  // Remove empty onclick/onload handlers
  cleaned = cleaned.replace(/\son\w+="[^"]*"/gi, "");

  // Fix double protocol in URLs (https:https://)
  cleaned = cleaned.replace(/https:https:\/\//g, "https://");
  cleaned = cleaned.replace(/http:https:\/\//g, "https://");

  return cleaned;
}

/**
 * Clean CSS: remove bloat (@font-face, @keyframes, print, comments) but keep all visual rules.
 */
function cleanCss(css: string): string {
  // Remove bloat but keep all visual rules (class filtering was too aggressive)
  let cleaned = css
    .replace(/\/\*[\s\S]*?\*\//g, "")                                          // comments
    .replace(/@font-face\s*\{[^}]*\}/gi, "")                                   // font-face
    .replace(/@keyframes[^{]*\{(?:[^{}]*\{[^}]*\})*[^}]*\}/gi, "")            // keyframes
    .replace(/@media\s+print[^{]*\{(?:[^{}]*\{[^}]*\})*[^}]*\}/gi, "")        // print media
    .replace(/@charset[^;]*;/gi, "")                                            // charset
    .replace(/@import[^;]*;/gi, "")                                             // imports
    .replace(/\s{2,}/g, " ")
    .trim();

  // If CSS is still huge (>150k), keep it but compress aggressively
  if (cleaned.length > 150000) {
    // Remove all whitespace that's not inside values
    cleaned = cleaned
      .replace(/\s*\{\s*/g, "{")
      .replace(/\s*\}\s*/g, "}")
      .replace(/\s*;\s*/g, ";")
      .replace(/\s*:\s*/g, ":")
      .replace(/\s*,\s*/g, ",");
  }

  return cleaned;
}

export async function clonePage(
  html: string,
  css: string,
  language: string,
  baseUrl: string = ""
): Promise<ClonedPage> {
  // Step 1: Server-side HTML cleaning (no AI needed)
  let processedHtml = cleanHtmlForShopify(html, baseUrl);

  // Step 2: Clean CSS (remove bloat, keep all visual rules)
  const relevantCss = cleanCss(css);

  // Step 3: AI — "find & replace" approach
  // Instead of asking AI to reproduce all HTML (which causes truncation),
  // we ask it to return a LIST of replacements to apply server-side.
  const system = `You are an expert Shopify Liquid developer. You analyze HTML and return a list of text replacements to convert it into a Shopify Liquid section.

You do NOT reproduce the HTML. You only return replacements.`;

  // Send a smart sample: first 10k + search for price/cart sections to include
  const maxHtml = 18000;
  let sampleHtml: string;
  if (processedHtml.length <= maxHtml) {
    sampleHtml = processedHtml;
  } else {
    // Include first 12k (product gallery, title) + find price/cart section
    const first = processedHtml.slice(0, 12000);
    // Search for price area in the rest
    const rest = processedHtml.slice(12000);
    const priceIdx = rest.search(/class="[^"]*price[^"]*"|class='[^']*price[^']*'/i);
    const cartIdx = rest.search(/add[_-]?to[_-]?cart|warenkorb|panier/i);
    const importantIdx = Math.min(
      priceIdx >= 0 ? priceIdx : rest.length,
      cartIdx >= 0 ? cartIdx : rest.length
    );
    if (importantIdx < rest.length) {
      const start = Math.max(0, importantIdx - 500);
      const priceSection = rest.slice(start, start + 5000);
      sampleHtml = first + "\n<!-- ... -->\n" + priceSection;
    } else {
      sampleHtml = first;
    }
  }

  const userMessage = `Analyze this HTML from a product page and return replacements to make it a Shopify Liquid section.

## HTML sample:
${sampleHtml}

## Return a JSON object with:
1. "replacements": array of {"find": "exact text to find", "replace": "Liquid replacement"} — these will be applied with string.replace()
   - Find the product title text and replace with {{ product.title }}
   - Find prices (e.g. "€1.499,00" or "$29.99") and replace with {{ product.price | money }}
   - Find "Add to cart" / "In den Warenkorb" type buttons text and replace with translated text + Liquid
   - Find product description paragraphs and replace with {{ product.description }}
   - Find the main product image URL and replace with {{ product.featured_image | image_url: width: 1200 }}
2. "translations": array of {"find": "original text", "replace": "translated text in ${language}"} — for UI labels, buttons, headings
3. "sectionSchema": a complete Shopify section schema JSON string with:
   - name: section name in ${language}
   - settings: image_picker for images, text/richtext for editable content, color for colors — ALL labels in ${language}
   - blocks: if the page has repeatable elements (features, specs, etc.) — ALL labels in ${language}
   - presets: [{"name": "section name in ${language}"}]

IMPORTANT:
- "find" must be EXACT text from the HTML (copy-paste, not paraphrased)
- Keep replacements minimal — only replace dynamic product content
- For images, find the full src="..." value and replace the URL part only
- Return ONLY valid JSON, no markdown fences.`;

  const text = await chatCompletion(system, userMessage, 8192);
  const raw = parseAIJson<Record<string, unknown>>(text);

  // Apply replacements to the full processed HTML
  let liquidCode = processedHtml;

  const replacements = Array.isArray(raw.replacements) ? raw.replacements : [];
  const translations = Array.isArray(raw.translations) ? raw.translations : [];

  for (const r of [...replacements, ...translations]) {
    const find = String(r.find || "");
    const replace = String(r.replace || "");
    if (find && replace && find !== replace) {
      // Use string replace (first occurrence for product-specific, all for UI labels)
      if (translations.includes(r)) {
        liquidCode = liquidCode.split(find).join(replace);
      } else {
        liquidCode = liquidCode.replace(find, replace);
      }
    }
  }

  // Validate sectionSchema is valid JSON, fallback if not
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

  console.log(`[Clone] Applied ${replacements.length} replacements + ${translations.length} translations. HTML: ${processedHtml.length} → ${liquidCode.length} chars`);

  // Assemble final .liquid file
  // Use Shopify's stylesheet_tag if CSS is large, otherwise inline
  const cssInline = relevantCss.length > 200000
    ? `{%- comment -%}CSS is large - consider moving to assets/cloned-section.css{%- endcomment -%}
<style>${relevantCss}</style>`
    : `<style>${relevantCss}</style>`;

  const fullSection = `${cssInline}

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
