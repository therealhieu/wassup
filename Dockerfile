# ── Base: Node + Bun (same base for all stages to avoid ABI mismatch) ─
FROM node:22-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    && rm -rf /var/lib/apt/lists/* \
    && npm install -g bun@1.2.20

# ── Stage 1: Install dependencies ─────────────────────────────────────
FROM base AS deps
WORKDIR /app

COPY package.json bun.lock ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

RUN bun install --frozen-lockfile

# ── Stage 2: Build ────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# DATABASE_URL needed at build time for page data collection (Prisma import)
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build

RUN bunx prisma generate && bun run build

# ── Stage 3: Production runtime ───────────────────────────────────────
FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Copy standalone output + static/public assets
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy Prisma schema, migrations, and config for runtime migrate
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./

# Install only the Prisma CLI for migrations (isolated from app node_modules)
RUN cd /tmp && echo '{"dependencies":{"prisma":"7.4.1","dotenv":"16.5.0"}}' > package.json \
    && npm install --omit=dev 2>/dev/null \
    && mkdir -p /app/prisma-cli \
    && mv node_modules /app/prisma-cli/node_modules \
    && rm package.json

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD node -e "fetch('http://localhost:3000').then(r => { if (!r.ok) process.exit(1) }).catch(() => process.exit(1))"

EXPOSE 3000

CMD ["sh", "-c", "NODE_PATH=/app/prisma-cli/node_modules node /app/prisma-cli/node_modules/prisma/build/index.js migrate deploy && node server.js"]
