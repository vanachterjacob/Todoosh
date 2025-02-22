// Data validation schemas and utilities
class Validator {
    static listSchema = {
        type: 'object',
        required: ['id', 'name', 'todos', 'createdAt', 'order'],
        properties: {
            id: { type: 'string', minLength: 1 },
            name: { type: 'string', minLength: 1 },
            todos: {
                type: 'array',
                items: { $ref: '#/definitions/todo' }
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            order: { type: 'number', minimum: 0 },
            favorite: { type: 'boolean', default: false },
            isArchived: { type: 'boolean', default: false }
        }
    };

    static todoSchema = {
        type: 'object',
        required: ['id', 'text', 'completed', 'createdAt', 'order'],
        properties: {
            id: { type: 'string', minLength: 1 },
            text: { type: 'string', minLength: 1 },
            completed: { type: 'boolean', default: false },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            order: { type: 'number', minimum: 0 },
            favorite: { type: 'boolean', default: false },
            subtasks: {
                type: 'array',
                items: { $ref: '#/definitions/subtask' },
                default: []
            },
            dueDate: { type: 'string', format: 'date-time', nullable: true },
            tags: {
                type: 'array',
                items: { type: 'string' },
                default: []
            }
        }
    };

    static subtaskSchema = {
        type: 'object',
        required: ['id', 'text', 'completed', 'createdAt'],
        properties: {
            id: { type: 'string', minLength: 1 },
            text: { type: 'string', minLength: 1 },
            completed: { type: 'boolean', default: false },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
        }
    };

    static validateList(list) {
        try {
            if (!list || typeof list !== 'object') {
                throw new Error('Invalid list object');
            }

            // Validate required fields
            this.validateRequired(list, this.listSchema.required);

            // Validate and set default values
            list.favorite = !!list.favorite;
            list.isArchived = !!list.isArchived;
            list.todos = Array.isArray(list.todos) ? list.todos : [];
            list.updatedAt = list.updatedAt || new Date().toISOString();

            // Validate todos
            list.todos = list.todos.map(todo => this.validateTodo(todo)).filter(Boolean);

            return list;
        } catch (error) {
            console.error('Validation error in list:', error);
            return null;
        }
    }

    static validateTodo(todo) {
        try {
            if (!todo || typeof todo !== 'object') {
                throw new Error('Invalid todo object');
            }

            // Validate required fields
            this.validateRequired(todo, this.todoSchema.required);

            // Validate and set default values
            todo.completed = !!todo.completed;
            todo.favorite = !!todo.favorite;
            todo.subtasks = Array.isArray(todo.subtasks) ? todo.subtasks : [];
            todo.tags = Array.isArray(todo.tags) ? todo.tags : [];
            todo.updatedAt = todo.updatedAt || new Date().toISOString();

            // Validate subtasks
            todo.subtasks = todo.subtasks.map(subtask => this.validateSubtask(subtask)).filter(Boolean);

            return todo;
        } catch (error) {
            console.error('Validation error in todo:', error);
            return null;
        }
    }

    static validateSubtask(subtask) {
        try {
            if (!subtask || typeof subtask !== 'object') {
                throw new Error('Invalid subtask object');
            }

            // Validate required fields
            this.validateRequired(subtask, this.subtaskSchema.required);

            // Validate and set default values
            subtask.completed = !!subtask.completed;
            subtask.updatedAt = subtask.updatedAt || new Date().toISOString();

            return subtask;
        } catch (error) {
            console.error('Validation error in subtask:', error);
            return null;
        }
    }

    static validateRequired(obj, required) {
        for (const field of required) {
            if (obj[field] === undefined || obj[field] === null) {
                throw new Error(`Missing required field: ${field}`);
            }
        }
    }

    static safeGet(obj, path, defaultValue = null) {
        try {
            return path.split('.').reduce((current, key) =>
                (current && current[key] !== undefined) ? current[key] : defaultValue, obj);
        } catch (error) {
            return defaultValue;
        }
    }
} 