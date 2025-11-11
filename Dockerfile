FROM node:20-alpine AS builder

WORKDIR /build

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install root dependencies
RUN npm ci

# Install backend dependencies
WORKDIR /build/backend
RUN npm ci

# Install frontend dependencies
WORKDIR /build/frontend
RUN npm ci

# Copy source files
WORKDIR /build
COPY backend ./backend
COPY frontend ./frontend
COPY shared ./shared

# Build backend
WORKDIR /build/backend
RUN npm run build

# Build frontend
WORKDIR /build/frontend
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Copy backend build output
COPY --from=builder /build/backend/dist ./backend/dist
COPY --from=builder /build/backend/package*.json ./backend/

# Copy frontend build output
COPY --from=builder /build/frontend/dist ./frontend/dist

# Install production dependencies
WORKDIR /app/backend
RUN npm ci --production

# Create data directory
RUN mkdir -p /app/data

# Set working directory
WORKDIR /app/backend

# Expose port
EXPOSE 9876

# Start Node.js server
CMD ["node", "dist/server.js"]
