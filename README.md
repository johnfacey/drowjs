[![Gitpod ready-to-code](https://img.shields.io/badge/Gitpod-ready--to--code-blue?logo=gitpod)](https://gitpod.io/#https://github.com/johnfacey/drowjs)

# Drow.js 🎭

**The Tiny, Object-Based Web Component Library.**

Drow is a minimalist wrapper for the Web Components API. It replaces the boilerplate of JavaScript Classes with a clean, object-based configuration. Define your components as simple objects and let Drow handle the registration and rendering.

## Why Drow?

- 🚫 **Zero Dependencies**: No NPM, no build steps, no headaches.
- 📉 **Microscopic Size**: Tiny footprint with high performance.
- 🧩 **Object-First API**: No more `class X extends HTMLElement` or `super()`.
- ⚡ **Native Performance**: Uses the browser's built-in Custom Elements registry.

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

Or as an NPM Module
```
import Drow from 'drow';
```

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

## Directives Reference

Drow uses simple directives to handle DOM logic reactively:

| Directive | Description | Example |
| :--- | :--- | :--- |
| `@event` | Bind DOM events (click, input, etc.) | `@click="doSomething"` |
| `d-model` | Two-way binding for inputs | `d-model="username"` |
| `d-for` | Render a list of items | `d-for="item in items"` |
| `d-if` | Conditional rendering (adds/removes) | `d-if="isVisible"` |
| `d-show` | Conditional visibility (display: none) | `d-show="isVisible"` |
| `d-class:name` | Conditional CSS class | `d-class:active="isActive"` |
| `d-bind:attr` | Dynamic attribute binding | `d-bind:src="imageUrl"` |

## Interactive Demo: Todo List

This example demonstrates list rendering, two-way data binding, and event handling.

```javascript
const TodoApp = {
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
        <li d-for="task in tasks">
          <span>{{task}}</span>
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
        this.state.newTask = ""; // Reset input
      }
    },
    removeTask(e) {
      const itemToRemove = e.target.dataset.item;
      this.state.tasks = this.state.tasks.filter(t => t !== itemToRemove);
    },
    clearTasks() {
      this.state.tasks = [];
    }
  },
  css: \`
    .todo-box { border: 1px solid #444; padding: 1rem; border-radius: 8px; }
    input { padding: 5px; border-radius: 4px; border: 1px solid #ccc; }
    button { cursor: pointer; background: #a78bfa; color: white; border: none; padding: 5px 10px; border-radius: 4px; }
    li { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
    li button { background: #ef4444; padding: 2px 8px; }
  \`
};

Drow.register(TodoApp);
```

## Examples

Check out the live interactive demos:
- [Basic Counter & Time](index.html)

## Documentation

See the docs for usage and examples:

- docs/README.md



## Setup from npm

To use Drow in your project, install it via npm:

```bash
npm install drowjs
```

Once installed, you can import and use it in your module-based application:

```javascript
import { Drow } from 'drowjs';
```

## Local Development

To contribute to Drow.js or run the project locally for testing:

```bash
npm install
npm run server
```

### Building

To generate the minified version `drow.min.js`, use Terser:

```bash
# One-time minification
npx terser drow.js -o drow.min.js --compress --mangle
```

## Credits

Author [johnfacey.dev](https://johnfacey.dev/)
