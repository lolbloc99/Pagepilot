import { NextRequest, NextResponse } from "next/server";
import { listThemes } from "@/lib/shopify/admin";
import { getShopByDomain } from "@/lib/db/shops";

export async function POST(req: NextRequest) {
  try {
    const { domain } = await req.json();

    if (!domain) {
      return NextResponse.json(
        { error: "domain is required" },
        { status: 400 }
      );
    }

    const shop = await getShopByDomain(domain);
    if (!shop) {
      return NextResponse.json(
        { error: "Shop not connected" },
        { status: 404 }
      );
    }

    const themes = await listThemes(shop.domain, shop.accessToken);
    return NextResponse.json({ themes });
  } catch (error) {
    console.error("Shopify themes error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch themes" },
      { status: 500 }
    );
  }
}
