// List container component
class ListContainer extends Component {
    constructor(element, options = {}) {
        super(element, options);
        this.storageService = options.storageService;
        this.firebaseService = options.firebaseService;
        this._listItems = new Map();
    }

    async setupState() {
        this._state = {
            lists: [],
            currentListId: null,
            isLoading: true,
            error: null
        };
    }

    async setupEventListeners() {
        // Listen for list changes
        this.storageService.on(Constants.EVENTS.LIST_UPDATED, () => this.loadLists());
        this.storageService.on(Constants.EVENTS.LIST_CREATED, () => this.loadLists());
        this.storageService.on(Constants.EVENTS.LIST_DELETED, () => this.loadLists());

        // Delegate click events
        this.delegate('click', '[data-action="select-list"]', this.handleListSelect.bind(this));
        this.delegate('click', '[data-action="favorite-list"]', this.handleListFavorite.bind(this));
        this.delegate('click', '[data-action="delete-list"]', this.handleListDelete.bind(this));
    }

    async loadLists() {
        try {
            this.setState({ isLoading: true, error: null });
            const lists = await this.storageService.getLists();

            // Sort lists: favorites first, then by order
            const sortedLists = lists.sort((a, b) => {
                if (a.favorite !== b.favorite) {
                    return b.favorite ? 1 : -1;
                }
                return a.order - b.order;
            });

            this.setState({ lists: sortedLists, isLoading: false });
        } catch (error) {
            console.error('Error loading lists:', error);
            this.setState({ error: 'Failed to load lists', isLoading: false });
        }
    }

    async render() {
        const { lists, isLoading, error, currentListId } = this.getState();

        if (isLoading) {
            this.element.innerHTML = '<div class="loading">Loading lists...</div>';
            return;
        }

        if (error) {
            this.element.innerHTML = `<div class="error">${error}</div>`;
            return;
        }

        // Clear existing list items that are no longer present
        for (const [id, component] of this._listItems) {
            if (!lists.find(list => list.id === id)) {
                component.destroy();
                this._listItems.delete(id);
            }
        }

        // Create or update list items
        lists.forEach(list => {
            let listItem = this._listItems.get(list.id);

            if (!listItem) {
                const itemElement = document.createElement('div');
                itemElement.className = 'list-item';
                this.element.appendChild(itemElement);

                listItem = new ListItem(itemElement, {
                    list,
                    isActive: list.id === currentListId,
                    onSelect: () => this.emit(Constants.EVENTS.LIST_SELECTED, list),
                    onFavorite: () => this.handleListFavorite(list),
                    onDelete: () => this.handleListDelete(list)
                });
                this._listItems.set(list.id, listItem);
                listItem.init();
            } else {
                listItem.setState({
                    list,
                    isActive: list.id === currentListId
                });
            }
        });
    }

    async handleListSelect(event, target) {
        const listId = target.closest('[data-list-id]').dataset.listId;
        this.setState({ currentListId: listId });
        this.emit(Constants.EVENTS.LIST_SELECTED,
            this._state.lists.find(list => list.id === listId)
        );
    }

    async handleListFavorite(event, target) {
        const listId = target.closest('[data-list-id]').dataset.listId;
        const list = this._state.lists.find(list => list.id === listId);
        if (list) {
            list.toggleFavorite();
            await this.storageService.updateList(list);
        }
    }

    async handleListDelete(event, target) {
        const listId = target.closest('[data-list-id]').dataset.listId;
        const list = this._state.lists.find(list => list.id === listId);
        if (list) {
            if (list.todos.length > 0) {
                if (!confirm('This list contains todos. Are you sure you want to delete it?')) {
                    return;
                }
            }
            await this.storageService.deleteList(list.id);

            // If this was the current list, select another one
            if (list.id === this._state.currentListId) {
                const nextList = this._state.lists.find(l => l.id !== list.id);
                if (nextList) {
                    this.emit(Constants.EVENTS.LIST_SELECTED, nextList);
                }
            }
        }
    }

    setCurrentList(listId) {
        this.setState({ currentListId: listId });
    }

    async cleanup() {
        // Cleanup all list items
        for (const component of this._listItems.values()) {
            component.destroy();
        }
        this._listItems.clear();
    }
} 