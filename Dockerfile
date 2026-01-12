# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies for native modules (argon2)
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source files
COPY tsconfig.json ./
COPY src ./src/

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install dependencies for native modules (argon2)
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies only
RUN npm ci --omit=dev

# Generate Prisma client
RUN npx prisma generate

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Copy views and public assets
COPY src/views ./src/views/
COPY src/public ./src/public/

# Copy OpenAPI spec
COPY openapi ./openapi/

# Create data directory
RUN mkdir -p /app/data

# Set environment
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_URL=file:/app/data/app.sqlite

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start command - run migrations, seed, and start server
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
