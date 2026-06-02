# Deployment Notes

## Architecture

Primary Care Trees now supports a Django backend for provider search while keeping the current static shard fallback.

- Frontend: Next.js app at the repository root.
- Backend: Django API in `backend/`.
- Provider data: generated static shards in `public/provider-index/`.
- Runtime switch: set `NEXT_PUBLIC_PROVIDER_API_BASE_URL` on the frontend to make the dashboard call Django.

If `NEXT_PUBLIC_PROVIDER_API_BASE_URL` is unset or the API is unavailable, the frontend falls back to matching providers from the static client-side shards.

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
