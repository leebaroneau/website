FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci
RUN npx playwright install --with-deps chromium

COPY . .
RUN npm run build

RUN addgroup -g 1000 nodejs && adduser -D -u 1000 -G nodejs nodejs && chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3000
CMD ["node", "server/index.mjs"]
