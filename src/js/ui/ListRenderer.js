// List Renderer Component
class ListRenderer {
    constructor(todoApp) {
        this.app = todoApp;
    }

    renderLists() {
        this.app.listContainer.innerHTML = '';

        // Ensure lists array exists
        if (!Array.isArray(this.app.lists)) {
            console.warn('TodoApp: Lists is not an array, initializing empty array');
            this.app.lists = [];
            return;
        }

        this.app.lists
            .sort((a, b) => {
                // Sort by favorite first, then by order
                if (a.favorite !== b.favorite) {
                    return b.favorite ? 1 : -1;
                }
                return a.order - b.order;
            })
            .forEach(list => this.renderListItem(list));
    }

    renderListItem(list) {
        // Skip invalid list objects
        if (!list || typeof list !== 'object') {
            console.warn('TodoApp: Invalid list object found, skipping:', list);
            return;
        }

        // Ensure todos array exists
        if (!Array.isArray(list.todos)) {
            console.warn('TodoApp: List todos is not an array, initializing empty array for list:', list.id);
            list.todos = [];
        }

        const listElement = document.createElement('div');
        listElement.className = `list-item${list.id === this.app.currentListId ? ' active' : ''}`;
        listElement.draggable = true;
        listElement.dataset.id = list.id;
        listElement.dataset.type = 'list';

        listElement.innerHTML = this.createListHTML(list);
        this.setupListEventListeners(listElement, list);
        this.app.listContainer.appendChild(listElement);
    }

    createListHTML(list) {
        return `
            <div class="list-item__content">
                <div class="drag-handle">⋮⋮</div>
                <span class="list-item__name">${list.name || 'Untitled List'}</span>
                <span class="list-item__count">${list.todos.length}</span>
            </div>
            <input type="text" class="list-item__edit" value="${list.name || ''}" placeholder="List name">
            <div class="list-item__actions">
                <button class="list-item__action list-item__action--favorite${list.favorite ? ' active' : ''}" title="Toggle favorite"></button>
                <button class="list-item__action list-item__action--edit" title="Rename list"></button>
                <button class="list-item__action list-item__action--delete" title="Delete list"></button>
            </div>`;
    }

    setupListEventListeners(listElement, list) {
        // Prevent dragging when interacting with buttons or input
        listElement.querySelector('.list-item__actions').addEventListener('mousedown', e => {
            e.stopPropagation();
        });
        listElement.querySelector('.list-item__edit').addEventListener('mousedown', e => {
            e.stopPropagation();
        });

        // Drag handling
        this.setupDragHandling(listElement);

        // Favorite button event
        listElement.querySelector('.list-item__action--favorite').addEventListener('click', (e) => {
            e.stopPropagation();
            this.app.toggleListFavorite(list.id);
        });

        // Click event for selecting list
        listElement.addEventListener('click', (e) => {
            if (!e.target.closest('.list-item__actions') && !e.target.closest('.list-item__edit')) {
                this.app.currentListId = list.id;
                this.app.updateUI();
            }
        });

        // Edit functionality
        this.setupEditFunctionality(listElement, list);

        // Delete functionality
        this.setupDeleteFunctionality(listElement, list);
    }

    setupDragHandling(listElement) {
        listElement.addEventListener('mousedown', e => {
            const isDragHandle = e.target.classList.contains('drag-handle');
            const isMainContent = e.target.closest('.list-item__content') && !e.target.closest('.list-item__actions');
            listElement.draggable = isDragHandle || isMainContent;
        });

        listElement.addEventListener('mouseup', () => {
            listElement.draggable = true;
        });
    }

    setupEditFunctionality(listElement, list) {
        const editButton = listElement.querySelector('.list-item__action--edit');
        const editInput = listElement.querySelector('.list-item__edit');

        editButton.addEventListener('click', (e) => {
            e.stopPropagation();
            listElement.classList.add('list-item--editing');
            editInput.focus();
        });

        editInput.addEventListener('blur', () => {
            listElement.classList.remove('list-item--editing');
            if (editInput.value.trim() !== list.name) {
                this.app.editList(list.id, editInput.value);
            }
        });

        editInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                listElement.classList.remove('list-item--editing');
                if (editInput.value.trim() !== list.name) {
                    this.app.editList(list.id, editInput.value);
                }
            }
        });

        editInput.addEventListener('keyup', (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                listElement.classList.remove('list-item--editing');
                editInput.value = list.name;
            }
        });
    }

    setupDeleteFunctionality(listElement, list) {
        listElement.querySelector('.list-item__action--delete').addEventListener('click', (e) => {
            e.stopPropagation();
            const todoCount = list.todos.length;
            const message = todoCount > 0
                ? `Are you sure you want to delete "${list.name}" and its ${todoCount} todo${todoCount === 1 ? '' : 's'}?`
                : `Are you sure you want to delete "${list.name}"?`;

            if (confirm(message)) {
                this.app.deleteList(list.id);
            }
        });
    }
}

// Make ListRenderer available globally
window.ListRenderer = ListRenderer; 