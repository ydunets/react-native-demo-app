# Multi-stage build for optimized production image
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files (supports building from repo root context)
COPY backend/package.json backend/package-lock.json ./

# Install full dependencies for build (dev + prod)
RUN npm ci

# Copy source code
COPY backend/src ./src
COPY backend/tsconfig.json ./
COPY backend/tsconfig.build.json ./

# Build TypeScript
RUN npm run build

# Prune to production dependencies for final image size
RUN npm ci --only=production

# Production image
FROM node:24-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Copy built application and dependencies
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json

USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/index.js"]
