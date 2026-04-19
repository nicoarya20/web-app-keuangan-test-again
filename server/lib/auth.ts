import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from './prisma'

const isProduction = process.env.NODE_ENV === 'production'

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: (process.env.BETTER_AUTH_URL || 'https://web-app-keuangan-test-again.vercel.app') + '/api/auth',
  trustedOrigins: [
    'https://web-app-keuangan-test-again.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  user: {
    additionalFields: {},
  },
  advanced: {
    cookies: {
      session_token: {
        name: 'better-auth.session_token',
        options: {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          secure: process.env.NODE_ENV === 'production',
        },
      },
    },
  },
})

export type Session = typeof auth.$Infer.Session
