/**
 * Type definitions for Drow.js
 */

export interface DrowStore {
    /** Reactive global state accessible by components with `useStore: true` */
    state: Record<string, any>;
    /** Array of components currently subscribed to store changes */
    listeners: DrowComponentInstance[];
    /** Add a component instance to the store listener list */
    subscribe(comp: DrowComponentInstance): void;
    /** Remove a component instance from the store listener list */
    unsubscribe(comp: DrowComponentInstance): void;
}

/**
 * The internal component instance (extends HTMLElement)
 */
export interface DrowComponentInstance extends HTMLElement {
    /** Reactive state object of the component */
    state: Record<string, any>;
    /** Dictionary of elements marked with `ref` or `d-ref` */
    refs: Record<string, HTMLElement>;
    /** Helper to dispatch standard CustomEvents from the component */
    emit(name: string, detail?: any): void;
    /** Returns the internal drow-wrapper element */
    getWrap(): HTMLElement | null;
    /** Helper to retrieve attribute values */
    getProp(propName: string): string | null;
    /** Returns the component instance itself */
    getComp(): this;
}

export interface DrowComponentConfig {
    /** The tag name for the custom element (e.g., 'my-button') */
    name: string;
    /** Initial reactive state for the component */
    state?: Record<string, any>;
    /** Array of attribute names to observe as properties */
    props?: string[];
    /** HTML template string with {{interpolation}} and directives */
    template?: string;
    /** Scoped CSS string. Use :host to target the component container */
    css?: string;
    /** Lifecycle hook: Called when the component is connected to the DOM */
    init?(this: DrowComponentInstance, config: DrowComponentConfig): void;
    /** Lifecycle hook: Called when the component is removed from the DOM */
    disconnected?(this: DrowComponentInstance): void;
    /** Functions that return values derived from state. Accessed in template via {{key}} */
    computed?: Record<string, (this: DrowComponentInstance, state: any) => any>;
    /** Event handlers triggered by `@event` directives in the template */
    methods?: Record<string, (this: DrowComponentInstance, event: Event) => void>;
    /** Whether to use Shadow DOM. If false, scoped Light DOM is used. */
    shadow?: boolean;
    /** If true, the component will re-render whenever Drow.store.state changes */
    useStore?: boolean;
    /** Optional: Target selector to replace the component into (internal usage) */
    append?: string;
    /** Watcher for attribute changes defined in `props` */
    watch?(attribute: { name: string; oldValue: any; newValue: any; comp: DrowComponentInstance }): void;
}

export interface Drow {
    /** The global reactive data store */
    store: DrowStore;
    /** Registers a new component with the browser's CustomElementRegistry */
    register(config: DrowComponentConfig): Drow;
}

/**
 * Global Drow instance
 */
declare const Drow: Drow;

export default Drow;

declare global {
    var Drow: Drow;
}