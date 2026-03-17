import { chatCompletion, parseAIJson } from "./client";

export interface ClonedPage {
  liquidCode: string;
  cssCode: string;
  sectionSchema: string;
  fullSection: string;
}

/**
 * Server-side HTML cleaning: convert custom web components to standard divs,
 * replace hardcoded IDs, etc.
 */
function cleanHtmlForShopify(html: string): string {
  let cleaned = html;

  // Replace custom web components with standard divs
  cleaned = cleaned.replace(
    /<([\w-]+(?:-[\w-]+)+)(\s[^>]*)?>/gi,
    (match, tag, attrs) => {
      const lower = tag.toLowerCase();
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

  // Replace hardcoded template/section IDs
  cleaned = cleaned.replace(/template--\d+__\w+/g, "{{ section.id }}");

  // Remove empty onclick/onload handlers
  cleaned = cleaned.replace(/\son\w+="[^"]*"/gi, "");

  // Fix double protocol
  cleaned = cleaned.replace(/https:https:\/\//g, "https://");
  cleaned = cleaned.replace(/http:https:\/\//g, "https://");

  return cleaned;
}

/**
 * Replace <img> tags with Shopify Liquid image_picker placeholders.
 * Each image gets a unique setting ID (image_1, image_2, etc.)
 * so the user can upload their own images in Shopify theme editor.
 */
function replaceImagesWithPlaceholders(html: string): { html: string; imageSettings: ImageSetting[] } {
  const imageSettings: ImageSetting[] = [];
  let imageIndex = 0;

  // Replace <img> tags
  const result = html.replace(
    /<img\s[^>]*>/gi,
    (match) => {
      imageIndex++;
      const id = `image_${imageIndex}`;

      // Extract alt text if any
      const altMatch = match.match(/alt="([^"]*)"/i);
      const alt = altMatch ? altMatch[1] : `Image ${imageIndex}`;

      // Extract width/height if present
      const widthMatch = match.match(/width="(\d+)"/i);
      const heightMatch = match.match(/height="(\d+)"/i);
      const width = widthMatch ? widthMatch[1] : "800";

      // Extract class if present (to keep styling)
      const classMatch = match.match(/class="([^"]*)"/i);
      const classAttr = classMatch ? ` class="${classMatch[1]}"` : "";

      // Extract loading attribute
      const loadingAttr = ' loading="lazy"';

      imageSettings.push({
        id,
        label: alt || `Image ${imageIndex}`,
        width: parseInt(width) || 800,
      });

      // Return Shopify Liquid image with fallback placeholder
      return `{%- if section.settings.${id} -%}
  <img${classAttr} src="{{ section.settings.${id} | image_url: width: ${width} }}" alt="${alt}"${loadingAttr}>
{%- else -%}
  <img${classAttr} src="{{ 'image' | placeholder_svg_tag }}" alt="${alt}"${loadingAttr}>
{%- endif -%}`;
    }
  );

  // Also handle background-image in inline styles
  const bgResult = result.replace(
    /style="([^"]*background(?:-image)?:\s*url\([^)]+\)[^"]*)"/gi,
    (match, styleContent) => {
      imageIndex++;
      const id = `bg_image_${imageIndex}`;

      imageSettings.push({
        id,
        label: `Image de fond ${imageIndex}`,
        width: 1920,
      });

      // Replace the background-image URL with Liquid
      const newStyle = styleContent.replace(
        /background(?:-image)?:\s*url\([^)]+\)/gi,
        `background-image: url({{ section.settings.${id} | image_url: width: 1920 }})`
      );

      return `style="${newStyle}"`;
    }
  );

  return { html: bgResult, imageSettings };
}

interface ImageSetting {
  id: string;
  label: string;
  width: number;
}

/**
 * Remove video elements (user will add their own)
 * Replace with a simple placeholder div
 */
function replaceVideosWithPlaceholders(html: string): string {
  // Replace <video> tags with placeholder
  let result = html.replace(
    /<video[^>]*>[\s\S]*?<\/video>/gi,
    '<div class="video-placeholder" style="aspect-ratio: 16/9; background: #f0f0f0; display: flex; align-items: center; justify-content: center; border-radius: 8px;"><span style="color: #999; font-size: 14px;">📹 Vidéo — à configurer dans le theme editor</span></div>'
  );

  // Replace YouTube/Vimeo iframes with placeholder
  result = result.replace(
    /<iframe[^>]*(?:youtube|vimeo|player)[^>]*>[\s\S]*?<\/iframe>/gi,
    '<div class="video-placeholder" style="aspect-ratio: 16/9; background: #f0f0f0; display: flex; align-items: center; justify-content: center; border-radius: 8px;"><span style="color: #999; font-size: 14px;">📹 Vidéo — à configurer dans le theme editor</span></div>'
  );

  return result;
}

/**
 * Clean CSS: minimal cleaning for maximum visual fidelity.
 */
function cleanCss(css: string): string {
  return css
    .replace(/@charset[^;]*;/gi, "")
    .replace(/@import[^;]*;/gi, "")
    .replace(/@media\s+print[^{]*\{(?:[^{}]*\{[^}]*\})*[^}]*\}/gi, "")
    .replace(/\n{3,}/g, "\n")
    .trim();
}

export async function clonePage(
  html: string,
  css: string,
  language: string,
  baseUrl: string = ""
): Promise<ClonedPage> {
  // Step 1: Clean HTML structure
  let processedHtml = cleanHtmlForShopify(html);

  // Step 2: Replace images with Shopify placeholders (user uploads their own)
  const { html: htmlWithPlaceholders, imageSettings } = replaceImagesWithPlaceholders(processedHtml);
  processedHtml = htmlWithPlaceholders;

  // Step 3: Replace videos with placeholders
  processedHtml = replaceVideosWithPlaceholders(processedHtml);

  // Step 4: Clean CSS
  const relevantCss = cleanCss(css);

  // Step 5: AI — minimal text replacements only (no images/videos)
  const system = `You are an expert Shopify Liquid developer. You analyze HTML and return MINIMAL text replacements to convert product text content into Shopify Liquid tags.

CRITICAL RULES:
- You MUST NOT change HTML structure, classes, IDs, or layout
- You MUST NOT touch any images — they are already handled as Shopify image_picker placeholders
- You MUST NOT touch any video elements
- You ONLY replace dynamic TEXT CONTENT (title, price, description, buttons)
- Each "find" must be EXACTLY copied from the HTML
- Keep replacements MINIMAL (5-15 max)`;

  // Smart HTML sample for AI
  const maxHtml = 20000;
  let sampleHtml: string;
  if (processedHtml.length <= maxHtml) {
    sampleHtml = processedHtml;
  } else {
    const first = processedHtml.slice(0, 13000);
    const rest = processedHtml.slice(13000);
    const priceIdx = rest.search(/class="[^"]*price[^"]*"|class='[^']*price[^']*'/i);
    const cartIdx = rest.search(/add[_-]?to[_-]?cart|warenkorb|panier|ajouter/i);
    const descIdx = rest.search(/class="[^"]*description[^"]*"/i);
    const indices = [priceIdx, cartIdx, descIdx].filter(i => i >= 0);
    if (indices.length > 0) {
      const importantIdx = Math.min(...indices);
      const start = Math.max(0, importantIdx - 500);
      const section = rest.slice(start, start + 6000);
      sampleHtml = first + "\n<!-- ... -->\n" + section;
    } else {
      sampleHtml = first;
    }
  }

  const userMessage = `Analyze this product page HTML and return text replacements for Shopify Liquid.

NOTE: Images are ALREADY replaced with Shopify image_picker placeholders. Do NOT touch them.

## HTML (${processedHtml.length} chars):
${sampleHtml}

## Return JSON with:

### 1. "replacements" — array of {"find": "exact text", "replace": "Liquid code"}
ONLY replace:
- **Product title** → {{ product.title }}
- **Price** (e.g. "€29,99" or "$149.00") → {{ product.price | money }}
- **Compare-at price** → {{ product.compare_at_price | money }}
- **Add to cart button text** → {{ 'products.product.add_to_cart' | t }}
- **Product description paragraph** → {{ product.description }}

DO NOT touch: images, videos, CSS, HTML attributes, structure.

### 2. "translations" — array of {"find": "text", "replace": "text in ${language}"}
Translate UI labels: "Add to Cart", "Description", "Reviews", "Quantity", etc.

### 3. "sectionSchema" — valid JSON string for {% schema %} with:
- name in ${language}
- settings with image_picker entries (I'll merge the auto-detected ones)
- text/richtext for editable content
- presets

Return ONLY valid JSON, no markdown. "find" must be EXACT from the HTML.`;

  const text = await chatCompletion(system, userMessage, 8192);
  const raw = parseAIJson<Record<string, unknown>>(text);

  // Apply text replacements
  let liquidCode = processedHtml;

  const replacements = Array.isArray(raw.replacements) ? raw.replacements : [];
  const translations = Array.isArray(raw.translations) ? raw.translations : [];

  let appliedCount = 0;
  for (const r of [...replacements, ...translations]) {
    const find = String(r.find || "");
    const replace = String(r.replace || "");
    if (find && replace && find !== replace && find.length > 1) {
      // Safety: skip attribute replacements
      if (find.includes('src="') || find.includes('href="') || find.includes('poster="') || find.includes("section.settings.image")) {
        continue;
      }

      const before = liquidCode;
      if (translations.includes(r)) {
        liquidCode = liquidCode.split(find).join(replace);
      } else {
        liquidCode = liquidCode.replace(find, replace);
      }
      if (liquidCode !== before) appliedCount++;
    }
  }

  // Build section schema — merge AI schema with auto-detected image settings
  let sectionSchema = "";
  const rawSchema = String(raw.sectionSchema || raw.section_schema || raw.schema || "");

  try {
    const schema = rawSchema ? JSON.parse(rawSchema) : { name: "Section clonée", settings: [], presets: [{ name: "Section clonée" }] };

    // Add image_picker settings for each detected image
    const existingIds = new Set((schema.settings || []).map((s: { id: string }) => s.id));
    for (const img of imageSettings) {
      if (!existingIds.has(img.id)) {
        schema.settings = schema.settings || [];
        schema.settings.push({
          type: "image_picker",
          id: img.id,
          label: img.label,
        });
      }
    }

    sectionSchema = JSON.stringify(schema, null, 2);
  } catch {
    // Build fallback schema with image settings
    const settings = imageSettings.map(img => ({
      type: "image_picker",
      id: img.id,
      label: img.label,
    }));
    sectionSchema = JSON.stringify({
      name: "Section clonée",
      settings,
      presets: [{ name: "Section clonée" }],
    }, null, 2);
  }

  console.log(`[Clone] Applied ${appliedCount} text replacements. ${imageSettings.length} images → placeholders. HTML: ${html.length} → ${liquidCode.length} chars`);

  // Assemble final .liquid file
  const fullSection = `<style>
${relevantCss}
</style>

${liquidCode}

{% schema %}
${sectionSchema}
{% endschema %}`;

  return {
    fullSection,
    liquidCode,
    cssCode: relevantCss,
    sectionSchema,
  };
}
