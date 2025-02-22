// Main Application
class TodoApp {
    constructor() {
        this.lists = [];
        this.currentListId = null;
        this.filter = 'all';
        console.log('TodoApp: Initializing...');

        // First, set up DOM elements
        this.setupDOMElements();

        // Initialize renderers
        this.todoListRenderer = new TodoListRenderer(this);
        this.listRenderer = new ListRenderer(this);

        // Then initialize services
        this.storageService = new StorageService();
        this.firebaseService = new FirebaseService();
        this.dragDropService = new DragDropService();
        this.themeToggle = new ThemeToggle();

        // Setup services after DOM elements are available
        this.setupServices();
        this.setupEventListeners();

        // Load data with proper initialization sequence
        this.initializeData();
    }

    async initializeData() {
        console.log('TodoApp: Starting data initialization');

        try {
            // Initialize Firebase and wait for connection
            console.log('TodoApp: Waiting for Firebase connection...');
            await this.firebaseService.init();

            // Now that we're connected, start sync
            console.log('TodoApp: Firebase connected, starting sync');
            this.firebaseService.startSync([]);

            // Load from localStorage only if Firebase data is empty
            console.log('TodoApp: Loading from localStorage as fallback');
            if (this.lists.length === 0) {
                this.loadFromLocalStorage();
            }

            // Update UI
            console.log('TodoApp: Updating UI');
            this.updateUI();
        } catch (error) {
            console.error('TodoApp: Failed to initialize Firebase, falling back to localStorage', error);
            this.loadFromLocalStorage();
            this.updateUI();
        }
    }

    setupServices() {
        // Firebase setup
        this.firebaseService.onConnectionChange = (connected) => {
            if (this.syncStatus) {  // Add null check
                this.updateSyncStatus(connected);
            }
        };

        this.firebaseService.onDataChange = (lists) => {
            if (!Array.isArray(lists)) {
                console.warn('TodoApp: Received invalid lists data:', lists);
                return;
            }

            // Ensure all lists are properly instantiated
            this.lists = lists.map(list => {
                if (!(list instanceof List)) {
                    return List.fromJSON(list);
                }
                return list;
            });

            // Set current list if none is selected
            if (!this.currentListId && this.lists.length > 0) {
                this.currentListId = this.lists[0].id;
            }

            this.saveToLocalStorage();
            this.updateUI();
        };

        // Drag and drop setup
        this.dragDropService.onDrop = (draggedId, targetId, newIndex, type) => {
            if (type === 'list') {
                this.reorderList(draggedId, newIndex);
            } else if (type === 'todo') {
                this.reorderTodo(draggedId, newIndex);
            }
        };
    }

    setupDOMElements() {
        // Todo elements
        this.todoInput = document.getElementById('todoInput');
        this.addButton = document.getElementById('addTodo');
        this.todoList = document.getElementById('todoList');
        this.todoCount = document.getElementById('todoCount');
        this.clearCompletedBtn = document.getElementById('clearCompleted');
        this.syncStatus = document.getElementById('syncStatus');
        this.filterButtons = document.querySelectorAll('.filter-btn');

        // List elements
        this.listContainer = document.getElementById('listContainer');
        this.listInput = document.getElementById('listInput');
        this.addListButton = document.getElementById('addList');
        this.currentListName = document.getElementById('currentListName');

        // Theme toggle
        const themeToggleElement = document.getElementById('themeToggle');
        if (themeToggleElement) {
            this.themeToggle = new ThemeToggle(themeToggleElement);
            this.themeToggle.init();
        }
    }

    setupEventListeners() {
        // Todo event listeners
        this.addButton.addEventListener('click', () => this.addTodo());
        this.todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });
        this.clearCompletedBtn.addEventListener('click', () => this.clearCompleted());
        this.filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.setFilter(e.target.dataset.filter));
        });

        // List event listeners
        this.addListButton.addEventListener('click', () => this.addList());
        this.listInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addList();
        });

        // Drag and drop event listeners
        this.setupDragAndDrop();
    }

    setupDragAndDrop() {
        // Remove list drag and drop event listeners

        // Todo drag and drop
        this.todoList.addEventListener('dragstart', (e) => {
            this.dragDropService.handleDragStart(e, 'todo');
        });
        this.todoList.addEventListener('dragend', (e) => {
            this.dragDropService.handleDragEnd(e);
        });
        this.todoList.addEventListener('dragover', (e) => {
            this.dragDropService.handleDragOver(e);
        });
        this.todoList.addEventListener('drop', (e) => {
            this.dragDropService.handleDrop(e);
        });
    }

    loadFromLocalStorage() {
        const loadedLists = this.storageService.load();
        if (Array.isArray(loadedLists)) {
            this.lists = loadedLists.map(list => List.fromJSON(list));
            if (this.lists.length > 0 && !this.currentListId) {
                this.currentListId = this.lists[0].id;
            }
        } else {
            console.warn('TodoApp: Invalid data in localStorage, initializing empty lists');
            this.lists = [];
        }
    }

    saveToLocalStorage() {
        if (!Array.isArray(this.lists)) {
            console.warn('TodoApp: Cannot save invalid lists to localStorage');
            return;
        }
        this.storageService.save(this.lists);
    }

    updateSyncStatus(connected) {
        this.syncStatus.textContent = connected ? 'Online' : 'Offline';
        this.syncStatus.style.background = connected ? '#4CAF50' : '#999';
        this.syncStatus.style.color = 'white';
    }

    addList() {
        const name = this.listInput.value.trim();
        if (!name) return;

        const list = new List(name);
        this.lists.push(list);
        this.currentListId = list.id;
        this.listInput.value = '';

        this.saveToLocalStorage();
        this.firebaseService.uploadData(this.lists);
        this.updateUI();
    }

    addTodo() {
        if (!this.currentListId) return;
        const text = this.todoInput.value.trim();
        if (!text) return;

        const currentList = this.lists.find(list => list.id === this.currentListId);
        if (currentList) {
            currentList.addTodo(text);
            this.todoInput.value = '';

            this.saveToLocalStorage();
            this.firebaseService.uploadData(this.lists);
            this.updateUI();
        }
    }

    toggleTodo(todoId) {
        const currentList = this.lists.find(list => list.id === this.currentListId);
        if (currentList) {
            currentList.toggleTodo(todoId);
            this.saveToLocalStorage();
            this.firebaseService.uploadData(this.lists);
            this.updateUI();
        }
    }

    editTodo(todoId, newText) {
        const currentList = this.lists.find(list => list.id === this.currentListId);
        if (currentList && newText.trim()) {
            currentList.editTodo(todoId, newText);
            this.saveToLocalStorage();
            this.firebaseService.uploadData(this.lists);
            this.updateUI();
        }
    }

    clearCompleted() {
        const currentList = this.lists.find(list => list.id === this.currentListId);
        if (currentList) {
            currentList.todos = currentList.todos.filter(todo => !todo.completed);
            this.saveToLocalStorage();
            this.firebaseService.uploadData(this.lists);
            this.updateUI();
        }
    }

    setFilter(filter) {
        this.filter = filter;
        this.filterButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        this.updateUI();
    }

    reorderList(listId, newIndex) {
        const list = this.lists.find(l => l.id === listId);
        if (!list) return;

        this.lists = this.lists.filter(l => l.id !== listId);
        this.lists.splice(newIndex, 0, list);

        this.lists.forEach((list, index) => {
            list.order = index;
        });

        this.saveToLocalStorage();
        this.firebaseService.uploadData(this.lists);
        this.updateUI();
    }

    reorderTodo(todoId, newIndex) {
        const currentList = this.lists.find(list => list.id === this.currentListId);
        if (currentList) {
            currentList.reorderTodos(todoId, newIndex);
            this.saveToLocalStorage();
            this.firebaseService.uploadData(this.lists);
            this.updateUI();
        }
    }

    editList(listId, newName) {
        const list = this.lists.find(list => list.id === listId);
        if (list && newName.trim()) {
            list.editName(newName);
            this.saveToLocalStorage();
            this.firebaseService.uploadData(this.lists);
            this.updateUI();
        }
    }

    deleteList(listId) {
        this.lists = this.lists.filter(list => list.id !== listId);
        if (this.currentListId === listId) {
            this.currentListId = this.lists.length > 0 ? this.lists[0].id : null;
        }
        this.saveToLocalStorage();
        this.firebaseService.uploadData(this.lists);
        this.updateUI();
    }

    updateUI() {
        this.listRenderer.renderLists();
        this.todoListRenderer.renderTodos();
        this.updateTodoCount();
    }

    updateTodoCount() {
        const currentList = this.lists.find(list => list.id === this.currentListId);
        if (!currentList) {
            this.todoCount.textContent = '0 items left';
            return;
        }

        const activeCount = currentList.todos.filter(todo => !todo.completed).length;
        this.todoCount.textContent = `${activeCount} item${activeCount !== 1 ? 's' : ''} left`;
    }

    toggleListFavorite(listId) {
        const list = this.lists.find(l => l.id === listId);
        if (list) {
            list.toggleFavorite();
            this.saveToLocalStorage();
            this.firebaseService.uploadData(this.lists);
            this.updateUI();
        }
    }

    toggleTodoFavorite(todoId) {
        const currentList = this.lists.find(list => list.id === this.currentListId);
        if (currentList) {
            currentList.toggleTodoFavorite(todoId);
            this.saveToLocalStorage();
            this.firebaseService.uploadData(this.lists);
            this.updateUI();
        }
    }

    startSubtaskEditing(subtaskEl) {
        this.todoListRenderer.startSubtaskEditing(subtaskEl);
    }
}

// Make TodoApp available globally
window.TodoApp = TodoApp;

// Initialize the app when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TodoApp();
}); 