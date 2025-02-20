class List {
    constructor(name, id = Date.now().toString()) {
        this.id = id;
        this.name = name;
        this.todos = [];
        this.createdAt = new Date().toISOString();
        this.order = 0;
        this.favorite = false;
    }

    addTodo(text) {
        const todo = {
            id: Date.now().toString(),
            text,
            completed: false,
            createdAt: new Date().toISOString(),
            order: this.todos.length,
            favorite: false,
            subtasks: []
        };
        this.todos.push(todo);
        return todo;
    }

    addSubtask(todoId, text) {
        const todo = this.todos.find(todo => todo.id === todoId);
        if (todo) {
            if (!Array.isArray(todo.subtasks)) {
                todo.subtasks = [];
            }

            const subtask = {
                id: Date.now().toString(),
                text,
                completed: false,
                createdAt: new Date().toISOString(),
                order: todo.subtasks.length,
                parent: todoId
            };
            todo.subtasks.push(subtask);
            return subtask;
        }
        return null;
    }

    removeSubtask(todoId, subtaskId) {
        const todo = this.todos.find(todo => todo.id === todoId);
        if (todo) {
            todo.subtasks = todo.subtasks.filter(subtask => subtask.id !== subtaskId);
        }
    }

    toggleSubtask(todoId, subtaskId) {
        const todo = this.todos.find(todo => todo.id === todoId);
        if (todo) {
            const subtask = todo.subtasks.find(subtask => subtask.id === subtaskId);
            if (subtask) {
                subtask.completed = !subtask.completed;
            }
        }
    }

    removeTodo(todoId) {
        this.todos = this.todos.filter(todo => todo.id !== todoId);
    }

    toggleTodo(todoId) {
        const todo = this.todos.find(todo => todo.id === todoId);
        if (todo) {
            todo.completed = !todo.completed;
            // When completing a parent task, complete all subtasks
            if (todo.completed) {
                todo.subtasks.forEach(subtask => {
                    subtask.completed = true;
                });
            }
        }
        return todo;
    }

    reorderTodos(todoId, newOrder) {
        const todo = this.todos.find(todo => todo.id === todoId);
        if (!todo) return;

        this.todos = this.todos.filter(t => t.id !== todoId);
        this.todos.splice(newOrder, 0, todo);

        // Update order property for all todos
        this.todos.forEach((todo, index) => {
            todo.order = index;
        });
    }

    editTodo(todoId, newText) {
        const todo = this.todos.find(todo => todo.id === todoId);
        if (todo) {
            todo.text = newText;
        }
        return todo;
    }

    editSubtask(todoId, subtaskId, newText) {
        const todo = this.todos.find(todo => todo.id === todoId);
        if (todo) {
            const subtask = todo.subtasks.find(subtask => subtask.id === subtaskId);
            if (subtask) {
                subtask.text = newText;
            }
        }
    }

    editName(newName) {
        if (newName && newName.trim()) {
            this.name = newName.trim();
        }
        return this;
    }

    toggleFavorite() {
        this.favorite = !this.favorite;
        return this;
    }

    toggleTodoFavorite(todoId) {
        const todo = this.todos.find(todo => todo.id === todoId);
        if (todo) {
            todo.favorite = !todo.favorite;
        }
        return todo;
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            todos: this.todos,
            createdAt: this.createdAt,
            order: this.order,
            favorite: this.favorite
        };
    }

    static fromJSON(json) {
        const list = new List(json.name, json.id);
        list.todos = json.todos;
        list.createdAt = json.createdAt;
        list.favorite = json.favorite || false;
        return list;
    }
} 