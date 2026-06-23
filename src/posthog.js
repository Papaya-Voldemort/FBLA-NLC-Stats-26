import posthog from 'posthog-js'

const token = import.meta.env.VITE_PUBLIC_POSTHOG_KEY
const host = import.meta.env.VITE_PUBLIC_POSTHOG_HOST

const isInitialized = !!token

if (isInitialized) {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : ''
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === ''

  posthog.init(token, {
    api_host: host || 'https://us.i.posthog.com',
    person_profiles: 'always',
    cookie_domain: isLocalhost ? undefined : hostname,
  })
} else {
  console.warn('PostHog analytics token not found. Analytics is disabled.')
}

// Export a fallback mock object if disabled to prevent errors
const posthogProxy = isInitialized ? posthog : {
  capture: (event, properties) => {
    console.log(`[PostHog Disabled] Capture: ${event}`, properties)
  }
}

export default posthogProxy

