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
            subtasks: []  // Always initialize as empty array
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
            if (todo.completed && Array.isArray(todo.subtasks)) {
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

        const oldOrder = todo.order;
        const isMovingDown = newOrder > oldOrder;

        // Remove the todo from its current position
        this.todos = this.todos.filter(t => t.id !== todoId);

        // Update orders of todos between old and new positions
        let affectedTodos = [];
        this.todos.forEach(t => {
            const originalOrder = t.order;
            if (isMovingDown) {
                if (t.order > oldOrder && t.order <= newOrder) {
                    t.order--;
                    affectedTodos.push({
                        id: t.id,
                        text: t.text.slice(0, 30) + '...',
                        from: originalOrder,
                        to: t.order
                    });
                }
            } else {
                if (t.order >= newOrder && t.order < oldOrder) {
                    t.order++;
                    affectedTodos.push({
                        id: t.id,
                        text: t.text.slice(0, 30) + '...',
                        from: originalOrder,
                        to: t.order
                    });
                }
            }
        });

        // Set the new order for the dragged todo
        todo.order = newOrder;

        // Insert the todo at its new position
        this.todos.splice(newOrder, 0, todo);

        // Ensure orders are sequential and correct
        this.todos.sort((a, b) => a.order - b.order);
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
        // Ensure todos is an array and each todo has a subtasks array
        list.todos = Array.isArray(json.todos) ? json.todos.map(todo => ({
            ...todo,
            subtasks: Array.isArray(todo.subtasks) ? todo.subtasks : []
        })) : [];
        list.createdAt = json.createdAt || new Date().toISOString();
        list.order = typeof json.order === 'number' ? json.order : 0;
        list.favorite = !!json.favorite;
        return list;
    }
} 