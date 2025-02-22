// Individual list item component
class ListItem extends Component {
    constructor(element, options = {}) {
        super(element, options);
        this.list = options.list;
        this.isActive = options.isActive || false;
        this.onSelect = options.onSelect;
        this.onFavorite = options.onFavorite;
        this.onDelete = options.onDelete;
        this._isEditing = false;
    }

    async setupState() {
        this._state = {
            list: this.list,
            isActive: this.isActive,
            isEditing: false
        };
    }

    async setupEventListeners() {
        // Delegate events
        this.delegate('click', '[data-action="select-list"]', (e) => {
            e.preventDefault();
            if (!this._state.isEditing) {
                this.onSelect?.();
            }
        });

        this.delegate('click', '[data-action="favorite-list"]', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.onFavorite?.();
        });

        this.delegate('click', '[data-action="delete-list"]', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.onDelete?.();
        });

        this.delegate('dblclick', '.list-name', () => {
            if (!this._state.isEditing) {
                this.startEditing();
            }
        });

        this.delegate('keydown', '.list-name-input', (e) => {
            if (e.key === 'Enter') {
                this.finishEditing();
            } else if (e.key === 'Escape') {
                this.cancelEditing();
            }
        });

        this.delegate('blur', '.list-name-input', () => {
            this.finishEditing();
        });
    }

    startEditing() {
        this.setState({ isEditing: true });
    }

    async finishEditing() {
        const input = this.$('.list-name-input');
        if (input && input.value.trim()) {
            const newName = input.value.trim();
            if (newName !== this._state.list.name) {
                this._state.list.editName(newName);
                this.emit(Constants.EVENTS.LIST_UPDATED, this._state.list);
            }
        }
        this.setState({ isEditing: false });
    }

    cancelEditing() {
        this.setState({ isEditing: false });
    }

    async render() {
        const { list, isActive, isEditing } = this.getState();
        const activeClass = isActive ? ' active' : '';
        const favoriteClass = list.favorite ? ' favorite' : '';

        this.element.className = `list-item${activeClass}${favoriteClass}`;
        this.element.dataset.listId = list.id;
        this.element.dataset.action = 'select-list';

        if (isEditing) {
            this.element.innerHTML = `
                <input type="text" class="list-name-input" 
                    value="${list.name}" 
                    data-action="edit-list">
                <div class="list-actions">
                    <button class="btn-favorite" data-action="favorite-list">
                        ${list.favorite ? '★' : '☆'}
                    </button>
                    <button class="btn-delete" data-action="delete-list">×</button>
                </div>
            `;
            this.$('.list-name-input').focus();
        } else {
            this.element.innerHTML = `
                <span class="list-name">${list.name}</span>
                <span class="todo-count">${list.todos.filter(t => !t.completed).length}</span>
                <div class="list-actions">
                    <button class="btn-favorite" data-action="favorite-list">
                        ${list.favorite ? '★' : '☆'}
                    </button>
                    <button class="btn-delete" data-action="delete-list">×</button>
                </div>
            `;
        }
    }

    removeEventListeners() {
        // Event listeners are automatically removed by the delegate system
    }
} 