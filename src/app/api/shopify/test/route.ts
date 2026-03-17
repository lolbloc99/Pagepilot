import { NextRequest, NextResponse } from "next/server";
import { getValidToken } from "@/lib/shopify/token";

const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || "2025-01";

export async function POST(req: NextRequest) {
  try {
    const { domain } = await req.json();
    if (!domain) {
      return NextResponse.json({ error: "domain is required" }, { status: 400 });
    }

    const accessToken = await getValidToken(domain);

    // Test 1: Shop info
    const shopRes = await fetch(
      `https://${domain}/admin/api/${SHOPIFY_API_VERSION}/shop.json`,
      {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
      }
    );

    if (!shopRes.ok) {
      return NextResponse.json({
        success: false,
        error: `Shop API failed (${shopRes.status}). Token might be invalid — try removing and reconnecting the store.`,
      });
    }

    const shopData = await shopRes.json();

    // Test 2: Themes (read_themes scope)
    const themesRes = await fetch(
      `https://${domain}/admin/api/${SHOPIFY_API_VERSION}/themes.json`,
      {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
      }
    );

    const hasReadThemes = themesRes.ok;
    let themeCount = 0;
    if (hasReadThemes) {
      const themesData = await themesRes.json();
      themeCount = themesData.themes?.length || 0;
    }

    return NextResponse.json({
      success: true,
      shopName: shopData.shop?.name || domain,
      plan: shopData.shop?.plan_name || "unknown",
      hasReadThemes,
      themeCount,
      message: hasReadThemes
        ? `Connexion OK — ${shopData.shop?.name} (${themeCount} themes)`
        : `Connexion OK mais scope read_themes manquant. Ajoutez-le dans le Dev Dashboard, faites Release, réinstallez l'app.`,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Test failed",
    });
  }
}
