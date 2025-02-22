// New list input form component
class ListInput extends FormComponent {
    constructor(element, options = {}) {
        super(element, options);
        this.storageService = options.storageService;
    }

    async setupState() {
        this._state = {
            isSubmitting: false,
            error: null
        };
    }

    setupValidation() {
        this.addValidator('listName',
            value => value.length >= Constants.VALIDATION.MIN_NAME_LENGTH,
            `List name must be at least ${Constants.VALIDATION.MIN_NAME_LENGTH} character`
        );

        this.addValidator('listName',
            value => value.length <= Constants.VALIDATION.MAX_NAME_LENGTH,
            `List name cannot exceed ${Constants.VALIDATION.MAX_NAME_LENGTH} characters`
        );

        this.addValidator('listName',
            async value => {
                const lists = await this.storageService.getLists();
                return !lists.some(list => list.name === value);
            },
            'A list with this name already exists'
        );
    }

    async render() {
        const { isSubmitting, error } = this.getState();

        this.element.innerHTML = `
            <form class="list-input-form">
                <div class="input-group">
                    <input type="text" 
                        name="listName" 
                        id="listName"
                        class="form-control" 
                        placeholder="New list name..."
                        ${isSubmitting ? 'disabled' : ''}>
                    <button type="submit" class="btn btn-primary" ${isSubmitting ? 'disabled' : ''}>
                        ${isSubmitting ? 'Adding...' : 'Add List'}
                    </button>
                </div>
                <div class="error-message" data-error="listName"></div>
                ${error ? `<div class="error-message">${error}</div>` : ''}
            </form>
        `;
    }

    async submitForm(data) {
        try {
            this.setState({ isSubmitting: true, error: null });

            // Create new list
            const list = new List(data.listName);
            await this.storageService.createList(list);

            // Reset form
            this.resetForm();
            this.setState({ isSubmitting: false });

            // Emit event
            this.emit(Constants.EVENTS.LIST_CREATED, list);
        } catch (error) {
            console.error('Error creating list:', error);
            this.setState({
                error: 'Failed to create list. Please try again.',
                isSubmitting: false
            });
        }
    }

    removeEventListeners() {
        super.removeEventListeners();
        // Any additional cleanup specific to ListInput
    }
} 