// Error boundary utility for async operations
class ErrorBoundary {
    static async wrap(operation, fallback = null) {
        try {
            return await operation();
        } catch (error) {
            console.error('Operation failed:', error);
            return fallback;
        }
    }

    static async wrapWithRetry(operation, maxRetries = 3, delay = 1000) {
        let lastError;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                console.warn(`Attempt ${attempt}/${maxRetries} failed:`, error);
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, delay * attempt));
                }
            }
        }
        console.error('All retry attempts failed:', lastError);
        throw lastError;
    }

    static handlePromise(promise, successCallback, errorCallback) {
        return promise
            .then(result => {
                if (successCallback) {
                    successCallback(result);
                }
                return result;
            })
            .catch(error => {
                console.error('Promise error:', error);
                if (errorCallback) {
                    errorCallback(error);
                }
                throw error;
            });
    }

    static createSafeMethod(object, methodName) {
        const originalMethod = object[methodName];
        object[methodName] = async function (...args) {
            try {
                return await originalMethod.apply(this, args);
            } catch (error) {
                console.error(`Error in ${methodName}:`, error);
                throw error;
            }
        };
    }
} 