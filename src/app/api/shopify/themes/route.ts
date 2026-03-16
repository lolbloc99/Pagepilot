import { NextRequest, NextResponse } from "next/server";
import { listThemes } from "@/lib/shopify/admin";

export async function POST(req: NextRequest) {
  try {
    const { domain, accessToken } = await req.json();

    if (!domain || !accessToken) {
      return NextResponse.json(
        { error: "domain and accessToken are required" },
        { status: 400 }
      );
    }

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
