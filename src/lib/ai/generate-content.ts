import { chatCompletion, parseAIJson } from "./client";
import { buildGenerationPrompt } from "./prompts";
import { ScrapedProduct } from "../scrapers/types";

export interface GeneratedContent {
  title: string;
  subtitle: string;
  reviewCount: string;
  iconTexts: string[];
  iconFeatures: { icon: string; heading: string }[];
  description: string;
  collapsibleTabs: { heading: string; content: string; icon: string }[];
  imageWithText: { heading: string; body: string }[];
  multirowSections: { title: string; text: string }[];
  comparisonTable: { title: string; benefits: string[] };
  reviews: { title: string; text: string; author: string }[];
  customColumnFeatures: { title: string; text: string }[];
}

function validateAndFix(data: Record<string, unknown>): GeneratedContent {
  return {
    title: String(data.title || "Product"),
    subtitle: String(data.subtitle || ""),
    reviewCount: String(data.reviewCount || "2847"),
    iconTexts: Array.isArray(data.iconTexts)
      ? data.iconTexts.map(String)
      : ["Free Shipping", "30-Day Returns", "Secure Payment"],
    iconFeatures: Array.isArray(data.iconFeatures)
      ? data.iconFeatures.map((f: Record<string, unknown>) => ({
          icon: String(f?.icon || "check_circle"),
          heading: String(f?.heading || ""),
        }))
      : [
          { icon: "favorite", heading: "Premium Quality" },
          { icon: "undo", heading: "Easy Returns" },
          { icon: "local_shipping", heading: "Fast Delivery" },
        ],
    description: String(data.description || "<p>Product description</p>"),
    collapsibleTabs: Array.isArray(data.collapsibleTabs)
      ? data.collapsibleTabs.map((t: Record<string, unknown>) => ({
          heading: String(t?.heading || "Details"),
          content: String(t?.content || ""),
          icon: String(t?.icon || ""),
        }))
      : [],
    imageWithText: Array.isArray(data.imageWithText)
      ? data.imageWithText.map((s: Record<string, unknown>) => ({
          heading: String(s?.heading || ""),
          body: String(s?.body || ""),
        }))
      : [],
    multirowSections: Array.isArray(data.multirowSections)
      ? data.multirowSections.map((s: Record<string, unknown>) => ({
          title: String(s?.title || ""),
          text: String(s?.text || ""),
        }))
      : [],
    comparisonTable:
      data.comparisonTable &&
      typeof data.comparisonTable === "object"
        ? {
            title: String(
              (data.comparisonTable as Record<string, unknown>).title || "Why choose us?"
            ),
            benefits: Array.isArray(
              (data.comparisonTable as Record<string, unknown>).benefits
            )
              ? ((data.comparisonTable as Record<string, unknown>).benefits as unknown[]).map(String)
              : ["Benefit 1", "Benefit 2", "Benefit 3"],
          }
        : { title: "Why choose us?", benefits: ["Quality", "Price", "Service"] },
    reviews: Array.isArray(data.reviews)
      ? data.reviews.map((r: Record<string, unknown>) => ({
          title: String(r?.title || "Great!"),
          text: String(r?.text || ""),
          author: String(r?.author || "Customer"),
        }))
      : [],
    customColumnFeatures: Array.isArray(data.customColumnFeatures)
      ? data.customColumnFeatures.map((f: Record<string, unknown>) => ({
          title: String(f?.title || ""),
          text: String(f?.text || ""),
        }))
      : [],
  };
}

export async function generateContent(
  product: ScrapedProduct,
  language: string,
  tone: string
): Promise<GeneratedContent> {
  const prompt = buildGenerationPrompt(product, language, tone);

  const text = await chatCompletion(
    "You are an expert e-commerce copywriter. Return only valid JSON, no markdown code fences.",
    prompt
  );

  const raw = parseAIJson<Record<string, unknown>>(text);
  return validateAndFix(raw);
}
