import { z } from "zod";

export const ScrapedProductSchema = z.object({
  platform: z.enum(["shopify", "aliexpress", "amazon"]),
  sourceUrl: z.string().url(),
  title: z.string(),
  description: z.string(),
  descriptionText: z.string(),
  price: z.object({
    amount: z.number(),
    currency: z.string(),
    compareAt: z.number().optional(),
  }),
  images: z.array(
    z.object({
      url: z.string().url(),
      alt: z.string().optional(),
    })
  ),
  variants: z.array(
    z.object({
      title: z.string(),
      price: z.number().optional(),
      options: z.record(z.string(), z.string()),
    })
  ),
  features: z.array(z.string()),
  vendor: z.string().optional(),
  tags: z.array(z.string()).optional(),
  rating: z
    .object({
      score: z.number(),
      count: z.number(),
    })
    .optional(),
});

export type ScrapedProduct = z.infer<typeof ScrapedProductSchema>;
