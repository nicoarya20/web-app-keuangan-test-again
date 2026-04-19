/**
 * Vercel Serverless Function Entry Point
 * 
 * This file is automatically detected by Vercel as a serverless function.
 * It re-exports the Hono app from the backend folder.
 * 
 * Path: /api/index.ts -> deployed as /api (catches /api/* routes)
 */

import app from '../backend/src/index'

// Vercel expects a default export of the request handler
export default app

