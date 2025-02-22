// Base service class for common functionality
class BaseService {
    constructor() {
        // Make methods safe by default
        const methodNames = Object.getOwnPropertyNames(Object.getPrototypeOf(this))
            .filter(name => typeof this[name] === 'function' && name !== 'constructor');

        methodNames.forEach(methodName => {
            ErrorBoundary.createSafeMethod(this, methodName);
        });
    }

    // Common error handling
    handleError(error, context) {
        console.error(`Error in ${this.constructor.name} (${context}):`, error);
        throw error;
    }

    // Safe data access
    safeGet(obj, path, defaultValue = null) {
        return Validator.safeGet(obj, path, defaultValue);
    }

    // Async operation wrapper
    async wrapOperation(operation, context, fallback = null) {
        return ErrorBoundary.wrap(
            async () => await operation(),
            fallback
        ).catch(error => this.handleError(error, context));
    }

    // Retry wrapper
    async wrapWithRetry(operation, context, maxRetries = 3, delay = 1000) {
        return ErrorBoundary.wrapWithRetry(
            async () => await operation(),
            maxRetries,
            delay
        ).catch(error => this.handleError(error, context));
    }

    // Event handling
    on(eventName, handler) {
        if (!this._eventHandlers) {
            this._eventHandlers = new Map();
        }
        if (!this._eventHandlers.has(eventName)) {
            this._eventHandlers.set(eventName, new Set());
        }
        this._eventHandlers.get(eventName).add(handler);
    }

    off(eventName, handler) {
        if (this._eventHandlers?.has(eventName)) {
            this._eventHandlers.get(eventName).delete(handler);
        }
    }

    emit(eventName, data) {
        if (this._eventHandlers?.has(eventName)) {
            for (const handler of this._eventHandlers.get(eventName)) {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`Error in event handler for ${eventName}:`, error);
                }
            }
        }
    }
} 