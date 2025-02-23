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
        this.delegate('click', '.todo-item__checkbox', (e, target) => {
            const subtaskId = target.closest('.todo-item__subtask').dataset.id;
            this.onSubtaskToggle?.(subtaskId);
        });

        this.delegate('click', '.todo-item__action--delete', (e, target) => {
            const subtaskId = target.closest('.todo-item__subtask').dataset.id;
            this.onSubtaskDelete?.(subtaskId);
        });

        this.delegate('click', '.todo-item__action--edit', (e, target) => {
            const subtaskId = target.closest('.todo-item__subtask').dataset.id;
            this.setState({ editingSubtaskId: subtaskId });
        });

        this.delegate('keydown', '.todo-item__text[contenteditable="true"]', (e, target) => {
            const subtaskId = target.closest('.todo-item__subtask').dataset.id;
            if (e.key === 'Enter') {
                e.preventDefault();
                this.finishEditingSubtask(subtaskId, target.textContent);
            } else if (e.key === 'Escape') {
                this.setState({ editingSubtaskId: null });
            }
        });

        this.delegate('blur', '.todo-item__text[contenteditable="true"]', (e, target) => {
            const subtaskId = target.closest('.todo-item__subtask').dataset.id;
            this.finishEditingSubtask(subtaskId, target.textContent);
        });

        // Toggle subtasks
        this.delegate('click', '.subtasks-toggle', () => {
            this.setState({ showSubtasks: !this._state.showSubtasks });
        });

        // Drag and drop
        this.setupDragAndDrop();

        // WYSIWYG toolbar events
        this.delegate('click', '.wysiwyg-toolbar__button', (e, target) => {
            e.preventDefault();
            e.stopPropagation();

            const command = target.dataset.command;
            if (!command) return;

            const textEl = this.element.querySelector('.todo-item__text[contenteditable="true"]');
            if (!textEl) return;

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

            target.classList.toggle('active', document.queryCommandState(command));
            textEl.focus();
        });
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

    render() {
        return `
            <div class="todo-item__content">
                ${this.createCheckbox()}
                <span class="todo-item__text">${this.todo.text}</span>
                ${this.createSubtaskIndicator()}
                ${this.createActions()}
            </div>
            ${this.createSubtasks()}
        `;
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