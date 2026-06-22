---
name: nestjs-apply-architecture
description: Structure or refactor NestJS features with Modules, Controllers, Services, and DTOs. Use when creating a new backend endpoint, integrating a new service, or organizing business logic.
---

# Apply NestJS Architecture

Follow the repository's existing architecture for NestJS.

## Required Flow

```text
HTTP Request -> DTO Validation -> Controller -> Service -> PrismaService -> Result
```

Organize every feature by layer:

```text
src/modules/<feature>/
  <feature>.module.ts
  <feature>.controller.ts
  <feature>.service.ts
  dto/
    create-<feature>.dto.ts
    update-<feature>.dto.ts
```

## Implementation Order

1. Generate a new module using the NestJS CLI (if available) or create the structure manually.
2. Register the new module in `src/app.module.ts`.
3. Create the Service (`<feature>.service.ts`) and inject `PrismaService`.
4. Define the necessary interfaces and DTOs inside `dto/`. Use `class-validator` decorators (e.g., `@IsString()`, `@IsOptional()`) to ensure request validity.
5. Create the Controller (`<feature>.controller.ts`) and define the endpoints (`@Get()`, `@Post()`, etc.).
6. Inject the Service into the Controller. Keep the Controller logic minimal—only parse parameters and call the Service method.
7. Return raw JSON objects or NestJS standard responses from the Controller.

## Rules

- **Thin Controllers**: Do not write loops, conditionals, or database queries in the Controller.
- **Dependency Injection**: Always use `@Injectable()` and the constructor to inject dependencies (like `PrismaService`).
- **Imports**: Ensure any external modules (e.g., `AuthModule`, `PrismaModule`) are properly imported into the `<feature>.module.ts` before using their exported services.
