import { randomInt } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const stories = ["cherry", "london-planetree", "wall-street"] as const;

export function GET(request: NextRequest) {
  const story = stories[randomInt(stories.length)];
  const response = NextResponse.redirect(new URL(`/celebritree/${story}`, request.url));
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}
