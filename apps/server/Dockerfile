# Build stage
FROM node:22-bullseye AS builder
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/server/package.json ./apps/server/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN npm install -g pnpm@10
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/server ./apps/server
COPY packages/shared ./packages/shared

# Build shared package first, then server
RUN cd packages/shared && pnpm build
RUN cd apps/server && pnpm build

# Production stage
FROM node:22-bullseye
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/server/package.json ./apps/server/
COPY packages/shared/package.json ./packages/shared/

# Install production dependencies only
RUN npm install -g pnpm@10
RUN pnpm install --frozen-lockfile --prod

# Copy built files from builder stage
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist

# Set environment variables
ENV NODE_ENV=production
ENV PORT=9000

# Expose the port
EXPOSE 9000

# Start the server
CMD ["node", "apps/server/dist/index.js"]
