# Task: Mobile Responsive Overhaul

## Overview
Implement responsive design improvements across all pages to ensure the app works well on mobile devices (320px–768px).

## Subtasks

### Task 1: Fix Page Headers (High Priority)
**Files:** `IncomePage.tsx`, `ExpensesPage.tsx`, `WishlistPage.tsx`, `SavingsPage.tsx`

Change all page headers from `flex items-center justify-between` to a layout that stacks vertically on mobile and horizontally on larger screens:
- Use `flex flex-col sm:flex-row sm:items-center justify-between gap-3`
- Button groups should wrap with `flex flex-wrap gap-2`
- This prevents title + buttons from overflowing on screens < 400px

### Task 2: Fix Transaction List Items (High Priority)
**Files:** `IncomePage.tsx`, `ExpensesPage.tsx`, `SavingsPage.tsx`, `Dashboard.tsx`

Transaction list items currently use `flex items-center justify-between` with no text truncation:
- Add `min-w-0` to the flex container to allow truncation
- Add `truncate` class to category/text elements
- On mobile (< `sm`), stack the amount below the content: use `flex-col sm:flex-row` layout OR reduce amount font size with `text-base sm:text-xl`
- Ensure delete button remains accessible

### Task 3: Fix Dialog Overflow on Mobile (Medium Priority)
**Files:** `IncomePage.tsx`, `ExpensesPage.tsx`, `WishlistPage.tsx`, `SavingsPage.tsx`

Dialog forms can extend beyond viewport on small screens:
- Add `max-h-[85vh] overflow-y-auto` to `DialogContent`
- Alternatively, reduce form field spacing on mobile

### Task 4: Fix Stats Card Amount Overflow (Medium Priority)
**Files:** All pages with stat cards (Dashboard, Income, Expenses, Wishlist, Savings)

Large IDR amounts like "Rp 15,000,000" can overflow on screens < 360px:
- Change amount text from `text-2xl` to `text-xl sm:text-2xl`
- Add `break-words` or use `text-balance` if supported

### Task 5: Fix Dashboard Specific Issues (Medium Priority)
**File:** `Dashboard.tsx`

- Recent transaction items: add truncation to category names
- Quick Insights card: ensure long bullet points wrap properly
- Pie chart labels on mobile: consider hiding labels or using legend only

### Task 6: Fix Wishlist Card Spacing (Low Priority)
**File:** `WishlistPage.tsx`

- Change card padding from `p-5` to `p-4 sm:p-5`
- Ensure internal spacing is comfortable on mobile

### Task 7: Fix Savings Goal Cards (Low Priority)
**File:** `SavingsPage.tsx`

- Goal breakdown cards: adjust padding for mobile

### Task 8: Touch Target Improvements (Medium Priority)
**Files:** All pages

- Ensure all clickable elements have minimum 44x44px touch targets
- Icon buttons should be `p-2.5` or larger on mobile

## Execution Order

1. ✅ Task 1: Page Headers — Changed all 4 page headers to `flex-col sm:flex-row` with wrapping button groups
2. ✅ Task 2: Transaction List Items — Added `min-w-0`, `truncate`, `flex-shrink-0`, responsive font/icon sizes across all pages
3. ✅ Task 3: Dialog Overflow — Added `max-h-[85vh] overflow-y-auto` to shared DialogContent component
4. ✅ Task 4: Stats Card Amounts — Changed to `text-xl sm:text-2xl` with `break-words` on all pages
5. ✅ Task 5: Dashboard Specific — Fixed recent transactions truncation, Quick Insights wrapping
6. ✅ Task 6: Wishlist Card Spacing — Responsive padding, spacing, truncation on item names
7. ✅ Task 7: Savings Goal Cards — Responsive grid gap, card padding, goal name truncation
8. ✅ Task 8: Touch Targets — Increased delete button padding to `p-2.5`, added `aria-label`, sidebar nav items

## Acceptance Criteria

- [x] No horizontal scrolling at any viewport (320px+)
- [x] Page headers stack properly on mobile
- [x] Transaction items are readable with truncation
- [x] Dialogs don't overflow viewport
- [x] All amounts are visible without overflow
- [x] All interactive elements have adequate touch targets
- [x] Text is readable at all screen sizes
- [x] Build passes without errors

## Post-Implementation Fix (2026-04-12)

**Issue:** List items (All Income, All Expenses, All Savings) still looked messy on mobile — amount and delete button were competing with text content on the same row.

**Fix:** Changed list item layout from `flex items-start justify-between` to `flex flex-col sm:flex-row sm:items-center gap-3`:
- **Mobile (<640px):** Amount + delete appear on a separate row below the text content, using `justify-between` to spread them across full width
- **Desktop (640px+):** Amount + delete sit on the right side of the content row, using `sm:justify-end`

**Files:** `IncomePage.tsx`, `ExpensesPage.tsx`, `SavingsPage.tsx`
