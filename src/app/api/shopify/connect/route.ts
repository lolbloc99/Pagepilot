import { NextRequest, NextResponse } from "next/server";
import { upsertShop } from "@/lib/db/shops";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { shop, clientId, clientSecret } = await req.json();

    if (!shop || !clientId || !clientSecret) {
      return NextResponse.json(
        { error: "shop domain, clientId, and clientSecret are required" },
        { status: 400 }
      );
    }

    const cleanShop = shop.replace(/^https?:\/\//, "").replace(/\/$/, "");

    // Get access token via client_credentials grant (Shopify 2025+ method)
    const tokenRes = await fetch(
      `https://${cleanShop}/admin/oauth/access_token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: clientId,
          client_secret: clientSecret,
        }),
      }
    );

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("Token request failed:", errText);
      return NextResponse.json(
        { error: `Shopify rejected the connection. Make sure the app is installed on this store. (${tokenRes.status})` },
        { status: 500 }
      );
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    const scopes = tokenData.scope || "";
    const expiresIn = tokenData.expires_in || 86399;

    // Fetch shop name
    let shopName = cleanShop;
    try {
      const shopRes = await fetch(
        `https://${cleanShop}/admin/api/2024-10/shop.json`,
        {
          headers: {
            "X-Shopify-Access-Token": accessToken,
            "Content-Type": "application/json",
          },
        }
      );
      if (shopRes.ok) {
        const shopData = await shopRes.json();
        shopName = shopData.shop.name;
      }
    } catch {
      // Use domain as fallback
    }

    // Save to MongoDB (credentials + token for auto-refresh)
    await upsertShop({
      shopId: crypto.randomUUID(),
      name: shopName,
      domain: cleanShop,
      clientId,
      clientSecret,
      accessToken,
      scopes,
      addedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      shopName,
      domain: cleanShop,
      expiresIn,
    });
  } catch (error) {
    console.error("Shopify connect error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Connection failed" },
      { status: 500 }
    );
  }
}
