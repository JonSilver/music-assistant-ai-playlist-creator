# ---------- deps (root workspace install from lockfile) ----------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY frontend/package*.json frontend/
COPY backend/package*.json backend/
RUN npm ci

# ---------- build ----------
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app /app
COPY . .

RUN npm run build:prod

# Sanity-check: fail fast if dist missing
RUN test -f /app/frontend/dist/index.html || (echo "frontend/dist/index.html missing" && ls -la /app/frontend && exit 1)

# ---------- runtime ----------
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Backend production deps only
COPY backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev --no-audit --no-fund

# App artefacts
COPY --from=build /app/backend/dist ./backend/dist
# COPY --from=build /app/shared ./shared

# Deploy frontend build output to backend static serving path
COPY --from=build /app/frontend/dist ./backend/dist/public

# Data dir expected to be a volume
RUN mkdir -p /app/data
VOLUME ["/app/data"]

# Strict volume check entrypoint (atomic write, executable, on PATH)
COPY entrypoint.sh /usr/local/bin/entrypoint
RUN sed -i 's/\r$//' /usr/local/bin/entrypoint && chmod +x /usr/local/bin/entrypoint

USER node
EXPOSE 9876
ENTRYPOINT ["entrypoint"]
CMD ["node", "backend/dist/backend/src/server.js"]
