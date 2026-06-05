# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

RUN npx prisma generate

COPY . .

RUN npm run build

# ── Stage 2: production ───────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

# Prisma client gerado no build stage
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Aplicação compilada
COPY --from=builder /app/dist ./dist

# Schema necessário para migrate deploy em runtime
COPY prisma ./prisma/

EXPOSE 3001

CMD ["node", "dist/main"]
