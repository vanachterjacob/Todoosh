// Application-wide constants and configuration
const Constants = {
    // Storage keys
    STORAGE: {
        LISTS: 'todoosh_lists',
        THEME: 'todoosh_theme',
        VERSION: 'todoosh_version'
    },

    // Event names
    EVENTS: {
        LIST_UPDATED: 'list:updated',
        LIST_CREATED: 'list:created',
        LIST_DELETED: 'list:deleted',
        TODO_UPDATED: 'todo:updated',
        TODO_CREATED: 'todo:created',
        TODO_DELETED: 'todo:deleted',
        SYNC_STATUS: 'sync:status',
        THEME_CHANGED: 'theme:changed'
    },

    // Firebase paths
    FIREBASE: {
        LISTS_PATH: 'lists',
        CONNECTION_TEST: '_connection_test'
    },

    // UI states
    UI: {
        FILTERS: {
            ALL: 'all',
            ACTIVE: 'active',
            COMPLETED: 'completed'
        },
        THEMES: {
            LIGHT: 'light',
            DARK: 'dark'
        },
        SYNC_STATES: {
            ONLINE: 'online',
            OFFLINE: 'offline',
            ERROR: 'error',
            SYNCING: 'syncing'
        }
    },

    // Timing configurations
    TIMING: {
        SYNC_DEBOUNCE: 500,
        RETRY_DELAY: 1000,
        MAX_RETRIES: 3
    },

    // Validation
    VALIDATION: {
        MIN_NAME_LENGTH: 1,
        MAX_NAME_LENGTH: 100,
        DATE_FORMAT: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.*Z$/
    }
}; 