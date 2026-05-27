FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci
RUN npx playwright install --with-deps chromium

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["node", "server/index.mjs"]
