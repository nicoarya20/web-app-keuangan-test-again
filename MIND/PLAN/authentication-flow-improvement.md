# Plan: Authentication Flow Improvement

## Goal
Improve the user experience during authentication by preventing hard redirects and ensuring the root URL dynamically switches between the Login view and the Dashboard.

## Strategy
1.  **Component-based Auth:** Modify `RequireAuth` to render the `LoginPage` component directly instead of using `window.location.href`.
2.  **Layout Protection:** Wrap the `RootLayout` in the router configuration with `RequireAuth` to ensure unauthenticated users see only the login screen.
3.  **Smooth Transitions:** Refine `LoginPage` to handle internal state updates and use React Router's `navigate` for zero-reload transitions.

## Impact
- Better UX: No flickering or full-page reloads when session expires.
- Clean URL Management: The root path (`/`) remains consistent while its content changes based on auth state.
