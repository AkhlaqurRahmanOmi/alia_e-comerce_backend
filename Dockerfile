# syntax=docker/dockerfile:1.7
ARG NODE_VERSION=22-alpine

# Stage 1: Build
FROM node:${NODE_VERSION} AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

# Use install instead of ci to tolerate transient lock drift in container builds.
RUN npm install
RUN npx prisma generate

COPY . .
RUN npm run build

# Stage 2: Production
FROM node:${NODE_VERSION}

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install --omit=dev && npm cache clean --force
RUN npx prisma generate

COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production

# Create directories for logs and local file storage
RUN mkdir -p logs
RUN mkdir -p uploads/reviews uploads/products uploads/variants uploads/test

# Set proper permissions for uploads directory
RUN chmod -R 755 uploads

# Define volume for persistent file storage
VOLUME ["/app/uploads"]

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
