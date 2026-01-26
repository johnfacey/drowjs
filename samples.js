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


var config = {
  name: "user-card",
  state: { first: "John", last: "Doe" },
  // Computed property derived from state
  computed: {
    fullName: (state) => `${state.first} ${state.last}`
  },
  // Scoped CSS
  css: `
    .card { border: 1px solid #ccc; padding: 10px; }
    b { color: blue; }
  `,
  template: `
    <div class="card">
      User: <b>{{fullName}}</b>
    </div>
  `,
  // Cleanup when removed from DOM
  disconnected: function() {
    console.log("User card removed");
  }
};
Drow.register(config);

var config = {
  name: "input-test",
  state: { message: "Hello" },
  template: `
    <input type="text" d-model="message" />
    <p>You typed: {{message}}</p>
  `
};
var config = {
  name: "focus-test",
  template: `
    <input type="text" ref="myInput" />
    <button @click="focusInput">Focus Input</button>
  `,
  methods: {
    focusInput() {
      // Access the element directly via this.refs
      this.refs.myInput.focus();
    }
  }
};

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

// Component 1: Updates the store
var sender = {
  name: "sender-comp",
  useStore: true, // Subscribe to store updates
  template: `<button @click="updateStore">Update Global</button>`,
  methods: {
    updateStore() {
      Drow.store.state.message = "Hello from Sender!";
    }
  }
};

// Component 2: Displays data from the store
var receiver = {
  name: "receiver-comp",
  useStore: true,
  // Use a computed property to access the store in the template
  computed: {
    globalMsg: () => Drow.store.state.message || "No message yet"
  },
  template: `<div>Global Message: {{globalMsg}}</div>`
};


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

var config = {
  name: "blog-post",
  state: {
    content: "<b>Welcome</b> to my <i>blog</i>!"
  },
  template: `
    <div d-html="content"></div>
  `
};
