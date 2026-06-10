[![Gitpod ready-to-code](https://img.shields.io/badge/Gitpod-ready--to--code-blue?logo=gitpod)](https://gitpod.io/#https://github.com/johnfacey/drowjs)

# Drow.js 🎭

**The Tiny, Object-Based Web Component Library.**

Drow is a minimalist wrapper for the Web Components API. It replaces the boilerplate of JavaScript Classes with a clean, object-based configuration. Define your components as simple objects and let Drow handle the registration and rendering.

## Why Drow?

- 🚫 **Zero Dependencies**: No NPM, no build steps, no headaches.
- 📉 **Microscopic Size**: Tiny footprint with high performance.
- 🧩 **Object-First API**: No more `class X extends HTMLElement` or `super()`.
- ⚡ **Native Performance**: Uses the browser's built-in Custom Elements registry.
- 🔁 **Batched Rendering**: Rapid state mutations are coalesced into a single DOM update per frame.

<div style="clear:both;padding-bottom:10px">
<p>
<img src="res/Drow-Setup.png"
     alt="Drow - Simple Web Component Library for creating custom HTML Components." />
</p>
</div>

## Setup

Include `drow.js` in your HTML file:

```html
<script src="drow.js"></script>
```

Or as an NPM module:

```bash
npm install drowjs
```

```javascript
import Drow from 'drowjs';
```

---

## Define a Drow Component

Drow components are defined using simple objects. Reactivity is handled automatically via the `state` object and `methods`.

```javascript
const config = {
  name: "my-counter",
  state: { count: 0 },
  css: `button { font-weight: bold; }`,
  template: `
    <div>
      <button @click="increment">Count is {{count}}</button>
    </div>
  `,
  methods: {
    increment() {
      this.state.count++;
    }
  }
};

Drow.register(config);
```

---

## Config Reference

| Key | Type | Description |
| :--- | :--- | :--- |
| `name` | `string` | **Required.** Custom element tag name — must contain a hyphen. |
| `template` | `string` | HTML template string. Supports `{{expression}}` interpolation. |
| `state` | `object` | Reactive per-instance state. Changes trigger a batched re-render. |
| `methods` | `object` | Event handler functions. Called with `this` bound to the component. |
| `computed` | `object` | Derived values: `{ key: (state) => value }`. Available in templates. |
| `props` | `string[]` | Observed HTML attributes, exposed as template variables. |
| `css` | `string` | Scoped CSS. Use `:host` to target the component root. |
| `shadow` | `boolean` | Attach a Shadow DOM instead of rendering in the Light DOM. |
| `useStore` | `boolean` | Subscribe to the global store. Access values via `{{store.key}}`. |
| `init` | `function` | Lifecycle hook — called once after the component connects. |
| `disconnected` | `function` | Lifecycle hook — called when the component is removed from the DOM. |
| `updated` | `function` | Lifecycle hook — called after every render cycle. |
| `watch` | `function(attr)` | Called when an observed prop attribute changes. Receives `{ name, oldValue, newValue, comp }`. |

---

## Directives Reference

| Directive | Description | Example |
| :--- | :--- | :--- |
| `@event` | Bind DOM events. Supports `.prevent` and `.stop` modifiers. | `@click="doSomething"` |
| `@event.prevent` | Calls `preventDefault()` before the handler. | `@submit.prevent="save"` |
| `@event.stop` | Calls `stopPropagation()` before the handler. | `@click.stop="select"` |
| `d-model` | Two-way binding for inputs. Supports nested paths. | `d-model="user.name"` |
| `d-for` | Render a list. Supports objects and `(item, index)` syntax. | `d-for="item in items"` |
| `d-key` | Keyed diffing for `d-for` — patches only changed items. | `d-key="{{item.id}}"` |
| `d-if` | Conditional rendering — removes element from DOM. | `d-if="isVisible"` |
| `d-else-if` | Chained condition after `d-if`. | `d-else-if="otherFlag"` |
| `d-else` | Fallback block after `d-if` or `d-else-if`. | `d-else` |
| `d-show` | Toggles `display: none` — element stays in DOM. | `d-show="isVisible"` |
| `d-class:name` | Conditionally adds/removes a CSS class. | `d-class:active="isActive"` |
| `d-bind:attr` | Reactive attribute binding. | `d-bind:src="imageUrl"` |
| `d-html` | Sets `innerHTML` from a state value. Use with trusted content only. | `d-html="richContent"` |
| `d-ref` | Registers element in `this.refs` for direct DOM access. | `d-ref="myInput"` |
| `d-cloak` | Hidden until the component finishes rendering (prevents FOUC). | `d-cloak` |

---

## Interpolation

Use `{{key}}` in templates to render state, computed, prop, or store values. Dot notation is supported for nested access.

```html
<p>{{user.profile.name}}</p>
<p>{{store.currentUser}}</p>
```

---

## Event Binding

Bind any DOM event with `@eventName="methodName"`. Modifiers can be chained with `.`:

```html
<button @click="save">Save</button>
<form @submit.prevent="handleSubmit">...</form>
<div @click.stop="select">...</div>
```

---

## Two-Way Binding (`d-model`)

`d-model` syncs an input's value with state. It supports nested paths:

```html
<input d-model="username" />
<input d-model="address.city" />
<input type="checkbox" d-model="settings.darkMode" />
```

---

## List Rendering (`d-for`)

Iterate over arrays of primitives or objects:

```html
<!-- Primitive list -->
<li d-for="tag in tags">{{tag}}</li>

<!-- Object list -->
<li d-for="user in users">{{user.name}} — {{user.email}}</li>

<!-- With index -->
<li d-for="(item, index) in items">{{index}}. {{item}}</li>
```

### Keyed Diffing (`d-key`)

Add `d-key` to enable efficient patching — Drow will reuse existing DOM nodes instead of rebuilding the entire list on every render:

```html
<li d-for="item in items" d-key="{{item.id}}">{{item.name}}</li>
```

Use a value that uniquely identifies each item (e.g. an `id`). Without `d-key`, the list is rebuilt from scratch on each render.

---

## Conditional Rendering (`d-if` / `d-else-if` / `d-else`)

```html
<p d-if="status === 'loading'">Loading…</p>
<p d-else-if="error">Something went wrong.</p>
<p d-else>Ready.</p>
```

`d-else-if` and `d-else` must immediately follow a `d-if` (or another `d-else-if`) element with no elements between them.

Use `d-show` instead of `d-if` when the element should remain in the DOM and only its visibility should toggle:

```html
<div d-show="isPanelOpen">...</div>
```

---

## Computed Properties

Computed values derive from state and are re-evaluated on every render:

```javascript
Drow.register({
  name: "cart-summary",
  state: { items: [] },
  computed: {
    total: (state) => state.items.reduce((sum, item) => sum + item.price, 0),
    isEmpty: (state) => state.items.length === 0
  },
  template: `
    <div>
      <p d-if="isEmpty">Your cart is empty.</p>
      <p d-else>Total: ${{total}}</p>
    </div>
  `
});
```

---

## Lifecycle Hooks

```javascript
Drow.register({
  name: "live-clock",
  state: { time: "" },
  init() {
    // Called once after the component connects to the DOM
    this._timer = setInterval(() => {
      this.state.time = new Date().toLocaleTimeString();
    }, 1000);
  },
  disconnected() {
    // Called when the component is removed from the DOM
    clearInterval(this._timer);
  },
  updated() {
    // Called after every render cycle
    console.log("clock re-rendered:", this.state.time);
  },
  template: `<span>{{time}}</span>`
});
```

---

## Global Store

Share state across multiple components with `Drow.store`. Any component with `useStore: true` re-renders when the store changes.

```javascript
// Write
Drow.store.state.user = "Alice";

// Read in template
// {{store.user}}
```

```javascript
Drow.register({
  name: "user-badge",
  useStore: true,
  template: `<span>Logged in as {{store.user}}</span>`
});

Drow.register({
  name: "login-btn",
  useStore: true,
  methods: {
    login() {
      Drow.store.state.user = "Alice";
    }
  },
  template: `<button @click="login">Log In</button>`
});
```

---

## Custom Events (`this.emit`)

Components can dispatch custom events that bubble up the DOM:

```javascript
methods: {
  submit() {
    this.emit("form-submit", { data: this.state.formData });
  }
}
```

Listen from a parent:

```javascript
document.querySelector("my-form").addEventListener("form-submit", (e) => {
  console.log(e.detail.data);
});
```

---

## Refs (`d-ref`)

Access DOM elements directly via `this.refs`:

```html
<input d-ref="emailInput" type="email" />
<button @click="focusEmail">Focus</button>
```

```javascript
methods: {
  focusEmail() {
    this.refs.emailInput.focus();
  }
}
```

---

## Scoped CSS

CSS defined in `css` is automatically scoped to the component. Use `:host` to target the component element itself:

```javascript
css: `
  :host { display: block; padding: 1rem; }
  button { background: #a78bfa; color: white; }
`
```

For Shadow DOM components (`shadow: true`), standard `:host` CSS works natively.

---

## Props & Attribute Watching

Declare observed attributes with `props`. They're available as template variables and trigger a re-render when changed. Use `watch` to respond to changes:

```javascript
Drow.register({
  name: "user-card",
  props: ["username", "avatar"],
  watch({ name, oldValue, newValue }) {
    console.log(`${name} changed: ${oldValue} → ${newValue}`);
  },
  template: `
    <div>
      <img d-bind:src="avatar" />
      <p>{{username}}</p>
    </div>
  `
});
```

```html
<user-card username="Alice" avatar="alice.png"></user-card>
```

---

## Debug Mode

`Drow.debug` controls console output. It defaults to `true`. Set it to `false` before registering components in production to suppress all Drow logs and dev warnings:

```javascript
Drow.debug = false;
Drow.register({ ... });
```

In debug mode, Drow will warn you if:
- A component name is missing or doesn't contain a hyphen (required by the Custom Elements spec)
- An unknown key is present in a config object

---

## Interactive Demo: Todo List

This example demonstrates list rendering, two-way data binding, and event handling.

```javascript
Drow.register({
  name: "todo-app",
  state: {
    newTask: "",
    tasks: ["Master Drow.js", "Build a tiny app"]
  },
  template: `
    <div class="todo-box">
      <h3>Task List ({{count}})</h3>
      <input d-model="newTask" placeholder="Add a new task...">
      <button @click="addTask">Add</button>
      <button @click="clearTasks">Clear All</button>
      <ul>
        <li d-for="(task, index) in tasks" d-key="{{task}}">
          <span>{{index}}. {{task}}</span>
          <button @click="removeTask" data-item="{{task}}">x</button>
        </li>
      </ul>
    </div>
  `,
  computed: {
    count: (state) => state.tasks.length
  },
  methods: {
    addTask() {
      if (this.state.newTask.trim()) {
        this.state.tasks = [...this.state.tasks, this.state.newTask];
        this.state.newTask = "";
      }
    },
    removeTask(e) {
      const item = e.target.dataset.item;
      this.state.tasks = this.state.tasks.filter(t => t !== item);
    },
    clearTasks() {
      this.state.tasks = [];
    }
  },
  css: `
    .todo-box { border: 1px solid #444; padding: 1rem; border-radius: 8px; }
    input { padding: 5px; border-radius: 4px; border: 1px solid #ccc; }
    button { cursor: pointer; background: #a78bfa; color: white; border: none; padding: 5px 10px; border-radius: 4px; }
    li { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
    li button { background: #ef4444; padding: 2px 8px; }
  `
});
```

---

## Examples

Check out the live interactive demos:
- [Basic Counter & Time](index.html)

---

## Documentation

Detailed API documentation is generated using JSDoc. To generate it locally:

```bash
npm run doc
```

The documentation is generated in the `docs/` directory.

---

## Local Development

```bash
npm install
npm run server
```

### Building

```bash
npx terser drow.js -o drow.min.js --compress --mangle
```

---

## Credits

Author [johnfacey.dev](https://johnfacey.dev/)
