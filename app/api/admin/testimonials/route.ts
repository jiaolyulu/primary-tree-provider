import { NextResponse } from "next/server";
import { isAdminRequest, listAdminTestimonials, testimonialErrorStatus } from "@/lib/testimonials";
import type { TestimonialStatus } from "@/lib/testimonials";

export const runtime = "nodejs";

function requestedStatus(value: string | null): TestimonialStatus | "all" {
  if (value === "approved" || value === "rejected" || value === "all") return value;
  return "pending";
}

export async function GET(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? "50");
  const status = requestedStatus(url.searchParams.get("status"));

  try {
    const testimonials = await listAdminTestimonials(status, Number.isFinite(limit) ? limit : 50);
    return NextResponse.json({ testimonials });
  } catch (error) {
    return NextResponse.json(
      { error: "Testimonials are not available right now." },
      { status: testimonialErrorStatus(error) },
    );
  }
}
