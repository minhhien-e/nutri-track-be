---
name: nestjs-use-real-data
description: Enforces the use of real database connections via Prisma in NestJS services. Use when implementing data retrieval or manipulation logic to ensure no mock data is introduced.
---

# Use Real Data via Prisma

This project strictly requires that all API endpoints interact with real data stored in the PostgreSQL database. **Mocked data, dummy arrays, and hardcoded values are explicitly forbidden** inside the business logic layers (Services/Controllers).

## Required Flow

```text
Service Method -> this.prisma.<model>.findMany() / create() / update() -> return
```

## Rules

1. **No Mock Data**: Do not return hardcoded JSON or arrays from your service methods. Always execute a query against `PrismaService`.
2. **Proper Injection**: Ensure `PrismaService` is injected into the constructor of your service:
   ```typescript
   constructor(private readonly prisma: PrismaService) {}
   ```
3. **Database Constraints**: Let the database handle relations, constraints, and data integrity. Include related models using Prisma's `include` or `select` options rather than manually mapping data from multiple distinct queries.
4. **Seeding Data**: If the database is empty and you need sample data for the app to function properly, you must **insert it via the database seed script**, not by hardcoding it in the API.
   - Update `prisma/seed.ts`.
   - Run `npx prisma db seed`.
5. **Real Filtering**: When a user queries data (e.g., searching by date, name, or tags), construct the appropriate Prisma `where` clauses rather than fetching all data and filtering it in memory.

## Verification

Before finishing your task, verify:
- There are no constant dummy arrays in the service or controller.
- All endpoints correctly call `this.prisma...`.
- If new sample data was needed, `prisma/seed.ts` has been modified.
