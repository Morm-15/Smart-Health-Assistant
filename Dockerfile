# ==========================================
# Production Dockerfile for Smart Health Assistant
# Multi-stage build for lightweight & secure deployment
# ==========================================

# Stage 1: Build Expo Web Application
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy dependency files
COPY package*.json ./

# Install npm dependencies
RUN npm install --legacy-peer-deps

# Copy full application source
COPY . .

# Build Arguments for environment configuration
ARG EXPO_PUBLIC_GEMINI_API_KEY
ENV EXPO_PUBLIC_GEMINI_API_KEY=${EXPO_PUBLIC_GEMINI_API_KEY}
ENV NODE_ENV=production

# Export static production bundle for Web
RUN npx expo export --platform web

# Stage 2: Production Nginx Web Server
FROM nginx:alpine AS runner

# Copy customized Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled web build from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose web port
EXPOSE 80

# Run nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
