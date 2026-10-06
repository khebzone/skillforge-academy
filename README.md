# Skillforge Academy

A single-instructor course platform for corporates and universities.
React + TypeScript + Vite + Tailwind CSS v4, with a swappable API layer.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build
```

### Demo accounts

| Role    | Email                        | Password     |
| ------- | ---------------------------- | ------------ |
| Admin   | admin@skillforge.example     | admin123     |
| Learner | priya.nair@acme.example      | learner123   |

"Reset demo data" is on the login page.

## What's in it

- **Public site** – home page, course catalog, course detail with curriculum, "Request this course" form for organizations.
- **Admin (you)** – dashboard, course builder (modules → video / PDF / PPT lessons, upload or link, publish checks), organizations, bulk enrollment from CSV, enrollments with progress and CSV export, learners, course requests.
- **Learner** – sees only enrolled courses, video / PDF / slides viewer, resume position, mark complete, progress, printable certificate.

## Data layer (no backend yet)

All screens talk to the `Api` interface in `src/api/types.ts`.
Right now it is implemented by `src/api/mock.ts` (browser localStorage + IndexedDB for uploaded files), so everything is demo-able offline.

To connect a real backend (FastAPI / Spring Boot / anything):

1. Create `src/api/http.ts` that implements `Api` using `fetch`.
2. Change one line in `src/api/index.ts` to export it.

No page needs to change. Things the real backend must own:

- **Auth**: hash passwords, issue sessions/JWT, enforce roles. Today's checks (`requireAdmin`, route guards) are UI-level only.
- **Authorization**: a learner may only read courses they are enrolled in, and only their own progress.
- **File storage**: store uploads in S3 / R2 and serve video via signed URLs or a video service (Mux, Cloudflare Stream, Bunny). `api.files.upload` / `urlFor` are the seam.
- **PPT**: browsers cannot render `.pptx`. Convert to PDF on upload (LibreOffice) and set `previewFileKey`; until then admins attach a PDF version in the lesson dialog.
- **Bulk enroll**: `enrollments.importBulk` creates accounts, generates temporary passwords and should send invitation emails.
