# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build production bundle
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install a simple HTTP server to serve the built files
RUN npm install -g http-server

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 5176

# Serve the built files
CMD ["http-server", "dist", "-p", "5176", "--cors"]
