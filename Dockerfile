# ─── Base: Node + Chromium (Alpine — for CI and prod) ─────────────────────────
FROM node:20-alpine AS base

RUN apk add --no-cache \
  chromium \
  nss \
  freetype \
  harfbuzz \
  ca-certificates \
  ttf-freefont

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

COPY package*.json ./

# ─── Dev (Debian — avoids musl/native binary issues with rolldown) ─────────────
FROM node:20 AS dev

RUN apt-get update && apt-get install -y --no-install-recommends \
  chromium \
  && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PATH="/app/node_modules/.bin:$PATH"

WORKDIR /app

COPY package*.json ./

RUN npm install --include=dev

# No COPY here — src/ and config files come from bind mounts in docker-compose

CMD npm install && npm run dev

# ─── Builder ──────────────────────────────────────────────────────────────────
FROM base AS builder

RUN npm ci

COPY . .

RUN npm run build

# ─── CI ───────────────────────────────────────────────────────────────────────
FROM builder AS ci

RUN npm run lint && npm test

