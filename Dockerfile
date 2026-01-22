# ---------- base ----------
FROM node:20-slim AS base
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates openssl curl bash tini \
  && rm -rf /var/lib/apt/lists/*

# ---------- deps (install all deps for build) ----------
FROM base AS deps
WORKDIR /app

COPY package.json ./
COPY package-lock.json* ./

RUN if [ -f package-lock.json ]; then \
      npm ci --no-audit --no-fund ; \
    else \
      npm install --no-audit --no-fund ; \
    fi

# ---------- builder ----------
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN mkdir -p public
RUN npm run build

# ---------- deps-prod ----------
FROM base AS deps_prod
WORKDIR /app

COPY package.json ./
COPY package-lock.json* ./
COPY prisma ./prisma

# ВАЖНО: без --ignore-scripts (postinstall prisma generate, если есть)
RUN if [ -f package-lock.json ]; then \
      npm ci --omit=dev --no-audit --no-fund ; \
    else \
      npm install --omit=dev --no-audit --no-fund ; \
    fi

# ---------- runner ----------
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
WORKDIR /app

# node_modules (prod)
COPY --from=deps_prod /app/node_modules ./node_modules

# ✅ Standalone server -> /app
COPY --from=builder /app/.next/standalone ./

# ✅ ВАЖНО: перезаписываем package.json нашим (иначе standalone package.json может снести scripts)
COPY --from=deps_prod /app/package.json ./package.json

# ✅ Статика именно туда, где её ждёт standalone
COPY --from=builder /app/.next/static ./.next/static

# ✅ public
COPY --from=builder /app/public ./public

# ✅ prisma schema + migrations
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
ENTRYPOINT ["/usr/bin/tini","--"]

# ✅ миграции перед стартом + запуск standalone
CMD ["bash","-lc","npm run prisma:migrate:deploy && node server.js"]
