## 2024-05-18 - Form Controls Missing ARIA Labels
**Learning:** Found a recurring pattern across the app where search inputs and filter dropdowns lack explicit `<label>` text for visual cleanliness but also missed `aria-label` attributes. This breaks accessibility for screen reader users who rely on these labels to understand form inputs.
**Action:** Always verify that every `<input>` or `<select>` without an explicit `<label>` element has an `aria-label` describing its purpose to maintain screen reader accessibility while preserving a clean UI.
