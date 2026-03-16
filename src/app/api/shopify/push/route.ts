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
    const msg = error instanceof Error ? error.message : "Failed to push template";
    if (msg.includes("403") || msg.includes("approval") || msg.includes("scope")) {
      return NextResponse.json(
        { error: "Scope manquant: write_themes. Créez une Custom App dans votre Admin Shopify (Paramètres > Apps > Développer des apps), ajoutez les scopes read_themes et write_themes, installez l'app, puis reconnectez avec le nouveau Client ID/Secret." },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}
