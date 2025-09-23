## Feature Expansion Plan

- Extend each card's layout with a top notes accordion section that toggles against the existing to-do list; default both collapsed on mobile and keep notes expanded on desktop for quick editing.
- Add a shared accordion component (keyboard accessible) with labeled headers [ Notes | To-Do ]; maintain state per card so the user's last view persists via local storage.
- Introduce a rich-text capable textarea (autosave on blur or debounce) for notes; store alongside existing card data and include a migration to add notes and optional accordionState fields.
- Wire an "Open All Images" button in the card header; when clicked, gather picture URLs and launch them with window.open in a controlled loop with a pop-up messaging fallback.
- Update the card data model, API (if any), and tests to cover notes persistence, accordion toggling, and image button behavior; refresh README and design docs accordingly.
