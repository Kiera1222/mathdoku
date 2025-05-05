FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies
RUN npm run install-all

# Copy project files
COPY . .

# Build client
RUN cd client && npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy server files
COPY --from=builder /app/server ./server
COPY --from=builder /app/package*.json ./

# Copy client build
COPY --from=builder /app/client/build ./client/build

# Install production dependencies
RUN npm ci --only=production && \
    cd server && npm ci --only=production

# Serve static files from client/build
RUN mkdir -p server/public && \
    cp -r client/build/* server/public/

# Expose port
EXPOSE 8080

# Start server
CMD ["node", "server/index.js"] 