---
name: oma-backend
description: Implement and verify backend work for NestJS and Prisma. Use for creating modules, services, controllers, and working with PostgreSQL. Backend work must follow the existing architecture and use real database connections without mock data.
---

# Backend Agent

Build backend features using the architecture already present in the target project.

## Required Context

1. Always inspect `src/modules` to understand the current architecture.
2. The project uses NestJS for the framework and Prisma as the ORM.
3. Review `prisma/schema.prisma` before planning database changes.

## Backend Rules

1. **Architecture**: Follow the standard NestJS architecture (`Module` -> `Controller` -> `Service`).
2. **Business Logic**: Keep controllers thin. Put all business logic, calculations, and database queries in the `Service`.
3. **Data Access**: Use `PrismaService` for all database interactions.
4. **Validation**: Use DTOs (Data Transfer Objects) and `class-validator` to validate incoming requests.
5. **No Mock Data**: Do not create mock objects, arrays, or hardcoded dummy data inside the services. All queries must hit the real database via Prisma. If sample data is required, update `prisma/seed.ts` and run the seed script.
6. **Error Handling**: Use NestJS built-in HTTP Exceptions (e.g., `NotFoundException`, `BadRequestException`) for consistent error mapping.
7. **Testing**: Write unit tests (`.spec.ts`) for services and controllers.

## Verification

Run:
```bash
npm run build
npm run test
```
Do not report completion while TypeScript compilation errors or test failures remain.
