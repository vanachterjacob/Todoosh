// TodoList Renderer Component
class TodoListRenderer {
    constructor(app) {
        this.app = app;
        this.todoList = document.getElementById('todoList');
        this.todoInput = document.getElementById('todoInput');
        this.clearCompletedBtn = document.getElementById('clearCompleted');
        this.filterButtons = document.querySelectorAll('.filter-btn');
    }

    renderTodos() {
        this.app.todoList.innerHTML = '';
        const currentList = this.app.lists.find(list => list.id === this.app.currentListId);
        if (!currentList) return;

        this.app.currentListName.textContent = currentList.name;

        const filteredTodos = currentList.todos.filter(todo => {
            if (this.app.filter === 'active') return !todo.completed;
            if (this.app.filter === 'completed') return todo.completed;
            return true;
        });

        // First sort by order, then by favorite status
        filteredTodos
            .sort((a, b) => {
                // First sort by favorite status
                if (a.favorite !== b.favorite) {
                    return b.favorite ? 1 : -1;
                }
                // Then sort by order
                return a.order - b.order;
            })
            .forEach(todo => this.renderTodoItem(todo, currentList));
    }

    renderTodoItem(todo, currentList) {
        const todoElement = document.createElement('div');
        todoElement.className = `todo-item${todo.completed ? ' todo-item--completed' : ''}${todo.favorite ? ' favorite' : ''}`;
        todoElement.draggable = true;
        todoElement.dataset.id = todo.id;
        todoElement.dataset.type = 'todo';
        todoElement.dataset.order = todo.order;

        todoElement.innerHTML = this.createTodoHTML(todo);
        this.setupTodoEventListeners(todoElement, todo, currentList);
        this.app.todoList.appendChild(todoElement);
    }

    createTodoHTML(todo) {
        const mainContent = `
            <div class="todo-item__content">
                <div class="todo-item__checkbox-wrapper">
                    <input type="checkbox" class="todo-item__checkbox" ${todo.completed ? 'checked' : ''}>
                    <div class="todo-item__checkbox-custom"></div>
                </div>
                <span class="todo-item__text">${todo.text}</span>
                ${todo.subtasks && todo.subtasks.length ? `
                <button class="todo-item__subtask-indicator${todo.collapsed ? ' collapsed' : ''}" title="Toggle subtasks">
                    <span class="subtask-count">${todo.subtasks.filter(subtask => !subtask.completed).length}</span>
                    <svg width="12" height="12" viewBox="0 0 12 12">
                        <path d="M2 4 L6 8 L10 4" fill="none" stroke="currentColor" stroke-width="2"/>
                    </svg>
                </button>` : ''}
                <input type="text" class="todo-item__edit" value="${todo.text}">
                <div class="todo-item__actions">
                    <button class="todo-item__action todo-item__action--subtask" title="Add subtask">+</button>
                    <button class="todo-item__action todo-item__action--edit" title="Edit todo"></button>
                    <button class="todo-item__action todo-item__action--delete" title="Delete todo"></button>
                </div>
                <button class="todo-item__action todo-item__action--favorite${todo.favorite ? ' active' : ''}" title="Toggle favorite"></button>
            </div>`;

        const subtasksContent = todo.subtasks && todo.subtasks.length > 0 ? this.createSubtasksHTML(todo.subtasks, todo.collapsed) : '';
        return mainContent + subtasksContent;
    }

    createSubtasksHTML(subtasks, collapsed) {
        return `
            <div class="todo-item__subtasks${collapsed ? ' collapsed' : ''}">
                ${subtasks.map(subtask => `
                    <div class="todo-item__subtask" data-id="${subtask.id}">
                        <div class="todo-item__checkbox-wrapper">
                            <input type="checkbox" class="todo-item__checkbox" ${subtask.completed ? 'checked' : ''}>
                            <div class="todo-item__checkbox-custom"></div>
                        </div>
                        <div class="todo-item__text" contenteditable="false">${sanitizeHTML(subtask.text)}</div>
                        <div class="todo-item__actions">
                            <button class="todo-item__action todo-item__action--edit" title="Edit"></button>
                            <button class="todo-item__action todo-item__action--delete" title="Delete subtask"></button>
                        </div>
                    </div>
                `).join('')}
                ${this.createWYSIWYGToolbar()}
            </div>`;
    }

    createWYSIWYGToolbar() {
        return `
            <div class="wysiwyg-toolbar">
                <button class="wysiwyg-toolbar__button" data-command="bold" title="Bold"><b>B</b></button>
                <button class="wysiwyg-toolbar__button" data-command="italic" title="Italic"><i>I</i></button>
                <button class="wysiwyg-toolbar__button" data-command="underline" title="Underline"><u>U</u></button>
                <div class="wysiwyg-toolbar__separator"></div>
                <button class="wysiwyg-toolbar__button" data-command="insertUnorderedList" title="Bullet List">•</button>
                <button class="wysiwyg-toolbar__button" data-command="insertOrderedList" title="Numbered List">1.</button>
                <div class="wysiwyg-toolbar__separator"></div>
                <button class="wysiwyg-toolbar__button" data-command="createLink" title="Add Link">🔗</button>
                <button class="wysiwyg-toolbar__button" data-command="code" title="Code">〈/〉</button>
            </div>`;
    }

    setupTodoEventListeners(todoElement, todo, currentList) {
        // Main todo event listeners
        this.setupMainTodoListeners(todoElement, todo, currentList);

        // Subtask event listeners
        const subtasksContainer = todoElement.querySelector('.todo-item__subtasks');
        if (subtasksContainer) {
            this.setupSubtaskListeners(subtasksContainer);
        }
    }

    setupMainTodoListeners(todoElement, todo, currentList) {
        // Subtask indicator
        const subtaskIndicator = todoElement.querySelector('.todo-item__subtask-indicator');
        if (subtaskIndicator) {
            subtaskIndicator.addEventListener('click', (e) => {
                e.stopPropagation();
                todo.collapsed = !todo.collapsed;
                todoElement.querySelector('.todo-item__subtasks')?.classList.toggle('collapsed');
                subtaskIndicator.classList.toggle('collapsed');
                this.app.saveToLocalStorage();
            });
        }

        // Favorite button
        todoElement.querySelector('.todo-item__action--favorite').addEventListener('click', (e) => {
            e.stopPropagation();
            this.app.toggleTodoFavorite(todo.id);
        });

        // Checkbox
        todoElement.querySelector('.todo-item__checkbox').addEventListener('change', () => {
            this.app.toggleTodo(todo.id);
        });

        // Edit button
        const editButton = todoElement.querySelector('.todo-item__action--edit');
        const editInput = todoElement.querySelector('.todo-item__edit');

        editButton.addEventListener('click', () => {
            todoElement.classList.add('todo-item--editing');
            editInput.value = todo.text;
            editInput.focus();
            editInput.select();
        });

        // Edit input events
        this.setupEditInputListeners(editInput, todoElement, todo);

        // Delete button
        todoElement.querySelector('.todo-item__action--delete').addEventListener('click', () => {
            currentList.removeTodo(todo.id);
            this.app.saveToLocalStorage();
            this.app.firebaseService.uploadData(this.app.lists);
            this.app.updateUI();
        });

        // Add subtask button
        todoElement.querySelector('.todo-item__action--subtask').addEventListener('click', () => {
            this.handleAddSubtask(todo.id, todoElement);
        });
    }

    setupEditInputListeners(editInput, todoElement, todo) {
        editInput.addEventListener('blur', () => {
            todoElement.classList.remove('todo-item--editing');
            const newText = editInput.value.trim();
            if (newText !== todo.text) {
                this.app.editTodo(todo.id, newText);
            }
        });

        editInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                editInput.blur();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                editInput.value = todo.text;
                editInput.blur();
            }
        });
    }

    setupSubtaskListeners(subtasksContainer) {
        // Edit button click for subtasks
        subtasksContainer.addEventListener('click', (e) => {
            if (e.target.matches('.todo-item__action--edit')) {
                const subtaskEl = e.target.closest('.todo-item__subtask');
                const todoEl = subtaskEl?.closest('.todo-item');
                if (subtaskEl && todoEl) {
                    const todoId = todoEl.dataset.id;
                    const subtaskId = subtaskEl.dataset.id;
                    console.log('Editing subtask:', { todoId, subtaskId });
                    const todoItem = this.app.todoContainer.getTodoItem(todoId);
                    if (todoItem) {
                        try {
                            todoItem.setState({ editingSubtaskId: subtaskId });
                        } catch (error) {
                            console.error('Failed to set subtask editing state:', error);
                            const textEl = subtaskEl.querySelector('.todo-item__text');
                            if (textEl) {
                                textEl.contentEditable = 'true';
                                textEl.focus();
                            }
                        }
                    }
                }
            }
        });

        // Checkbox events for subtasks
        subtasksContainer.querySelectorAll('.todo-item__checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const subtaskEl = checkbox.closest('.todo-item__subtask');
                const todoEl = subtaskEl.closest('.todo-item');
                const todo = this.app.lists
                    .find(list => list.id === this.app.currentListId)
                    .todos.find(t => t.id === todoEl.dataset.id);

                const subtask = todo.subtasks.find(s => s.id === subtaskEl.dataset.id);
                subtask.completed = checkbox.checked;

                // Update the counter in the indicator
                const indicator = todoEl.querySelector('.todo-item__subtask-indicator .subtask-count');
                if (indicator) {
                    indicator.textContent = todo.subtasks.filter(s => !s.completed).length;
                }

                this.app.saveToLocalStorage();
                this.app.firebaseService.uploadData(this.app.lists);
            });
        });

        // WYSIWYG toolbar
        this.setupWYSIWYGToolbar(subtasksContainer);
    }

    setupWYSIWYGToolbar(subtasksContainer) {
        subtasksContainer.addEventListener('click', (e) => {
            const button = e.target.closest('.wysiwyg-toolbar__button');
            if (!button) return;

            e.preventDefault();
            e.stopPropagation();

            const command = button.dataset.command;
            const subtaskEl = subtasksContainer.querySelector('.todo-item__subtask.todo-item--editing');
            if (!subtaskEl) return;

            const textEl = subtaskEl.querySelector('.todo-item__text');
            textEl.focus();

            if (command === 'createLink') {
                const url = prompt('Enter the URL:');
                if (url) {
                    document.execCommand(command, false, url);
                }
            } else if (command === 'code') {
                const selection = window.getSelection();
                const range = selection.getRangeAt(0);
                const code = document.createElement('code');
                code.textContent = range.toString();
                range.deleteContents();
                range.insertNode(code);
            } else {
                document.execCommand(command, false, null);
            }

            button.classList.toggle('active', document.queryCommandState(command));
            textEl.focus();
        });
    }

    handleAddSubtask(todoId, todoElement) {
        const currentList = this.app.lists.find(list => list.id === this.app.currentListId);
        if (!currentList) return;

        currentList.addSubtask(todoId, 'New subtask');
        this.app.saveToLocalStorage();
        this.app.firebaseService.uploadData(this.app.lists);

        // First render the updated UI
        this.app.updateUI();

        // Then try to focus the new subtask after the UI has been updated
        setTimeout(() => {
            const subtasks = todoElement.querySelector('.todo-item__subtasks');
            if (!subtasks) return;

            const lastSubtask = subtasks.querySelector('.todo-item__subtask:last-child');
            if (!lastSubtask) return;

            const textEl = lastSubtask.querySelector('.todo-item__text');
            if (!textEl) return;

            lastSubtask.classList.add('todo-item--editing');
            textEl.contentEditable = 'true';
            textEl.focus();

            // Show the WYSIWYG toolbar
            const toolbar = subtasks.querySelector('.wysiwyg-toolbar');
            if (toolbar) {
                toolbar.style.display = 'flex';
                toolbar.style.top = '-35px';
            }

            // Set up text selection
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(textEl);
            selection.removeAllRanges();
            selection.addRange(range);
        }, 50); // Give the DOM enough time to update
    }
}

// Make TodoListRenderer available globally
window.TodoListRenderer = TodoListRenderer; 