import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  // Keep OAuth PKCE cookies and callback on one origin. A cross-domain callback
  // can lose the stored OAuth state and strand viewers on an error screen.
  const host = request.nextUrl.hostname.toLowerCase();
  if (host === "1muslim.vercel.app" || host === "www.1muslim.live" || host === "1muslimlive.com" || host === "www.1muslimlive.com") {
    const canonical = new URL(request.nextUrl.pathname + request.nextUrl.search, "https://1muslim.live");
    return NextResponse.redirect(canonical, 307);
  }
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );

          supabaseResponse = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );

          Object.entries(headers).forEach(([key, value]) => {
            supabaseResponse.headers.set(key, value);
          });
        },
      },
    }
  );

  // Guests may view the landing page, but must sign in before navigating elsewhere.
  // Keep auth callbacks, static assets, legal pages and API endpoints accessible.
  const pathname = request.nextUrl.pathname;
  const guestAllowed = pathname === "/" || pathname.startsWith("/auth") ||
    pathname.startsWith("/terms") || pathname.startsWith("/privacy") ||
    pathname.startsWith("/api/") || pathname.startsWith("/_next/") ||
    pathname.startsWith("/assets/") || pathname.startsWith("/videos/") ||
    pathname.startsWith("/favicon") || pathname.startsWith("/robots") ||
    pathname.startsWith("/sitemap") || pathname.startsWith("/.well-known/") ||
    /\\.[a-z0-9]{2,6}$/i.test(pathname);
  // Production launch lock: protect every application route on the server.
  // Preview deployments are unaffected. A verified admin email is checked from
  // the authenticated Supabase user, not from client-side UI state.
  const productionHost = host === "1muslim.live";
  const publicLaunchRoute = pathname === "/" || pathname.startsWith("/auth") ||
    pathname.startsWith("/terms") || pathname.startsWith("/privacy") ||
    pathname.startsWith("/api/") || pathname.startsWith("/_next/") ||
    pathname.startsWith("/assets/") || pathname.startsWith("/videos/") ||
    pathname.startsWith("/favicon") || pathname.startsWith("/robots") ||
    pathname.startsWith("/sitemap") || pathname.startsWith("/.well-known/");
  if (productionHost && !publicLaunchRoute) {
    const { data: { user } } = await supabase.auth.getUser();
    const isAdmin = !!user && !!user.email_confirmed_at &&
      user.email?.toLowerCase() === "hudhudbyelmi@gmail.com";
    if (!isAdmin) {
      const landing = request.nextUrl.clone();
      landing.pathname = "/";
      landing.search = "";
      landing.searchParams.set("coming_soon", "1");
      const redirect = NextResponse.redirect(landing);
      supabaseResponse.cookies.getAll().forEach(cookie => redirect.cookies.set(cookie));
      return redirect;
    }
  }
  if (!guestAllowed) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/auth";
      loginUrl.search = "";
      loginUrl.searchParams.set("next", pathname + request.nextUrl.search);
      const redirect = NextResponse.redirect(loginUrl);
      supabaseResponse.cookies.getAll().forEach(cookie => redirect.cookies.set(cookie));
      return redirect;
    }
  } else {
    await supabase.auth.getClaims();
  }
  return supabaseResponse;
}
