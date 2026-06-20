import posthog from 'posthog-js'

const token = import.meta.env.VITE_PUBLIC_POSTHOG_KEY
const host = import.meta.env.VITE_PUBLIC_POSTHOG_HOST

const isInitialized = !!token

if (isInitialized) {
  posthog.init(token, {
    api_host: host || 'https://us.i.posthog.com',
    person_profiles: 'identified_only',
  })
} else {
  console.warn('PostHog analytics token not found. Analytics is disabled.')
}

// Export a proxy to prevent errors/warnings and log to console if disabled
const posthogProxy = new Proxy(posthog, {
  get(target, prop) {
    if (!isInitialized) {
      if (prop === 'capture') {
        return (event, properties) => {
          console.log(`[PostHog Disabled] Capture: ${event}`, properties)
        }
      }
      if (typeof target[prop] === 'function') {
        return () => {}
      }
    }
    return target[prop]
  }
})

export default posthogProxy

