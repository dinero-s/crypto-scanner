FROM node:lts-alpine

RUN apk add --no-cache ffmpeg

WORKDIR /app
COPY server.js /app/server.js

EXPOSE 4002

CMD ["node", "/app/server.js"]
