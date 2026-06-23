let posthogInstance = null;
const queue = [];

const token = import.meta.env.VITE_PUBLIC_POSTHOG_KEY;
const host = import.meta.env.VITE_PUBLIC_POSTHOG_HOST;
const isInitialized = !!token;

if (isInitialized && typeof window !== 'undefined') {
  const initPostHog = async () => {
    try {
      const { default: ph } = await import('posthog-js');
      const hostname = window.location.hostname;
      const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '';

      ph.init(token, {
        api_host: host || 'https://us.i.posthog.com',
        person_profiles: 'always',
        cookie_domain: isLocalhost ? undefined : hostname,
      });
      posthogInstance = ph;
      
      // Flush queue
      while (queue.length > 0) {
        const { method, args } = queue.shift();
        if (typeof posthogInstance[method] === 'function') {
          posthogInstance[method](...args);
        }
      }
    } catch (err) {
      console.error('Failed to load PostHog:', err);
    }
  };

  // Initialize PostHog after page load / when idle to not block initial render
  if (window.requestIdleCallback) {
    window.requestIdleCallback(() => setTimeout(initPostHog, 1000));
  } else {
    window.addEventListener('load', () => setTimeout(initPostHog, 1000));
  }
} else if (!isInitialized) {
  console.warn('PostHog analytics token not found. Analytics is disabled.');
}

const posthogProxy = {
  capture: (event, properties) => {
    if (posthogInstance) {
      posthogInstance.capture(event, properties);
    } else if (isInitialized) {
      queue.push({ method: 'capture', args: [event, properties] });
    } else {
      console.log(`[PostHog Disabled] Capture: ${event}`, properties);
    }
  },
  identify: (distinctId, userProperties) => {
    if (posthogInstance) {
      posthogInstance.identify(distinctId, userProperties);
    } else if (isInitialized) {
      queue.push({ method: 'identify', args: [distinctId, userProperties] });
    }
  }
};

export default posthogProxy;
