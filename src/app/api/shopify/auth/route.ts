import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { shop } = await req.json();

    if (!shop) {
      return NextResponse.json({ error: "shop is required" }, { status: 400 });
    }

    const clientId = process.env.SHOPIFY_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json(
        { error: "SHOPIFY_CLIENT_ID not set in .env.local" },
        { status: 500 }
      );
    }

    const cleanShop = shop.replace(/^https?:\/\//, "").replace(/\/$/, "");

    // Generate a random nonce for CSRF protection
    const nonce = crypto.randomBytes(16).toString("hex");

    const scopes = "read_themes,write_themes";
    const redirectUri = `${req.nextUrl.origin}/api/shopify/callback`;

    const authUrl =
      `https://${cleanShop}/admin/oauth/authorize?` +
      `client_id=${clientId}` +
      `&scope=${scopes}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${nonce}`;

    return NextResponse.json({ authUrl, nonce, shop: cleanShop });
  } catch (error) {
    console.error("Shopify auth error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Auth failed" },
      { status: 500 }
    );
  }
}
