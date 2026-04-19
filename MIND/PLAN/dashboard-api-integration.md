# Plan: Dashboard API Integration

## Objective
Optimize the Dashboard by replacing client-side calculations with pre-computed data from the backend API. This will improve performance, especially as the number of transactions grows, and ensure consistency across the application.

## Strategy
1. **Leverage Backend Endpoints:** Use the existing `/api/dashboard` and `/api/dashboard/cashflow` endpoints.
2. **Update FinanceContext:** Add methods to fetch dashboard-specific data if needed, or fetch directly in the `Dashboard` component.
3. **Refactor Dashboard.tsx:**
    - Replace `incomes`, `expenses`, etc. filtering/reduction with data from `api.dashboard.get()`.
    - Replace the 7-day cashflow calculation with data from `api.dashboard.cashflow()`.
    - Maintain the existing responsive layout and UI components.
4. **Loading & Error States:** Ensure the dashboard handles loading and error states gracefully while fetching data.

## Impact
- **Performance:** Reduced CPU usage on the client side for data processing.
- **Accuracy:** Calculations are handled by the server (Prisma/PostgreSQL), which is more robust for large datasets.
- **Consistency:** The dashboard will show the same data that the backend uses for summaries and reports.

## Files to Modify
1. `src/app/pages/Dashboard.tsx` — Main refactoring target.
2. `src/lib/api.ts` — Ensure types are accurate for the response (already mostly done).
