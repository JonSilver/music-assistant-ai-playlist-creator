FROM node:20-alpine AS builder

WORKDIR /build

# Copy all source
COPY . .

# Build backend
WORKDIR /build/backend
RUN npm ci && npm run build

# Build frontend
WORKDIR /build/frontend
RUN npm ci && npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Install nginx and supervisor
RUN apk add --no-cache nginx supervisor

# Copy backend
COPY --from=builder /build/backend/dist ./backend/dist
COPY --from=builder /build/backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm ci --production

# Copy frontend built files
COPY --from=builder /build/frontend/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/http.d/default.conf

# Copy supervisor config
COPY supervisord.conf /etc/supervisord.conf

# Create data directory
RUN mkdir -p /app/data

WORKDIR /app

EXPOSE 80

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
