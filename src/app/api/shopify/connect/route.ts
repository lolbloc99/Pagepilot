import { NextRequest, NextResponse } from "next/server";
import { getShopInfo, listThemes } from "@/lib/shopify/admin";

export async function POST(req: NextRequest) {
  try {
    const { domain, accessToken } = await req.json();

    if (!domain || !accessToken) {
      return NextResponse.json(
        { error: "domain and accessToken are required" },
        { status: 400 }
      );
    }

    // Test the connection by fetching shop info + themes
    const [shop, themes] = await Promise.all([
      getShopInfo(domain, accessToken),
      listThemes(domain, accessToken),
    ]);

    return NextResponse.json({
      success: true,
      shopName: shop.name,
      themes,
    });
  } catch (error) {
    console.error("Shopify connect error:", error);
    const msg = error instanceof Error ? error.message : "Connection failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
