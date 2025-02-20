class TodoApp {
    constructor() {
        this.lists = [];
        this.currentListId = null;
        this.filter = 'all';
        console.log('TodoApp: Initializing...');

        // First, set up DOM elements
        this.setupDOMElements();

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
        this.renderLists();
        this.renderTodos();
        this.updateTodoCount();
    }

    renderLists() {
        this.listContainer.innerHTML = '';

        // Ensure lists array exists
        if (!Array.isArray(this.lists)) {
            console.warn('TodoApp: Lists is not an array, initializing empty array');
            this.lists = [];
            return;
        }

        this.lists
            .sort((a, b) => {
                // Sort by favorite first, then by order
                if (a.favorite !== b.favorite) {
                    return b.favorite ? 1 : -1;
                }
                return a.order - b.order;
            })
            .forEach(list => {
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
                listElement.className = `list-item${list.id === this.currentListId ? ' active' : ''}`;
                listElement.draggable = true;
                listElement.dataset.id = list.id;
                listElement.dataset.type = 'list';
                listElement.innerHTML = `
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
                    </div>
                `;

                // Prevent dragging when interacting with buttons or input
                listElement.querySelector('.list-item__actions').addEventListener('mousedown', e => {
                    e.stopPropagation();
                });
                listElement.querySelector('.list-item__edit').addEventListener('mousedown', e => {
                    e.stopPropagation();
                });

                // Only allow dragging from the drag handle or main content
                listElement.addEventListener('mousedown', e => {
                    const isDragHandle = e.target.classList.contains('drag-handle');
                    const isMainContent = e.target.closest('.list-item__content') && !e.target.closest('.list-item__actions');
                    if (!isDragHandle && !isMainContent) {
                        listElement.draggable = false;
                    } else {
                        listElement.draggable = true;
                    }
                });

                // Reset draggable on mouse up
                listElement.addEventListener('mouseup', () => {
                    listElement.draggable = true;
                });

                // Favorite button event
                listElement.querySelector('.list-item__action--favorite').addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleListFavorite(list.id);
                });

                // Click event for selecting list
                listElement.addEventListener('click', (e) => {
                    // Don't trigger if clicking on actions or edit input
                    if (!e.target.closest('.list-item__actions') && !e.target.closest('.list-item__edit')) {
                        this.currentListId = list.id;
                        this.updateUI();
                    }
                });

                // Edit button event
                listElement.querySelector('.list-item__action--edit').addEventListener('click', (e) => {
                    e.stopPropagation();
                    listElement.classList.add('list-item--editing');
                    const editInput = listElement.querySelector('.list-item__edit');
                    editInput.focus();
                });

                // Edit input events
                const editInput = listElement.querySelector('.list-item__edit');
                editInput.addEventListener('blur', () => {
                    listElement.classList.remove('list-item--editing');
                    if (editInput.value.trim() !== list.name) {
                        this.editList(list.id, editInput.value);
                    }
                });
                editInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        listElement.classList.remove('list-item--editing');
                        if (editInput.value.trim() !== list.name) {
                            this.editList(list.id, editInput.value);
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

                // Delete button event
                listElement.querySelector('.list-item__action--delete').addEventListener('click', (e) => {
                    e.stopPropagation();
                    const todoCount = list.todos.length;
                    const message = todoCount > 0
                        ? `Are you sure you want to delete "${list.name}" and its ${todoCount} todo${todoCount === 1 ? '' : 's'}?`
                        : `Are you sure you want to delete "${list.name}"?`;

                    if (confirm(message)) {
                        this.deleteList(list.id);
                    }
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
            .sort((a, b) => {
                // Sort by favorite first, then by order
                if (a.favorite !== b.favorite) {
                    return b.favorite ? 1 : -1;
                }
                return a.order - b.order;
            })
            .forEach(todo => {
                const todoElement = document.createElement('div');
                todoElement.className = `todo-item${todo.completed ? ' todo-item--completed' : ''}${todo.favorite ? ' favorite' : ''}`;
                todoElement.draggable = true;
                todoElement.dataset.id = todo.id;
                todoElement.dataset.type = 'todo';

                // Main todo content without WYSIWYG
                const mainContent = `
                    <div class="todo-item__content">
                        <div class="todo-item__checkbox-wrapper">
                            <input type="checkbox" class="todo-item__checkbox" ${todo.completed ? 'checked' : ''}>
                            <div class="todo-item__checkbox-custom"></div>
                        </div>
                        <span class="todo-item__text">${todo.text}</span>
                        <input type="text" class="todo-item__edit" value="${todo.text}">
                        <div class="todo-item__actions">
                            <button class="todo-item__action todo-item__action--favorite${todo.favorite ? ' active' : ''}" title="Toggle favorite"></button>
                            <button class="todo-item__action todo-item__action--subtask" title="Add subtask">+</button>
                            <button class="todo-item__action todo-item__action--edit" title="Edit todo"></button>
                            <button class="todo-item__action todo-item__action--delete" title="Delete todo"></button>
                        </div>
                    </div>`;

                // Subtasks content with WYSIWYG
                const subtasksContent = todo.subtasks && todo.subtasks.length > 0 ? `
                    <div class="todo-item__subtasks">
                        ${todo.subtasks.map(subtask => `
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
                        </div>
                    </div>` : '';

                todoElement.innerHTML = mainContent + subtasksContent;

                // Favorite button event
                todoElement.querySelector('.todo-item__action--favorite').addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleTodoFavorite(todo.id);
                });

                // Checkbox event
                todoElement.querySelector('.todo-item__checkbox').addEventListener('change', () => {
                    this.toggleTodo(todo.id);
                });

                // Edit button click for main todo
                todoElement.querySelector('.todo-item__action--edit').addEventListener('click', () => {
                    todoElement.classList.add('todo-item--editing');
                    const editInput = todoElement.querySelector('.todo-item__edit');
                    editInput.value = todo.text;
                    editInput.focus();
                    editInput.select();
                });

                // Edit input events for main todo
                const editInput = todoElement.querySelector('.todo-item__edit');
                editInput.addEventListener('blur', () => {
                    todoElement.classList.remove('todo-item--editing');
                    const newText = editInput.value.trim();
                    if (newText !== todo.text) {
                        this.editTodo(todo.id, newText);
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

                // Delete button event
                todoElement.querySelector('.todo-item__action--delete').addEventListener('click', () => {
                    currentList.removeTodo(todo.id);
                    this.saveToLocalStorage();
                    this.firebaseService.uploadData(this.lists);
                    this.updateUI();
                });

                // Add event listener for the add subtask button
                todoElement.querySelector('.todo-item__action--subtask').addEventListener('click', () => {
                    const currentList = this.lists.find(list => list.id === this.currentListId);
                    if (currentList) {
                        currentList.addSubtask(todo.id, 'New subtask');
                        this.saveToLocalStorage();
                        this.firebaseService.uploadData(this.lists);
                        this.updateUI();

                        // Focus the new subtask after render
                        requestAnimationFrame(() => {
                            const subtasks = todoElement.querySelector('.todo-item__subtasks');
                            if (subtasks) {
                                const lastSubtask = subtasks.lastElementChild;
                                if (lastSubtask) {
                                    const textEl = lastSubtask.querySelector('.todo-item__text');
                                    textEl.focus();
                                    // Make the text editable
                                    lastSubtask.classList.add('todo-item--editing');
                                    const editInput = lastSubtask.querySelector('.todo-item__edit');
                                    editInput.focus();
                                    editInput.select();
                                }
                            }
                        });
                    }
                });

                // Add event delegation for subtask events
                const subtasksContainer = todoElement.querySelector('.todo-item__subtasks');
                if (subtasksContainer) {
                    console.log('Setting up subtask container event listeners');

                    // Subtask edit button click
                    const boundEditHandler = (e) => {
                        console.log('Edit button clicked', e.target);
                        if (e.target.matches('.todo-item__action--edit')) {
                            console.log('Edit button match found');
                            const subtaskEl = e.target.closest('.todo-item__subtask');
                            console.log('Found subtask element:', subtaskEl);
                            if (subtaskEl) {
                                console.log('Calling startSubtaskEditing');
                                this.startSubtaskEditing(subtaskEl);
                            }
                        }
                    };

                    subtasksContainer.addEventListener('click', boundEditHandler.bind(this));

                    // WYSIWYG toolbar buttons for subtasks
                    subtasksContainer.addEventListener('click', (e) => {
                        const button = e.target.closest('.wysiwyg-toolbar__button');
                        if (button) {
                            console.log('WYSIWYG button clicked:', button.dataset.command);
                            e.preventDefault();
                            e.stopPropagation();

                            const command = button.dataset.command;
                            const subtaskEl = subtasksContainer.querySelector('.todo-item__subtask.todo-item--editing');
                            const textEl = subtaskEl.querySelector('.todo-item__text');

                            // Ensure the text element has focus and selection is maintained
                            textEl.focus();
                            const selection = window.getSelection();
                            const range = selection.getRangeAt(0);

                            if (command === 'createLink') {
                                const url = prompt('Enter the URL:');
                                if (url) {
                                    document.execCommand(command, false, url);
                                }
                            } else if (command === 'code') {
                                const code = document.createElement('code');
                                code.textContent = range.toString();
                                range.deleteContents();
                                range.insertNode(code);
                            } else {
                                document.execCommand(command, false, null);
                            }

                            // Keep the button active state
                            const isActive = document.queryCommandState(command);
                            button.classList.toggle('active', isActive);

                            // Prevent the contenteditable from losing focus
                            textEl.focus();

                            // Prevent blur event from firing
                            e.preventDefault();
                        }
                    });
                }

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
        console.log('Starting subtask editing for:', subtaskEl);
        const textEl = subtaskEl.querySelector('.todo-item__text');
        console.log('Found text element:', textEl);

        // Don't proceed if already editing
        if (textEl.contentEditable === 'true') {
            console.log('Already in edit mode');
            return;
        }

        // Store original text for comparison
        subtaskEl.dataset.originalText = textEl.innerHTML.trim();

        // Enable editing
        textEl.contentEditable = 'true';
        subtaskEl.classList.add('todo-item--editing');
        console.log('Added editing class');

        // Show toolbar
        const subtasksContainer = subtaskEl.closest('.todo-item__subtasks');
        const toolbar = subtasksContainer.querySelector('.wysiwyg-toolbar');
        toolbar.style.display = 'flex';
        toolbar.style.top = '-35px';
        console.log('Showing toolbar');

        // Focus after a short delay to ensure the UI is updated
        setTimeout(() => {
            textEl.focus();
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(textEl);
            selection.removeAllRanges();
            selection.addRange(range);
            console.log('Set up text selection');
        }, 10);

        // Save on blur
        const saveOnBlur = (event) => {
            console.log('Blur event triggered');
            // Don't save if clicking within the WYSIWYG toolbar
            if (event && event.relatedTarget && event.relatedTarget.closest('.wysiwyg-toolbar')) {
                console.log('Clicked within toolbar, not saving');
                textEl.focus(); // Keep focus on the text
                return;
            }

            const subtaskId = subtaskEl.dataset.id;
            const todoId = subtaskEl.closest('.todo-item').dataset.id;
            console.log('Subtask ID:', subtaskId, 'Todo ID:', todoId);

            textEl.contentEditable = 'false';
            subtaskEl.classList.remove('todo-item--editing');
            toolbar.style.display = 'none';

            const currentList = this.lists.find(list => list.id === this.currentListId);
            console.log('Found current list:', currentList);
            if (currentList) {
                // Sanitize the HTML before saving
                const newText = sanitizeHTML(textEl.innerHTML).trim();
                if (newText !== subtaskEl.dataset.originalText) {
                    console.log('Saving subtask edit:', newText);
                    currentList.editSubtask(todoId, subtaskId, newText);
                    this.saveToLocalStorage();
                    this.firebaseService.uploadData(this.lists);

                    // Set the sanitized content back to the element
                    textEl.innerHTML = newText;
                    this.updateUI();
                } else {
                    console.log('No changes made, skipping save');
                }
            }

            textEl.removeEventListener('blur', boundSaveOnBlur);
        };

        // Bind the correct this context
        const boundSaveOnBlur = saveOnBlur.bind(this);
        textEl.addEventListener('blur', boundSaveOnBlur);
        console.log('Added blur event listener');

        // Save on Enter (but allow Shift+Enter for new lines)
        textEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                console.log('Enter key pressed, saving edit');
                e.preventDefault();
                textEl.blur();
            } else if (e.key === 'Escape') {
                console.log('Escape pressed, canceling edit');
                e.preventDefault();
                textEl.innerHTML = subtaskEl.dataset.originalText;
                textEl.blur();
            }
        });
    }
}

function sanitizeHTML(html) {
    // Create a temporary container
    const container = document.createElement('div');

    // Set the HTML content
    container.innerHTML = html;

    // List of allowed tags
    const allowedTags = [
        'b', 'strong',
        'i', 'em',
        'u',
        's', 'strike',
        'a',
        'code',
        'ul', 'ol', 'li',
        'p',
        'br'
    ];

    // List of allowed attributes
    const allowedAttributes = {
        'a': ['href', 'target', 'rel']  // Allow target and rel attributes for links
    };

    // Function to clean a node
    function cleanNode(node) {
        if (node.nodeType === 3) { // Text node
            return;
        }

        if (node.nodeType === 1) { // Element node
            // Remove node if it's not in allowed tags
            if (!allowedTags.includes(node.tagName.toLowerCase())) {
                while (node.firstChild) {
                    node.parentNode.insertBefore(node.firstChild, node);
                }
                node.parentNode.removeChild(node);
                return;
            }

            // Special handling for links
            if (node.tagName.toLowerCase() === 'a') {
                node.setAttribute('target', '_blank');
                node.setAttribute('rel', 'noopener noreferrer');
            }

            // Remove all attributes except those that are allowed
            const attributes = Array.from(node.attributes);
            attributes.forEach(attr => {
                const tagName = node.tagName.toLowerCase();
                const allowedAttrsForTag = allowedAttributes[tagName] || [];
                if (!allowedAttrsForTag.includes(attr.name)) {
                    node.removeAttribute(attr.name);
                }
            });

            // Clean all child nodes
            Array.from(node.childNodes).forEach(cleanNode);
        }
    }

    // Clean the container
    Array.from(container.childNodes).forEach(cleanNode);

    return container.innerHTML;
} 