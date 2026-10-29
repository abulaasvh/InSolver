FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/worker/package.json ./apps/worker/
COPY apps/api/prisma ./apps/api/prisma

RUN npm install

COPY packages/shared ./packages/shared
COPY apps/worker ./apps/worker

RUN npm run build --workspace=@insolver/shared

WORKDIR /app/apps/worker
RUN npx prisma generate --schema=../api/prisma/schema.prisma
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/apps/worker/dist ./apps/worker/dist
COPY --from=builder /app/apps/worker/node_modules ./apps/worker/node_modules
COPY --from=builder /app/apps/worker/package.json ./apps/worker/package.json
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma

CMD ["node", "apps/worker/dist/index.js"]
