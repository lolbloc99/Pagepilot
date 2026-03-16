import { chatCompletion, parseAIJson } from "./client";

export interface ClonedPage {
  liquidCode: string;
  cssCode: string;
  sectionSchema: string;
  fullSection: string;
}

export async function clonePage(
  html: string,
  css: string,
  language: string
): Promise<ClonedPage> {
  const system = `You are an expert Shopify Liquid developer. Your job is to convert HTML into Shopify Liquid sections.

CRITICAL RULES:
- You ONLY convert the HTML structure to Liquid. You do NOT touch or reproduce CSS.
- The CSS will be injected separately — never output CSS, never write "/* all styles */" or any placeholder.
- Output REAL, COMPLETE HTML with Liquid tags. Never abbreviate, never use comments like "<!-- rest of content -->".
- Every single visible element from the source HTML must appear in your output.
- Keep ALL original class names and HTML structure exactly as-is.
- Only add Liquid template tags ({{ }}, {% %}) where appropriate.`;

  // Clean HTML — keep class names intact for CSS matching
  let cleanHtml = html
    .replace(/\s{2,}/g, " ")
    .replace(/data-[a-z-]+="[^"]*"/gi, "")
    .replace(/<link[^>]*>/gi, "")
    .replace(/<meta[^>]*>/gi, "");

  const maxHtml = 25000;
  const trimmedHtml = cleanHtml.length > maxHtml
    ? cleanHtml.slice(0, maxHtml) + "\n<!-- truncated -->"
    : cleanHtml;

  const userMessage = `Convert this HTML into a Shopify Liquid section. Keep ALL original class names and structure.

## Source HTML:
\`\`\`html
${trimmedHtml}
\`\`\`

## Instructions:
1. Convert the HTML to use Shopify Liquid template tags where appropriate:
   - Product title: {{ product.title }}
   - Product price: {{ product.price | money }}
   - Product description: {{ product.description }}
   - Images: {{ section.settings.image | image_url: width: 800 }} or {{ product.featured_image | image_url: width: 800 }}
   - Text content: {{ section.settings.heading }}, {{ section.settings.text }}, etc.
2. Translate all visible text to **${language}**
3. Keep ALL original class names exactly as they are (the CSS depends on them)
4. Keep the full HTML structure — do NOT simplify or abbreviate anything
5. Create a {% schema %} block with settings for all editable text, images, colors, and buttons
6. Do NOT output any CSS — it will be added separately
7. Do NOT use placeholders like "<!-- more content -->" — output the COMPLETE HTML

Return a JSON object:
{
  "liquidCode": "The complete HTML with Liquid tags (NO <style> tags, NO CSS)",
  "sectionSchema": "The {% schema %} JSON content (just the JSON inside {% schema %}...{% endschema %})"
}

Return ONLY valid JSON, no markdown fences.`;

  const text = await chatCompletion(system, userMessage, 32768);
  const raw = parseAIJson<Record<string, unknown>>(text);

  const liquidCode = String(raw.liquidCode || raw.liquid_code || raw.liquid || "");
  const sectionSchema = String(raw.sectionSchema || raw.section_schema || raw.schema || "");

  // Clean CSS: remove print, font-face, keyframes, comments, collapse whitespace
  const cleanCss = css
    .replace(/@media print[^}]*\{[^}]*\}/gi, "")
    .replace(/@font-face\s*\{[^}]*\}/gi, "")
    .replace(/@keyframes[^}]*\{[^}]*(\{[^}]*\})*[^}]*\}/gi, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  // Assemble the full .liquid file: original CSS + Liquid HTML + schema
  // Use Shopify's built-in section id for scoping
  const fullSection = `<style>
${cleanCss}
</style>

<div id="section-{{ section.id }}" class="cloned-section">
${liquidCode}
</div>

{% schema %}
${sectionSchema}
{% endschema %}`;

  return {
    fullSection,
    liquidCode,
    cssCode: cleanCss,
    sectionSchema,
  };
}
