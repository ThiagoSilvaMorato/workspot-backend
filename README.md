# WorkSpot

WorkSpot is a backend API for a platform where users can discover and share good places to work
remotely, such as coffee shops, restaurants, coworking spaces, and other public locations.

The goal is to help people find places with good internet, power outlets, comfort, and a suitable
environment for focused work.

---

## Features

- User registration
- Create work-friendly places (WorkSpots)
- List places
- Search by city
- Rate places
- Tag system (e.g., good Wi-Fi, many power outlets, quiet environment)
- Reviews and comments

---

## Project Structure

The project follows a modular architecture:

```text id="z3kq91"
src/
├── modules/
│   ├── users/
│   ├── auth/
│   ├── workspots/
│   ├── reviews/
│   ├── ratings/
│   └── tags/
├── shared/
├── infra/
├── config/
└── app.ts
```

Each module contains its own logic (controller, service, repository).

---

## Tech Stack

- Node.js
- TypeScript
- Fastify
- Prisma ORM
- PostgreSQL
- Zod
- Vitest

---

## How to Run the Project

### 1. Clone the repository

```bash id="r7x1lm"
git clone <repo-url>
cd workspot
```

---

### 2. Install dependencies

```bash id="p2v8kc"
npm install
```

---

### 3. Configure environment variables

Create a `.env` file:

```env id="m1q9aa"
DATABASE_URL=""
PORT=3000
```

---

### 4. Run database migrations

```bash id="t8v3sd"
npx prisma migrate dev
```

---

### 5. Start the development server

```bash id="q9n2zx"
npm run dev
```

---

## Core Concept

Each WorkSpot contains:

- Name
- Address
- City (used for filtering)
- Tags (place characteristics)
- User ratings
- User reviews

---

## Purpose

This project was created as a learning-focused backend project using modern Node.js practices, with
emphasis on:

- Clean architecture
- Scalable code structure
- Strong TypeScript typing
- Separation of concerns
- Real-world backend design patterns
