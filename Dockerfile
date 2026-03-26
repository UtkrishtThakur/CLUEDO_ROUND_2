# -------- Base Image --------
FROM node:20-alpine AS base

# -------- Dependencies Stage --------
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 🔥 Network hardening for npm
RUN npm config set registry https://registry.npmjs.org/ \
    && npm config set fetch-retries 5 \
    && npm config set fetch-retry-maxtimeout 600000 \
    && npm config set fetch-timeout 600000

COPY package.json package-lock.json ./

# retry install
RUN npm ci || npm ci || npm ci


# -------- Build Stage --------
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# 🔥 Fail early if build breaks
RUN npm run build


# -------- Production Stage --------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# only copy required files
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules

# optional (only if exists)
COPY --from=builder /app/next.config.* ./

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["npm", "start"]