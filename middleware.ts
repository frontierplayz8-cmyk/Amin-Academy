import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const response = NextResponse.next()

    // 🛡️ Security Headers (Production Hardening)

    // 1. CSP (Content Security Policy) - Report Only initially to avoid breaking things
    // We allow scripts from self, google (firebase, analytics), and inline (unsafe-inline is common necessity, strive to remove)
    const csp = `
        default-src 'self';
        script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.googletagmanager.com;
        connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com https://*.firebaseio.com https://generativelanguage.googleapis.com;
        img-src 'self' data: https://*.googleusercontent.com https://firebasestorage.googleapis.com;
        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
        font-src 'self' https://fonts.gstatic.com;
        frame-src 'self' https://*.firebaseapp.com;
        object-src 'none';
        base-uri 'self';
    `.replace(/\s{2,}/g, ' ').trim()

    // response.headers.set('Content-Security-Policy', csp)

    // 2. HSTS (HTTP Strict Transport Security)
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')

    // 3. X-Content-Type-Options
    response.headers.set('X-Content-Type-Options', 'nosniff')

    // 4. Referrer Policy
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

    // 5. Permissions Policy (Feature Policy)
    response.headers.set('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=()')

    // 🤖 Basic "Machine-vs-Machine" Defense (Bot Block)
    const userAgent = request.headers.get('user-agent') || ''
    const badBots = ['GPTBot', 'ChatGPT-User', 'Google-Extended', 'CCBot', 'Omgilibot', 'FacebookBot']

    if (badBots.some(bot => userAgent.includes(bot))) {
        return new NextResponse('Bot access denied', { status: 403 })
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        {
            source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
            missing: [
                { type: 'header', key: 'next-router-prefetch' },
                { type: 'header', key: 'purpose', value: 'prefetch' },
            ],
        },
        // Apply to API routes as well for headers
        '/api/:path*',
    ],
}
