FROM node:22.12-alpine AS builder

WORKDIR /app

# Copy package manifests first for optimal Docker layer caching
COPY package*.json ./

# Install dependencies from the committed npm lockfile.
RUN npm ci

# Copy source code and build TypeScript
COPY . .
RUN npm run build

FROM node:22.12-alpine AS release

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./

# Install production dependencies from the committed npm lockfile.
RUN npm ci --omit=dev --ignore-scripts

COPY --from=builder /app/dist ./dist

# Create directory for attachments
RUN mkdir -p /app/attachments
VOLUME ["/app/attachments"]

ENTRYPOINT ["node", "dist/index.js"]