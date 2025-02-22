// Base component class with lifecycle methods
class Component {
    constructor(element, options = {}) {
        this.element = element;
        this.options = options;
        this._state = {};
        this._eventHandlers = new Map();
        this._childComponents = new Set();

        // Make methods safe by default
        const methodNames = Object.getOwnPropertyNames(Object.getPrototypeOf(this))
            .filter(name => typeof this[name] === 'function' && name !== 'constructor');

        methodNames.forEach(methodName => {
            ErrorBoundary.createSafeMethod(this, methodName);
        });
    }

    // Lifecycle Methods
    async init() {
        try {
            await this.setupState();
            await this.setupEventListeners();
            await this.render();
            this.postRender();
        } catch (error) {
            console.error(`Error initializing ${this.constructor.name}:`, error);
            throw error;
        }
    }

    async destroy() {
        try {
            this.removeEventListeners();
            await this.cleanup();
            this._childComponents.forEach(child => child.destroy());
            this._childComponents.clear();
            this.element.innerHTML = '';
        } catch (error) {
            console.error(`Error destroying ${this.constructor.name}:`, error);
        }
    }

    // State Management
    setState(newState) {
        const oldState = { ...this._state };
        this._state = { ...this._state, ...newState };

        // Only render if state actually changed
        if (JSON.stringify(oldState) !== JSON.stringify(this._state)) {
            this.render();
        }
    }

    getState() {
        return { ...this._state };
    }

    // Event Handling
    on(eventName, handler) {
        if (!this._eventHandlers.has(eventName)) {
            this._eventHandlers.set(eventName, new Set());
        }
        this._eventHandlers.get(eventName).add(handler);
    }

    off(eventName, handler) {
        if (this._eventHandlers.has(eventName)) {
            this._eventHandlers.get(eventName).delete(handler);
        }
    }

    emit(eventName, data) {
        if (this._eventHandlers.has(eventName)) {
            this._eventHandlers.get(eventName).forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`Error in event handler for ${eventName}:`, error);
                }
            });
        }
    }

    // Child Component Management
    addChild(component) {
        this._childComponents.add(component);
    }

    removeChild(component) {
        component.destroy();
        this._childComponents.delete(component);
    }

    // DOM Event Helpers
    delegate(eventName, selector, handler) {
        const wrappedHandler = (event) => {
            const target = event.target.closest(selector);
            if (target && this.element.contains(target)) {
                handler.call(this, event, target);
            }
        };

        this.element.addEventListener(eventName, wrappedHandler);
        return wrappedHandler; // Store for removal
    }

    // Methods to be implemented by child classes
    async setupState() {
        // Initialize component state
    }

    async setupEventListeners() {
        // Setup DOM event listeners
    }

    async render() {
        // Render component UI
    }

    postRender() {
        // Post-render operations
    }

    async cleanup() {
        // Cleanup before destruction
    }

    removeEventListeners() {
        // Remove DOM event listeners
    }

    // Utility Methods
    $(selector) {
        return this.element.querySelector(selector);
    }

    $$(selector) {
        return Array.from(this.element.querySelectorAll(selector));
    }

    safeGet(obj, path, defaultValue = null) {
        return Validator.safeGet(obj, path, defaultValue);
    }
}

// Make globally available
window.Component = Component; 