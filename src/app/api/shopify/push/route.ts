import { NextRequest, NextResponse } from "next/server";
import { pushTemplate } from "@/lib/shopify/admin";
import { getValidToken } from "@/lib/shopify/token";

export async function POST(req: NextRequest) {
  try {
    const { domain, themeId, templateName, template, liquidContent } = await req.json();

    if (!domain || !themeId || !templateName) {
      return NextResponse.json(
        { error: "domain, themeId, and templateName are required" },
        { status: 400 }
      );
    }

    const accessToken = await getValidToken(domain);

    let safeName = templateName
      .toLowerCase()
      .replace(/[^a-z0-9-_.]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    // Fallback if sanitization removed all characters
    if (!safeName) {
      safeName = "product-page";
    }

    const key = safeName.endsWith(".json")
      ? `product.${safeName}`
      : `product.${safeName}.json`;

    const result = await pushTemplate(domain, accessToken, themeId, key, template || {}, liquidContent);

    const parts = [result.sectionKey, result.cssKey, result.key].filter(Boolean);
    return NextResponse.json({
      success: true,
      key: result.key,
      sectionKey: result.sectionKey,
      cssKey: result.cssKey,
      message: `Pushed: ${parts.join(" + ")}`,
    });
  } catch (error) {
    console.error("Shopify push error:", error);
    const msg = error instanceof Error ? error.message : "Failed to push template";
    if (msg.includes("403") || msg.includes("approval") || msg.includes("scope")) {
      return NextResponse.json(
        { error: "Scope manquant: write_themes. Dans le Dev Dashboard (dev.shopify.com), allez dans votre app > Versions, créez une version avec les scopes read_themes et write_themes, faites Release, réinstallez l'app sur la boutique, puis reconnectez dans PagePilot." },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}
