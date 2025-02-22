// Todo input form component
class TodoInput extends FormComponent {
    constructor(element, options = {}) {
        super(element, options);
        this.list = options.list;
        this.storageService = options.storageService;
    }

    async setupState() {
        this._state = {
            isSubmitting: false,
            error: null,
            showSubtaskInput: false,
            subtasks: []
        };
    }

    setupValidation() {
        // Validate todo text
        this.addValidator('todoText',
            value => value.length >= Constants.VALIDATION.MIN_TODO_LENGTH,
            `Todo text must be at least ${Constants.VALIDATION.MIN_TODO_LENGTH} characters`
        );

        this.addValidator('todoText',
            value => value.length <= Constants.VALIDATION.MAX_TODO_LENGTH,
            `Todo text cannot exceed ${Constants.VALIDATION.MAX_TODO_LENGTH} characters`
        );

        // Validate subtask text if present
        this.addValidator('subtaskText',
            value => !value || value.length >= Constants.VALIDATION.MIN_SUBTASK_LENGTH,
            `Subtask text must be at least ${Constants.VALIDATION.MIN_SUBTASK_LENGTH} characters`
        );

        this.addValidator('subtaskText',
            value => !value || value.length <= Constants.VALIDATION.MAX_SUBTASK_LENGTH,
            `Subtask text cannot exceed ${Constants.VALIDATION.MAX_SUBTASK_LENGTH} characters`
        );
    }

    async render() {
        const { isSubmitting, error, showSubtaskInput, subtasks } = this.getState();

        this.element.innerHTML = `
            <form class="todo-input-form">
                <div class="input-group">
                    <input type="text" 
                        name="todoText" 
                        id="todoText"
                        class="form-control" 
                        placeholder="What needs to be done?"
                        ${isSubmitting ? 'disabled' : ''}>
                    <button type="button" 
                        class="btn btn-subtask" 
                        data-action="toggle-subtask"
                        ${isSubmitting ? 'disabled' : ''}>
                        ${showSubtaskInput ? '−' : '+'}
                    </button>
                    <button type="submit" 
                        class="btn btn-primary"
                        ${isSubmitting ? 'disabled' : ''}>
                        ${isSubmitting ? 'Adding...' : 'Add Todo'}
                    </button>
                </div>
                <div class="error-message" data-error="todoText"></div>
                ${error ? `<div class="error-message">${error}</div>` : ''}
                
                ${showSubtaskInput ? `
                    <div class="subtask-input">
                        <div class="input-group">
                            <input type="text" 
                                name="subtaskText" 
                                id="subtaskText"
                                class="form-control" 
                                placeholder="Add a subtask..."
                                ${isSubmitting ? 'disabled' : ''}>
                            <button type="button" 
                                class="btn btn-secondary" 
                                data-action="add-subtask"
                                ${isSubmitting ? 'disabled' : ''}>
                                Add
                            </button>
                        </div>
                        <div class="error-message" data-error="subtaskText"></div>
                    </div>
                ` : ''}

                ${subtasks.length > 0 ? `
                    <div class="subtasks-preview">
                        ${subtasks.map((subtask, index) => `
                            <div class="subtask-preview">
                                <span class="subtask-text">${subtask}</span>
                                <button type="button" 
                                    class="btn btn-remove" 
                                    data-action="remove-subtask" 
                                    data-index="${index}">
                                    ×
                                </button>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </form>
        `;
    }

    async setupEventListeners() {
        super.setupEventListeners();

        // Toggle subtask input
        this.delegate('click', '[data-action="toggle-subtask"]', () => {
            this.setState({ showSubtaskInput: !this._state.showSubtaskInput });
        });

        // Add subtask
        this.delegate('click', '[data-action="add-subtask"]', async () => {
            const input = this.$('#subtaskText');
            if (!input) return;

            const subtaskText = input.value.trim();
            if (!subtaskText) return;

            // Validate subtask text
            const errors = await this.validateField('subtaskText', subtaskText);
            if (errors.length > 0) return;

            // Add subtask and clear input
            this.setState({
                subtasks: [...this._state.subtasks, subtaskText]
            });
            input.value = '';
        });

        // Remove subtask
        this.delegate('click', '[data-action="remove-subtask"]', (e, target) => {
            const index = parseInt(target.dataset.index);
            if (isNaN(index)) return;

            const subtasks = [...this._state.subtasks];
            subtasks.splice(index, 1);
            this.setState({ subtasks });
        });
    }

    async submitForm(data) {
        try {
            this.setState({ isSubmitting: true, error: null });

            // Create new todo with subtasks
            const todo = new Todo(data.todoText);
            this._state.subtasks.forEach(text => {
                todo.addSubtask(new Subtask(text));
            });

            // Add todo to list and save
            this.list.addTodo(todo);
            await this.storageService.updateList(this.list);

            // Reset form
            this.resetForm();
            this.setState({
                isSubmitting: false,
                showSubtaskInput: false,
                subtasks: []
            });

            // Emit event
            this.emit(Constants.EVENTS.TODO_CREATED, todo);
        } catch (error) {
            console.error('Error creating todo:', error);
            this.setState({
                error: 'Failed to create todo. Please try again.',
                isSubmitting: false
            });
        }
    }

    resetForm() {
        super.resetForm();
        this.setState({
            showSubtaskInput: false,
            subtasks: []
        });
    }

    removeEventListeners() {
        super.removeEventListeners();
        // Any additional cleanup specific to TodoInput
    }
}

// Make globally available
window.TodoInput = TodoInput; 