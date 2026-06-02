# Deployment Notes

## Architecture

Primary Care Trees now supports a Django backend for provider search while keeping the current static shard fallback.

- Frontend: Next.js app at the repository root.
- Backend: Django API in `backend/`.
- Provider data: compact SQLite index at `backend/data/provider_index.sqlite`, generated from `trees_map.json`.
- Runtime switch: set `NEXT_PUBLIC_PROVIDER_API_BASE_URL` on the frontend to make the dashboard call Django.

If `NEXT_PUBLIC_PROVIDER_API_BASE_URL` is unset or the API is unavailable, the frontend falls back to matching providers from the static client-side shards.

## Provider Index

The Django API reads from `backend/data/provider_index.sqlite`. The SQLite file keeps the source dataset's dictionary encoding so it stays deployable while still supporting indexed queries.

Indexed lookup paths:

- `clinic_zipcode_id` for ZIP searches.
- `(lat, lng)` and `(lng, lat)` for map pin bounding-box searches.
- `medical_specialty_id` and `(clinic_zipcode_id, medical_specialty_id)` for specialty refinement.
- `provider_conditions(condition_key, provider_id)` for exact symptom matching from the dropdown-style condition set.
- `(star_doctor, care_rating)` for quality tie-breaks.

Rebuild the index after replacing the source JSON:

```bash
python backend/manage.py import_tree_map /path/to/trees_map.json --output backend/data/provider_index.sqlite
```

## Local Development

Run the Django API:

```bash
python backend/manage.py runserver 127.0.0.1:8000
```

Run the frontend:

```bash
NEXT_PUBLIC_PROVIDER_API_BASE_URL=http://127.0.0.1:8000 npm run dev -- -p 3001
```

Smoke-test the API:

```bash
curl "http://127.0.0.1:8000/api/providers/search?zip=11205&symptom=stress%20management&lat=40.70030&lng=-73.97120"
```

## Vercel Auto-Deploy Plan

Use two Git-connected Vercel projects or services from the same GitHub repository:

1. Frontend project
   - Repository: `jiaolyulu/primary-tree-provider`
   - Root directory: repository root
   - Framework preset: Next.js
   - Build command: `npm run build`
   - Production branch: `main`
   - Environment variable: `NEXT_PUBLIC_PROVIDER_API_BASE_URL=<django-service-url>`

2. Backend service
   - Repository: `jiaolyulu/primary-tree-provider`
   - Root directory: `backend`
   - Runtime: Python/Django
   - Install command: `pip install -r requirements.txt`
   - Production branch: `main`
   - Environment variables:
     - `DJANGO_SECRET_KEY`
     - `DJANGO_ALLOWED_HOSTS=<django-service-host>`
     - `DJANGO_DEBUG=false`

After both Vercel projects are imported from GitHub, Vercel automatically creates preview deployments for branch pushes and production deployments for pushes or merges to the production branch.

## Netlify Status

The current Netlify site is linked locally, but it is not Git-connected. Its most recent deployments were CLI deploys, not automatic Git deployments.
