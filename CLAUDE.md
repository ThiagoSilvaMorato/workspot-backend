# CLAUDE.md

## Project Overview

This project is a backend API built with Node.js and TypeScript.

The goal is to maintain a scalable, maintainable, and production-ready codebase following modern
software engineering practices.

When generating code, always prioritize:

- Readability
- Simplicity
- Type safety
- Maintainability
- Scalability

Avoid overengineering and unnecessary abstractions.

---

# Tech Stack

Unless explicitly instructed otherwise, use:

- Node.js
- TypeScript
- Fastify
- Prisma ORM
- PostgreSQL
- Zod
- Vitest

---

# General Development Principles

Before implementing any feature:

1. Understand the existing architecture.
2. Reuse existing patterns whenever possible.
3. Avoid duplicate code.
4. Keep solutions simple.
5. Follow SOLID principles when they add value.
6. Prefer composition over inheritance.
7. Favor explicit code over magic abstractions.

---

# TypeScript Rules

## Mandatory

- Enable strict typing.
- Always provide explicit types when helpful.
- Prefer interfaces for contracts.
- Prefer type inference when obvious.
- Use readonly whenever applicable.

## Forbidden

- Do not use `any`.
- Do not disable TypeScript checks.
- Do not use type assertions unless absolutely necessary.

Bad:

```ts
const data: any = response;
```

Good:

```ts
interface UserResponse {
  id: string;
  name: string;
}

const data: UserResponse = response;
```

---

# Project Architecture

Use a modular architecture.

Structure:

```text
src/
├── modules/
├── shared/
├── infra/
├── config/
├── app.ts
└── server.ts
```

---

# Module Structure

Every business domain should be organized inside a module.

Example:

```text
modules/
└── users/
    ├── controller/
    ├── service/
    ├── repository/
    ├── dto/
    ├── schemas/
    ├── types/
    └── routes/
```

Each module should be self-contained.

Avoid creating dependencies between modules whenever possible.

---

# Layer Responsibilities

## Controller

Responsibilities:

- Receive requests
- Validate input
- Call services
- Return responses

Controllers must NOT:

- Access database directly
- Contain business logic

---

## Service

Responsibilities:

- Business rules
- Application workflows
- Orchestration

Services must NOT:

- Handle HTTP concerns
- Know framework-specific details

---

## Repository

Responsibilities:

- Database access
- Queries
- Persistence

Repositories must NOT:

- Implement business logic

---

# Validation

Always validate external input.

Use Zod schemas.

Example:

```ts
const createUserSchema = z.object({
  name: z.string().min(3),
  email: z.email(),
});
```

Never trust request payloads.

---

# Error Handling

Always handle errors explicitly.

Use custom application errors when appropriate.

Example:

```ts
throw new AppError("User not found", 404);
```

Never expose internal implementation details to clients.

---

# Database

Use Prisma ORM.

Guidelines:

- Use migrations.
- Keep schema organized.
- Prefer descriptive model names.
- Avoid raw SQL unless necessary.

Example:

```ts
const user = await prisma.user.findUnique({
  where: {
    id,
  },
});
```

---

# API Standards

Use REST conventions.

Examples:

```http
GET    /users
GET    /users/:id
POST   /users
PUT    /users/:id
DELETE /users/:id
```

Responses should be predictable and consistent.

Success:

```json
{
  "data": {}
}
```

Error:

```json
{
  "message": "User not found"
}
```

---

# Naming Conventions

Use clear and descriptive names.

Examples:

```ts
getUserById;
createUser;
updateUser;
deleteUser;
```

Avoid abbreviations.

Bad:

```ts
getUsr;
crtUsr;
```

---

# Logging

Use structured logging.

Log:

- Startup events
- Errors
- Important business events

Do not log:

- Passwords
- Tokens
- Sensitive information

---

# Testing

Use Vitest.

Create tests for:

- Business rules
- Services
- Critical flows

Prioritize testing business logic over framework code.

Example:

```ts
describe("CreateUserService", () => {
  it("should create a user", async () => {
    // test
  });
});
```

---

# Security

Always assume user input is malicious.

Requirements:

- Validate input
- Sanitize data when necessary
- Hash passwords
- Never store plain text passwords
- Protect sensitive endpoints
- Use environment variables for secrets

---

# Environment Variables

All configuration must come from environment variables.

Example:

```env
DATABASE_URL=
JWT_SECRET=
PORT=
```

Never hardcode secrets.

---

# Documentation

When implementing a new feature:

- Explain architectural decisions.
- Document complex logic.
- Keep comments concise and useful.

Avoid obvious comments.

Bad:

```ts
// Increment counter
counter++;
```

Good:

```ts
// Retry logic required because payment provider
// occasionally returns transient failures.
```

---

# Code Generation Guidelines

Whenever generating code:

1. Follow the existing project structure.
2. Reuse existing patterns.
3. Keep files focused on a single responsibility.
4. Generate production-ready code.
5. Include proper typing.
6. Include validation.
7. Include error handling.
8. Include tests when applicable.

Always behave as a senior backend engineer responsible for maintaining a long-term production
system.
