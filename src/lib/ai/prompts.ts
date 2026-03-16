import { ScrapedProduct } from "../scrapers/types";

export function buildGenerationPrompt(
  product: ScrapedProduct,
  language: string,
  tone: string
): string {
  return `You are an expert e-commerce copywriter specialized in high-converting Shopify product pages.

Analyze the following product data and generate compelling, conversion-optimized content in **${language}**.

## Product Data
- **Title**: ${product.title}
- **Price**: ${product.price.amount} ${product.price.currency}${product.price.compareAt ? ` (was ${product.price.compareAt})` : ""}
- **Description**: ${product.descriptionText}
- **Features**: ${product.features.join(" | ")}
- **Platform**: ${product.platform}
- **Vendor**: ${product.vendor || "N/A"}
- **Rating**: ${product.rating ? `${product.rating.score}/5 (${product.rating.count} reviews)` : "N/A"}
- **Number of images**: ${product.images.length}

## Tone
Write in a **${tone}** tone. The copy should be persuasive and optimized for conversions.

## Required Output
Return a JSON object with exactly this structure (all text content must be in **${language}**):

\`\`\`json
{
  "title": "Optimized product title (catchy, benefit-focused)",
  "subtitle": "Short tagline or subtitle with an emoji",
  "reviewCount": "Number between 1000 and 9999 for social proof",
  "iconTexts": [
    "Short benefit text 1 (e.g. '✅ Free Shipping')",
    "Short benefit text 2",
    "Short benefit text 3"
  ],
  "iconFeatures": [
    { "icon": "favorite", "heading": "Short benefit heading" },
    { "icon": "undo", "heading": "Short benefit heading" },
    { "icon": "local_shipping", "heading": "Short benefit heading" }
  ],
  "description": "Rich HTML product description with <p>, <strong>, <ul>, <li> tags. Write 3-5 paragraphs that highlight benefits, features, and create desire. Include emojis strategically.",
  "collapsibleTabs": [
    { "heading": "Tab heading (e.g. Features / Specs)", "content": "HTML content for this tab", "icon": "inventory_2" },
    { "heading": "Tab heading (e.g. Shipping)", "content": "HTML content", "icon": "local_shipping" },
    { "heading": "Tab heading (e.g. Returns)", "content": "HTML content", "icon": "undo" },
    { "heading": "Tab heading (e.g. FAQ)", "content": "HTML content", "icon": "help" }
  ],
  "imageWithText": [
    { "heading": "Section heading about a key benefit", "body": "HTML paragraph explaining this benefit in detail" },
    { "heading": "Another key benefit heading", "body": "HTML paragraph" }
  ],
  "multirowSections": [
    { "title": "Feature/benefit heading", "text": "HTML paragraph about this feature" },
    { "title": "Feature/benefit heading", "text": "HTML paragraph about this feature" }
  ],
  "comparisonTable": {
    "title": "Why choose [product/brand] ?",
    "benefits": [
      "Unique benefit 1",
      "Unique benefit 2",
      "Unique benefit 3"
    ]
  },
  "reviews": [
    { "title": "Review title", "text": "Realistic review text (2-3 sentences)", "author": "First name" },
    { "title": "Review title", "text": "Realistic review text", "author": "First name" },
    { "title": "Review title", "text": "Realistic review text", "author": "First name" }
  ],
  "customColumnFeatures": [
    { "title": "Feature heading", "text": "Short feature description paragraph" },
    { "title": "Feature heading", "text": "Short feature description paragraph" },
    { "title": "Feature heading", "text": "Short feature description paragraph" }
  ]
}
\`\`\`

Important rules:
- ALL text must be in ${language}
- Write compelling, benefit-focused copy that converts
- Use emotional triggers and social proof
- Keep headings concise (3-6 words)
- Make the description scannable with short paragraphs
- Reviews should feel authentic and varied
- Icons must be valid Material Symbols names (favorite, local_shipping, undo, inventory_2, check_circle, star, shield, timer, eco, verified, support_agent, thumb_up)
- Return ONLY the JSON, no markdown fences or extra text`;
}
