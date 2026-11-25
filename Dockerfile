# =================================================================
# Swari (सवारी) Production Multi-Stage Container Image
# Architecture: Dual-Stage (Build + Runtime), Minimal Alpine, Non-Root
# =================================================================

# -----------------------------------------------------------------
# Stage 1: Build Frontend Assets
# -----------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci

# Copy full application source and compile Vite bundle
COPY . .
RUN npm run build

# -----------------------------------------------------------------
# Stage 2: Production Application Runtime (Non-Root)
# -----------------------------------------------------------------
FROM node:22-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production \
    PORT=8000 \
    HOST=0.0.0.0

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy server application, database schemas, and migration assets
COPY server/ ./server/
COPY database/ ./database/
COPY scripts/ ./scripts/

# Copy compiled frontend from builder stage
COPY --from=builder /app/dist ./dist

# Create runtime non-root ownership
RUN chown -R node:node /app

# Switch to standard non-root user
USER node

# Healthcheck probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8000/health || exit 1

EXPOSE 8000

CMD ["node", "server/index.js"]
