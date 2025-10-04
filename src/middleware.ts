import { withAuth } from 'next-auth/middleware'

export default withAuth(
  function middleware() {
    // Add any additional middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to auth pages, home page, and API routes without token
        if (req.nextUrl.pathname.startsWith('/auth/') || 
            req.nextUrl.pathname === '/' ||
            req.nextUrl.pathname.startsWith('/api/')) {
          return true
        }
        return !!token
      }
    },
  }
)

export const config = {
  matcher: [
    // Protect all dashboard and app pages
    '/dashboard',
    '/dashboard/:path*',
    '/device',
    '/device/:path*',
    '/reports',
    '/profile',
    '/reports/:path*',
    // Protect API routes that require authentication
    '/api/dashboard/:path*',
    '/api/devices/:path*',
    '/api/reports/:path*',
    '/api/breath-analysis/:path*',
    '/api/readings/:path*',
    '/api/activity/:path*'
  ]
}
