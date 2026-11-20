# Multi-stage production build for DisputeGuard
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS builder
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

RUN pnpm install --frozen-lockfile

COPY packages ./packages
COPY apps ./apps

RUN pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=10000
ENV NODE_PATH="/app/node_modules:/app/apps/api/node_modules"

# Copy full application with intact pnpm workspace symlinks and built artifacts
COPY --from=builder /app /app

EXPOSE 10000

CMD ["node", "apps/api/dist/index.js"]
