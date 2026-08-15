# NLC Stats

This repository contains an interactive single page dashboard built to search and visualize competitive event schedules and registrations for the 2026 FBLA National Leadership Conference. The dashboard tracks registrations across High School and Middle School divisions, local chapters, and state associations.

## Architecture

The project is structured as a component-driven Single Page Application built on the Svelte 5 framework and bundled with Vite.

Key technologies used:
* **Svelte 5**: Leverages the Svelte 5 Runes reactivity system for state management, filters, and rendering.
* **Vite**: Provides fast bundling and development rebuilding.
* **Chart.js**: Configured with reactive themes to visualize divisions share, team configurations, state registrations, and hourly active schedules.
* **@sveltejs/adapter-vercel**: Adapts the SvelteKit application for serverless edge deployment on Vercel.

## Directory Structure

```text
├── index.html          # HTML entry point and Svelte app mount element
├── package.json        # Node dependencies and build scripts
├── vite.config.js      # Vite and Svelte plugin configuration
├── parse_data.py       # Python script that parsed raw schedules text into JSON
├── data.json           # Extracted structured registration data
├── src/
│   ├── main.js         # Svelte mount script
│   ├── app.css         # Styling stylesheet with FBLA colors and themes
│   ├── App.svelte      # Root container managing global state and loading
│   └── components/
│       ├── Header.svelte             # Navbar, logos, and theme toggling
│       ├── Overview.svelte           # Dashboard KPI cards and Chart.js canvases
│       ├── EventExplorer.svelte      # Unified event sidebar list and schedules table
│       ├── StateSchoolExplorer.svelte# Interconnected 3-column roster explorer
│       └── CompetitorFinder.svelte   # Master competitor schedule lookup with pagination
```

## Data Extraction

The source data was extracted from a conference schedule document containing 843 pages of scheduled times.

The parsing pipeline is defined in `parse_data.py`:
1. The raw text is extracted using python-pypdf.
2. The parser scans the text line-by-line using state name lines as anchors to identify school names, competitor lists, and scheduled arrival times.
3. False positive state name matches are prevented by checking state values against a validated set of FBLA state associations.
4. Cleaned event names group similar preliminary runs into unified events.

## Local Installation

Ensure Bun is installed on your environment.

1. Install all dependencies:
```bash
bun install
```

2. Run the development server locally:
```bash
bun run dev
```

3. Open your browser and navigate to the address shown in your terminal (typically http://localhost:5173).

## Production Build and Execution

To package the application for production deployment:

```bash
# Compile and bundle code
bun run build

# Preview the production build locally
bun run preview
```

## Vercel Deployment

This project is configured for serverless edge deployment on Vercel using `@sveltejs/adapter-vercel`.

When deployed on Vercel:
1. Vercel automatically detects SvelteKit and runs `bun run build`.
2. Static assets and serverless function endpoints are generated for maximum efficiency.
3. Edge caching headers (`s-maxage`, `stale-while-revalidate`) allow CDN edge nodes to serve requests instantly with minimal function invocations, reducing hosting costs.

## License

This project is open-source software licensed under the [GNU Affero General Public License v3.0 (AGPL-3.0)](file:///Users/elinelson/Documents/Development/NLC_26_Breakdown/LICENSE).

Under the terms of this license:
* You are free to copy, modify, distribute, and run this application.
* If you host or run this application on a network server (for example, as a web service or SaaS product), you must make the corresponding source code of the application available to your users under the same license terms.
* All modifications and derivatives must be open-sourced under the AGPL-3.0.
