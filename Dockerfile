FROM node:22-slim AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy only the files needed for dependencies
COPY package.json pnpm-lock.yaml ./

# Install dependencies using the lockfile
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install pnpm for the runner stage as well
RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["pnpm", "run", "start:prod"]
