# Task: Dashboard API Integration

## Overview
Optimize the `Dashboard.tsx` component to use specialized backend endpoints for stats, charts, and transaction history.

## Subtasks

### Task 1: Update API Types
**File:** `src/lib/api.ts`
- Ensure `DashboardData` accurately reflects the backend response.
- Current type has `recentTransactions: Record<string, unknown>[]`, but the backend should return specific transaction types (mixed income/expense).
- [x] Task 1: Update API Types
- [x] Task 2: Implement Data Fetching
- [x] Task 3: Refactor Stats Cards
- [x] Task 4: Refactor Charts
- [x] Task 5: Refactor Recent Transactions
- [x] Task 6: Verification

## Execution Order
1. ✅ Task 1: Update API Types
2. ✅ Task 2: Implement Data Fetching
3. ✅ Task 3: Refactor Stats Cards
4. ✅ Task 4: Refactor Charts
5. ✅ Task 5: Refactor Recent Transactions
6. ✅ Task 6: Verification


## Acceptance Criteria
- [ ] Dashboard displays accurate stats from backend.
- [ ] Pie chart and Line chart show correct data from backend.
- [ ] Recent transactions list matches backend response.
- [ ] No regressions in responsiveness or UI.
- [ ] Build passes without errors.
