# ---- deps: resolve & install with bun ----------------------------------------
FROM oven/bun:1.4-slim AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# ---- builder: prisma generate + next build ------------------------------------
FROM oven/bun:1.4-slim AS builder
WORKDIR /app
# openssl: required by Prisma's query engine on debian-slim images
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Build-time placeholder; the runtime URL comes from docker-compose (absolute path).
ENV DATABASE_URL=file:/app/data/custom.db
RUN bunx prisma generate
RUN bun run build

# ---- runner --------------------------------------------------------------------
# Same debian-based image as the builder so the Prisma "native" engine built during
# `prisma generate` (glibc + openssl 3) matches the runtime exactly.
FROM oven/bun:1.4-slim AS runner
WORKDIR /app
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates sqlite3 \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1

# Full node_modules: needed so the entrypoint can run `bunx prisma migrate deploy`
# and the seed script works in-container. Includes the generated .prisma client.
COPY --from=builder /app/node_modules ./node_modules
COPY prisma ./prisma
COPY scripts ./scripts
# Standalone server (file tracing bundles the traced deps incl. the Prisma engine)
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh \
  && mkdir -p /app/data \
  && chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD bun -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["bun", "server.js"]
