import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter({
      out: 'build'
    }),
    files: {
      assets: 'public'
    },
    csp: {
      mode: 'hash',
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'", 'https://us-assets.i.posthog.com'],
        'style-src': ["'self'", 'https://fonts.googleapis.com'],
        'font-src': ["'self'", 'https://fonts.gstatic.com'],
        'connect-src': ["'self'", 'https://us.i.posthog.com', 'https://us-assets.i.posthog.com', 'https://api.iconify.design'],
        'img-src': ["'self'", 'data:', 'https://fbla.elinelson.dev'],
        'frame-ancestors': ["'none'"]
      }
    }
  }
};

export default config;
