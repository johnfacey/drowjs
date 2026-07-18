/**
 * Drow.js - TypeScript Definitions
 * The Tiny, Object-Based Web Component Library.
 * @see https://github.com/johnfacey/drowjs
 */

// ---------------------------------------------------------------------------
// Attribute change descriptor passed to config.watch()
// ---------------------------------------------------------------------------

export interface DrowAttributeChange {
  /** The name of the attribute that changed. */
  name: string;
  /** The attribute's previous value. */
  oldValue: string | null;
  /** The attribute's new value. */
  newValue: string | null;
  /** The component element that owns the attribute. */
  comp: HTMLElement;
}

// ---------------------------------------------------------------------------
// Component instance — available as `this` inside hooks and methods
// ---------------------------------------------------------------------------

export interface DrowComponentInstance extends HTMLElement {
  /** The reactive per-instance state. Mutations trigger a batched re-render. */
  state: Record<string, any>;

  /**
   * Dispatch a custom event that bubbles up through the DOM.
   * @param name    Event name
   * @param detail  Arbitrary payload attached to `event.detail`
   */
  emit(name: string, detail?: unknown): void;

  /**
   * Map of elements registered with `d-ref` or `ref` attributes.
   * Keys are the ref name; values are the matching HTMLElement.
   */
  refs: Record<string, HTMLElement>;

  /**
   * Returns the component's `<drow-wrapper>` element.
   * Useful for DOM queries scoped to the component.
   */
  getWrap(): HTMLElement | null;

  /**
   * Returns the component element itself (equivalent to `this`).
   */
  getComp(): this;

  /**
   * Returns the value of a prop attribute.
   * @param propName  The attribute name declared in `config.props`
   */
  getProp(propName: string): string | null;
}

// ---------------------------------------------------------------------------
// Component config object passed to Drow.register()
// ---------------------------------------------------------------------------

export interface DrowComponentConfig<
  State extends Record<string, any> = Record<string, any>
> {
  /**
   * **Required.** Custom element tag name. Must contain a hyphen.
   * @example "my-counter"
   */
  name: string;

  /**
   * HTML template string. Supports `{{expression}}` interpolation,
   * dot-notation paths (`{{user.name}}`), and all Drow directives.
   */
  template?: string;

  /**
   * Per-instance reactive state. Each instance receives a deep clone of
   * this object. Mutations are batched via `requestAnimationFrame` and
   * trigger a single DOM update per frame.
   */
  state?: State;

  /**
   * Event handler methods. Each function is called with `this` bound
   * to the component instance.
   */
  methods?: Record<
    string,
    (this: DrowComponentInstance, event?: Event) => void
  >;

  /**
   * Computed properties derived from state. Re-evaluated on every render.
   * Available in templates via `{{key}}`.
   *
   * @example
   * computed: {
   *   total: (state) => state.items.reduce((s, i) => s + i.price, 0)
   * }
   */
  computed?: Record<string, (state: State) => unknown>;

  /**
   * List of HTML attribute names to observe as props.
   * Observed attributes are available as template variables and trigger
   * a batched re-render when changed.
   */
  props?: string[];

  /**
   * Component-scoped CSS string. Use `:host` to target the component root.
   * Automatically scoped to the component tag in Light DOM mode.
   */
  css?: string;

  /**
   * Attach a Shadow DOM (`mode: "open"`) instead of rendering in Light DOM.
   * @default false
   */
  shadow?: boolean;

  /**
   * Subscribe this component to the global `Drow.store`. Store values
   * are accessible in templates via `{{store.key}}`.
   * @default false
   */
  useStore?: boolean;

  /**
   * Lifecycle hook — called once after the component connects to the DOM.
   * Use for timers, subscriptions, or any one-time setup.
   */
  init?(
    this: DrowComponentInstance,
    config: DrowComponentConfig<State>
  ): void;

  /**
   * Lifecycle hook — called when the component is removed from the DOM.
   * Use to clean up timers, event listeners, or subscriptions.
   */
  disconnected?(this: DrowComponentInstance): void;

  /**
   * Lifecycle hook — called after every render cycle.
   * Useful for post-render DOM inspection or analytics.
   */
  updated?(this: DrowComponentInstance): void;

  /**
   * Called whenever an observed prop attribute changes.
   * @param attr  Details about the change
   */
  watch?(
    this: DrowComponentInstance,
    attr: DrowAttributeChange
  ): void;
}

// ---------------------------------------------------------------------------
// Global Store
// ---------------------------------------------------------------------------

export interface DrowStore {
  /**
   * Reactive store state shared across all subscribed components.
   * Assigning any key triggers a batched re-render on all subscribers.
   *
   * @example
   * Drow.store.state.user = "Alice";
   */
  state: Record<string, any>;

  /** @internal */
  listeners: HTMLElement[];
  /** @internal */
  subscribe(comp: HTMLElement): void;
  /** @internal */
  unsubscribe(comp: HTMLElement): void;
}

// ---------------------------------------------------------------------------
// Drow namespace
// ---------------------------------------------------------------------------

export interface DrowStatic {
  /**
   * Controls debug logging and dev-mode warnings.
   * Set to `false` in production to silence all Drow console output.
   *
   * In debug mode (`true`), Drow will warn on:
   * - Missing or non-hyphenated component names
   * - Unknown keys in the config object
   *
   * @default true
   *
   * @example
   * Drow.debug = false;
   * Drow.register({ ... });
   */
  debug: boolean;

  /**
   * The global store. Any component with `useStore: true` re-renders
   * when store state changes.
   */
  store: DrowStore;

  /**
   * Register a new Web Component.
   *
   * @param config  Component configuration object
   * @returns The `Drow` object for method chaining
   *
   * @example
   * Drow.register({
   *   name: "my-counter",
   *   state: { count: 0 },
   *   template: `<button @click="inc">{{count}}</button>`,
   *   methods: {
   *     inc() { this.state.count++; }
   *   }
   * });
   */
  register<State extends Record<string, any> = Record<string, any>>(
    config: DrowComponentConfig<State>
  ): this;
}

// ---------------------------------------------------------------------------
// Module exports
// ---------------------------------------------------------------------------

declare const Drow: DrowStatic;
export default Drow;
export { Drow };

declare global {
  // Makes `window.Drow` available without an import in non-module scripts
  var Drow: DrowStatic;
}

// ---------------------------------------------------------------------------
// Directive reference (documentation only)
// ---------------------------------------------------------------------------

/**
 * ## Drow Template Directives
 *
 * | Directive        | Description                                                  | Example                      |
 * | :--------------- | :----------------------------------------------------------- | :--------------------------- |
 * | `@event`         | Bind a DOM event to a method                                 | `@click="doSomething"`       |
 * | `@event.prevent` | Calls `preventDefault()` before the handler                 | `@submit.prevent="save"`     |
 * | `@event.stop`    | Calls `stopPropagation()` before the handler                 | `@click.stop="select"`       |
 * | `d-model`        | Two-way binding. Supports nested paths.                      | `d-model="user.name"`        |
 * | `d-for`          | List rendering. Supports `(item, index)` syntax.             | `d-for="(item, i) in items"` |
 * | `d-key`          | Keyed diffing for `d-for` — patches only changed items.      | `d-key="{{item.id}}"`        |
 * | `d-if`           | Conditional rendering — removes element from DOM.            | `d-if="isVisible"`           |
 * | `d-else-if`      | Chained condition after `d-if`.                              | `d-else-if="otherFlag"`      |
 * | `d-else`         | Fallback block after `d-if` or `d-else-if`.                  | `d-else`                     |
 * | `d-show`         | Toggles `display: none` — element stays in DOM.              | `d-show="isOpen"`            |
 * | `d-class:name`   | Conditionally adds/removes a CSS class.                      | `d-class:active="isActive"`  |
 * | `d-bind:attr`    | Reactive attribute binding.                                  | `d-bind:src="imageUrl"`      |
 * | `d-html`         | Sets `innerHTML` from a state value (trusted content only).  | `d-html="richContent"`       |
 * | `d-ref`          | Registers element in `this.refs` for direct DOM access.      | `d-ref="myInput"`            |
 * | `d-cloak`        | Hidden until component finishes rendering (prevents FOUC).   | `d-cloak`                    |
 */
export type DrowDirectives = never;
