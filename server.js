import http from 'http';
import sirv from 'sirv';

const PORT = process.env.PORT || 5173;

// Serve files from 'dist' folder with single-page-application routing fallback
const serve = sirv('dist', {
  single: true,
  gzip: true,
  brotli: true
});

const server = http.createServer((req, res) => {
  const host = req.headers.host || '';

  // Redirect old Railway domain to the new custom domain
  if (host.includes('fbla-nlc-stats-26-production.up.railway.app')) {
    res.writeHead(301, {
      'Location': `https://fbla.elinelson.dev${req.url}`,
      'Cache-Control': 'public, max-age=31536000'
    });
    return res.end();
  }

  // Caching headers for performance optimization
  const url = req.url || '';
  if (url.startsWith('/assets/')) {
    // Immutable built chunks containing content hash
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (url.startsWith('/data/')) {
    // JSON database files
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
  } else if (url === '/favicon.svg' || url === '/robots.txt' || url === '/sitemap.xml') {
    // Static config/root assets
    res.setHeader('Cache-Control', 'public, max-age=86400');
  } else {
    // HTML and dynamic routes - always validate
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  }

  // Standard Security Headers
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy (CSP)
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://us-assets.i.posthog.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "connect-src 'self' https://us.i.posthog.com https://us-assets.i.posthog.com https://api.iconify.design; " +
    "img-src 'self' data: https://fbla.elinelson.dev; " +
    "frame-ancestors 'none';"
  );

  // Otherwise, serve static assets normally
  serve(req, res);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});
