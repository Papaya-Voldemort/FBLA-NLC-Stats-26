export async function handle({ event, resolve }) {
  const host = event.request.headers.get('host') || '';

  // Redirect old Railway domain to the new custom domain
  if (host.includes('fbla-nlc-stats-26-production.up.railway.app')) {
    return new Response(null, {
      status: 301,
      headers: {
        'Location': `https://fbla.elinelson.dev${event.url.pathname}${event.url.search}`,
        'Cache-Control': 'public, max-age=31536000'
      }
    });
  }

  const response = await resolve(event);

  // Caching headers for assets/data routes
  const pathname = event.url.pathname;
  if (pathname.startsWith('/_app/immutable/')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (pathname.startsWith('/data/')) {
    response.headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
  } else if (pathname === '/favicon.svg' || pathname === '/robots.txt' || pathname === '/sitemap.xml') {
    response.headers.set('Cache-Control', 'public, max-age=86400');
  }

  // Set standard security headers
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://us-assets.i.posthog.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "connect-src 'self' https://us.i.posthog.com https://us-assets.i.posthog.com https://api.iconify.design; " +
    "img-src 'self' data: https://fbla.elinelson.dev; " +
    "frame-ancestors 'none';"
  );

  return response;
}
