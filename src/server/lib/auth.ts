import { betterAuth } from 'better-auth'
import { db } from './db'

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: (process.env.BETTER_AUTH_URL || 'https://web-app-keuanganku.vercel.app') + '/api/auth',
  trustedOrigins: [
    'https://web-app-keuanganku.vercel.app',
    'https://web-app-keuangan-test-again.vercel.app',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:3000',
  ],
  database: db,  // pg.Pool — same connection pool as app routes, no Prisma binary needed
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
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
