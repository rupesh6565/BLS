# Advocate Website

Website for Advocate B. L. Sharma with a Vercel backend for consultation enquiries.

## What Is Included

- Static website files: `index.html`, `styles.css`, `script.js`
- Vercel API endpoint: `POST /api/enquiries`
- Admin-only enquiry list: `GET /api/enquiries` with `Authorization: Bearer <ADMIN_TOKEN>`
- Storage health endpoint: `GET /api/health`
- Postgres schema: `migrations/001_create_enquiries.sql`

## Edit These Details

- Replace `Advocate B. L. Sharma` with the final name if needed.
- Replace phone number `+91 00000 00000`.
- Replace email `advocate@example.com`.
- Replace office address text.
- Update the about section with enrollment number, education, court practice, and languages.

## Environment Variables

The backend uses Postgres when `DATABASE_URL` is configured. If Postgres is not configured, it can store enquiries in a private Vercel Blob store connected to the project through `BLOB_READ_WRITE_TOKEN`.

Set these in Vercel for Postgres:

```text
DATABASE_URL=postgres://user:password@host:5432/database?sslmode=require
ADMIN_TOKEN=use-a-long-random-secret
```

`POSTGRES_URL`, `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`, or `NEON_DATABASE_URL` also work if your Vercel Marketplace database provides those names.

For Vercel Blob storage, connect a private Blob store to the project. Vercel will inject `BLOB_READ_WRITE_TOKEN`.

## Local Development

Install dependencies and run tests:

```powershell
npm install
npm test
```

For Vercel-style local routing:

```powershell
npx vercel dev
```

## Deploy To Vercel

1. Create or import the project in Vercel.
2. Add a private Vercel Blob store or a Postgres database from Vercel Marketplace.
3. Add `ADMIN_TOKEN`.
4. Deploy the project.
5. Visit `/api/health` on the deployment URL to confirm storage is connected.

The `enquiries` table is created automatically on the first API call when Postgres is used.