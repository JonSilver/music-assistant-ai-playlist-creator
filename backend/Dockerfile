FROM node:20-alpine AS builder

WORKDIR /app

# Copy shared types first
COPY shared /shared

# Copy package files
COPY backend/package*.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY backend/src ./src
COPY backend/tsconfig.json ./

# Build
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install production dependencies only
RUN npm ci --production

# Copy built files
COPY --from=builder /app/dist ./dist

# Create data directory
RUN mkdir -p /app/data

# Expose port
EXPOSE 3001

# Start server
CMD ["node", "dist/server.js"]
