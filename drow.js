var DrowElements = [];

/**
 * Drow.js - The Tiny, Object-Based Web Component Library.
 * @namespace Drow
 * @see {@link https://github.com/drowjs|GitHub}
 */
const Drow = {
  /**
   * Global Store for sharing state between components.
   */
  store: {
    state: new Proxy({}, {
      set: (target, key, value) => {
        target[key] = value;
        Drow.store.listeners.forEach(l => l.render());
        return true;
      }
    }),
    listeners: [],
    subscribe(comp) {
      this.listeners.push(comp);
    },
    unsubscribe(comp) {
      this.listeners = this.listeners.filter(l => l !== comp);
    }
  },
  /**
   * Registers a new Web Component using Drow.register(config).
   * @param {object} config - Configuration object for the component.
   * @returns {object} The Drow object for method chaining.
   * @memberof Drow
   * @example
   *
   * // <my-counter></my-counter>
   *
   * const config = {
   *   name: "my-counter",
   *   state: { count: 0 },
   *   css: `button { color: red; }`,
   *   template: `<button @click="increment">Count is {{count}}</button>`,
   *   methods: {
   *     increment() {
   *       this.state.count++;
   *     }
   *   }
   * }
   *
   * Drow.register(config);
   *
   * @example
   * // Using Computed Properties and Lifecycle Hooks
   * Drow.register({
   *   name: "timer-display",
   *   state: { seconds: 0 },
   *   computed: {
   *     minutes: (state) => Math.floor(state.seconds / 60)
   *   },
   *   init() {
   *     this.timer = setInterval(() => this.state.seconds++, 1000);
   *   },
   *   disconnected() {
   *     clearInterval(this.timer);
   *   },
   *   template: `<div>Time: {{minutes}}m {{seconds}}s</div>`
   * });
   *
   * @example
   * // Using the Global Store
   * Drow.register({
   *   name: "store-sync",
   *   useStore: true,
   *   methods: {
   *     updateGlobal() {
   *       Drow.store.state.user = "John";
   *     }
   *   },
   *   template: `
   *     <div>
   *       <p>Global User: {{store.user}}</p>
   *       <button @click="updateGlobal">Set User</button>
   *     </div>
   *   `
   * });
   */
  register(config) {
    for (const element of DrowElements) {
      if (element === config.name) {
        console.log(`Drow ${config.name} already Registered`);
        return;
      }
    }
    DrowElements.push(config.name);

    window.customElements.define(
      config.name,
      class extends HTMLElement {
        static get observedAttributes() {
          return config.props || [];
        }

        constructor() {
          super();
          this.setAttribute("Drow-component", true);
          this.setAttribute("Drow-name", config.name);
          this.init = typeof config.init === "function" ? config.init : function() {};
          this.refs = {};

          // Clone state from config to ensure per-instance reactivity 
          // instead of shared object references
          const initialState = config.state ? JSON.parse(JSON.stringify(config.state)) : {};
          this.state = this._observable(initialState);
        }

        _observable(obj) {
          const self = this;
          if (obj && obj._isProxy) return obj;
          
          return new Proxy(obj, {
            get(target, key) {
              if (key === '_isProxy') return true;
              const val = target[key];
              return (val && typeof val === 'object') ? self._observable(val) : val;
            },
            set(target, key, value) {
              if (target[key] === value) return true;
              target[key] = value;
              self.render();
              return true;
            }
          });
        }

        connectedCallback() {
          if (config.shadow && !this.shadowRoot) {
            this.attachShadow({
              mode: "open"
            });
          }

          if (config.useStore) {
            Drow.store.subscribe(this);
          }

          if (this._originalContent === undefined) {
            this._originalContent = this.innerHTML;
          }

          this.render();

          if (typeof this.init === "function") {
            this.init(config);
          }
          if (config.append !== undefined && config.append !== "") {
            document
              .querySelector("head")
              .replaceChild(this, document.querySelector("head"));
          }
        }

        disconnectedCallback() {
          if (config.useStore) {
            Drow.store.unsubscribe(this);
          }
          if (config.disconnected && typeof config.disconnected === 'function') {
            config.disconnected.call(this);
          }
        }

        /**
         * Renders the component template with current state and props.
         */
        render() {
          if (!config.template) return;

          // 1. Prepare Merged Context (State + Computed + Props)
          // Extract plain values from Proxy state for the rendering context
          const context = {};
          if (this.state) {
             Object.keys(this.state).forEach(key => {
                context[key] = this.state[key];
             });
          }
          
          if (config.useStore) {
            context.store = Drow.store.state;
          }

          if (config.computed) {
            Object.keys(config.computed).forEach(key => {
              context[key] = config.computed[key].call(this, this.state);
            });
          }

          if (config.props) {
            config.props.forEach(prop => {
              context[prop] = this.getAttribute(prop) || "";
            });
          }

          // 2. Efficient Interpolation
          let template = config.template.replace(/{{([\s\S]*?)}}/g, (match, key) => {
            const cleanKey = key.trim();
            
            // Support nested property access (e.g., {{store.globalCount}})
            const value = cleanKey.split('.').reduce((acc, part) => {
                return acc && acc[part] !== undefined ? acc[part] : undefined;
            }, context);

            if (value !== undefined) return value;
            if (cleanKey === 'bind') return this._originalContent || "";

            // Only clear the tag if it's a known root property (state, store, etc.)
            // This prevents wiping out d-for iterator variables like {{img.id}}
            const rootKey = cleanKey.split('.')[0];
            return (rootKey in context) ? "" : match;
          });

          // 3. Handle Slotting/Shadow DOM specifics
          if (config.shadow) {
            template = template.replace("<slot></slot>", "{{bind}}").replace("{{bind}}", "<slot></slot>");
          } else {
            if (template.includes('<slot') || template.includes('{{bind}}')) {
              const tempTemplate = document.createElement('template');
              tempTemplate.innerHTML = template;
              const content = tempTemplate.content;
              const userContentDiv = document.createElement('div');
              userContentDiv.innerHTML = this._originalContent || '';

              content.querySelectorAll('slot[name]').forEach(slot => {
                const name = slot.getAttribute('name');
                const userElements = userContentDiv.querySelectorAll(`[slot="${name}"]`);
                if (userElements.length > 0) {
                  const frag = document.createDocumentFragment();
                  userElements.forEach(el => frag.appendChild(el));
                  slot.replaceWith(frag);
                } else {
                  // Unwrap fallback content
                  const frag = document.createDocumentFragment();
                  while (slot.firstChild) frag.appendChild(slot.firstChild);
                  slot.replaceWith(frag);
                }
              });

              const defaultSlot = content.querySelector('slot:not([name])');
              if (defaultSlot) {
                const frag = document.createDocumentFragment();
                while (userContentDiv.firstChild) {
                  frag.appendChild(userContentDiv.firstChild);
                }
                defaultSlot.replaceWith(frag);
              }
              template = tempTemplate.innerHTML;
            }
          }

          let css = '';
          if (config.css) {
            if (config.shadow) {
              css = `<style>${config.css}</style>`;
            } else {
              const scopedCss = config.css.replaceAll(':host', '&');
              css = `<style>${config.name} { ${scopedCss} }</style>`;
            }
          }

          const content = `<drow-wrapper>${css}${template}</drow-wrapper>`;

          // 5. Capture Focus state
          const root = this.shadowRoot || document;
          let activeEl = root.activeElement;
          if (!this.shadowRoot && (!activeEl || !this.contains(activeEl))) activeEl = null;
          
          let focusKey = null;
          let selection = { start: 0, end: 0 };

          if (activeEl) {
             focusKey = activeEl.getAttribute('ref') || activeEl.getAttribute('d-ref') || activeEl.getAttribute('d-model');
             if (focusKey && (activeEl.type === 'text' || activeEl.tagName === 'TEXTAREA')) {
                 selection.start = activeEl.selectionStart;
                 selection.end = activeEl.selectionEnd;
             }
          }

          // 6. Targeted DOM Update
          (this.shadowRoot || this).innerHTML = content;
          
          this.processDirectives(context);
          this.applyEvents();
          this.emit = (name, detail) => {
            this.dispatchEvent(new CustomEvent(name, {
              detail,
              bubbles: true,
              composed: true
            }));
          };

          if (focusKey && this.refs[focusKey]) {
              const el = this.refs[focusKey];
              el.focus();
              if (el.setSelectionRange && (el.type === 'text' || el.tagName === 'TEXTAREA')) {
                  el.setSelectionRange(selection.start, selection.end);
              }
          }
        }

        /**
         * Updates the template with the props provided to the Drow Component.
         * Variables are replaced in the template Ex: {{variable_name}} 
         * {{bind}} is used as an internal reference so that elements can exist within a Drow Component instead of being removed
         * @instance
         * @example
         * updateVars(config) -- used internally
         */
        updateVars(config) {
          let newConfig = config;
          for (let i = 0; i < this.getAttributeNames().length; i++) {
            let thisAttr = this.getAttributeNames()[i];
            let thisAttrValue = this.getAttribute(thisAttr);
            if (thisAttr != 'bind') {
              newConfig.template = newConfig.template.replaceAll("{{" + thisAttr + "}}", thisAttrValue);
            }
          }

          return newConfig;
        }

        /**
         * Process directives like d-if and d-show.
         */
        processDirectives(context) {
          const root = this.shadowRoot || this;
          
          // Helper to resolve nested paths (e.g. "user.avatar" or "store.url")
          const getValue = (key) => {
            return key.split('.').reduce((acc, part) => {
              return acc && acc[part] !== undefined ? acc[part] : undefined;
            }, context);
          };
          
          // d-for (List Rendering)
          root.querySelectorAll('[d-for]').forEach(el => {
            const expr = el.getAttribute('d-for');
            const [iterVar, listName] = expr.split(' in ').map(s => s.trim());
            const list = getValue(listName);
            
            if (Array.isArray(list)) {
              const parent = el.parentNode;
              list.forEach(item => {
                const clone = el.cloneNode(true);
                clone.removeAttribute('d-for');
                let html = clone.outerHTML;
                
                if (typeof item === 'object') {
                   Object.keys(item).forEach(key => {
                       html = html.replaceAll(`{{${iterVar}.${key}}}`, item[key]);
                   });
                } else {
                   html = html.replaceAll(`{{${iterVar}}}`, item);
                }
                
                el.insertAdjacentHTML('beforebegin', html);
              });
              el.remove();
            }
          });

          // d-if (Conditional Rendering)
          root.querySelectorAll('[d-if]').forEach(el => {
            const key = el.getAttribute('d-if');
            const isNegated = key.startsWith('!');
            const stateKey = isNegated ? key.substring(1) : key;
            const value = getValue(stateKey);
            
            if (isNegated ? value : !value) {
              el.remove();
            } else {
              el.removeAttribute('d-if');
            }
          });

          // d-show (Toggles Display)
          root.querySelectorAll('[d-show]').forEach(el => {
            const key = el.getAttribute('d-show');
            const isNegated = key.startsWith('!');
            const stateKey = isNegated ? key.substring(1) : key;
            const value = getValue(stateKey);

            if (isNegated ? value : !value) {
              el.style.display = 'none';
            } else {
              el.style.display = '';
            }
            el.removeAttribute('d-show');
          });

          // d-class:name (Conditional Class)
          root.querySelectorAll('*').forEach(el => {
            Array.from(el.attributes).forEach(attr => {
              if (attr.name.startsWith('d-class:')) {
                const className = attr.name.substring(8);
                const key = attr.value;
                const isNegated = key.startsWith('!');
                const stateKey = isNegated ? key.substring(1) : key;
                const value = getValue(stateKey);

                if (isNegated ? !value : value) {
                  el.classList.add(className);
                } else {
                  el.classList.remove(className);
                }
                el.removeAttribute(attr.name);
              }
            });
          });

          // d-bind (Attribute Binding)
          root.querySelectorAll('*').forEach(el => {
            Array.from(el.attributes).forEach(attr => {
              if (attr.name.startsWith('d-bind:')) {
                const realAttr = attr.name.substring(7);
                const stateKey = attr.value;
                const value = getValue(stateKey);
                
                if (value !== undefined && value !== null) {
                  el.setAttribute(realAttr, value);
                }
                el.removeAttribute(attr.name);
              }
            });
          });

          // d-html (Raw HTML)
          root.querySelectorAll('[d-html]').forEach(el => {
             const key = el.getAttribute('d-html');
             const value = getValue(key);
             if (value !== undefined) {
               el.innerHTML = value;
             }
             el.removeAttribute('d-html');
          });

          // d-cloak (Removes cloak attribute once component is rendered)
          if (this.hasAttribute('d-cloak')) {
            this.removeAttribute('d-cloak');
          }
          root.querySelectorAll('[d-cloak]').forEach(el => {
            el.removeAttribute('d-cloak');
          });
        }

        /**
         * Binds event listeners based on @event syntax in the template.
         * Example: <button @click="handleClick">
         */
        applyEvents() {
          const root = this.shadowRoot || this;
          this.refs = {};
          const elements = root.querySelectorAll('*');
          elements.forEach(el => {
            Array.from(el.attributes).forEach(attr => {
              // Event Binding (@click)
              if (attr.name.startsWith('@')) {
                let eventName = attr.name.substring(1);
                let modifiers = [];
                if (eventName.includes('.')) {
                  const parts = eventName.split('.');
                  eventName = parts[0];
                  modifiers = parts.slice(1);
                }

                const methodName = attr.value;
                if (config.methods && typeof config.methods[methodName] === 'function') {
                  el.addEventListener(eventName, (e) => {
                    if (modifiers.includes('prevent')) e.preventDefault();
                    if (modifiers.includes('stop')) e.stopPropagation();
                    config.methods[methodName].call(this, e);
                  });
                  el.removeAttribute(attr.name);
                }
              }
              // Refs (ref="myInput" or d-ref="myInput")
              if (attr.name === 'ref' || attr.name === 'd-ref') {
                  this.refs[attr.value] = el;
              }
              // Two-Way Binding (d-model="stateKey")
              if (attr.name === 'd-model') {
                  const key = attr.value;
                  // Store ref for focus restoration if explicit ref is missing
                  if (!el.hasAttribute('ref') && !el.hasAttribute('d-ref')) {
                      this.refs[key] = el;
                  }
                  
                  const valueProp = (el.type === 'checkbox') ? 'checked' : 'value';
                  const eventType = (el.type === 'checkbox' || el.type === 'radio') ? 'change' : 'input';

                  if (this.state[key] !== undefined) {
                      el[valueProp] = this.state[key];
                  }
                  el.addEventListener(eventType, (e) => {
                      this.state[key] = e.target[valueProp];
                  });
              }
            });
          });
        }

        /**
         * Gets the Wrapper Element of a Drow Component.
         * @instance
         * @example
         * this.getWrap().querySelector("b");
         */
        getWrap() {
          return (this.shadowRoot || this).querySelector("drow-wrapper");
        }

        /**
         * Gets a Property of a Drow Component.
         * @property {string} propName - returns of Property used in Componenet.
         * @returns {string} Property
         * @instance
         * @example
         * this.getProp('prop1');
         */
        getProp(propName) {
          return this.getAttribute(propName);
        }

        /**
         * Gets the Drow Component.
         * @returns Drow Component
         * @instance
         * @example
         * this.getComp();
         */
        getComp() {
          return this;
        }

        // Respond to attribute changes.
        attributeChangedCallback(attr, oldValue, newValue) {
          var attribute = {
            name: attr,
            oldValue: oldValue,
            newValue: newValue,
            comp: this.getComp()
          };
          this.render();
          try {
            config.watch(attribute);
          } catch (e) {}
        }
      }
    );
    console.log(`Drow ${config.name} Registered`);
    return this;
  }
};

if ((typeof process !== 'undefined') && (process.release.name === 'node')) {
  module.exports = Drow;
} else {
  window.Drow = Drow;
}