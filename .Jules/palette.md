## 2024-03-24 - Accessibility Pattern: Form Controls in SvelteKit Dashboard
**Learning:** In highly compact, dashboard-style Svelte components (like CompetitorFinder), explicit visible `<label>` elements are often omitted to save screen space, leading to poor screen reader experiences for complex filter inputs.
**Action:** Always verify that every standalone `<input>` and `<select>` in a filter row or search bar includes a descriptive `aria-label` attribute if a visible label is missing.
