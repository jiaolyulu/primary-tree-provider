import { NextResponse } from "next/server";
import { listApprovedTestimonials, testimonialErrorStatus } from "@/lib/testimonials";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? "24");

  try {
    const testimonials = await listApprovedTestimonials(Number.isFinite(limit) ? limit : 24);
    return NextResponse.json(
      { testimonials },
      {
        headers: {
          "Cache-Control": "public, max-age=60, s-maxage=300",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Testimonials are not available right now." },
      { status: testimonialErrorStatus(error) },
    );
  }
}
