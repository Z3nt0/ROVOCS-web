import NextAuth from 'next-auth/next'
import { authOptions } from '@/lib/auth/auth-config'

const handler = NextAuth(authOptions)

export async function GET(request: Request) {
  try {
    return await handler(request)
  } catch (error) {
    console.error('NextAuth GET Error:', error)
    return new Response(
      JSON.stringify({ error: 'Authentication service error' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

export async function POST(request: Request) {
  try {
    return await handler(request)
  } catch (error) {
    console.error('NextAuth POST Error:', error)
    return new Response(
      JSON.stringify({ error: 'Authentication service error' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
