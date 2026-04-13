import { createAuthClient } from 'better-auth/react'

const isProduction = import.meta.env.PROD

// Better Auth baseURL (without /api suffix, as Better Auth adds /api/auth/*)
const getAuthBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    // Remove /api suffix if present
    return import.meta.env.VITE_API_URL.replace(/\/api$/, '')
  }
  return isProduction
    ? 'https://web-app-keuangan-test-again.vercel.app'
    : 'http://localhost:3000'
}

export const authClient = createAuthClient({
  baseURL: getAuthBaseURL(),
})

export const { signIn, signUp, signOut, useSession } = authClient
