class TodoComponent {
    constructor(todo, parentElement, onUpdate) {
        this.todo = todo;
        this.parentElement = parentElement;
        this.onUpdate = onUpdate;
        this.element = this.render();
        this.setupEventListeners();
    }

    render() {
        const todoEl = document.createElement('div');
        todoEl.className = 'todo-item';
        todoEl.dataset.id = this.todo.id;
        todoEl.innerHTML = `
            <div class="todo-content ${this.todo.completed ? 'completed' : ''}">
                <div class="todo-main">
                    <div class="drag-handle">⋮⋮</div>
                    <input type="checkbox" class="todo-checkbox" ${this.todo.completed ? 'checked' : ''}>
                    <div class="todo-text" contenteditable="true">${this.todo.text}</div>
                    <div class="todo-actions">
                        <button class="todo-favorite ${this.todo.favorite ? 'active' : ''}" title="Favorite">★</button>
                        <button class="todo-add-subtask" title="Add Subtask">+</button>
                        <button class="todo-delete" title="Delete">×</button>
                    </div>
                </div>
                ${this.todo.subtasks.length > 0 ? `
                    <div class="todo-subtasks">
                        ${this.todo.subtasks.map(subtask => `
                            <div class="subtask" data-id="${subtask.id}">
                                <input type="checkbox" class="subtask-checkbox" ${subtask.completed ? 'checked' : ''}>
                                <div class="subtask-text" contenteditable="true">${subtask.text}</div>
                                <button class="subtask-delete" title="Delete Subtask">×</button>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;

        return todoEl;
    }

    setupEventListeners() {
        // Checkbox toggle
        this.element.querySelector('.todo-checkbox').addEventListener('change', (e) => {
            this.todo.toggleComplete();
            this.update();
        });

        // Text editing
        const textEl = this.element.querySelector('.todo-text');
        textEl.addEventListener('blur', (e) => {
            this.todo.text = e.target.innerText.trim();
            this.update();
        });
        textEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.target.blur();
            }
        });

        // Favorite toggle
        this.element.querySelector('.todo-favorite').addEventListener('click', (e) => {
            this.todo.toggleFavorite();
            this.update();
        });

        // Add subtask
        const addSubtaskBtn = this.element.querySelector('.todo-add-subtask');
        if (addSubtaskBtn) {
            addSubtaskBtn.addEventListener('click', (e) => {
                const subtask = this.todo.addSubtask('New subtask');
                this.update();
                // Focus the new subtask text after render
                requestAnimationFrame(() => {
                    const newSubtaskEl = this.element.querySelector(`[data-id="${subtask.id}"] .subtask-text`);
                    if (newSubtaskEl) {
                        newSubtaskEl.focus();
                        // Select all text
                        const range = document.createRange();
                        range.selectNodeContents(newSubtaskEl);
                        const selection = window.getSelection();
                        selection.removeAllRanges();
                        selection.addRange(range);
                    }
                });
            });
        }

        // Delete todo
        this.element.querySelector('.todo-delete').addEventListener('click', (e) => {
            if (this.todo.subtasks.length > 0) {
                if (!confirm('This todo has subtasks. Are you sure you want to delete it?')) {
                    return;
                }
            }
            this.element.remove();
            this.onUpdate('delete', this.todo);
        });

        // Subtask event delegation
        const subtasksContainer = this.element.querySelector('.todo-subtasks');
        if (subtasksContainer) {
            // Subtask deletion
            subtasksContainer.addEventListener('click', (e) => {
                if (e.target.matches('.subtask-delete')) {
                    const subtaskEl = e.target.closest('.subtask');
                    if (!subtaskEl) return;

                    const subtaskId = parseInt(subtaskEl.dataset.id);
                    this.todo.removeSubtask(subtaskId);
                    this.update();
                }
            });

            // Subtask completion
            subtasksContainer.addEventListener('change', (e) => {
                if (e.target.matches('.subtask-checkbox')) {
                    const subtaskEl = e.target.closest('.subtask');
                    const subtaskId = parseInt(subtaskEl.dataset.id);
                    const subtask = this.todo.subtasks.find(s => s.id === subtaskId);
                    if (subtask) {
                        subtask.toggleComplete();
                        this.update();
                    }
                }
            });

            // Subtask text editing
            subtasksContainer.addEventListener('blur', (e) => {
                if (e.target.matches('.subtask-text')) {
                    const subtaskEl = e.target.closest('.subtask');
                    const subtaskId = parseInt(subtaskEl.dataset.id);
                    const subtask = this.todo.subtasks.find(s => s.id === subtaskId);
                    if (subtask) {
                        subtask.text = e.target.innerText.trim();
                        this.update();
                    }
                }
            }, true);

            // Handle Enter key in subtasks
            subtasksContainer.addEventListener('keydown', (e) => {
                if (e.target.matches('.subtask-text') && e.key === 'Enter') {
                    e.preventDefault();
                    e.target.blur();
                }
            });
        }
    }

    update() {
        const newElement = this.render();
        this.element.replaceWith(newElement);
        this.element = newElement;
        this.setupEventListeners();
        this.onUpdate('update', this.todo);
    }
} 