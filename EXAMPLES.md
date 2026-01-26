# Examples

The following examples are taken from the library's component configs.

## my-counter
```js
var config = {
  name: "my-counter",
  state: { count: 0 },
  template: `<button @click="increment">Count is {{count}}</button>`,
  methods: {
    increment() {
      this.state.count++;
    }
  }
};
Drow.register(config);
```

## user-card
```js
var config = {
  name: "user-card",
  state: { first: "John", last: "Doe" },
  computed: {
    fullName: (state) => `${state.first} ${state.last}`
  },
  css: `
    .card { border: 1px solid #ccc; padding: 10px; }
    b { color: blue; }
  `,
  template: `
    <div class="card">
      User: <b>{{fullName}}</b>
    </div>
  `,
  disconnected: function() {
    console.log("User card removed");
  }
};
Drow.register(config);
```

## input-test
```js
var config = {
  name: "input-test",
  state: { message: "Hello" },
  template: `
    <input type="text" d-model="message" />
    <p>You typed: {{message}}</p>
  `
};
Drow.register(config);
```

## focus-test
```js
var config = {
  name: "focus-test",
  template: `
    <input type="text" ref="myInput" />
    <button @click="focusInput">Focus Input</button>
  `,
  methods: {
    focusInput() {
      this.refs.myInput.focus();
    }
  }
};
Drow.register(config);
```

## toggle-box
```js
var config = {
  name: "toggle-box",
  state: { isVisible: true },
  template: `
    <button @click="toggle">Toggle</button>
    <div d-if="isVisible">I am removed from DOM when hidden</div>
    <div d-show="isVisible">I am just hidden (display: none)</div>
  `,
  methods: {
    toggle() {
      this.state.isVisible = !this.state.isVisible;
    }
  }
};
Drow.register(config);
```

## sender-comp / receiver-comp (store example)
```js
var sender = {
  name: "sender-comp",
  useStore: true,
  template: `<button @click="updateStore">Update Global</button>`,
  methods: {
    updateStore() {
      Drow.store.state.message = "Hello from Sender!";
    }
  }
};

var receiver = {
  name: "receiver-comp",
  useStore: true,
  computed: {
    globalMsg: () => Drow.store.state.message || "No message yet"
  },
  template: `<div>Global Message: {{globalMsg}}</div>`
};

Drow.register(sender);
Drow.register(receiver);
```

## todo-list
```js
var config = {
  name: "todo-list",
  state: {
    todos: [
      { id: 1, text: "Learn DrowJS" },
      { id: 2, text: "Build an App" }
    ]
  },
  template: `
    <ul>
      <li d-for="todo in todos">
        {{todo.id}}: {{todo.text}}
      </li>
    </ul>
  `
};
Drow.register(config);
```

## user-avatar
```js
var config = {
  name: "user-avatar",
  state: {
    avatarUrl: "https://via.placeholder.com/150",
    isActive: "active-user"
  },
  template: `
    <img d-bind:src="avatarUrl" d-bind:class="isActive" />
  `
};
Drow.register(config);
```

## blog-post
```js
var config = {
  name: "blog-post",
  state: {
    content: "<b>Welcome</b> to my <i>blog</i>!"
  },
  template: `
    <div d-html="content"></div>
  `
};
Drow.register(config);
```
