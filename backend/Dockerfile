# syntax=docker/dockerfile:1.7

# Этап сборки
FROM node:lts-alpine AS builder

WORKDIR /app
ENV NODE_OPTIONS=--max-old-space-size=4096
COPY package.json yarn.lock ./
RUN yarn --frozen-lockfile --network-timeout 300000

COPY . .
RUN yarn build

# Продакшен-образ
FROM node:lts-alpine

ENV NODE_ENV=production
ENV NODE_PATH=/app/dist
WORKDIR /app
EXPOSE 4001

COPY package.json yarn.lock ./
RUN yarn --frozen-lockfile --production --network-timeout 300000

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/languages ./src/languages

CMD ["node", "dist/src/main.js"]
