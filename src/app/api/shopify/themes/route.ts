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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch themes" },
      { status: 500 }
    );
  }
}
