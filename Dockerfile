# Stage 1: Build the React/Vite application
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve static files with nginx on port 8080
FROM nginx:stable-alpine

# Remove default nginx config and copy custom one
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Cloud Run requires the container to listen on port 8080
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
