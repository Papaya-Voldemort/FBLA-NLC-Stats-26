# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the NLC 2026 Breakdown Svelte app. A new `src/posthog.js` singleton was created to initialize `posthog-js` (the browser SDK) using environment variables. PostHog is initialized in `src/main.js` before the app mounts, ensuring all subsequent events are captured from the first user interaction. Eleven events were instrumented across five components, covering the full user journey from initial data load through deep exploration of events, states, schools, and competitors. The filter dropdowns in `CompetitorFinder` were refactored from `bind:value` to explicit `onchange` handlers to enable per-interaction tracking without disrupting existing reactivity.

| Event Name | Description | File |
|---|---|---|
| `data loaded` | The app successfully fetches and processes the NLC registration data on mount. | `src/App.svelte` |
| `tab switched` | User navigates between the Overview, Events, States & Schools, or Search tabs. | `src/App.svelte` |
| `theme toggled` | User switches between dark and light mode. | `src/App.svelte` |
| `event detail viewed` | User selects a specific competitive event to view its schedule and participant details. | `src/components/EventExplorer.svelte` |
| `event list sorted` | User changes the sort order of the events list (name, commit rate, competitors, or teams). | `src/components/EventExplorer.svelte` |
| `state selected` | User selects a state in the Interactive State & School Explorer to drill into its chapters. | `src/components/StateSchoolExplorer.svelte` |
| `school roster viewed` | User opens a school chapter's full student roster in the explorer. | `src/components/StateSchoolExplorer.svelte` |
| `state event roster viewed` | User views all entries for a specific event from a selected state. | `src/components/StateSchoolExplorer.svelte` |
| `competitor searched` | User enters a search query in the Master Competitor Finder (debounced, 2+ chars). | `src/components/CompetitorFinder.svelte` |
| `competitor filter changed` | User applies a division, state, or team-size filter in the Competitor Finder. | `src/components/CompetitorFinder.svelte` |
| `overview event clicked` | User clicks an event from the Top 10 Most Popular Events list on the Overview tab. | `src/components/Overview.svelte` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics (wizard) — Dashboard](https://us.posthog.com/project/479271/dashboard/1740121)
- [Daily Active Users](https://us.posthog.com/project/479271/insights/5gBqetXG)
- [Tab Navigation Popularity](https://us.posthog.com/project/479271/insights/h2deiuar)
- [Feature Engagement Trends](https://us.posthog.com/project/479271/insights/jod81hJA)
- [Deep Exploration Activity](https://us.posthog.com/project/479271/insights/7PjhPJHm)
- [Search & Filter Usage](https://us.posthog.com/project/479271/insights/bw1g3QE6)

## Verify before merging

- [ ] Run a full production build (the wizard only verified the files it touched) and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite — call sites that were rewritten or instrumented may need updated mocks or fixtures.
- [ ] Add `VITE_PUBLIC_POSTHOG_KEY` and `VITE_PUBLIC_POSTHOG_HOST` to `.env.example` and any bootstrap scripts so collaborators know what to set.
- [ ] Wire source-map upload (`posthog-cli sourcemap` or your bundler's upload step) into CI so production stack traces de-minify.

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.
