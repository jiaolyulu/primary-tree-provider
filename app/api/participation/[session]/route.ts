import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import { parseTreeSubmission } from "@/lib/participation-validation";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ session: string }> };
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
function database() {
  if (!process.env.DATABASE_URL) throw new Error("unconfigured");
  return neon(process.env.DATABASE_URL);
}
async function getSession(slug: string) {
  if (!/^[a-z0-9-]{1,64}$/.test(slug)) return null;
  const sql = database();
  const rows = await sql`SELECT slug, title, is_open FROM participation_sessions WHERE slug = ${slug}`;
  return rows[0] ?? null;
}
export async function GET(request: Request, context: Context) {
  try {
    const { session } = await context.params;
    const info = await getSession(session);
    if (!info) return json({ error: "This presentation does not exist." }, 404);
    const params = new URL(request.url).searchParams;
    const page = Number(params.get("page") ?? 0);
    if (!Number.isSafeInteger(page) || page < 0 || page > 10000) return json({ error: "Invalid page." }, 400);
    const sql = database();
    const rows = await sql`SELECT id, tree, city, place, story, name FROM tree_responses
      WHERE session_slug = ${session} AND hidden = false ORDER BY created_at DESC, id DESC LIMIT 30 OFFSET ${page * 30}`;
    const count = await sql`SELECT count(*)::int AS total FROM tree_responses WHERE session_slug = ${session} AND hidden = false`;
    return json({ title: info.title, open: info.is_open, answers: rows, total: count[0].total });
  } catch {
    return json({ error: "The response database is unavailable. Please try again shortly." }, 503);
  }
}
export async function POST(request: Request, context: Context) {
  let data;
  try {
    // Bound the stream too: Content-Length may be absent or inaccurate.
    const reader = request.body?.getReader();
    if (!reader) return json({ error: "Please complete the questionnaire." }, 400);
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 8192) { await reader.cancel(); return json({ error: "This response is too large." }, 413); }
      chunks.push(value);
    }
    data = parseTreeSubmission(JSON.parse(Buffer.concat(chunks).toString("utf8")));
  } catch (error) {
    return json({ error: error instanceof SyntaxError ? "Invalid response format." : error instanceof Error ? error.message : "Invalid response." }, 400);
  }
  try {
    const { session } = await context.params;
    const info = await getSession(session);
    if (!info) return json({ error: "This presentation does not exist." }, 404);
    const sql = database();
    const existing = await sql`SELECT id FROM tree_responses WHERE session_slug = ${session} AND id = ${data.id}`;
    if (existing.length) return json({ ok: true });
    if (!info.is_open) return json({ error: "Submissions for this presentation are closed." }, 403);
    const budget = await sql`INSERT INTO participation_rate_limits (session_slug, bucket, count)
      VALUES (${session}, date_trunc('minute', now()), 1)
      ON CONFLICT (session_slug) DO UPDATE SET bucket = EXCLUDED.bucket,
        count = CASE WHEN participation_rate_limits.bucket = EXCLUDED.bucket THEN participation_rate_limits.count + 1 ELSE 1 END
      RETURNING count`;
    if (budget[0].count > 120) return json({ error: "Lots of trees are arriving! Please try again in one minute." }, 429);
    await sql`INSERT INTO tree_responses (id, session_slug, tree, city, place, story, name, consent)
      SELECT ${data.id}, slug, ${data.tree}, ${data.city}, ${data.place}, ${data.story}, ${data.name}, true
      FROM participation_sessions WHERE slug = ${session} AND is_open = true
      ON CONFLICT DO NOTHING`;
    const saved = await sql`SELECT id FROM tree_responses WHERE session_slug = ${session} AND id = ${data.id}`;
    if (!saved.length) return json({ error: "Submissions for this presentation are closed." }, 403);
    return json({ ok: true }, 201);
  } catch {
    return json({ error: "Your response could not be saved. Your text is still here; please try again." }, 503);
  }
}
