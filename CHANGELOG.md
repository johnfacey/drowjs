# Changelog

All notable changes to this project will be documented in this file.

## [1.0.2] - 2025-05-08

### Added
- **Deep Reactivity**: Implemented recursive Proxies in the component state, allowing nested object mutations to trigger re-renders automatically.
- **TypeScript Support**: Added `drow.d.ts` definition file to provide full autocomplete and type safety in supported editors.
- **`this.emit()` Helper**: Added a built-in method for components to dispatch custom events easily.
- **`d-cloak` Directive**: New directive to hide unrendered templates until the component is fully initialized, preventing flickering (FOUC).
- **`d-bind` Directive**: Added support for reactive attribute binding (e.g., `d-bind:src`, `d-bind:href`).
- **Enhanced `d-for`**: Added support for iterating over arrays of objects using dot notation (e.g., `{{item.name}}`).
- **Lifecycle Hooks**: Formally documented and improved `init()` and `disconnected()` hooks for better resource management.
- **Global Store Demos**: Added interactive examples to `index.html` showing cross-component state synchronization.

### Changed
- **Rendering Engine Refactor**: 
    - Switched to Regex-based interpolation for significantly faster template processing.
    - Implemented **Dirty Checking**: The library now compares the generated HTML string and skips DOM updates if the content hasn't changed.
    - Improved focus and text selection restoration logic during re-renders.
- **Documentation**: 
    - Major update to `README.md` including core concepts, directives reference, and advanced usage patterns.
    - Updated `index.html` with a modern, dark-themed hero section and interactive feature cards.
    - Pointed all documentation links to the project's GitHub `docs/` subfolder.

### Fixed
- Fixed issues where input focus was lost during high-frequency state updates.
- Corrected `package.json` to properly include the `types` field and the `.d.ts` file in the npm bundle.
- Improved `d-for` cleanup logic to prevent duplicate renders in the Light DOM.

---
*Initial versions (1.0.0 - 1.0.1) focused on the core Object-First API and basic registration.*