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

# Run builds by PATH, not by workspace name (robust for any package name)
RUN npm run --workspace ./frontend build && npm run --workspace ./backend build

# Sanity-check: fail fast if dist missing
RUN test -f /app/frontend/dist/index.html || (echo "frontend/dist/index.html missing" && ls -la /app/frontend && exit 1)

# ---------- runtime ----------
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Backend prod deps only
COPY backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev --no-audit --no-fund

# Server artefacts
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/shared ./shared

# Place SPA in several likely static roots
COPY --from=build /app/frontend/dist ./backend/dist/public
COPY --from=build /app/frontend/dist ./backend/dist/backend/public
COPY --from=build /app/frontend/dist ./backend/dist/backend/src/public
# Also drop alongside server root just in case the server serves __dirname
COPY --from=build /app/frontend/dist ./backend/dist

USER node
EXPOSE ${PORT:-9876}

# Optional healthcheck: returns 2xx if SPA served
HEALTHCHECK --interval=20s --timeout=3s --start-period=10s --retries=3 \
    CMD wget -qO- http://127.0.0.1:${PORT:-9876}/ >/dev/null 2>&1 || exit 1

CMD ["node", "backend/dist/backend/src/server.js"]
