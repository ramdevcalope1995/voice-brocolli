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
- **Authentication** - Clerk-based authentication with fallback support

## Tech Stack

- NestJS with TypeScript
- MongoDB (Mongoose)
- Upstash Redis & Vector
- Stream.io SDK
- QStash for async jobs
- Clerk for authentication

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
CLERK_AUTH_ENABLED=true|false
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
UPSTASH_VECTOR_REST_URL=
UPSTASH_VECTOR_REST_TOKEN=
MONGODB_URI=
STREAM_API_KEY=
STREAM_API_SECRET=
QSTASH_TOKEN=
```

## License

UNLICENSED
