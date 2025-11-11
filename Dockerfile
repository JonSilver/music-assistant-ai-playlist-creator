FROM node:20-alpine AS builder

WORKDIR /build

# Copy all source files
COPY . .

# Build backend
WORKDIR /build/backend
RUN npm ci && npm run build

# Build frontend
WORKDIR /build/frontend
RUN npm ci && npm run build

# Prune dev dependencies from backend
WORKDIR /build/backend
RUN npm prune --production

# Production image
FROM node:20-alpine

WORKDIR /app/backend

# Copy backend build output
COPY --from=builder /build/backend/dist ./dist

# Copy production node_modules (already pruned)
COPY --from=builder /build/backend/node_modules ./node_modules

# Copy package.json for reference
COPY --from=builder /build/backend/package.json ./package.json

# Copy frontend build output
COPY --from=builder /build/frontend/dist ../frontend/dist

# Create data directory
RUN mkdir -p /app/data

# Expose port
EXPOSE 9876

# Start Node.js server
CMD ["node", "dist/server.js"]
