# Install dependencies only when needed
FROM node:20-alpine AS deps
# Install libc6-compat if needed, but for now just basic deps

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run next
FROM node:20-alpine AS runner
RUN apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont

    # Tell Puppeteer to skip installing Chrome. We'll be using the installed package.
    ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
        PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

    WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Install supervisor for process management
RUN apk add --no-cache supervisor

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy worker script and supervisord config
COPY --chown=nextjs:nodejs scripts/cron-worker.js ./scripts/cron-worker.js
COPY --chown=nextjs:nodejs supervisord.conf /etc/supervisord.conf

# Create data directory for SQLite
RUN mkdir -p /data && chown nextjs:nodejs /data
VOLUME /data

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"
ENV DATABASE_URL "/data/japan-politics.db"

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
