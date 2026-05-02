/**
 * Drow Component - Simple Web Component Library for creating custom HTML Components.
 * @constructor
 * @see {@link https://github.com/drowjs|GitHub}
 */
var DrowElements = [];
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
   * Registers a Drow Component.
   * @param {object} config - Object used to define a Drow.
   * @memberof Drow
   * @example
   *
   * <my-counter></my-counter>
   *
   * var config = {
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
          this.init = config.init;
          this.refs = {};

          this.state = new Proxy(config.state || {}, {
            set: (target, key, value) => {
              target[key] = value;
              this.render();
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

          this.init(config);
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
          let template = config.template;

          // Prepare Data (State + Computed)
          let data = { ...this.state };
          if (config.computed) {
            Object.keys(config.computed).forEach(key => {
              data[key] = config.computed[key].call(this, this.state);
            });
          }

          // Replace Data
          if (data) {
            for (const [key, value] of Object.entries(data)) {
              template = template.replaceAll(`{{${key}}}`, value);
            }
          }

          // Replace Props
          if (config.props) {
            config.props.forEach(prop => {
              const value = this.getAttribute(prop) || "";
              template = template.replaceAll(`{{${prop}}}`, value);
            });
          }

          // Slotting / Content Projection
          if (config.shadow) {
            template = template.replaceAll("{{bind}}", "<slot></slot>");
          } else {
            // Light DOM Slotting Polyfill
            if (template.includes('<slot') || template.includes('{{bind}}')) {
              const tempTemplate = document.createElement('template');
              tempTemplate.innerHTML = template;
              const content = tempTemplate.content;

              const userContentDiv = document.createElement('div');
              userContentDiv.innerHTML = this._originalContent || '';

              // Named Slots
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

              // Default Slot
              const defaultSlot = content.querySelector('slot:not([name])');
              if (defaultSlot) {
                const frag = document.createDocumentFragment();
                while (userContentDiv.firstChild) {
                  frag.appendChild(userContentDiv.firstChild);
                }
                defaultSlot.replaceWith(frag);
              }

              template = tempTemplate.innerHTML;

              // Legacy {{bind}} support
              if (this._originalContent) {
                template = template.replaceAll("{{bind}}", this._originalContent);
              }
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

          // Capture Focus (to restore after render)
          const root = this.shadowRoot || document;
          let activeEl = root.activeElement;
          if (!this.shadowRoot && (!activeEl || !this.contains(activeEl))) {
             activeEl = null;
          }
          
          let focusKey = null;
          let selectionStart = 0;
          let selectionEnd = 0;

          if (activeEl) {
             // Use ref or d-model as the key to identify the element
             focusKey = activeEl.getAttribute('ref') || activeEl.getAttribute('d-ref') || activeEl.getAttribute('d-model');
             if (focusKey && (activeEl.type === 'text' || activeEl.tagName === 'TEXTAREA')) {
                 selectionStart = activeEl.selectionStart;
                 selectionEnd = activeEl.selectionEnd;
             }
          }

          if (config.shadow && this.shadowRoot) {
            this.shadowRoot.innerHTML = content;
          } else {
            this.innerHTML = content;
          }
          this.processDirectives();
          this.applyEvents();

          // Restore Focus
          if (focusKey && this.refs[focusKey]) {
              const el = this.refs[focusKey];
              el.focus();
              if (el.setSelectionRange && (el.type === 'text' || el.tagName === 'TEXTAREA')) {
                  el.setSelectionRange(selectionStart, selectionEnd);
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
        processDirectives() {
          const root = this.shadowRoot || this;
          
          // d-for (List Rendering)
          root.querySelectorAll('[d-for]').forEach(el => {
            const expr = el.getAttribute('d-for');
            const [iterVar, listName] = expr.split(' in ').map(s => s.trim());
            const list = this.state[listName];
            
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
                
                parent.insertAdjacentHTML('beforebegin', html);
              });
              el.remove();
            }
          });

          // d-if (Conditional Rendering)
          root.querySelectorAll('[d-if]').forEach(el => {
            const key = el.getAttribute('d-if');
            const isNegated = key.startsWith('!');
            const stateKey = isNegated ? key.substring(1) : key;
            const value = this.state[stateKey];
            
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
            const value = this.state[stateKey];

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
                const value = this.state[stateKey];

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
                if (this.state[stateKey] !== undefined) {
                  el.setAttribute(realAttr, this.state[stateKey]);
                }
                el.removeAttribute(attr.name);
              }
            });
          });

          // d-html (Raw HTML)
          root.querySelectorAll('[d-html]').forEach(el => {
             const key = el.getAttribute('d-html');
             if (this.state[key] !== undefined) {
               el.innerHTML = this.state[key];
             }
             el.removeAttribute('d-html');
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