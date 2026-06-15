# Testimonials Backend

The testimonial backend uses Neon Postgres through Next.js route handlers. Public submissions are saved as `pending`; the public read endpoint only returns `approved` testimonials.

## Environment

Set these in Vercel Project Settings -> Environment Variables:

```bash
DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require
TESTIMONIAL_ADMIN_TOKEN=replace-with-a-long-random-token
```

`DATABASE_URL` should be the pooled or serverless-safe Neon connection string.

## Endpoints

### Submit a testimonial

`POST /api/testimonials/submit`

```json
{
  "displayName": "Jon",
  "neighborhood": "Midwood",
  "zipCode": "11230",
  "providerId": 123456,
  "speciesCommon": "Littleleaf Linden",
  "symptom": "insomnia",
  "quote": "I sat under my linden after work and finally felt my shoulders drop.",
  "imageUrl": "",
  "consentGiven": true
}
```

Response:

```json
{
  "ok": true,
  "testimonial": {
    "id": "uuid",
    "status": "pending"
  }
}
```

### List approved testimonials

`GET /api/testimonials?limit=24`

Returns approved testimonials only.

### Admin list

`GET /api/admin/testimonials?status=pending&limit=50`

Use either:

```bash
Authorization: Bearer $TESTIMONIAL_ADMIN_TOKEN
```

or:

```bash
x-admin-token: $TESTIMONIAL_ADMIN_TOKEN
```

`status` can be `pending`, `approved`, `rejected`, or `all`.

### Approve or reject

`PATCH /api/admin/testimonials/:id`

```json
{
  "status": "approved",
  "reviewerNote": "Clear consent, good story."
}
```

Use `"rejected"` for rejected submissions.

## Schema

The app creates the table and indexes automatically on first use, but the schema is:

```sql
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
);

CREATE INDEX IF NOT EXISTS testimonials_status_created_at_idx
  ON testimonials (status, created_at DESC);

CREATE INDEX IF NOT EXISTS testimonials_provider_id_idx
  ON testimonials (provider_id);
```

## Moderation Notes

Do not publish testimonials automatically. Keep submissions speculative and experiential; avoid collecting detailed medical history, phone numbers, full addresses, date of birth, insurance details, or actual treatment claims.
