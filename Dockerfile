FROM node:20-alpine AS builder

WORKDIR /build

# Copy all source files
COPY . .

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Build backend
WORKDIR /build/backend
RUN npm ci && npm run build

# Build frontend
WORKDIR /build/frontend
RUN npm ci && npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Copy backend package files
COPY --from=builder /build/backend/package*.json ./backend/

# Install only production dependencies
WORKDIR /app/backend
RUN npm ci --omit=dev

# Copy backend build output
COPY --from=builder /build/backend/dist ./dist

# Copy frontend build output
COPY --from=builder /build/frontend/dist ../frontend/dist

# Create data directory
RUN mkdir -p /app/data

# Expose port
EXPOSE 9876

# Start Node.js server
CMD ["node", "dist/server.js"]
