<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

## Description

Backend API for 3D Gen application with AI memory, sales demo, and real-time communication features.

## Features

- **AI Memory** - Vector-based memory storage using Upstash Vector with Redis caching
  - `POST /ai-memory/remember` - Store memories for users
  - `POST /ai-memory/recall` - Query user memories
- **Sales Demo** - Session management for sales demonstrations
  - `POST /sales-demo/session` - Create demo sessions
- **Health Check** - Infrastructure monitoring at `/health`
- **QStash Webhooks** - Async job and cron handling
- **Authentication** - MongoDB-backed email/password auth with bcrypt and session tokens
- **Notebook Chat** - NotebookLM-style notebook creation and Gemini-backed chat

## Tech Stack

- NestJS with TypeScript
- MongoDB (Mongoose)
- Upstash Redis & Vector
- Stream.io SDK
- QStash for async jobs
- bcryptjs for password hashing
- Vercel AI SDK for Gemini notebook chat

## Project setup

```bash
$ pnpm install
```

## Compile and run the project

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Cloud Run deploy

1. Build and push the container image.
2. Deploy it to Cloud Run with `PORT=8080`.
3. Set `MONGODB_URI`, `CORS_ORIGIN`, and `AI_GATEWAY_API_KEY` as Cloud Run env vars or secrets.

Example:

```bash
gcloud run deploy notebook-backend \
  --image=REGION-docker.pkg.dev/PROJECT_ID/REPO/backend:latest \
  --region=REGION \
  --port=8080 \
  --allow-unauthenticated \
  --set-env-vars=MONGODB_URI=...,CORS_ORIGIN=https://your-frontend-url,AI_GATEWAY_API_KEY=...
```

## Run tests

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```

## Environment Variables

```
MONGODB_URI=
CORS_ORIGIN=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
UPSTASH_VECTOR_REST_URL=
UPSTASH_VECTOR_REST_TOKEN=
STREAM_API_KEY=
STREAM_API_SECRET=
QSTASH_TOKEN=
AI_GATEWAY_API_KEY=
AI_GATEWAY_MODEL=google/gemini-2.0-flash
```

## License

UNLICENSED
