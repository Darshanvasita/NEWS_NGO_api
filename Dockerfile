# Use Node.js 18 LTS as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create logs directory
RUN mkdir -p logs

# Create uploads directory
RUN mkdir -p src/uploads

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (res) => { if (res.statusCode !== 200) process.exit(1); })"

# Run database sync and start server
CMD ["sh", "-c", "node -e \"require('./src/models').sequelize.sync().then(() => console.log('Database synced')).catch(e => console.error(e));\" && node src/server.js"]