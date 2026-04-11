# Plan: Mobile Responsive Overhaul

## Objective

Make the entire Finance Web App fully responsive and usable on mobile devices (320px–768px screens), ensuring a seamless experience from small phones to desktop.

## Current State Analysis

The app already has **partial** mobile responsiveness:
- ✅ Sidebar slidesides in/out on mobile with overlay
- ✅ Topbar has hamburger menu button (hidden on `lg:`)
- ✅ Search bar hidden on mobile (`hidden sm:flex`)
- ✅ Dashboard stats cards use `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
- ✅ Charts use Recharts `ResponsiveContainer` with `width="100%"`
- ✅ Wishlist cards use `grid-cols-1 lg:grid-cols-2`

### Identified Issues

| # | Area | Issue | Severity |
|---|------|-------|----------|
| 1 | **All Page Headers** (Income, Expenses, Wishlist, Savings) | `flex items-center justify-between` with title + buttons on same line — will overflow/squish on screens < 400px | High |
| 2 | **Transaction List Items** (Income, Expenses, Savings) | `flex items-center justify-between` with icon + content + amount + delete button on one row — text truncation missing, amounts can push off-screen on narrow viewports | High |
| 3 | **Dialog Forms** | Dialog content has no `max-h-[90vh]` or `overflow-y-auto` — on small screens, long forms can extend beyond viewport | Medium |
| 4 | **Dashboard Recent Transactions** | Transaction rows have category name + date + amount inline — category names can be long, no truncation | Medium |
| 5 | **Wishlist Cards** | Two-column grid on `lg:` is fine, but card internal layout has no spacing adjustments on small screens | Low |
| 6 | **Savings Goals Breakdown** | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` — fine, but card content could use better padding on mobile | Low |
| 7 | **Stats Card Amounts** | `text-2xl` font-bold for large IDR amounts (e.g., "Rp 15,000,000") can overflow on very small screens (< 360px) | Medium |
| 8 | **Quick Insights Card** | Long category names in bullet points can overflow on mobile | Low |
| 9 | **Budget Progress** | Category name + amount on same line can wrap poorly | Low |
| 10 | **Touch Targets** | Some buttons/interactive elements are smaller than 44px recommended touch target | Medium |

## Implementation Strategy

### Phase 1: Critical Layout Fixes (High Severity)
1. **Page Headers** — Stack title and buttons vertically on mobile using `flex-col sm:flex-row` with `gap` spacing
2. **Transaction List Items** — Add `min-w-0` and `truncate` to text elements, stack amount below content on very small screens
3. **Dialog Overflow** — Add `max-h-[85vh] overflow-y-auto` to dialog content wrappers

### Phase 2: Content Readability (Medium Severity)
4. **Dashboard Transactions** — Add text truncation, responsive font sizing
5. **Stats Card Amounts** — Use responsive font sizes (`text-xl sm:text-2xl`) for long amounts
6. **Touch Targets** — Ensure all interactive elements meet minimum 44px touch targets

### Phase 3: Polish (Low Severity)
7. **Wishlist Card Spacing** — Adjust internal padding on mobile (`p-4 sm:p-5`)
8. **Savings Goal Cards** — Better mobile padding
9. **Quick Insights** — Add text wrapping for long content
10. **Budget Progress** — Stack label and amount on mobile

## Files to Modify

1. `src/app/pages/IncomePage.tsx` — Header, transaction items, dialog
2. `src/app/pages/ExpensesPage.tsx` — Header, transaction items, dialog, budget section
3. `src/app/pages/WishlistPage.tsx` — Header, card spacing, dialog
4. `src/app/pages/SavingsPage.tsx` — Header, transaction items, dialog
5. `src/app/pages/Dashboard.tsx` — Recent transactions, stats amounts, insights
6. `src/app/components/Sidebar.tsx` — Already good, minor touch target improvements
7. `src/app/components/Topbar.tsx` — Already good, no changes needed
8. `src/components/ui/dialog.tsx` — Add mobile-friendly max-height/scroll

## Testing Approach

- Use browser dev tools to test at breakpoints: 320px, 375px, 414px, 768px, 1024px
- Verify no horizontal scrolling at any viewport
- Verify all interactive elements are tappable
- Verify text remains readable at all sizes
