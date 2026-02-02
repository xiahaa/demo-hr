## 2025-02-18 - [Form Accessibility in Dark Mode Bento Grids]
**Learning:** In minimalist, dark-themed UIs where labels are often omitted for aesthetics (using placeholders instead), adding `aria-label` is crucial for screen readers. Also, visual feedback for disabled states on "floating" buttons inside inputs is essential to prevent user frustration when clicking without input.
**Action:** Always check "search-bar style" inputs for `aria-label` and ensure the action button has a clear disabled state if it's visually integrated into the input field.

## 2025-02-19 - [Async Feedback Accessibility]
**Learning:** Visual loading indicators (spinners, progress bars) are invisible to screen readers unless explicitly marked. A simple `aria-live="polite"` region turns a silent wait into an informed process.
**Action:** Always wrap dynamic status text in `role="status"` or `aria-live="polite"` and ensure progress bars have `role="progressbar"` with value attributes.
