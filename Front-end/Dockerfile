# Multi-stage .NET-style build pattern adapted for React/Vite
# Following Infrastructure-Agent.md containerization patterns with maximum security hardening
# Using distroless for production, Debian slim for dev/build to minimize attack vectors

# Development stage with Debian slim - minimal CVEs, full development toolchain
FROM node:20-slim AS development
WORKDIR /app

# Install security updates and essential packages for development
RUN apt-get update && apt-get upgrade -y && \
    apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create non-root user for security
RUN groupadd -g 1001 nodejs && \
    useradd -r -u 1001 -g nodejs frontend

# Copy package files and install all dependencies (including dev)
COPY --chown=frontend:nodejs package*.json ./
RUN npm ci

# Copy source code and change ownership
COPY --chown=frontend:nodejs . .

# Clean any existing Vite cache and create with proper permissions
RUN rm -rf node_modules/.vite 2>/dev/null || true && \
    mkdir -p node_modules/.vite && \
    chown -R frontend:nodejs node_modules/.vite

# Switch to non-root user
USER frontend

# Expose Vite dev server port
EXPOSE 3000

# Start development server with host binding for Docker and force dependency re-optimization
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000", "--force"]

# Build stage - Debian slim for build tools, minimal CVE exposure
FROM node:20-slim AS build
WORKDIR /app

# Install security updates for build stage
RUN apt-get update && apt-get upgrade -y && \
    apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY . .
RUN npm run build

# Production stage with Google Distroless - ZERO CVE vulnerabilities, minimal attack surface
FROM gcr.io/distroless/nodejs20-debian12:nonroot AS production

# Set working directory
WORKDIR /app

# Copy built static assets from build stage
COPY --from=build --chown=nonroot:nonroot /app/dist ./public

# Create minimal static file server script inline
COPY --chown=nonroot:nonroot <<'EOF' ./server.js
const http = require('http');
const fs = require('fs');
const path = require('path');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  let filePath = path.join(__dirname, 'public', req.url === '/' ? 'index.html' : req.url);
  
  // Handle SPA routing - serve index.html for non-static files
  if (!fs.existsSync(filePath) && !path.extname(filePath)) {
    filePath = path.join(__dirname, 'public', 'index.html');
  }
  
  // Health check endpoint
  if (req.url === '/health') {
    res.writeHead(200, { 
      'Content-Type': 'text/plain',
      'X-Frame-Options': 'SAMEORIGIN',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block'
    });
    res.end('healthy');
    return;
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('File not found');
      } else {
        res.writeHead(500);
        res.end('Server error');
      }
    } else {
      const ext = path.extname(filePath);
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      
      res.writeHead(200, { 
        'Content-Type': contentType,
        'X-Frame-Options': 'SAMEORIGIN',
        'X-Content-Type-Options': 'nosniff',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'no-referrer-when-downgrade',
        'Content-Security-Policy': "default-src 'self' http: https: data: blob: 'unsafe-inline'"
      });
      res.end(content);
    }
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Secure distroless server running on port ${port}`);
});
EOF

# Expose port
EXPOSE 3000

# Health check endpoint using distroless Node.js
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD ["/nodejs/bin/node", "-e", "require('http').get('http://localhost:3000/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"]

# Start the secure static file server (already running as nonroot user)
ENTRYPOINT ["/nodejs/bin/node", "server.js"]