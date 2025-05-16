# Build stage
FROM node:18-alpine as builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy all files
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built files and server
COPY --from=builder /app/dist ./dist
COPY server.cjs .
COPY .env .

# Expose the port
EXPOSE 3001

# Start the server
CMD ["node", "server.cjs"]
