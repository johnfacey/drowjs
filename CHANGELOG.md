# Changelog

All notable changes to this project will be documented in this file.

## [1.0.3] - 2025-05-09

### Added
- **Nested Path Support**: Interpolation and directives now support dot notation (e.g., `{{store.key}}` or `{{user.profile.name}}`), enabling deep data access in templates.
- **Attribute Encoding Support**: Added automatic handling for URL-encoded characters (like `%7B%7B`) in `d-for` attribute interpolation, resolving broken images in galleries.

### Fixed
- **Component Isolation**: Implemented deep-cloning of initial state per instance to prevent unintended shared reactivity between multiple components of the same type.
- **Directive Resolution**: Fixed directives (`d-bind`, `d-if`, etc.) to correctly resolve values from the merged context, including Global Store and Computed properties.
- **Loop Insertion**: Corrected the DOM insertion point for `d-for` items to ensure elements are rendered as direct siblings to the template, maintaining CSS scoping.
- **Rendering Engine**: Removed an aggressive dirty-checking optimization that was preventing visual updates to attributes when the inner HTML structure remained identical.
- **Initialization Safety**: Added guard checks in the component constructor to prevent `TypeError` when components are registered without an explicit `init` method.

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