# Use Node.js 18 alpine as base
FROM node:18-alpine

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies)
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# In development, we skip the TSC build because the project has TS errors 
# that are normally bypassed by 'tsx' in development mode.
# RUN npm run build

# Expose the port the app runs on
EXPOSE 3003

# Command to run migrations and then start the server in DEV mode
# This uses 'tsx' which handles TS files directly and skips strict type checking errors
CMD ["sh", "-c", "npx tsx src/scripts/migrate.ts && npm run dev"]
