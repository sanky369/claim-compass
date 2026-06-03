import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "claimcompass-web",
    checked_at: new Date().toISOString(),
  });
}
