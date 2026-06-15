import { NextResponse } from "next/server";
import { isAdminRequest, parseAdminUpdate, testimonialErrorStatus, updateTestimonialStatus } from "@/lib/testimonials";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Please submit a valid moderation action." }, { status: 400 });
  }

  const { data, error } = parseAdminUpdate(payload);
  if (!data) {
    return NextResponse.json({ error }, { status: 400 });
  }

  try {
    const testimonial = await updateTestimonialStatus(id, data);
    if (!testimonial) {
      return NextResponse.json({ error: "Testimonial not found." }, { status: 404 });
    }
    return NextResponse.json({ testimonial });
  } catch (updateError) {
    return NextResponse.json(
      { error: "We could not update the testimonial right now." },
      { status: testimonialErrorStatus(updateError) },
    );
  }
}
