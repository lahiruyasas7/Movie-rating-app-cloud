# Stage 1: build your app
FROM node:16-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci RUN npm ci --legacy-peer-deps

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: production image
FROM node:16-alpine
WORKDIR /app

# Copy only production deps
COPY package*.json ./
RUN npm ci --production RUN npm ci --legacy-peer-deps

# Copy compiled output
COPY --from=builder /app/dist ./dist

# Expose your app's port
EXPOSE 3001

# Start the server
CMD ["node", "dist/main"]

