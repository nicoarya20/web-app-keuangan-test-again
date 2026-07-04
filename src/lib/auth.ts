import { createAuthClient } from 'better-auth/react'

// Di dev: pakai window.location.origin supaya request lewat Vite proxy → backend
// Di prod: pakai Vercel URL (same-origin, tidak perlu CORS)
const getAuthBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/api$/, '')
  }
  return import.meta.env.PROD
    ? 'https://web-app-keuangan-test-again.vercel.app'
    : window.location.origin
}

export const authClient = createAuthClient({
  baseURL: getAuthBaseURL(),
})

export const { signIn, signUp, signOut, useSession } = authClient
