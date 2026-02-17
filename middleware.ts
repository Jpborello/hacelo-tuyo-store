import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function middleware(req: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request: req,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return req.cookies.getAll()
                },
                setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
                    cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request: req,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { session },
    } = await supabase.auth.getSession()

    let comercio = null;
    if (session) {
        const { data } = await supabase
            .from('comercios')
            .select('estado')
            .eq('user_id', session.user.id)
            .single();
        comercio = data;
    }

    // Proteger rutas /admin
    if (req.nextUrl.pathname.startsWith('/admin')) {
        if (!session) {
            return NextResponse.redirect(new URL('/login', req.url))
        }

        const isAdmin = session.user.email === process.env.ADMIN_EMAIL;

        // Admin Bypass: Permitir acceso al backoffice sin comercio
        if (isAdmin && req.nextUrl.pathname.startsWith('/admin/backoffice')) {
            return supabaseResponse;
        }

        // Check account status
        // If account is suspended, redirect to suspended page
        if (comercio?.estado === 'suspendido') {
            return NextResponse.redirect(new URL('/suspended', req.url))
        }

        // If no comercio found, redirect to register
        if (!comercio) {
            return NextResponse.redirect(new URL('/register', req.url))
        }
    }

    // Redirigir a dashboard si ya está autenticado y va a /login
    // SOLO si tiene comercio activo. Si no tiene comercio, lo dejamos en login
    // para que pueda entrar con otra cuenta.
    if (req.nextUrl.pathname === '/login' && session && comercio) {
        return NextResponse.redirect(new URL('/admin/dashboard', req.url))
    }

    return supabaseResponse
}

export const config = {
    matcher: ['/admin/:path*', '/login'],
}
