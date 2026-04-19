# Summary: Authentication Flow Improvement

## Changes
- **RequireAuth.tsx:** Removed `window.location.href` redirect. Now returns `<LoginPage />` when `session` is null.
- **routes.tsx:** Moved `RequireAuth` to the parent level of `RootLayout`. Removed redundant `RequireAuth` wrappers from child routes.
- **LoginPage.tsx:** Added `useEffect` to redirect already-logged-in users. Removed `callbackURL` from `signIn` to allow SPA-style navigation.

## Verification Results
- Manual Verification: Root URL correctly displays Login for guest and Dashboard for user.
- Build Verification: Successful `bun run build`.
