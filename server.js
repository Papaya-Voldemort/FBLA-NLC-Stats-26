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

  // Otherwise, serve static assets normally
  serve(req, res);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});
