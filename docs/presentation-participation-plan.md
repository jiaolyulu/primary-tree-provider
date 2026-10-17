# Presentation participation: Trees we know

Original planning notes; the shipped first version is documented in `presentation-setup.md`. The final questionnaire requires only tree and city, makes story/name optional, removes the place question, and uses a public-display submit notice. Advanced presenter management remains future work.

## Audience experience

The presenter opens `/participate/[session]/wall`. A persistent QR code and readable short link point to `/participate/[session]`. Audience members submit a phone-friendly form without an account. Each response becomes a tree-story card on the shared wall. A session isolates each presentation so rehearsals and previous events do not mix with the audience's responses.

Opening prompt: **What tree do you recognize in your city?**

Form fields:

- **What tree is it?** Required free text; explicitly allow “I don’t know its name.” A species dropdown alone would exclude many participants.
- **What city is it in?** Required free text, with a country/region hint for ambiguous city names.
- **Where would we find it?** Optional park, neighborhood, street corner, or landmark. Do not require a home address or GPS permission.
- **What should we know about this tree?** Required short story, up to 500 characters. Hint: “How do you recognize it? What makes it memorable? Who spends time near it?”
- **Your name or nickname.** Optional; otherwise show “Anonymous.”
- **Permission to display.** Required checkbox explaining that the response appears on the public presentation wall.

After success, show a confirmation and a deliberate “Add another tree” action. Retain typed text after network errors. Disable the submit button while sending, and use a submission UUID to prevent duplicate records on retry.

## Projector experience

- Large heading, QR code, readable participation URL, and response count.
- Spacious cards with tree name, city/place, story, and optional contributor name.
- New cards enter at the top with a brief highlight; respect reduced-motion settings.
- Fetch updates every 3 seconds while visible. Keep existing cards during temporary outages, show connection status, and retry with backoff.
- Paginate older responses so every answer remains accessible, rather than silently limiting the wall to the newest results.
- Presenter can pause the on-screen updates while discussing a response; submissions continue to save. Resume retrieves missed responses.
- Fullscreen control and a useful empty state: “Be the first to introduce a tree.”
- Avoid auto-geocoding in the first version: city/place text is enough to participate. A map can follow after deciding how locations will be verified.

## Implementation in this repository

Reuse the existing Next.js App Router, Neon Postgres connection (`DATABASE_URL`), and `qrcode` package. Keep the Django provider lookup unchanged; audience trees can be anywhere, not only in the NYC provider dataset.

Add separate `participation_sessions` and `tree_responses` tables. Do not reuse testimonials: those require symptoms and moderation and have a different purpose.

Proposed session fields: UUID, unique public slug, title, open/closed state, publication mode (`immediate` or `review`), creation time.

Proposed response fields: UUID, session UUID, unique per-session submission UUID, tree name, city, place, story, display name, consent, status (`pending`, `published`, `hidden`), creation time. Index session/status/creation time for wall pagination.

Proposed routes:

- `/participate/[session]`: mobile form.
- `/participate/[session]/wall`: public presentation wall with QR code.
- `/participate/manage`: authenticated presenter controls.
- `POST /api/participation/[session]/responses`: validate and save.
- `GET /api/participation/[session]/responses`: published responses only, with cursor pagination and no shared stale cache.
- Protected management endpoints: create/open/close session, approve/hide responses.

Server validation must enforce field lengths, consent, existing/open session, allowed publication states, and bounded request size. Use parameterized SQL and render responses as plain React text. Apply durable per-session submission limits; do not rely on per-process memory for serverless rate limiting. The server decides publication status, never the audience request.

Use a server-only presenter credential and a protected session cookie for management. Never put administrative credentials in the QR code, public URL, or client bundle. QR URLs must derive from the configured public origin/current deployed origin, not a hard-coded localhost address.

## Decisions to confirm

1. Immediate publication versus presenter approval. The requested live experience suggests immediate publication; offer a hide control either way. Existing testimonial moderation remains unchanged.
2. Presentation date, expected audience size, and whether participation remains open afterward.
3. Confirm the public deployment. Existing deployment documentation lists `https://primary-tree-provider.vercel.app`; its current status and database configuration have not yet been verified.

## Delivery sequence

1. Build the responsive form and wall with an explicit, isolated demo mode for rehearsal.
2. Add database migration, submission/list APIs, validation, retry deduplication, and session isolation.
3. Add presenter controls and the selected publication mode.
4. Check production database configuration and deploy a preview for phone/projector rehearsal.
5. Deploy the approved version, create the real session, and export its QR code for the slide deck.

## Acceptance checks

- A submission on a phone appears on a different device within about 3–5 seconds in immediate mode.
- Review mode keeps pending responses private until approved; hidden responses disappear from the public wall.
- Reloading preserves data; two sessions cannot see each other's responses.
- Retry after a lost response does not create duplicates.
- Closed or nonexistent sessions reject submissions with clear messages.
- Invalid input and missing consent are rejected server-side; unauthorized management requests fail.
- Slow/offline connections preserve form text and previously loaded wall content.
- QR code scans from the actual presentation slide and resolves to the public mobile form.
- Long stories, unknown species, anonymous entries, keyboard navigation, and reduced motion work.
- Rehearsal data is isolated from the real session; test with the expected audience volume before the event.

## Current state

This document records the original plan; see `presentation-setup.md` for the implemented first version. The local project has been connected to `https://github.com/jiaolyulu/primary-tree-provider.git`, and `main` tracks `origin/main`.
