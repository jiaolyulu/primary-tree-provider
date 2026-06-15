import { NextResponse } from "next/server";
import { createTestimonialSubmission, parseSubmission, testimonialErrorStatus } from "@/lib/testimonials";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Please submit valid testimonial details." }, { status: 400 });
  }

  const { data, error } = parseSubmission(payload);
  if (!data) {
    return NextResponse.json({ error }, { status: 400 });
  }

  try {
    const testimonial = await createTestimonialSubmission(data);
    return NextResponse.json(
      {
        ok: true,
        testimonial: {
          id: testimonial.id,
          status: testimonial.status,
        },
      },
      { status: 201 },
    );
  } catch (submissionError) {
    return NextResponse.json(
      { error: "We could not save the testimonial right now. Please try again." },
      { status: testimonialErrorStatus(submissionError) },
    );
  }
}
