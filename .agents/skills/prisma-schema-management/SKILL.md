---
name: prisma-schema-management
description: Manage database models, migrations, and seed data using Prisma. Use when adding or modifying database tables, defining relationships, or initializing sample records in the backend.
---

# Prisma Schema Management

This project uses Prisma ORM. Follow these steps when making changes to the database structure or default data.

## 1. Modifying the Schema

The source of truth for the database is `prisma/schema.prisma`.
- When adding new data, define the `model` in this file.
- Use explicit relationships (e.g., `@relation(fields: [authorId], references: [id])`).
- Respect naming conventions: `camelCase` for model fields, `PascalCase` for model names.

## 2. Generating Migrations

After modifying `schema.prisma`, you MUST create a migration file to update the actual database structure.

Run the following command:
```bash
npx prisma migrate dev --name <descriptive_name>
```

This will:
- Generate a new SQL migration in `prisma/migrations/`.
- Execute it against the active database.
- Automatically regenerate the Prisma Client (`@prisma/client`).

## 3. Seed Data

If your new feature requires initial lookup data or sample records to test:
1. Open `prisma/seed.ts`.
2. Add the `prisma.<model>.upsert()` or `prisma.<model>.create()` calls.
3. Run `npx prisma db seed`.

**Do not hardcode sample data into the NestJS controllers or services**. All test data must flow from the database.

## Verification

Run `npm run build` and ensure there are no TypeScript errors. The newly generated Prisma types should be recognized across the application.
