import { NextRequest, NextResponse } from "next/server";
import { listThemes } from "@/lib/shopify/admin";
import { getValidToken } from "@/lib/shopify/token";

export async function POST(req: NextRequest) {
  try {
    const { domain } = await req.json();

    if (!domain) {
      return NextResponse.json(
        { error: "domain is required" },
        { status: 400 }
      );
    }

    const accessToken = await getValidToken(domain);
    const themes = await listThemes(domain, accessToken);
    return NextResponse.json({ themes });
  } catch (error) {
    console.error("Shopify themes error:", error);
    const msg = error instanceof Error ? error.message : "Failed to fetch themes";
    // Detect scope issues
    if (msg.includes("403") || msg.includes("approval") || msg.includes("scope")) {
      return NextResponse.json(
        { error: "Scope manquant: read_themes. Dans Shopify Partners > App > Configuration, ajoutez les scopes read_themes et write_themes, puis reinstallez l'app sur la boutique et reconnectez-la dans PagePilot." },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}
