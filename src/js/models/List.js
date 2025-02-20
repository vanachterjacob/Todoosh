class List {
    constructor(name, order = Date.now()) {
        this.id = Date.now().toString();
        this.name = name;
        this.todos = [];
        this.createdAt = new Date().toISOString();
        this.order = order;
        this.favorite = false;
    }

    addTodo(text) {
        const todo = {
            id: Date.now().toString(),
            text,
            completed: false,
            createdAt: new Date().toISOString(),
            order: this.todos.length,
            favorite: false
        };
        this.todos.push(todo);
        return todo;
    }

    removeTodo(todoId) {
        this.todos = this.todos.filter(todo => todo.id !== todoId);
    }

    toggleTodo(todoId) {
        const todo = this.todos.find(todo => todo.id === todoId);
        if (todo) {
            todo.completed = !todo.completed;
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
            todo.text = newText.trim();
        }
        return todo;
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
        const list = new List(json.name, json.order);
        list.id = json.id;
        list.todos = json.todos;
        list.createdAt = json.createdAt;
        list.favorite = json.favorite || false;
        return list;
    }
} 