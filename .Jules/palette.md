## 2024-05-18 - Add missing aria-labels to form inputs
**Learning:** Found multiple `<input>` and `<select>` form controls in Svelte components that lack explicit visual `<label>` elements or `aria-label` attributes, which hurts accessibility for screen reader users.
**Action:** When creating form inputs that do not have associated visual text labels, always include descriptive `aria-label` attributes to maintain accessibility without altering layout.
