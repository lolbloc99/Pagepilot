import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const code = searchParams.get("code");
    const shop = searchParams.get("shop");
    const state = searchParams.get("state");

    if (!code || !shop || !state) {
      return NextResponse.redirect(
        new URL("/shops?error=missing_params", req.url)
      );
    }

    const clientId = process.env.SHOPIFY_CLIENT_ID;
    const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        new URL("/shops?error=missing_config", req.url)
      );
    }

    // Exchange code for access token
    const tokenRes = await fetch(
      `https://${shop}/admin/oauth/access_token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
        }),
      }
    );

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("Token exchange failed:", errText);
      return NextResponse.redirect(
        new URL("/shops?error=token_exchange_failed", req.url)
      );
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // Fetch shop name
    let shopName = shop;
    try {
      const shopRes = await fetch(
        `https://${shop}/admin/api/2024-10/shop.json`,
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
      // Use domain as name fallback
    }

    // Redirect to shops page with token data encoded in URL fragment (stays client-side only)
    const shopData = encodeURIComponent(
      JSON.stringify({
        domain: shop,
        name: shopName,
        accessToken,
      })
    );

    return NextResponse.redirect(
      new URL(`/shops?connected=${shopData}`, req.url)
    );
  } catch (error) {
    console.error("Shopify callback error:", error);
    return NextResponse.redirect(
      new URL("/shops?error=callback_failed", req.url)
    );
  }
}
