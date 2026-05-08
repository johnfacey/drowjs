# Getting Started with Drow.js

Drow.js is a minimalist library for building Web Components using simple object configurations. This guide explores the basics and the powerful **Deep Reactivity** system.

## 1. Quick Setup

Include the library in your project:

```html
<script src="path/to/drow.js"></script>
```

## 2. Defining a Component

Register a component by providing a configuration object to `Drow.register`.

```javascript
Drow.register({
  name: "profile-banner",
  state: {
    user: {
      name: "John Facey",
      settings: {
        theme: "dark"
      }
    }
  },
  // Use computed properties to access deep state values in templates
  computed: {
    userName: (state) => state.user.name,
    currentTheme: (state) => state.user.settings.theme
  },
  template: `
    <div class="banner">
      <h1>Welcome, {{userName}}</h1>
      <p>Active Theme: {{currentTheme}}</p>
      <button @click="toggleTheme">Toggle Theme</button>
      <button @click="updateName">Update Name</button>
    </div>
  `,
  methods: {
    toggleTheme() {
      // DEEP REACTIVITY:
      // Mutating a nested property automatically triggers a re-render.
      const newTheme = this.state.user.settings.theme === "dark" ? "light" : "dark";
      this.state.user.settings.theme = newTheme;
    },
    updateName() {
      // You can mutate any level of the state object
      this.state.user.name = "Jane Doe";
    }
  }
});
```

## 3. Deep Reactivity in Action

Drow.js uses recursive Proxies to watch your state. Unlike simpler libraries that only track top-level changes, Drow detects mutations deep within your objects and arrays.

### Mutating Nested Objects
```javascript
this.state.settings.profile.notifications.email = true; // Component re-renders
```

### Mutating Arrays
```javascript
this.state.items.push({ id: 3, text: "New Task" }); // Component re-renders
this.state.items[0].done = true; // Component re-renders
```

## 4. Lifecycle Hooks

Use `init` for setup and `disconnected` for cleanup.

```javascript
Drow.register({
  name: "auto-timer",
  state: { time: 0 },
  init() {
    this.timer = setInterval(() => {
      this.state.time++;
    }, 1000);
  },
  disconnected() {
    clearInterval(this.timer);
  },
  template: `<div>Seconds elapsed: {{time}}</div>`
});
```

## 5. Next Steps

Explore the [README](../README.md) for a full directive reference, including `d-for` for list rendering and `d-model` for two-way binding.