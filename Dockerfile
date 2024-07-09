FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json .
RUN npm ci --ignore-scripts

COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD HOSTNAME="0.0.0.0" PORT=3000 node server.js
