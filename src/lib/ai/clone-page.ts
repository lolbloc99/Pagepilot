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
  const system = `You are an expert Shopify Liquid developer. You convert HTML/CSS pages into clean, production-ready Shopify Liquid sections. You produce pixel-perfect clones using only Liquid, HTML, and inline/scoped CSS. No external dependencies.`;

  // Clean and truncate to stay within token limits
  let cleanHtml = html
    .replace(/\s{2,}/g, " ")               // collapse whitespace
    .replace(/data-[a-z-]+="[^"]*"/gi, "") // remove data attributes
    .replace(/class="[^"]{100,}"/gi, (m) => `class="${m.slice(7, 80)}"`) // truncate long classes
    .replace(/style="[^"]{200,}"/gi, (m) => `style="${m.slice(7, 150)}"`) // truncate long inline styles
    .replace(/<link[^>]*>/gi, "")           // remove link tags
    .replace(/<meta[^>]*>/gi, "");          // remove meta tags

  let cleanCss = css
    .replace(/@media print[^}]*\{[^}]*\}/gi, "") // remove print styles
    .replace(/@font-face\s*\{[^}]*\}/gi, "")     // remove font-face
    .replace(/@keyframes[^}]*\{[^}]*(\{[^}]*\})*[^}]*\}/gi, "") // remove keyframes
    .replace(/\s{2,}/g, " ");

  const maxHtml = 8000;
  const maxCss = 4000;
  const trimmedHtml = cleanHtml.length > maxHtml ? cleanHtml.slice(0, maxHtml) + "\n<!-- truncated -->" : cleanHtml;
  const trimmedCss = cleanCss.length > maxCss ? cleanCss.slice(0, maxCss) + "\n/* truncated */" : cleanCss;

  const userMessage = `Convert this product page HTML/CSS into a complete Shopify Liquid custom section file.

## Source HTML (cleaned):
\`\`\`html
${trimmedHtml}
\`\`\`

## Source CSS (extracted):
\`\`\`css
${trimmedCss}
\`\`\`

## Requirements:
1. Create a SINGLE Shopify section .liquid file that contains everything
2. All text content must be in **${language}**
3. Include a {% schema %} block at the bottom with editable settings for all text, images, colors
4. Use Shopify's {{ section.settings.xxx }} for dynamic content
5. Scope ALL CSS inside <style> tags with a unique section class to avoid conflicts
6. Use {{ product.title }}, {{ product.price | money }}, {{ product.description }} where appropriate
7. Make images use {{ section.settings.image | image_url }} or product images
8. Keep the EXACT same visual layout, spacing, colors, fonts, animations
9. Make it fully responsive (mobile + desktop)
10. Replace any competitor branding/logos with Shopify dynamic content

Return a JSON object with:
{
  "fullSection": "The complete .liquid file content including <style>, HTML with Liquid, and {% schema %}",
  "liquidCode": "Just the HTML/Liquid part without style and schema",
  "cssCode": "Just the CSS code",
  "sectionSchema": "Just the {% schema %} JSON content"
}

Return ONLY the JSON, no markdown fences.`;

  const text = await chatCompletion(system, userMessage);
  const raw = parseAIJson<Record<string, unknown>>(text);

  return {
    fullSection: String(raw.fullSection || raw.full_section || ""),
    liquidCode: String(raw.liquidCode || raw.liquid_code || raw.liquid || ""),
    cssCode: String(raw.cssCode || raw.css_code || raw.css || ""),
    sectionSchema: String(raw.sectionSchema || raw.section_schema || raw.schema || ""),
  };
}
