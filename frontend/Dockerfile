# Use an official Node.js image as the base
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* yarn.lock* ./
RUN npm ci --prefer-offline --no-audit --progress=false

COPY . .
RUN npm run build

# Use a lightweight web server to serve static files
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Remove default nginx static assets
RUN rm -rf ./*

# Copy built assets from previous stage
COPY --from=build /app/dist .

# Copy custom nginx config if needed
# COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
