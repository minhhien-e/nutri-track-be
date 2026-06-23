---
name: nestjs-use-path-aliases
description: Use path aliases (e.g., @/*) for importing modules in NestJS backend projects instead of relative paths (../ or ./).
---

# NestJS Use Path Aliases

This skill enforces the usage of path aliases in NestJS backend projects to keep imports clean, maintainable, and refactor-friendly.

## Context

When importing modules, services, or controllers across different domains in a backend project, relative paths can quickly become unreadable and brittle (e.g., `import { UsersService } from '../../../../users/users.service'`). Using a path alias like `@/` pointing to the `src/` directory solves this.

## Rules

1. **Always Use Aliases for `src/` Imports:**
   - Whenever you are importing a file located inside the `src/` folder from another file in `src/`, always prefer the `@/` alias over deep relative paths.
   - **Correct:** `import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard'`
   - **Incorrect:** `import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard'`

2. **Configuration Verification:**
   - Ensure `tsconfig.json` has `paths` mapped:
     ```json
     {
       "compilerOptions": {
         "baseUrl": "./",
         "paths": {
           "@/*": ["src/*"]
         }
       }
     }
     ```
   - Ensure `package.json` build script uses `tsc-alias` to replace aliases during compilation:
     `"build": "nest build && tsc-alias"`
   - Ensure `jest.config.js` or package.json's jest block resolves aliases via `moduleNameMapper`:
     ```javascript
     moduleNameMapper: {
       '^@/(.*)$': '<rootDir>/src/$1',
     }
     ```

3. **Exceptions:**
   - Sibling files inside the exact same folder (e.g., importing a `.dto.ts` into a `.controller.ts` right next to it) should generally use `./` if it improves immediate local clarity.
   - External node modules still use standard package name imports.

## Enforcement
Whenever you modify an existing component or create a new backend module, update deep relative imports to use the path alias pattern if the project configuration supports it.
