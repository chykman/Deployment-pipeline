FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app

# Dependencies first so this layer is cached until package*.json changes
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

COPY server.js ./

ARG GIT_SHA=dev
ENV GIT_SHA=${GIT_SHA}

USER node
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --start-period=15s --retries=5 \
  CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null || exit 1
CMD ["node", "server.js"]
