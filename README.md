# Resonance — Music Library

A full-stack music library app: search the iTunes catalog, save albums, rate them, and explore your listening trends on an analytics dashboard.

- **Backend**: Spring Boot 3.4.4 (Java 21, Gradle) + PostgreSQL 16 + JWT auth
- **Frontend**: Next.js 16 (App Router, TypeScript, Tailwind CSS v4) + Chart.js
- **Live app**: [https://resonance-music-library.vercel.app](https://resonance-music-library.vercel.app) (to be deployed)
- **API base**: `https://music-library-backend.onrender.com/api` (to be deployed)

---

## Features

- Register / login with JWT (token stored in localStorage)
- Debounced album search against the iTunes Search API (proxied by the backend)
- Personal library: add, edit rating (1–5) and notes, delete
- Analytics dashboard with 5 charts: albums per genre, rating distribution, library growth over time, top artists, releases by decade
- AI-style trend summary generated from your library stats (rule-based, no external API key required)

## Architecture

```
music-library/
├── backend/   (this repository root — Spring Boot application)
│   ├── src/main/java/com/ledger/music_library/
│   │   ├── controller/   # REST controllers (auth, library, search, insights)
│   │   ├── service/      # business logic (albums, insights)
│   │   ├── security/     # JWT filter, config, user details
│   │   ├── repository/   # Spring Data JPA
│   │   ├── entity/       # User, Album
│   │   ├── dto/          # request/response objects with validation
│   │   └── exception/    # typed errors + global handler
│   └── build.gradle
└── frontend/   (Next.js application)
    ├── src/app/          # login, register, search, library, dashboard
    ├── src/components/   # navbar, cards, modals, charts
    └── src/lib/          # API client, auth context, types
```

## Entity Model

**User** (`users`) — id, email (unique), password (bcrypt), timestamps.

**Album** (`albums`) — id, user_id (FK), apple_catalog_id, title, artist_name, genre, release_date, track_count, artwork_url, user_rating (1–5, nullable), user_notes, created_at, updated_at.

Unique constraint on `(user_id, apple_catalog_id)` — the same album can only be saved once per user.

## API

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Create account, returns JWT |
| POST | `/api/auth/login` | No | Login, returns JWT |
| GET | `/api/search?term=&entity=&limit=` | No | iTunes catalog proxy |
| GET | `/api/library` | Yes | List my albums |
| POST | `/api/library` | Yes | Save an album |
| PUT | `/api/library/{id}` | Yes | Update rating/notes |
| DELETE | `/api/library/{id}` | Yes | Remove album |
| GET | `/api/insights/summary` | Yes | Library stats + trend summary |
| GET | `/actuator/health` | No | Health check |

Errors are returned in a consistent envelope: `{"error": "CONFLICT", "status": 409, "detail": "Email already in use"}`.

## Running Locally

### Prerequisites

- JDK 21, Docker (for PostgreSQL)
- Node.js 20.9+ and npm

### Backend

```bash
# 1. Start PostgreSQL
docker run --name music-library-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=music_library -p 5432:5432 -d postgres:16

# 2. Run (from repo root)
./gradlew bootRun
```

Environment variables (optional — defaults shown):

```
DB_URL=jdbc:postgresql://localhost:5432/music_library
DB_USERNAME=postgres
DB_PASSWORD=postgres
JWT_SECRET=<any long secret>
JWT_EXPIRATION=86400000
ALLOWED_ORIGINS=http://localhost:3000
```

> Note: run the JVM with `-Duser.timezone=UTC` if your local timezone is not recognized by the Postgres container.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local   # sets NEXT_PUBLIC_API_URL=http://localhost:8080/api
npm run dev
```

Open http://localhost:3000, register, and search for albums.

## AI Feature

`GET /api/insights/summary` computes stats from your library (top genre, average rating, most-collected artist, dominant release decade) and generates a short, human-readable trend summary.

**Design choice:** the summary is generated **rule-based** in `InsightsService` rather than calling OpenAI. Rationale: zero cost, no API key, works offline, deterministic output. The endpoint returns the same shape it would with an LLM, so swapping in OpenAI later only changes the `buildSummary` method (a `RestTemplate`/`WebClient` call to `/v1/chat/completions`).

## Trade-offs

| Decision | Trade-off |
|----------|-----------|
| JWT in localStorage | Simple and works everywhere, but vulnerable to XSS; HttpOnly cookies would be more secure at the cost of complexity |
| PostgreSQL vs MongoDB | Relational fits the user→albums ownership model and unique constraints; SQL joins are natural |
| iTunes Search API (proxy) | Free, no key required; but artwork/schema tied to Apple's catalog |
| Rule-based summary vs OpenAI | No cost/keys, deterministic; less creative than an LLM would be |
| No caching | Library is per-user and small; adds complexity with little benefit at this scale |
| Single repo (backend + frontend via git subtree) | One clone to run the whole project; subtree history is squashed |

## Deployment

- **Backend**: Render (Web Service) — set the env vars above (DB_URL, JWT_SECRET, ALLOWED_ORIGINS), build command `./gradlew bootJar`, start command `java -jar build/libs/music-library-0.0.1-SNAPSHOT.jar`. Use a managed PostgreSQL instance. For a Render PostgreSQL database, set `DB_URL` to the internal URL prefixed with `jdbc:` and also set `DB_USERNAME`/`DB_PASSWORD` from the Render database dashboard (the URL-embedded credentials are ignored when the separate env vars are set). Note: `ddl-auto=update` creates tables automatically on first boot.
- **Frontend**: Vercel — framework Next.js, root directory `frontend`, env `NEXT_PUBLIC_API_URL` pointing at the Render URL. Add the Vercel URL to `ALLOWED_ORIGINS` on the backend.
