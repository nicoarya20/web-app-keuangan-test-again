import { createAuthClient } from 'better-auth/react'

// Selalu pakai origin saat ini → bekerja di domain apapun tanpa hardcode
const getAuthBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/api$/, '')
  }
  return window.location.origin
}

export const authClient = createAuthClient({
  baseURL: getAuthBaseURL(),
})

export const { signIn, signUp, signOut, useSession } = authClient
