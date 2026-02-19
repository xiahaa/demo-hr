## 2025-02-18 - [Form Accessibility in Dark Mode Bento Grids]
**Learning:** In minimalist, dark-themed UIs where labels are often omitted for aesthetics (using placeholders instead), adding `aria-label` is crucial for screen readers. Also, visual feedback for disabled states on "floating" buttons inside inputs is essential to prevent user frustration when clicking without input.
**Action:** Always check "search-bar style" inputs for `aria-label` and ensure the action button has a clear disabled state if it's visually integrated into the input field.

## 2025-02-19 - [Async Feedback Accessibility]
**Learning:** Visual loading indicators (spinners, progress bars) are invisible to screen readers unless explicitly marked. A simple `aria-live="polite"` region turns a silent wait into an informed process.
**Action:** Always wrap dynamic status text in `role="status"` or `aria-live="polite"` and ensure progress bars have `role="progressbar"` with value attributes.

## 2026-02-03 - [Toggle Button State Accessibility]
**Learning:** Visual toggle states (e.g., changing background color on active sort buttons) are invisible to screen readers. `aria-pressed` provides the necessary semantic state for toggle buttons or filter groups where one item is active.
**Action:** Always add `aria-pressed={isActive}` to buttons that toggle state or act as exclusive filters.

## 2025-02-20 - [Dark Mode Focus Visibility]
**Learning:** In dark-themed, glassmorphism designs, default browser focus rings are often invisible against dark backgrounds or conflict with border styles. Interactive elements (cards, icon buttons) require explicit high-contrast focus rings (e.g., brand color) to be navigable by keyboard.
**Action:** Add `focus-visible:ring-2 focus-visible:ring-[brandColor] focus-visible:outline-none` to all interactive elements in dark mode interfaces.

## 2026-02-05 - [File Input Keyboard Accessibility]
**Learning:** Standard `input[type="file"]` elements hidden with `display: none` are inaccessible to keyboard users. Using `sr-only` (visually hidden) combined with the `peer` class allows the input to receive focus while styling the associated label with `peer-focus:ring` to provide visual feedback.
**Action:** Replace `hidden` with `sr-only peer` on file inputs and add `peer-focus:ring-*` styles to the label.

## 2026-02-07 - [Visible Labels for Secondary Inputs]
**Learning:** In minimalist "Bento" dark-mode forms, optional or secondary inputs (like scholar links or LinkedIn URLs) often omit labels for aesthetics, relying on placeholders. This hides context once the user starts typing and creates accessibility barriers.
**Action:** Always provide visible `<label>` text for form inputs, using `text-sm text-gray-400 font-medium` to balance readability with the minimalist design.

## 2026-02-21 - [Live Form Validation Accessibility]
**Learning:** Dynamic validation errors that appear below inputs are often missed by screen readers if they don't have an appropriate role. Using `role="alert"` ensures immediate announcement of critical validation failures without moving focus.
**Action:** Add `role="alert"` to container elements displaying dynamic form validation error messages.

## 2026-02-09 - [Visible Labels for Primary Search Inputs]
**Learning:** Even for primary, prominent "search-bar" style inputs in dark mode, relying solely on placeholders causes context loss when the user starts typing. A visible label, even if small, maintains context and improves accessibility for cognitive disabilities.
**Action:** Ensure all form inputs, including primary search bars, have a visible label, possibly positioned above the input to maintain the search bar aesthetic.

## 2026-02-10 - [State Preservation in Loading/Error States]
**Learning:** Replacing form components with loading/error screens via conditional rendering unmounts them, destroying user input. This forces users to retype data after a failed request or retry action.
**Action:** Use CSS visibility toggling (e.g., `hidden` vs `block`) instead of conditional rendering for forms to preserve state during temporary UI transitions like loading or error feedback.

## 2026-02-23 - [File Input UX Enhancement]
**Learning:** Standard file inputs lack drag-and-drop and clear functionality. Adding a visual drop zone (via `onDragOver/onDrop` on the label) and an explicit 'Clear' button improves usability significantly, especially for non-native file pickers.
**Action:** Enhance custom file inputs with drag-and-drop handlers on the label and a clear button that resets the file state.

## 2026-05-20 - [Semantic File Input Structure]
**Learning:** Nesting interactive elements (like a clear button) inside a `<label>` linked to a file input is invalid HTML and confuses screen readers. A robust pattern uses an absolute overlay label for the trigger and positions sibling buttons (e.g., Clear) above it with z-index.
**Action:** Refactor custom file inputs to use a container `div` with a sibling `label` (overlay) and `button` (z-indexed), avoiding nested interactive controls.

## 2026-05-22 - [Empty State Action Buttons]
**Learning:** Empty input fields are prime real estate for "accelerator" actions. Replacing the "Clear" button (which is useless when empty) with a "Paste" button reduces friction significantly for URL inputs.
**Action:** Implement context-aware action buttons inside inputs (e.g., Paste when empty, Clear when filled) to improve efficiency.
