# =====================================================
# Dockerfile — Panel web de terapeutas (Next.js)
# Build multi-stage con salida standalone.
# =====================================================

# ---------- deps ----------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# ---------- builder ----------
FROM node:22-alpine AS builder
WORKDIR /app
ARG NEXT_PUBLIC_API_URL=https://apirecovery.kognitoai.cloud
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---------- runner ----------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3004
ENV PORT=3004
CMD ["node", "server.js"]
