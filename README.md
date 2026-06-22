# NutriTrack Backend

NestJS backend for NutriTrack using PostgreSQL, Prisma, JWT auth, and Swagger.

## Local Docker

```bash
cp .env.example .env
docker compose up --build
```

In another terminal:

```bash
docker compose exec api npm run db:migrate
docker compose exec api npm run db:seed
docker compose exec api npm run admin:create -- --email=admin@nutri.local --password='change-me'
```

API:

- Health: `http://localhost:3000/health`
- Swagger: `http://localhost:3000/docs`

The seed command loads the curated food catalog only. It does not create demo users, demo diary records, or recent-food history.

Create or promote the first admin with:

```bash
npm run admin:create -- --email=admin@example.com --password='change-me' --displayName='Nutri Admin'
```

If a user already exists with that email, the script promotes it to `ADMIN` and ignores the password argument.

## Local Node

```bash
npm install
npm run db:generate
npm run start:dev
```

## Architecture

```txt
Controller -> Service -> Repository -> Prisma
```

- Controllers only receive/validate requests and call services.
- Services contain business logic.
- Repositories contain Prisma queries.
- `PrismaService` only wraps database access.
- Success responses are wrapped by `SuccessResponseInterceptor`.
- Errors are normalized by `AllExceptionsFilter`.
- Admin catalog APIs live under `/admin/foods` and require a JWT for a user with role `ADMIN`.
