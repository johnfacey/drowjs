# Changelog

All notable changes to this project will be documented in this file.

## [1.0.4] - 2025-06-09

### Added
- **Render Batching**: State mutations are now coalesced via `requestAnimationFrame`. Multiple synchronous state changes within the same frame trigger only a single DOM update.
- **Keyed `d-for` Diffing**: Add `d-key="{{item.id}}"` to a `d-for` element to enable efficient list patching. Drow reuses existing DOM nodes and only inserts/removes what changed, instead of rebuilding the entire list.
- **`d-for` Index Support**: Loop syntax now supports `(item, index) in items`, exposing `{{index}}` inside the loop body.
- **`d-else` / `d-else-if` Directives**: Conditional blocks can now chain naturally. Elements immediately following a `d-if` may carry `d-else-if="condition"` or `d-else` and will be resolved correctly.
- **`d-model` Deep Path Binding**: Two-way binding now supports nested state paths, e.g. `d-model="user.name"` reads and writes through the nested state object.
- **`updated()` Lifecycle Hook**: A new optional hook called after every render cycle. Useful for post-render DOM inspection or analytics.
- **`Drow.debug` Flag**: Defaults to `true`. Set `Drow.debug = false` in production to suppress all registration logs. In debug mode, Drow warns on missing hyphens in component names and unknown config keys.
- **TypeScript Definitions**: Added `drow.d.ts` with full type coverage for all config options, directives, lifecycle hooks, the global store, and `Drow.debug`.

### Fixed
- **Silent `watch` Errors**: Replaced the bare `try/catch` in `attributeChangedCallback` — `watch` is now only invoked when it is a function, and errors propagate normally.
- **Proxy Stability**: Arrays are no longer wrapped in nested Proxies, preventing reference instability and subtle spurious re-renders when iterating over array state.
- **`_observable` Re-wrapping**: Added a guard so already-proxied objects are not double-wrapped on repeated reads.

### Changed
- **Global Store Rendering**: Store mutations now use `_scheduleRender` (batched) instead of calling `render()` directly.
- **`attributeChangedCallback`**: Re-renders are now batched via `_scheduleRender` rather than calling `render()` synchronously on every attribute change.
- **Removed Dead Code**: `updateVars()` method removed — superseded by the render pipeline's interpolation pass since 1.0.2.
- **`append` Logic Removed**: The broken `append` config option (which attempted an invalid `replaceChild` in `<head>`) has been removed.

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