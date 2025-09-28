import CredentialsProvider from 'next-auth/providers/credentials'
import { validateUser } from './auth'

export const authOptions = {
  adapter: undefined, // Use JWT strategy instead of database adapter
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('Missing credentials')
          return null
        }

        try {
          console.log('Attempting to validate user:', credentials.email)
          const user = await validateUser(credentials.email, credentials.password)
          
          if (user) {
            console.log('User validated successfully:', user.email)
            return {
              id: user.id,
              name: user.name,
              email: user.email,
            }
          }
          
          console.log('User validation failed - user not found or invalid password')
          return null
        } catch (error) {
          console.error('Auth error:', error)
          console.error('Error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
          })
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours - update session every 24 hours
  },
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: any) {
      if (token.id && session.user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).id = token.id as string
      }
      return session
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async redirect({ url, baseUrl }: any) {
      console.log('NextAuth redirect called with:', { url, baseUrl })
      
      // Allows relative callback URLs
      if (url.startsWith("/")) {
        const redirectUrl = `${baseUrl}${url}`
        console.log('Redirecting to relative URL:', redirectUrl)
        return redirectUrl
      }
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) {
        console.log('Redirecting to same origin URL:', url)
        return url
      }
      
      const defaultRedirect = `${baseUrl}/dashboard`
      console.log('Redirecting to default:', defaultRedirect)
      return defaultRedirect
    },
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
  trustHost: true, // Required for Vercel
  useSecureCookies: process.env.NODE_ENV === 'production',
  logger: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    error(code: any, metadata?: any) {
      console.error('NextAuth Error:', code, metadata)
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    warn(code: any) {
      console.warn('NextAuth Warning:', code)
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    debug(code: any, metadata?: any) {
      console.log('NextAuth Debug:', code, metadata)
    }
  }
}
