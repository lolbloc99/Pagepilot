import { NextRequest, NextResponse } from "next/server";
import { pushTemplate } from "@/lib/shopify/admin";
import { getValidToken } from "@/lib/shopify/token";

export async function POST(req: NextRequest) {
  try {
    const { domain, themeId, templateName, template } = await req.json();

    if (!domain || !themeId || !templateName || !template) {
      return NextResponse.json(
        { error: "domain, themeId, templateName, and template are required" },
        { status: 400 }
      );
    }

    const accessToken = await getValidToken(domain);

    const safeName = templateName
      .toLowerCase()
      .replace(/[^a-z0-9-_.]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    const key = safeName.endsWith(".json")
      ? `product.${safeName}`
      : `product.${safeName}.json`;

    const result = await pushTemplate(domain, accessToken, themeId, key, template);

    return NextResponse.json({
      success: true,
      key: result.key,
      message: `Template pushed to ${result.key}`,
    });
  } catch (error) {
    console.error("Shopify push error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to push template" },
      { status: 500 }
    );
  }
}
