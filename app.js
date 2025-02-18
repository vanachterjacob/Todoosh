class TodoApp {
    constructor() {
        this.lists = [];
        this.currentListId = null;
        this.filter = 'all';
        this.setupDOMElements();
        this.setupEventListeners();
        this.loadFromLocalStorage();
        this.testFirebaseConnection();
        this.setupFirebaseSync();
        this.updateUI();
    }

    testFirebaseConnection() {
        database.ref('.info/connected').on('value', (snapshot) => {
            const connected = snapshot.val();
            console.log('Firebase connection status:', connected ? 'Connected' : 'Disconnected');
            this.syncStatus.textContent = connected ? 'Online' : 'Offline';
            this.syncStatus.style.background = connected ? '#4CAF50' : '#999';
            this.syncStatus.style.color = 'white';
        });
    }

    setupDOMElements() {
        this.todoInput = document.getElementById('todoInput');
        this.addButton = document.getElementById('addTodo');
        this.todoList = document.getElementById('todoList');
        this.todoCount = document.getElementById('todoCount');
        this.clearCompletedBtn = document.getElementById('clearCompleted');
        this.syncStatus = document.getElementById('syncStatus');
        this.filterButtons = document.querySelectorAll('.filter-btn');

        this.listContainer = document.getElementById('listContainer');
        this.listInput = document.getElementById('listInput');
        this.addListButton = document.getElementById('addList');
        this.currentListName = document.getElementById('currentListName');
    }

    setupEventListeners() {
        this.addButton.addEventListener('click', () => this.addTodo());
        this.todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });
        this.clearCompletedBtn.addEventListener('click', () => this.clearCompleted());
        this.filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.setFilter(e.target.dataset.filter));
        });

        this.addListButton.addEventListener('click', () => this.addList());
        this.listInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addList();
        });

        // Add drag and drop event listeners
        this.todoList.addEventListener('dragstart', this.handleDragStart.bind(this));
        this.todoList.addEventListener('dragend', this.handleDragEnd.bind(this));
        this.todoList.addEventListener('dragover', this.handleDragOver.bind(this));
        this.todoList.addEventListener('drop', this.handleDrop.bind(this));

        this.listContainer.addEventListener('dragstart', this.handleDragStart.bind(this));
        this.listContainer.addEventListener('dragend', this.handleDragEnd.bind(this));
        this.listContainer.addEventListener('dragover', this.handleDragOver.bind(this));
        this.listContainer.addEventListener('drop', this.handleDrop.bind(this));
    }

    setupFirebaseSync() {
        if (database) {
            this.syncStatus.textContent = 'Connecting...';
            this.syncStatus.style.background = '#FFA500';
            this.syncStatus.style.color = 'white';

            // Listen for connection state
            database.ref('.info/connected').on('value', (snapshot) => {
                const connected = snapshot.val();
                if (connected) {
                    // Test permissions with a small write operation
                    database.ref('lists/_connection_test').set({
                        test: true,
                        timestamp: firebase.database.ServerValue.TIMESTAMP
                    }).then(() => {
                        // Clean up test data
                        database.ref('lists/_connection_test').remove();

                        this.syncStatus.textContent = 'Online';
                        this.syncStatus.style.background = '#4CAF50';
                        this.syncStatus.style.color = 'white';

                        // Start listening for changes
                        this.setupListSync();

                        // Initial sync if we have local data
                        if (this.lists.length > 0) {
                            this.syncToFirebase();
                        }
                    }).catch((error) => {
                        console.error('Firebase permission error:', error);
                        this.syncStatus.textContent = 'Permission Denied';
                        this.syncStatus.style.background = '#FF4444';
                        this.syncStatus.style.color = 'white';

                        // Switch to offline-only mode
                        this.handleOfflineMode();
                    });
                } else {
                    this.syncStatus.textContent = 'Offline';
                    this.syncStatus.style.background = '#999';
                    this.syncStatus.style.color = 'white';

                    // Switch to offline-only mode
                    this.handleOfflineMode();
                }
            });
        }
    }

    handleOfflineMode() {
        // Load data from localStorage if available
        this.loadFromLocalStorage();

        // Disable Firebase sync
        if (database) {
            database.ref('lists').off();
        }
    }

    setupListSync() {
        database.ref('lists').on('value', (snapshot) => {
            const firebaseLists = snapshot.val();
            if (firebaseLists) {
                // Filter out any test data
                delete firebaseLists['_connection_test'];

                const listsArray = Object.values(firebaseLists).map(list => ({
                    ...list,
                    todos: Array.isArray(list.todos) ? list.todos : []
                }));

                if (JSON.stringify(this.lists) !== JSON.stringify(listsArray)) {
                    this.lists = listsArray;
                    this.saveToLocalStorage();
                    this.updateUI();
                }
            } else {
                // If no data in Firebase and we have local data, sync it
                if (this.lists.length > 0) {
                    this.syncToFirebase();
                } else {
                    this.lists = [];
                    this.saveToLocalStorage();
                    this.updateUI();
                }
            }
        }, (error) => {
            console.error('Firebase sync error:', error);
            this.syncStatus.textContent = 'Sync Error';
            this.syncStatus.style.background = '#FF4444';
            this.syncStatus.style.color = 'white';

            // Switch to offline-only mode
            this.handleOfflineMode();
        });
    }

    syncToFirebase() {
        if (!database || !Array.isArray(this.lists)) return;

        const listsObject = {};
        this.lists.forEach(list => {
            if (list && list.id) {
                listsObject[list.id] = {
                    ...list,
                    todos: Array.isArray(list.todos) ? list.todos : []
                };
            }
        });

        if (Object.keys(listsObject).length === 0) return;

        this.syncStatus.textContent = 'Syncing...';
        this.syncStatus.style.background = '#FFA500';

        database.ref('lists').set(listsObject)
            .then(() => {
                this.syncStatus.textContent = 'Online';
                this.syncStatus.style.background = '#4CAF50';
            })
            .catch((error) => {
                console.error('Firebase write error:', error);
                this.syncStatus.textContent = 'Sync Failed';
                this.syncStatus.style.background = '#FF4444';

                // Switch to offline-only mode on write error
                this.handleOfflineMode();
            });
    }

    loadFromLocalStorage() {
        const stored = localStorage.getItem('lists');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                this.lists = Array.isArray(parsed) ? parsed : [];
            } catch (e) {
                console.error('Error parsing stored lists:', e);
                this.lists = [];
            }
        } else {
            this.lists = [];
        }

        if (this.lists.length > 0) {
            this.currentListId = this.lists[0].id;
        }
        this.updateUI();
    }

    saveToLocalStorage() {
        if (Array.isArray(this.lists)) {
            localStorage.setItem('lists', JSON.stringify(this.lists));
        }
    }

    addList() {
        const text = this.listInput.value.trim();
        if (text) {
            const list = {
                id: Date.now().toString(),
                name: text,
                todos: [],
                createdAt: new Date().toISOString()
            };
            this.lists.push(list);
            this.listInput.value = '';
            if (!this.currentListId) {
                this.currentListId = list.id;
            }
            this.saveToLocalStorage();
            this.syncToFirebase();
            this.updateUI();
        }
    }

    updateList(id, newName) {
        this.lists = this.lists.map(list => {
            if (list.id === id) {
                return { ...list, name: newName };
            }
            return list;
        });
        this.saveToLocalStorage();
        this.syncToFirebase();
        this.updateUI();
    }

    deleteList(id) {
        this.lists = this.lists.filter(list => list.id !== id);
        if (this.currentListId === id) {
            this.currentListId = this.lists.length > 0 ? this.lists[0].id : null;
        }
        this.saveToLocalStorage();
        this.syncToFirebase();
        this.updateUI();
    }

    switchList(id) {
        this.currentListId = id;
        this.updateUI();
    }

    addTodo() {
        const text = this.todoInput.value.trim();
        if (text && this.currentListId) {
            const todo = {
                id: Date.now().toString(),
                text: text,
                completed: false,
                createdAt: new Date().toISOString()
            };

            this.lists = this.lists.map(list => {
                if (list.id === this.currentListId) {
                    return {
                        ...list,
                        todos: Array.isArray(list.todos) ? [...list.todos, todo] : [todo]
                    };
                }
                return list;
            });

            this.todoInput.value = '';
            this.saveToLocalStorage();
            this.syncToFirebase();
            this.updateUI();
        }
    }

    toggleTodo(todoId) {
        this.lists = this.lists.map(list => {
            if (list.id === this.currentListId) {
                const todos = Array.isArray(list.todos) ? list.todos : [];
                return {
                    ...list,
                    todos: todos.map(todo => {
                        if (todo.id === todoId) {
                            return { ...todo, completed: !todo.completed };
                        }
                        return todo;
                    })
                };
            }
            return list;
        });
        this.saveToLocalStorage();
        this.syncToFirebase();
        this.updateUI();
    }

    deleteTodo(todoId) {
        this.lists = this.lists.map(list => {
            if (list.id === this.currentListId) {
                const todos = Array.isArray(list.todos) ? list.todos : [];
                return {
                    ...list,
                    todos: todos.filter(todo => todo.id !== todoId)
                };
            }
            return list;
        });
        this.saveToLocalStorage();
        this.syncToFirebase();
        this.updateUI();
    }

    clearCompleted() {
        this.lists = this.lists.map(list => {
            if (list.id === this.currentListId) {
                const todos = Array.isArray(list.todos) ? list.todos : [];
                return {
                    ...list,
                    todos: todos.filter(todo => !todo.completed)
                };
            }
            return list;
        });
        this.saveToLocalStorage();
        this.syncToFirebase();
        this.updateUI();
    }

    setFilter(filter) {
        this.filter = filter;
        this.filterButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        this.updateUI();
    }

    getCurrentList() {
        return this.lists.find(list => list.id === this.currentListId);
    }

    getFilteredTodos() {
        const currentList = this.getCurrentList();
        if (!currentList) return [];

        switch (this.filter) {
            case 'active':
                return currentList.todos.filter(todo => !todo.completed);
            case 'completed':
                return currentList.todos.filter(todo => todo.completed);
            default:
                return currentList.todos;
        }
    }

    handleDragStart(e) {
        if (!e.target.matches('.todo-item, .list-item')) return;

        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', e.target.dataset.id);
        e.dataTransfer.setData('type', e.target.matches('.todo-item') ? 'todo' : 'list');
    }

    handleDragEnd(e) {
        if (!e.target.matches('.todo-item, .list-item')) return;

        e.target.classList.remove('dragging');
        document.querySelectorAll('.drag-over').forEach(el => {
            el.classList.remove('drag-over');
        });
    }

    handleDragOver(e) {
        e.preventDefault();
        const draggable = document.querySelector('.dragging');
        if (!draggable) return;

        const isOverTodoList = e.target.matches('.todo-item') || e.target.closest('.todo-item');
        const isOverListItem = e.target.matches('.list-item') || e.target.closest('.list-item');

        if (!isOverTodoList && !isOverListItem) return;

        const targetElement = isOverTodoList ? e.target.closest('.todo-item') : e.target.closest('.list-item');
        const isDraggingTodo = draggable.matches('.todo-item');
        const isDraggingList = draggable.matches('.list-item');

        // Only allow dropping todos on todos and lists on lists
        if ((isDraggingTodo && isOverTodoList) || (isDraggingList && isOverListItem)) {
            targetElement.classList.add('drag-over');
        }
    }

    handleDrop(e) {
        e.preventDefault();
        const id = e.dataTransfer.getData('text/plain');
        const type = e.dataTransfer.getData('type');

        const targetElement = type === 'todo'
            ? e.target.closest('.todo-item')
            : e.target.closest('.list-item');

        if (!targetElement) return;

        const targetId = targetElement.dataset.id;
        if (id === targetId) return;

        if (type === 'todo') {
            this.reorderTodo(id, targetId);
        } else {
            this.reorderList(id, targetId);
        }

        document.querySelectorAll('.drag-over').forEach(el => {
            el.classList.remove('drag-over');
        });
    }

    reorderTodo(sourceId, targetId) {
        const currentList = this.getCurrentList();
        if (!currentList || !Array.isArray(currentList.todos)) return;

        const todos = [...currentList.todos];
        const sourceIndex = todos.findIndex(todo => todo.id === sourceId);
        const targetIndex = todos.findIndex(todo => todo.id === targetId);

        if (sourceIndex === -1 || targetIndex === -1) return;

        const [movedTodo] = todos.splice(sourceIndex, 1);
        todos.splice(targetIndex, 0, movedTodo);

        this.lists = this.lists.map(list => {
            if (list.id === this.currentListId) {
                return { ...list, todos };
            }
            return list;
        });

        this.saveToLocalStorage();
        this.syncToFirebase();
        this.updateUI();
    }

    reorderList(sourceId, targetId) {
        const sourceIndex = this.lists.findIndex(list => list.id === sourceId);
        const targetIndex = this.lists.findIndex(list => list.id === targetId);

        if (sourceIndex === -1 || targetIndex === -1) return;

        const [movedList] = this.lists.splice(sourceIndex, 1);
        this.lists.splice(targetIndex, 0, movedList);

        this.saveToLocalStorage();
        this.syncToFirebase();
        this.updateUI();
    }

    updateUI() {
        if (!Array.isArray(this.lists)) {
            this.lists = [];
        }

        // Get current list once for all updates
        const currentList = this.getCurrentList();

        // Update current list name in header
        this.currentListName.textContent = currentList ? currentList.name : 'Select a List';

        // Update list container
        this.listContainer.innerHTML = '';
        this.lists.forEach(list => {
            if (!list || typeof list !== 'object') return;

            const li = document.createElement('li');
            li.className = `list-item ${list.id === this.currentListId ? 'active' : ''}`;
            li.draggable = true;
            li.dataset.id = list.id;

            const dragHandle = document.createElement('span');
            dragHandle.className = 'drag-handle';
            dragHandle.textContent = '⋮';

            const nameSpan = document.createElement('span');
            nameSpan.textContent = list.name || 'Unnamed List';
            nameSpan.addEventListener('click', () => this.switchList(list.id));

            const editBtn = document.createElement('button');
            editBtn.className = 'edit-btn';
            editBtn.textContent = '✎';
            editBtn.addEventListener('click', () => {
                const newName = prompt('Enter new list name:', list.name);
                if (newName && newName.trim()) {
                    this.updateList(list.id, newName.trim());
                }
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = '×';
            deleteBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to delete this list?')) {
                    this.deleteList(list.id);
                }
            });

            const todoCount = document.createElement('span');
            todoCount.className = 'todo-count';
            const todos = Array.isArray(list.todos) ? list.todos : [];
            const activeCount = todos.filter(todo => todo && !todo.completed).length;
            todoCount.textContent = `${activeCount}/${todos.length}`;

            li.appendChild(dragHandle);
            li.appendChild(nameSpan);
            li.appendChild(todoCount);
            li.appendChild(editBtn);
            li.appendChild(deleteBtn);
            this.listContainer.appendChild(li);
        });

        // Update todo list
        this.todoList.innerHTML = '';
        const filteredTodos = this.getFilteredTodos();
        if (Array.isArray(filteredTodos)) {
            filteredTodos.forEach(todo => {
                if (!todo || typeof todo !== 'object') return;

                const li = document.createElement('li');
                li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
                li.draggable = true;
                li.dataset.id = todo.id;

                const dragHandle = document.createElement('span');
                dragHandle.className = 'drag-handle';
                dragHandle.textContent = '⋮';

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = todo.completed;
                checkbox.addEventListener('change', () => this.toggleTodo(todo.id));

                const span = document.createElement('span');
                span.textContent = todo.text || '';

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-btn';
                deleteBtn.textContent = '×';
                deleteBtn.addEventListener('click', () => this.deleteTodo(todo.id));

                li.appendChild(dragHandle);
                li.appendChild(checkbox);
                li.appendChild(span);
                li.appendChild(deleteBtn);
                this.todoList.appendChild(li);
            });
        }

        // Update counter
        if (currentList) {
            const todos = Array.isArray(currentList.todos) ? currentList.todos : [];
            const activeTodos = todos.filter(todo => todo && !todo.completed).length;
            this.todoCount.textContent = `${activeTodos} item${activeTodos !== 1 ? 's' : ''} left`;
        } else {
            this.todoCount.textContent = '0 items left';
        }

        // Update input states
        this.todoInput.disabled = !this.currentListId;
        this.addButton.disabled = !this.currentListId;
    }
}

const app = new TodoApp(); 