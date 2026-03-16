import { NextRequest, NextResponse } from "next/server";
import { getAllShops, removeShopByDomain } from "@/lib/db/shops";

export async function GET() {
  try {
    const shops = await getAllShops();
    // Don't expose full access tokens to the client
    const safeShops = shops.map((s) => ({
      shopId: s.shopId,
      name: s.name,
      domain: s.domain,
      addedAt: s.addedAt,
      hasToken: !!s.accessToken,
    }));
    return NextResponse.json({ shops: safeShops });
  } catch (error) {
    console.error("List shops error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list shops" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { domain } = await req.json();
    if (!domain) {
      return NextResponse.json({ error: "domain is required" }, { status: 400 });
    }
    await removeShopByDomain(domain);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete shop error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete shop" },
      { status: 500 }
    );
  }
}
