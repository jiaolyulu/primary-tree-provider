import { neon } from "@neondatabase/serverless";
import { randomUUID } from "node:crypto";

export type TestimonialStatus = "pending" | "approved" | "rejected";

export type Testimonial = {
  id: string;
  displayName: string;
  neighborhood: string;
  zipCode: string;
  providerId: number | null;
  speciesCommon: string;
  symptom: string;
  quote: string;
  imageUrl: string;
  status: TestimonialStatus;
  reviewerNote: string;
  createdAt: string;
  updatedAt: string;
  approvedAt: string | null;
};

type TestimonialRow = {
  id: string;
  display_name: string;
  neighborhood: string | null;
  zip_code: string | null;
  provider_id: number | null;
  species_common: string;
  symptom: string;
  quote: string;
  image_url: string | null;
  status: TestimonialStatus;
  reviewer_note: string | null;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
};

export type TestimonialSubmission = {
  displayName: string;
  neighborhood?: string;
  zipCode?: string;
  providerId?: number | null;
  speciesCommon: string;
  symptom: string;
  quote: string;
  imageUrl?: string;
  consentGiven: boolean;
};

export type TestimonialAdminUpdate = {
  status: TestimonialStatus;
  reviewerNote?: string;
};

const MAX_LIMIT = 100;
const MIN_QUOTE_LENGTH = 20;

function sql() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }
  return neon(databaseUrl);
}

function trimString(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function optionalString(value: unknown, maxLength: number) {
  return trimString(value, maxLength);
}

function optionalProviderId(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  return Number.isInteger(numeric) && numeric > 0 ? numeric : null;
}

function normalizeStatus(value: unknown): TestimonialStatus | null {
  if (value === "pending" || value === "approved" || value === "rejected") return value;
  return null;
}

export function parseSubmission(payload: unknown): { data?: TestimonialSubmission; error?: string } {
  if (!payload || typeof payload !== "object") {
    return { error: "Please fill out the testimonial form." };
  }

  const body = payload as Record<string, unknown>;
  const data: TestimonialSubmission = {
    displayName: trimString(body.displayName, 80),
    neighborhood: optionalString(body.neighborhood, 80),
    zipCode: optionalString(body.zipCode, 12),
    providerId: optionalProviderId(body.providerId),
    speciesCommon: trimString(body.speciesCommon, 100),
    symptom: trimString(body.symptom, 80),
    quote: trimString(body.quote, 1000),
    imageUrl: optionalString(body.imageUrl, 600),
    consentGiven: body.consentGiven === true,
  };

  if (!data.consentGiven) return { error: "Please confirm we can review and publish your testimonial." };
  if (!data.displayName) return { error: "Please add a display name." };
  if (!data.speciesCommon) return { error: "Please choose a tree provider species." };
  if (!data.symptom) return { error: "Please choose a symptom." };
  if (data.quote.length < MIN_QUOTE_LENGTH) return { error: "Please add a little more detail to the testimonial." };

  return { data };
}

export function parseAdminUpdate(payload: unknown): { data?: TestimonialAdminUpdate; error?: string } {
  if (!payload || typeof payload !== "object") {
    return { error: "Please provide a moderation action." };
  }
  const body = payload as Record<string, unknown>;
  const status = normalizeStatus(body.status);
  if (!status || status === "pending") {
    return { error: "Status must be approved or rejected." };
  }
  return {
    data: {
      status,
      reviewerNote: optionalString(body.reviewerNote, 500),
    },
  };
}

export function isAdminRequest(request: Request) {
  const configuredToken = process.env.TESTIMONIAL_ADMIN_TOKEN;
  if (!configuredToken) return false;
  const authHeader = request.headers.get("authorization") ?? "";
  const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length).trim() : "";
  const headerToken = request.headers.get("x-admin-token") ?? "";
  return bearerToken === configuredToken || headerToken === configuredToken;
}

export function testimonialErrorStatus(error: unknown) {
  return error instanceof Error && error.message.includes("DATABASE_URL") ? 503 : 500;
}

function toTestimonial(row: TestimonialRow): Testimonial {
  return {
    id: row.id,
    displayName: row.display_name,
    neighborhood: row.neighborhood ?? "",
    zipCode: row.zip_code ?? "",
    providerId: row.provider_id,
    speciesCommon: row.species_common,
    symptom: row.symptom,
    quote: row.quote,
    imageUrl: row.image_url ?? "",
    status: row.status,
    reviewerNote: row.reviewer_note ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    approvedAt: row.approved_at,
  };
}

export async function ensureTestimonialsTable() {
  const query = sql();
  await query`
    CREATE TABLE IF NOT EXISTS testimonials (
      id uuid PRIMARY KEY,
      display_name text NOT NULL,
      neighborhood text DEFAULT '',
      zip_code text DEFAULT '',
      provider_id bigint,
      species_common text NOT NULL,
      symptom text NOT NULL,
      quote text NOT NULL,
      image_url text DEFAULT '',
      consent_given boolean NOT NULL DEFAULT false,
      status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
      reviewer_note text DEFAULT '',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      approved_at timestamptz
    )
  `;
  await query`CREATE INDEX IF NOT EXISTS testimonials_status_created_at_idx ON testimonials (status, created_at DESC)`;
  await query`CREATE INDEX IF NOT EXISTS testimonials_provider_id_idx ON testimonials (provider_id)`;
}

export async function createTestimonialSubmission(data: TestimonialSubmission) {
  await ensureTestimonialsTable();
  const query = sql();
  const id = randomUUID();
  const rows = await query`
    INSERT INTO testimonials (
      id,
      display_name,
      neighborhood,
      zip_code,
      provider_id,
      species_common,
      symptom,
      quote,
      image_url,
      consent_given
    )
    VALUES (
      ${id},
      ${data.displayName},
      ${data.neighborhood ?? ""},
      ${data.zipCode ?? ""},
      ${data.providerId ?? null},
      ${data.speciesCommon},
      ${data.symptom},
      ${data.quote},
      ${data.imageUrl ?? ""},
      ${data.consentGiven}
    )
    RETURNING *
  `;
  return toTestimonial(rows[0] as TestimonialRow);
}

export async function listApprovedTestimonials(limit: number) {
  await ensureTestimonialsTable();
  const query = sql();
  const safeLimit = Math.min(MAX_LIMIT, Math.max(1, Math.floor(limit)));
  const rows = await query`
    SELECT *
    FROM testimonials
    WHERE status = 'approved'
    ORDER BY approved_at DESC NULLS LAST, created_at DESC
    LIMIT ${safeLimit}
  `;
  return rows.map((row) => toTestimonial(row as TestimonialRow));
}

export async function listAdminTestimonials(status: TestimonialStatus | "all", limit: number) {
  await ensureTestimonialsTable();
  const query = sql();
  const safeLimit = Math.min(MAX_LIMIT, Math.max(1, Math.floor(limit)));
  const rows =
    status === "all"
      ? await query`
          SELECT *
          FROM testimonials
          ORDER BY created_at DESC
          LIMIT ${safeLimit}
        `
      : await query`
          SELECT *
          FROM testimonials
          WHERE status = ${status}
          ORDER BY created_at DESC
          LIMIT ${safeLimit}
        `;
  return rows.map((row) => toTestimonial(row as TestimonialRow));
}

export async function updateTestimonialStatus(id: string, data: TestimonialAdminUpdate) {
  await ensureTestimonialsTable();
  const query = sql();
  const rows = await query`
    UPDATE testimonials
    SET
      status = ${data.status},
      reviewer_note = ${data.reviewerNote ?? ""},
      approved_at = CASE WHEN ${data.status} = 'approved' THEN now() ELSE NULL END,
      updated_at = now()
    WHERE id = ${id}
    RETURNING *
  `;
  return rows[0] ? toTestimonial(rows[0] as TestimonialRow) : null;
}
