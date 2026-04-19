# Gemini CLI Project Context: Web-App Keuangan

This document provides essential context and instructions for the Gemini CLI agent to interact effectively with the **Web-App Keuangan** (Personal Finance Management) project.

## 📌 Project Overview
- **Purpose:** A comprehensive personal finance management application focused on Indonesian Rupiah (IDR).
- **Frontend:** React 18, Vite 6, TypeScript, Tailwind CSS 4, React Router 7, Radix UI (shadcn), Recharts, Motion.
- **Backend:** Hono API framework running on Node.js (@hono/node-server), Prisma 6 ORM.
- **Database:** PostgreSQL (Supabase).
- **Authentication:** Better Auth (implemented in backend/schema and frontend deps).
- **Architecture:** 
    - `src/`: Frontend React SPA.
    - `backend/`: Hono API server with modular routes.
    - `MIND/`: Strategic planning, tasks, and summaries (MANDATORY reference).

## 🛠 Building and Running

### Root Commands (Recommended)
- `npm install`: Install frontend dependencies.
- `npm run dev`: Starts both frontend (Vite) and backend (Hono) concurrently.
- `npm run backend:dev`: Starts only the backend with `tsx watch`.
- `npm run backend:db:push`: Pushes Prisma schema changes to the database.
- `npm run backend:db:studio`: Opens Prisma Studio for database management.

### Backend-Specific Commands
- `cd backend && npm install`: Install backend dependencies.
- `cd backend && npm run db:generate`: Regenerate Prisma client.
- `cd backend && npm run build`: Compile TypeScript to JS.

## 🏗 Development Workflow

### 🧠 Strategic Management (MIND Framework)
Follow the established workflow in the `MIND/` directory:
1. **Plan:** Review/create plans in `MIND/PLAN/[feature-name].md`.
2. **Tasks:** Track progress in `MIND/TASKS/[feature-name].md`.
3. **Summary:** Document completed work in `MIND/SUMMARY/[feature-name].md`.
4. **Structure:** Refer to `MIND/structure-project.md` for architectural details.

### 📝 Coding Standards (Guidelines)
- **Styling:** Use Tailwind CSS 4 utility classes. Refer to `src/styles/theme.css` for OKLCH tokens.
- **UI Components:** Use existing components in `src/app/components/ui/` (shadcn/ui base).
- **Types:** Strict TypeScript usage. Ensure types are updated in `backend/prisma/schema.prisma` and regenerated.
- **State:** Currently migrating from `localStorage` (`FinanceContext.tsx`) to Backend API. Always check if a feature should use the API before adding local state.

### 🌿 Git Conventions
- **Branching:** Use `tasks/[task-name]/[description]/[date-time]`.
- **Commits:** Clear, concise messages focusing on "why". Commit AFTER a successful build.
- **PRs:** Merge to `stg` branch before `main`.

## 🤖 Gemini Agent Instructions

### Security & Integrity
- NEVER commit or log secrets found in `.env` files (root or backend).
- Protect `.git` and system configuration.

### Technical Integrity
- **Reproduction:** Before fixing a bug, reproduce it with a script or test.
- **Verification:** Always run `npm run build` (or `cd backend && npm run build`) to verify changes before finality.
- **Prisma:** If you modify `backend/prisma/schema.prisma`, you MUST run `npm run backend:db:generate` and ideally `npm run backend:db:push`.

### Proactivity
- Use `codebase_investigator` for complex architectural questions.
- Use `generalist` for batch refactoring or high-volume tasks.
- If you notice `FinanceContext.tsx` is still using `localStorage` for a feature you are working on, suggest migrating it to the Hono API.

### Context Management
- Use `grep_search` and `glob` to find relevant components/routes before reading files.
- Refer to `MIND/structure-project.md` frequently to maintain architectural consistency.

## 🔗 Key Files
- `backend/prisma/schema.prisma`: Source of truth for data models.
- `backend/src/routes/`: Modular API logic.
- `src/app/context/FinanceContext.tsx`: Frontend state bridge.
- `src/app/routes.ts`: Frontend routing definitions.
- `guidelines/Guidelines.md`: Specific design and system rules.

### Workflow for Code Changes
1. **Commit** existing changes before starting new work
2. **Create plan** at `MIND/PLAN/[plan-name].md`
3. **Create task** at `MIND/PLAN/[task-name].md`
4. **Execute the task** and update task progress
5. **Create summary** at `MIND/SUMMARY/[summary-name].md` when done
6. **Run build** (`bun run build`) to ensure no compile errors
7. **Fix any build errors** if they occur
8. **Commit** all changes AFTER successful build
9. **Update version** in `package.json` for every change jika belum ada buatkan versi
10. **Push** to new branch with format: `tasks/[task-name]/[what-is-being-done]/[date-time]`
11. **Merge** to `main` branch after completion