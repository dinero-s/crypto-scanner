# syntax=docker/dockerfile:1.7

FROM node:lts-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --network-timeout 300000

COPY . .
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN npm run build

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
