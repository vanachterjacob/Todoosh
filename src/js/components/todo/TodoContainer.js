// Todo container component
class TodoContainer extends Component {
    constructor(element, options = {}) {
        super(element, options);
        this.storageService = options.storageService;
        this.list = options.list;
        this._todoItems = new Map();
        this._currentFilter = Constants.UI.FILTERS.ALL;
    }

    async setupState() {
        this._state = {
            list: this.list,
            todos: this.list?.todos || [],
            filter: this._currentFilter,
            isLoading: false,
            error: null
        };
    }

    async setupEventListeners() {
        // Listen for todo changes
        this.storageService.on(Constants.EVENTS.TODO_UPDATED, () => this.refreshTodos());
        this.storageService.on(Constants.EVENTS.TODO_CREATED, () => this.refreshTodos());
        this.storageService.on(Constants.EVENTS.TODO_DELETED, () => this.refreshTodos());

        // Filter events
        this.delegate('click', '[data-filter]', this.handleFilterChange.bind(this));
        this.delegate('click', '[data-action="clear-completed"]', this.handleClearCompleted.bind(this));
    }

    setList(list) {
        this.list = list;
        this.setState({ list, todos: list?.todos || [] });
    }

    setFilter(filter) {
        this._currentFilter = filter;
        this.setState({ filter });
    }

    getFilteredTodos() {
        const { todos, filter } = this.getState();
        switch (filter) {
            case Constants.UI.FILTERS.ACTIVE:
                return todos.filter(todo => !todo.completed);
            case Constants.UI.FILTERS.COMPLETED:
                return todos.filter(todo => todo.completed);
            default:
                return todos;
        }
    }

    async refreshTodos() {
        const list = await this.storageService.getList(this.list.id);
        if (list) {
            this.setList(list);
        }
    }

    async render() {
        const { isLoading, error, filter } = this.getState();
        const todos = this.getFilteredTodos();
        const activeTodoCount = this.list?.todos.filter(t => !t.completed).length || 0;

        if (isLoading) {
            this.element.innerHTML = '<div class="loading">Loading todos...</div>';
            return;
        }

        if (error) {
            this.element.innerHTML = `<div class="error">${error}</div>`;
            return;
        }

        // Update filters UI
        this.$$('[data-filter]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });

        // Update todo count
        const todoCount = this.$('#todoCount');
        if (todoCount) {
            todoCount.textContent = `${activeTodoCount} item${activeTodoCount !== 1 ? 's' : ''} left`;
        }

        // Clear completed button
        const clearCompleted = this.$('[data-action="clear-completed"]');
        if (clearCompleted) {
            const hasCompleted = this.list?.todos.some(t => t.completed);
            clearCompleted.style.display = hasCompleted ? 'block' : 'none';
        }

        // Update todo list
        const todoList = this.$('.todo-list');
        if (!todoList) return;

        // Clear removed todos
        for (const [id, component] of this._todoItems) {
            if (!todos.find(todo => todo.id === id)) {
                component.destroy();
                this._todoItems.delete(id);
            }
        }

        // Create or update todo items
        todos.forEach((todo, index) => {
            let todoItem = this._todoItems.get(todo.id);

            if (!todoItem) {
                const itemElement = document.createElement('div');
                itemElement.className = 'todo-item';
                todoList.appendChild(itemElement);

                todoItem = new TodoItem(itemElement, {
                    todo,
                    onToggle: () => this.handleTodoToggle(todo),
                    onDelete: () => this.handleTodoDelete(todo),
                    onEdit: newText => this.handleTodoEdit(todo, newText),
                    onFavorite: () => this.handleTodoFavorite(todo),
                    onReorder: newIndex => this.handleTodoReorder(todo, newIndex),
                    onSubtaskAdd: subtask => this.handleSubtaskAdd(todo, subtask),
                    onSubtaskDelete: subtaskId => this.handleSubtaskDelete(todo, subtaskId),
                    onSubtaskToggle: subtaskId => this.handleSubtaskToggle(todo, subtaskId),
                    onSubtaskEdit: (subtaskId, newText) => this.handleSubtaskEdit(todo, subtaskId, newText),
                    app: this.app
                });
                this._todoItems.set(todo.id, todoItem);
                todoItem.init();
            } else {
                todoItem.update({ todo, index });
            }
        });
    }

    async handleTodoToggle(todo) {
        try {
            todo.toggleCompleted();
            await this.storageService.updateList(this.list);
            this.emit(Constants.EVENTS.TODO_UPDATED, todo);
        } catch (error) {
            console.error('Error toggling todo:', error);
        }
    }

    async handleTodoDelete(todo) {
        try {
            this.list.removeTodo(todo.id);
            await this.storageService.updateList(this.list);
            this.emit(Constants.EVENTS.TODO_DELETED, todo);
        } catch (error) {
            console.error('Error deleting todo:', error);
        }
    }

    async handleTodoEdit(todo, newText) {
        try {
            todo.editText(newText);
            await this.storageService.updateList(this.list);
            this.emit(Constants.EVENTS.TODO_UPDATED, todo);
        } catch (error) {
            console.error('Error editing todo:', error);
        }
    }

    async handleTodoFavorite(todo) {
        try {
            todo.toggleFavorite();
            await this.storageService.updateList(this.list);
            this.emit(Constants.EVENTS.TODO_UPDATED, todo);
        } catch (error) {
            console.error('Error favoriting todo:', error);
        }
    }

    async handleTodoReorder(todo, newIndex) {
        try {
            this.list.reorderTodo(todo.id, newIndex);
            await this.storageService.updateList(this.list);
            this.emit(Constants.EVENTS.TODO_UPDATED, todo);
        } catch (error) {
            console.error('Error reordering todo:', error);
        }
    }

    async handleSubtaskAdd(todo, subtask) {
        try {
            todo.addSubtask(subtask);
            await this.storageService.updateList(this.list);
            this.emit(Constants.EVENTS.TODO_UPDATED, todo);
        } catch (error) {
            console.error('Error adding subtask:', error);
        }
    }

    async handleSubtaskDelete(todo, subtaskId) {
        try {
            todo.removeSubtask(subtaskId);
            await this.storageService.updateList(this.list);
            this.emit(Constants.EVENTS.TODO_UPDATED, todo);
        } catch (error) {
            console.error('Error deleting subtask:', error);
        }
    }

    async handleSubtaskToggle(todo, subtaskId) {
        try {
            todo.toggleSubtask(subtaskId);
            await this.storageService.updateList(this.list);
            this.emit(Constants.EVENTS.TODO_UPDATED, todo);
        } catch (error) {
            console.error('Error toggling subtask:', error);
        }
    }

    async handleSubtaskEdit(todo, subtaskId, newText) {
        try {
            todo.editSubtask(subtaskId, newText);
            await this.storageService.updateList(this.list);
            this.emit(Constants.EVENTS.TODO_UPDATED, todo);
        } catch (error) {
            console.error('Error editing subtask:', error);
        }
    }

    async handleFilterChange(event, target) {
        const filter = target.dataset.filter;
        if (filter && filter !== this._state.filter) {
            this.setFilter(filter);
        }
    }

    async handleClearCompleted() {
        try {
            const completedTodos = this._state.todos.filter(todo => todo.completed);
            await Promise.all(completedTodos.map(todo => this.handleTodoDelete(todo)));
        } catch (error) {
            console.error('Error clearing completed todos:', error);
        }
    }

    getTodoItem(todoId) {
        return this._todoItems.get(todoId);
    }

    async cleanup() {
        // Cleanup event listeners and references
        this._todoItems.forEach(item => item.cleanup());
        this._todoItems.clear();
        await super.cleanup();
    }
}

// Make globally available
window.TodoContainer = TodoContainer; 