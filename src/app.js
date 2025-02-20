class TodoApp {
    constructor() {
        this.lists = [];
        this.currentListId = null;
        this.filter = 'all';

        // First, set up DOM elements
        this.setupDOMElements();

        // Then initialize services
        this.storageService = new StorageService();
        this.firebaseService = new FirebaseService();
        this.dragDropService = new DragDropService();

        // Setup services after DOM elements are available
        this.setupServices();
        this.setupEventListeners();

        // Load initial data
        this.loadFromLocalStorage();
        this.updateUI();
    }

    setupServices() {
        // Firebase setup
        this.firebaseService.onConnectionChange = (connected) => {
            if (this.syncStatus) {  // Add null check
                this.updateSyncStatus(connected);
            }
        };

        this.firebaseService.onDataChange = (lists) => {
            this.lists = lists;
            this.saveToLocalStorage();
            this.updateUI();
        };

        // Initialize Firebase after setting up handlers
        this.firebaseService.init();

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
        // List drag and drop
        this.listContainer.addEventListener('dragstart', (e) => {
            this.dragDropService.handleDragStart(e, 'list');
        });
        this.listContainer.addEventListener('dragend', (e) => {
            this.dragDropService.handleDragEnd(e);
        });
        this.listContainer.addEventListener('dragover', (e) => {
            this.dragDropService.handleDragOver(e);
        });
        this.listContainer.addEventListener('drop', (e) => {
            this.dragDropService.handleDrop(e);
        });

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
        this.lists = this.storageService.load();
        if (this.lists.length > 0 && !this.currentListId) {
            this.currentListId = this.lists[0].id;
        }
    }

    saveToLocalStorage() {
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

    updateUI() {
        this.renderLists();
        this.renderTodos();
        this.updateTodoCount();
    }

    renderLists() {
        this.listContainer.innerHTML = '';
        this.lists
            .sort((a, b) => a.order - b.order)
            .forEach(list => {
                const listElement = document.createElement('div');
                listElement.className = `list-item${list.id === this.currentListId ? ' active' : ''}`;
                listElement.draggable = true;
                listElement.dataset.id = list.id;
                listElement.dataset.type = 'list';
                listElement.innerHTML = `
                    <span class="list-item__name">${list.name}</span>
                    <span class="list-item__count">${list.todos.length}</span>
                `;
                listElement.addEventListener('click', () => {
                    this.currentListId = list.id;
                    this.updateUI();
                });
                this.listContainer.appendChild(listElement);
            });
    }

    renderTodos() {
        this.todoList.innerHTML = '';
        const currentList = this.lists.find(list => list.id === this.currentListId);
        if (!currentList) return;

        this.currentListName.textContent = currentList.name;

        const filteredTodos = currentList.todos.filter(todo => {
            if (this.filter === 'active') return !todo.completed;
            if (this.filter === 'completed') return todo.completed;
            return true;
        });

        filteredTodos
            .sort((a, b) => a.order - b.order)
            .forEach(todo => {
                const todoElement = document.createElement('div');
                todoElement.className = `todo-item${todo.completed ? ' todo-item--completed' : ''}`;
                todoElement.draggable = true;
                todoElement.dataset.id = todo.id;
                todoElement.dataset.type = 'todo';
                todoElement.innerHTML = `
                    <input type="checkbox" class="todo-item__checkbox" ${todo.completed ? 'checked' : ''}>
                    <span class="todo-item__text">${todo.text}</span>
                    <input type="text" class="todo-item__edit" value="${todo.text}">
                    <div class="todo-item__actions">
                        <button class="todo-item__action todo-item__action--edit" title="Edit"></button>
                        <button class="todo-item__action todo-item__action--delete" title="Delete"></button>
                    </div>
                `;

                // Checkbox event
                todoElement.querySelector('.todo-item__checkbox').addEventListener('change', () => {
                    this.toggleTodo(todo.id);
                });

                // Edit button event
                todoElement.querySelector('.todo-item__action--edit').addEventListener('click', () => {
                    todoElement.classList.add('todo-item--editing');
                    const editInput = todoElement.querySelector('.todo-item__edit');
                    editInput.focus();
                });

                // Edit input events
                const editInput = todoElement.querySelector('.todo-item__edit');
                editInput.addEventListener('blur', () => {
                    todoElement.classList.remove('todo-item--editing');
                    this.editTodo(todo.id, editInput.value);
                });
                editInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        todoElement.classList.remove('todo-item--editing');
                        this.editTodo(todo.id, editInput.value);
                    }
                });
                editInput.addEventListener('keyup', (e) => {
                    if (e.key === 'Escape') {
                        todoElement.classList.remove('todo-item--editing');
                        editInput.value = todo.text;
                    }
                });

                // Delete button event
                todoElement.querySelector('.todo-item__action--delete').addEventListener('click', () => {
                    currentList.removeTodo(todo.id);
                    this.saveToLocalStorage();
                    this.firebaseService.uploadData(this.lists);
                    this.updateUI();
                });

                this.todoList.appendChild(todoElement);
            });
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
} 