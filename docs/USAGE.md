# Usage

Quick reference for the core component config and template features.

## Registering
Create a config object and call `Drow.register(config)`.

## Config properties
- `name` (string): component tag name.
- `state` (object): reactive state for the component.
- `template` (string): HTML template with interpolation `{{...}}`.
- `methods` (object): methods callable from the template (`@click`, etc.).
- `computed` (object): functions derived from `state` (read-only in templates).
- `css` (string): scoped CSS for the component.
- `disconnected` (function): cleanup when removed from DOM.
- `useStore` (bool): subscribe to global `Drow.store` updates.

## Template features & directives
- Event: `@click="handler"` — call a `methods` function. Supports `.prevent` and `.stop`.
- Two-way binding: `d-model="prop"` — bind input value to `state.prop`.
- Conditional render: `d-if="expr"` — add/remove from DOM.
- Conditional display: `d-show="expr"` — toggles `display: none`.
- Conditional class: `d-class:active="isActive"` — toggles class `active` if `state.isActive` is true.
- List rendering: `d-for="item in list"` — iterate arrays.
- Attribute binding: `d-bind:src="avatarUrl"` — bind attributes.
- HTML injection: `d-html="content"` — set innerHTML (use carefully).
- Refs: `d-ref="name"` (or `ref`) — accessible via `this.refs.name` in methods.

## Examples

Toggle a boolean from methods:

```js
methods: { toggle() { this.state.isVisible = !this.state.isVisible } }
```

d-for example:

```html
<ul>
  <li d-for="todo in todos">{{todo.text}}</li>
</ul>
```

## Global store
Use `Drow.store.state` to read or write global state when `useStore` is enabled.
