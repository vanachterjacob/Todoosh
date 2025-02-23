// Individual todo item component
class TodoItem extends Component {
    constructor(element, options = {}) {
        super(element, options);
        this.todo = options.todo;
        this.onToggle = options.onToggle;
        this.onDelete = options.onDelete;
        this.onEdit = options.onEdit;
        this.onFavorite = options.onFavorite;
        this.onReorder = options.onReorder;
        this.onSubtaskAdd = options.onSubtaskAdd;
        this.onSubtaskDelete = options.onSubtaskDelete;
        this.onSubtaskToggle = options.onSubtaskToggle;
        this.onSubtaskEdit = options.onSubtaskEdit;
        this._isEditing = false;
        this._dragState = {
            isDragging: false,
            startY: 0,
            currentY: 0
        };
    }

    async setupState() {
        this._state = {
            todo: this.todo,
            isEditing: false,
            isDragging: false,
            showSubtasks: true,
            editingSubtaskId: null
        };
    }

    update(newState) {
        Object.assign(this._state, newState);
        this.render();
    }

    setState(newState) {
        this.update(newState);
    }

    getState() {
        return this._state;
    }

    async setupEventListeners() {
        // Toggle completion
        this.delegate('click', '.todo-checkbox', (e) => {
            e.preventDefault();
            this.onToggle?.();
        });

        // Favorite
        this.delegate('click', '[data-action="favorite-todo"]', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.onFavorite?.();
        });

        // Delete
        this.delegate('click', '[data-action="delete-todo"]', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (this.todo.subtasks.length > 0) {
                if (!confirm('This todo has subtasks. Are you sure you want to delete it?')) {
                    return;
                }
            }
            this.onDelete?.();
        });

        // Edit on double click
        this.delegate('dblclick', '.todo-text', () => {
            if (!this._state.isEditing) {
                this.startEditing();
            }
        });

        // Handle edit input
        this.delegate('keydown', '.todo-edit-input', (e) => {
            if (e.key === 'Enter') {
                this.finishEditing();
            } else if (e.key === 'Escape') {
                this.cancelEditing();
            }
        });

        this.delegate('blur', '.todo-edit-input', () => {
            this.finishEditing();
        });

        // Add subtask
        this.delegate('click', '[data-action="add-subtask"]', () => {
            const subtask = { text: 'New subtask', completed: false };
            this.onSubtaskAdd?.(subtask);
            // Focus new subtask after render
            this.setState({ editingSubtaskId: subtask.id });
        });

        // Subtask events
        this.delegate('click', '.subtask-checkbox', (e, target) => {
            const subtaskId = target.closest('.subtask').dataset.subtaskId;
            this.onSubtaskToggle?.(subtaskId);
        });

        this.delegate('click', '[data-action="delete-subtask"]', (e, target) => {
            const subtaskId = target.closest('.subtask').dataset.subtaskId;
            this.onSubtaskDelete?.(subtaskId);
        });

        this.delegate('dblclick', '.subtask-text', (e, target) => {
            const subtaskId = target.closest('.subtask').dataset.subtaskId;
            this.setState({ editingSubtaskId: subtaskId });
        });

        this.delegate('keydown', '.subtask-edit-input', (e, target) => {
            const subtaskId = target.closest('.subtask').dataset.subtaskId;
            if (e.key === 'Enter') {
                e.preventDefault();
                this.finishEditingSubtask(subtaskId, target.value);
            } else if (e.key === 'Escape') {
                this.setState({ editingSubtaskId: null });
            }
        });

        this.delegate('blur', '.subtask-edit-input', (e, target) => {
            const subtaskId = target.closest('.subtask').dataset.subtaskId;
            this.finishEditingSubtask(subtaskId, target.value);
        });

        // Toggle subtasks
        this.delegate('click', '.subtasks-toggle', () => {
            this.setState({ showSubtasks: !this._state.showSubtasks });
        });

        // Drag and drop
        this.setupDragAndDrop();
    }

    setupDragAndDrop() {
        // Make only the drag handle draggable
        const dragHandle = this.$('.drag-handle');
        if (dragHandle) {
            dragHandle.draggable = true;
            dragHandle.addEventListener('dragstart', this.handleDragStart.bind(this));
            dragHandle.addEventListener('dragend', this.handleDragEnd.bind(this));
        }

        // The whole item can be a drop target
        this.element.addEventListener('dragover', this.handleDragOver.bind(this));
        this.element.addEventListener('drop', this.handleDrop.bind(this));
    }

    startEditing() {
        this.setState({ isEditing: true });
    }

    async finishEditing() {
        const input = this.$('.todo-edit-input');
        if (input && input.value.trim()) {
            const newText = input.value.trim();
            if (newText !== this._state.todo.text) {
                this.onEdit?.(newText);
            }
        }
        this.setState({ isEditing: false });
    }

    cancelEditing() {
        this.setState({ isEditing: false });
    }

    async finishEditingSubtask(subtaskId, newText) {
        if (newText.trim() && this.onSubtaskEdit) {
            this.onSubtaskEdit(subtaskId, newText.trim());
        }
        this.setState({ editingSubtaskId: null });
    }

    handleDragStart(e) {
        this.setState({ isDragging: true });
        e.dataTransfer.setData('text/plain', this._state.todo.id);
        e.dataTransfer.effectAllowed = 'move';
        requestAnimationFrame(() => {
            this.element.classList.add('dragging');
        });
    }

    handleDragEnd() {
        this.setState({ isDragging: false });
        this.element.classList.remove('dragging');
        this.element.classList.remove('drop-above', 'drop-below');
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        const rect = this.element.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;

        // Remove existing drop indicators
        this.element.classList.remove('drop-above', 'drop-below');

        // Add appropriate drop indicator
        if (e.clientY < midY) {
            this.element.classList.add('drop-above');
        } else {
            this.element.classList.add('drop-below');
        }
    }

    handleDrop(e) {
        e.preventDefault();
        const draggedId = e.dataTransfer.getData('text/plain');
        if (draggedId === this._state.todo.id) return;

        const rect = this.element.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        const dropIndex = this._state.todo.order + (e.clientY > midY ? 1 : 0);

        this.onReorder?.(dropIndex);
        this.element.classList.remove('drop-above', 'drop-below');
    }

    async render() {
        const { todo, isEditing, showSubtasks, editingSubtaskId } = this.getState();
        const completedClass = todo.completed ? ' completed' : '';
        const favoriteClass = todo.favorite ? ' favorite' : '';
        const editingClass = isEditing ? ' editing' : '';
        const hasSubtasks = todo.subtasks && todo.subtasks.length > 0;
        const activeSubtasks = hasSubtasks ? todo.subtasks.filter(s => !s.completed).length : 0;

        this.element.className = `todo-item${completedClass}${favoriteClass}${editingClass}`;
        this.element.dataset.todoId = todo.id;

        if (isEditing) {
            this.element.innerHTML = `
                <div class="drag-handle">⋮⋮</div>
                <input type="text" class="todo-edit-input" 
                    value="${todo.text}" 
                    data-action="edit-todo">
                <div class="todo-actions">
                    <button class="btn-favorite" data-action="favorite-todo">
                        ${todo.favorite ? '★' : '☆'}
                    </button>
                    <button class="btn-delete" data-action="delete-todo">×</button>
                </div>
            `;
            this.$('.todo-edit-input').focus();
        } else {
            this.element.innerHTML = `
                <div class="todo-main">
                    <div class="drag-handle">⋮⋮</div>
                    <input type="checkbox" class="todo-checkbox" 
                        ${todo.completed ? 'checked' : ''}>
                    <span class="todo-text">${todo.text}</span>
                    ${hasSubtasks ? `
                        <button class="subtasks-toggle">
                            ${activeSubtasks} active
                            <span class="arrow ${showSubtasks ? 'down' : 'right'}"></span>
                        </button>
                    ` : ''}
                    <div class="todo-actions">
                        <button class="btn-favorite" data-action="favorite-todo">
                            ${todo.favorite ? '★' : '☆'}
                        </button>
                        <button class="btn-add-subtask" data-action="add-subtask" title="Add Subtask">+</button>
                        <button class="btn-delete" data-action="delete-todo">×</button>
                    </div>
                </div>
                ${hasSubtasks ? `
                    <div class="subtasks ${showSubtasks ? 'show' : 'hide'}">
                        ${todo.subtasks.map(subtask => `
                            <div class="subtask ${subtask.completed ? 'completed' : ''}" 
                                data-subtask-id="${subtask.id}">
                                <input type="checkbox" class="subtask-checkbox" 
                                    ${subtask.completed ? 'checked' : ''}>
                                ${editingSubtaskId === subtask.id ? `
                                    <input type="text" class="subtask-edit-input" 
                                        value="${subtask.text}"
                                        data-action="edit-subtask">
                                ` : `
                                    <span class="subtask-text">${subtask.text}</span>
                                `}
                                <button class="btn-delete" data-action="delete-subtask">×</button>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            `;

            // Focus new subtask input if needed
            if (editingSubtaskId) {
                requestAnimationFrame(() => {
                    const input = this.$(`.subtask[data-subtask-id="${editingSubtaskId}"] .subtask-edit-input`);
                    if (input) {
                        input.focus();
                        input.select();
                    }
                });
            }
        }
    }

    removeEventListeners() {
        // Event listeners are automatically removed by the delegate system
        const dragHandle = this.$('.drag-handle');
        if (dragHandle) {
            dragHandle.removeEventListener('dragstart', this.handleDragStart);
            dragHandle.removeEventListener('dragend', this.handleDragEnd);
        }
        this.element.removeEventListener('dragover', this.handleDragOver);
        this.element.removeEventListener('drop', this.handleDrop);
    }
}

// Make globally available
window.TodoItem = TodoItem; 