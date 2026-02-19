## 2024-05-22 - Input Clear Button Pattern
**Learning:** For inputs with right-aligned action buttons (like "Analyze"), placing a "Clear" button requires absolute positioning to the left of the action button and significantly increasing the input's right padding (`pr-48` vs `pr-32`) to prevent text overlap.
**Action:** When adding secondary actions to inputs, always verify padding and ensure focus returns to the input after the action.
