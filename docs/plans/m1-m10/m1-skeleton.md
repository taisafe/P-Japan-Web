# Plan M1: Project Skeleton & Persistence

## Goal Description
Initialize the Japan Politics Daily Brief Web project with a robust "Editorial" style UI, SQLite persistence, and a single-process container architecture.

## Technical Specifications
- **Framework**: Next.js 14+ (App Router)
- **Database**: SQLite (better-sqlite3) with Drizzle ORM
- **Styling**: Tailwind CSS + Shadcn UI + Newsreader Serif Font
- **Architecture**: Internal API background processing (no external worker queue)
- **Persistence**: Database file at `/data/japan-politics.db` (for Docker volume mounting)

## Proposed Changes
### Project Setup
- [NEW] Initialize Next.js project with TypeScript and Tailwind.
- [NEW] Config `next.config.js` for standalone output.
- [NEW] Setup Lucide-react icons and Newsreader font.

### Data Layer
- [NEW] Setup Drizzle ORM and `drizzle.config.ts`.
- [NEW] Create `src/lib/db` with `better-sqlite3` instance.
- [NEW] Define initial schemas: `sources`, `articles`, `fetch_runs`.

### Docker Architecture
- [NEW] `Dockerfile` (Multi-stage build).
- [NEW] `docker-compose.yml` with `/data` volume mount.

### Base UI
- [NEW] Implement a standard Dashboard layout with navigation.
- [NEW] Dark/Light mode support with `next-themes`.
- [NEW] Health check page showing DB connectivity.

## Verification Plan
- Build standalone Docker image: `docker build -t jp-politics .`
- Verify DB file is created in mounted volume.
- Check font rendering and dark mode toggle.
