# Use Node.js 18 LTS
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./

# Install dependencies
RUN npm install --production

# Copy backend source code
COPY backend/ .

# Expose port
ENV PORT=3000
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]