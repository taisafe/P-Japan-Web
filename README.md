# Japan Politics Daily Brief Web

A self-hosted web application that aggregates Japanese political news, scores significance, and generates daily briefings using AI.

## Features

- **Automated Aggregation**: Fetches news from RSS feeds (Mainstream JP Media).
- **Event Clustering**: Groups related articles into "Events".
- **Heat Scoring**: Calculaties significance scores based on source weight and time decay.
- **AI Integration**: Auto-generates summary briefings and provides Chinese translations.
- **Single-Container Deployment**: Web server and scheduler in one Docker container.

## Getting Started

### Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000).

### Docker Deployment

The application is designed to run as a single Docker container which handles both the web server and background tasks (via Supervisord).

#### Build

```bash
docker build -t p-japan-web .
```

#### Run

```bash
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/data:/data \
  -e CRON_SECRET="your-secure-secret-here" \
  -e INTERNAL_API_URL="http://127.0.0.1:3000" \
  --name japan-politics \
  p-japan-web
```

#### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CRON_SCHEDULE` | Cron expression for daily tasks | `0 8 * * *` (8:00 AM) |
| `CRON_SECRET` | Secret key for protecting internal Cron API | (Required) |
| `DATABASE_URL` | Path to SQLite DB | `/data/japan-politics.db` |
| `INTERNAL_API_URL` | URL for the worker to reach the API | `http://127.0.0.1:3000` |

#### Volume Persistence

Mount a volume to `/data` to persist the SQLite database.

## Architecture

- **Frontend/Backend**: Next.js (App Router)
- **Database**: SQLite (via Drizzle ORM)
- **Process Manager**: Supervisord (manages Next.js + Cron Worker)
- **Scheduler**: Node-cron script invoking internal API endpoints.

## License

Private.
