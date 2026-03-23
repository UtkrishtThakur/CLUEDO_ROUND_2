# -------- Base Image --------
FROM node:20-alpine AS base

# -------- Dependencies Stage --------
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Fix npm network issues (CRITICAL)
RUN npm config set registry https://registry.npmjs.org/ \
    && npm config set fetch-retries 5 \
    && npm config set fetch-retry-maxtimeout 600000 \
    && npm config set fetch-timeout 600000

COPY package.json package-lock.json ./

# Retry logic (handles flaky network)
RUN npm ci || npm ci || npm ci


# -------- Build Stage --------
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build


# -------- Production Stage --------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["npm", "start"]