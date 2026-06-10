var DrowElements = [];

/**
 * Drow.js - The Tiny, Object-Based Web Component Library.
 * @namespace Drow
 * @see {@link https://github.com/drowjs|GitHub}
 */
const Drow = {
  /**
   * Enable debug logging. Set to false in production.
   * @type {boolean}
   */
  debug: true,

  /**
   * Global Store for sharing state between components.
   */
  store: {
    state: new Proxy({}, {
      set: (target, key, value) => {
        target[key] = value;
        Drow.store.listeners.forEach(l => l._scheduleRender());
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
   *   updated() {
   *     console.log('timer-display re-rendered');
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
    // --- Dev-mode config validation ---
    if (Drow.debug) {
      if (!config.name || typeof config.name !== 'string') {
        console.warn('Drow: config.name is required and must be a string.');
        return this;
      }
      if (!config.name.includes('-')) {
        console.warn(`Drow: component name "${config.name}" must contain a hyphen (Custom Elements spec requirement).`);
      }
      const knownKeys = ['name','state','template','css','methods','computed','props','init','disconnected','updated','watch','shadow','useStore','append'];
      Object.keys(config).forEach(k => {
        if (!knownKeys.includes(k)) {
          console.warn(`Drow [${config.name}]: unknown config key "${k}".`);
        }
      });
    }

    for (const element of DrowElements) {
      if (element === config.name) {
        if (Drow.debug) console.log(`Drow ${config.name} already Registered`);
        return this;
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
          this._renderPending = false;

          // Clone state from config to ensure per-instance reactivity
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
              // Only wrap plain objects — not arrays, dates, etc.
              if (val !== null && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
                return self._observable(val);
              }
              return val;
            },
            set(target, key, value) {
              if (target[key] === value) return true;
              target[key] = value;
              self._scheduleRender();
              return true;
            }
          });
        }

        /**
         * Batches render calls within the same animation frame.
         */
        _scheduleRender() {
          if (this._renderPending) return;
          this._renderPending = true;
          requestAnimationFrame(() => {
            this._renderPending = false;
            this.render();
          });
        }

        connectedCallback() {
          if (config.shadow && !this.shadowRoot) {
            this.attachShadow({ mode: "open" });
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

          // 1. Build merged context (state + computed + store + props)
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

          // 2. Interpolation
          let template = config.template.replace(/{{([\s\S]*?)}}/g, (match, key) => {
            const cleanKey = key.trim();
            const value = cleanKey.split('.').reduce((acc, part) => {
              return acc && acc[part] !== undefined ? acc[part] : undefined;
            }, context);

            if (value !== undefined) return value;
            if (cleanKey === 'bind') return this._originalContent || "";

            const rootKey = cleanKey.split('.')[0];
            return (rootKey in context) ? "" : match;
          });

          // 3. Slotting / Shadow DOM
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
                  const frag = document.createDocumentFragment();
                  while (slot.firstChild) frag.appendChild(slot.firstChild);
                  slot.replaceWith(frag);
                }
              });

              const defaultSlot = content.querySelector('slot:not([name])');
              if (defaultSlot) {
                const frag = document.createDocumentFragment();
                while (userContentDiv.firstChild) frag.appendChild(userContentDiv.firstChild);
                defaultSlot.replaceWith(frag);
              }
              template = tempTemplate.innerHTML;
            }
          }

          // 4. CSS scoping
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

          // 5. Capture focus state
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

          // 6. DOM update
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

          // 7. Restore focus
          if (focusKey && this.refs[focusKey]) {
            const el = this.refs[focusKey];
            el.focus();
            if (el.setSelectionRange && (el.type === 'text' || el.tagName === 'TEXTAREA')) {
              el.setSelectionRange(selection.start, selection.end);
            }
          }

          // 8. updated() lifecycle hook
          if (config.updated && typeof config.updated === 'function') {
            config.updated.call(this);
          }
        }

        /**
         * Process directives: d-for, d-if, d-else, d-else-if, d-show, d-class, d-bind, d-html, d-cloak.
         */
        processDirectives(context) {
          const root = this.shadowRoot || this;

          const getValue = (key) => {
            return key.split('.').reduce((acc, part) => {
              return acc && acc[part] !== undefined ? acc[part] : undefined;
            }, context);
          };

          // --- d-for (List Rendering with optional index and d-key diffing) ---
          root.querySelectorAll('[d-for]').forEach(el => {
            const expr = el.getAttribute('d-for');
            // Support: "item in list" or "(item, index) in list"
            const parenMatch = expr.match(/^\(\s*(\w+)\s*,\s*(\w+)\s*\)\s+in\s+(\S+)$/);
            const simpleMatch = expr.match(/^(\w+)\s+in\s+(\S+)$/);

            let iterVar, indexVar, listName;
            if (parenMatch) {
              [, iterVar, indexVar, listName] = parenMatch;
            } else if (simpleMatch) {
              [, iterVar, listName] = simpleMatch;
              indexVar = null;
            } else {
              return;
            }

            const list = getValue(listName);
            if (!Array.isArray(list)) return;

            const parent = el.parentNode;
            const keyAttr = el.getAttribute('d-key');

            const replaceTag = (html, tag, value) => {
              html = html.replaceAll(tag, value);
              const encodedTag = tag.replaceAll('{{', '%7B%7B').replaceAll('}}', '%7D%7D');
              return html.replaceAll(encodedTag, value);
            };

            if (keyAttr) {
              // Keyed diffing: build map of existing DOM nodes by key
              const existingNodes = {};
              let node = el.previousSibling;
              while (node) {
                const prev = node.previousSibling;
                if (node._drowKey !== undefined) {
                  existingNodes[node._drowKey] = node;
                }
                node = prev;
              }

              const newKeys = [];
              list.forEach((item, idx) => {
                const keyExpr = keyAttr.replace(/{{([\s\S]*?)}}/g, (_, k) => {
                  const kTrim = k.trim();
                  if (typeof item === 'object' && kTrim.startsWith(iterVar + '.')) {
                    return item[kTrim.slice(iterVar.length + 1)] ?? '';
                  }
                  if (kTrim === iterVar) return item;
                  if (indexVar && kTrim === indexVar) return idx;
                  return '';
                });

                newKeys.push(keyExpr);

                if (existingNodes[keyExpr]) {
                  // Node already exists — move into position before el
                  parent.insertBefore(existingNodes[keyExpr], el);
                } else {
                  // New node
                  const clone = el.cloneNode(true);
                  clone.removeAttribute('d-for');
                  clone.removeAttribute('d-key');
                  let html = clone.outerHTML;

                  if (typeof item === 'object') {
                    Object.keys(item).forEach(k => {
                      html = replaceTag(html, `{{${iterVar}.${k}}}`, item[k]);
                    });
                  } else {
                    html = replaceTag(html, `{{${iterVar}}}`, item);
                  }
                  if (indexVar) html = replaceTag(html, `{{${indexVar}}}`, idx);

                  const temp = document.createElement('template');
                  temp.innerHTML = html;
                  const newNode = temp.content.firstElementChild;
                  if (newNode) {
                    newNode._drowKey = keyExpr;
                    parent.insertBefore(newNode, el);
                  }
                }
              });

              // Remove stale nodes
              Object.keys(existingNodes).forEach(k => {
                if (!newKeys.includes(k)) existingNodes[k].remove();
              });

            } else {
              // No key — simple clone-and-insert
              list.forEach((item, idx) => {
                const clone = el.cloneNode(true);
                clone.removeAttribute('d-for');
                let html = clone.outerHTML;

                if (typeof item === 'object') {
                  Object.keys(item).forEach(k => {
                    html = replaceTag(html, `{{${iterVar}.${k}}}`, item[k]);
                  });
                } else {
                  html = replaceTag(html, `{{${iterVar}}}`, item);
                }
                if (indexVar) html = replaceTag(html, `{{${indexVar}}}`, idx);

                el.insertAdjacentHTML('beforebegin', html);
              });
            }

            el.remove();
          });

          // --- d-if / d-else-if / d-else chaining ---
          root.querySelectorAll('[d-if]').forEach(el => {
            const key = el.getAttribute('d-if');
            const isNegated = key.startsWith('!');
            const stateKey = isNegated ? key.substring(1) : key;
            const value = getValue(stateKey);
            const conditionMet = isNegated ? !value : !!value;

            if (!conditionMet) {
              // Walk siblings for d-else-if / d-else
              let sibling = el.nextElementSibling;
              let handled = false;
              while (sibling) {
                const next = sibling.nextElementSibling;
                if (sibling.hasAttribute('d-else-if')) {
                  if (!handled) {
                    const eKey = sibling.getAttribute('d-else-if');
                    const eNeg = eKey.startsWith('!');
                    const eSK = eNeg ? eKey.substring(1) : eKey;
                    const eVal = getValue(eSK);
                    const eMet = eNeg ? !eVal : !!eVal;
                    if (eMet) {
                      sibling.removeAttribute('d-else-if');
                      handled = true;
                    } else {
                      sibling.remove();
                    }
                  } else {
                    sibling.remove();
                  }
                } else if (sibling.hasAttribute('d-else')) {
                  if (!handled) {
                    sibling.removeAttribute('d-else');
                  } else {
                    sibling.remove();
                  }
                  break;
                } else {
                  break;
                }
                sibling = next;
              }
              el.remove();
            } else {
              el.removeAttribute('d-if');
              // Remove any trailing d-else-if / d-else siblings
              let sibling = el.nextElementSibling;
              while (sibling) {
                const next = sibling.nextElementSibling;
                if (sibling.hasAttribute('d-else-if') || sibling.hasAttribute('d-else')) {
                  sibling.remove();
                  sibling = next;
                } else {
                  break;
                }
              }
            }
          });

          // --- d-show ---
          root.querySelectorAll('[d-show]').forEach(el => {
            const key = el.getAttribute('d-show');
            const isNegated = key.startsWith('!');
            const stateKey = isNegated ? key.substring(1) : key;
            const value = getValue(stateKey);

            el.style.display = (isNegated ? value : !value) ? 'none' : '';
            el.removeAttribute('d-show');
          });

          // --- d-class:name ---
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

          // --- d-bind ---
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

          // --- d-html (raw HTML injection — sanitize in production!) ---
          root.querySelectorAll('[d-html]').forEach(el => {
            const key = el.getAttribute('d-html');
            const value = getValue(key);
            if (value !== undefined) {
              el.innerHTML = value;
            }
            el.removeAttribute('d-html');
          });

          // --- d-cloak ---
          if (this.hasAttribute('d-cloak')) this.removeAttribute('d-cloak');
          root.querySelectorAll('[d-cloak]').forEach(el => el.removeAttribute('d-cloak'));
        }

        /**
         * Binds event listeners (@event syntax) and handles d-model two-way binding.
         * d-model supports nested paths: d-model="user.name"
         */
        applyEvents() {
          const root = this.shadowRoot || this;
          this.refs = {};

          root.querySelectorAll('*').forEach(el => {
            Array.from(el.attributes).forEach(attr => {

              // Event binding: @click, @click.prevent, @click.stop
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

              // Refs
              if (attr.name === 'ref' || attr.name === 'd-ref') {
                this.refs[attr.value] = el;
              }

              // d-model with deep path support (e.g. d-model="user.name")
              if (attr.name === 'd-model') {
                const path = attr.value.split('.');
                if (!el.hasAttribute('ref') && !el.hasAttribute('d-ref')) {
                  this.refs[attr.value] = el;
                }

                const valueProp = (el.type === 'checkbox') ? 'checked' : 'value';
                const eventType = (el.type === 'checkbox' || el.type === 'radio') ? 'change' : 'input';

                // Read current value via deep path
                const currentVal = path.reduce((acc, k) => acc && acc[k] !== undefined ? acc[k] : undefined, this.state);
                if (currentVal !== undefined) el[valueProp] = currentVal;

                el.addEventListener(eventType, (e) => {
                  // Write via deep path
                  const newVal = e.target[valueProp];
                  if (path.length === 1) {
                    this.state[path[0]] = newVal;
                  } else {
                    // Navigate to the parent object and set the leaf key
                    const parent = path.slice(0, -1).reduce((acc, k) => acc[k], this.state);
                    parent[path[path.length - 1]] = newVal;
                  }
                });
              }
            });
          });
        }

        /**
         * Gets the wrapper element of a Drow Component.
         */
        getWrap() {
          return (this.shadowRoot || this).querySelector("drow-wrapper");
        }

        /**
         * Gets a prop attribute value.
         * @param {string} propName
         * @returns {string}
         */
        getProp(propName) {
          return this.getAttribute(propName);
        }

        /**
         * Returns the component element itself.
         * @returns {HTMLElement}
         */
        getComp() {
          return this;
        }

        /**
         * Responds to observed attribute changes.
         */
        attributeChangedCallback(attr, oldValue, newValue) {
          const attribute = {
            name: attr,
            oldValue,
            newValue,
            comp: this.getComp()
          };
          this._scheduleRender();
          if (config.watch && typeof config.watch === 'function') {
            config.watch.call(this, attribute);
          }
        }
      }
    );

    if (Drow.debug) console.log(`Drow ${config.name} Registered`);
    return this;
  }
};

if ((typeof process !== 'undefined') && (process.release.name === 'node')) {
  module.exports = Drow;
} else {
  window.Drow = Drow;
}
