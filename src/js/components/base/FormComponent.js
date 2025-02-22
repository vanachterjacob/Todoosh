// Base form handling component
class FormComponent extends Component {
    constructor(element, options = {}) {
        super(element, options);
        this._form = this.element.querySelector('form') || this.element;
        this._inputs = new Map();
        this._validators = new Map();
        this._errors = new Map();
    }

    // Form Setup
    async setupForm() {
        this.setupInputs();
        this.setupValidation();
        this.setupFormEvents();
    }

    setupInputs() {
        // Map all form inputs
        this.$$('input, textarea, select').forEach(input => {
            this._inputs.set(input.name || input.id, input);
        });
    }

    setupValidation() {
        // Override to add validation rules
    }

    setupFormEvents() {
        // Basic form events
        this._form.addEventListener('submit', this.handleSubmit.bind(this));
        this._form.addEventListener('reset', this.handleReset.bind(this));

        // Input events
        this._inputs.forEach((input, name) => {
            input.addEventListener('input', () => this.validateField(name));
            input.addEventListener('blur', () => this.validateField(name));
        });
    }

    // Validation
    addValidator(fieldName, validator, message) {
        if (!this._validators.has(fieldName)) {
            this._validators.set(fieldName, []);
        }
        this._validators.get(fieldName).push({ validate: validator, message });
    }

    async validateField(fieldName) {
        const input = this._inputs.get(fieldName);
        if (!input) return true;

        const validators = this._validators.get(fieldName) || [];
        const errors = [];

        for (const { validate, message } of validators) {
            try {
                const isValid = await validate(input.value, this.getFormData());
                if (!isValid) {
                    errors.push(message);
                }
            } catch (error) {
                console.error(`Validation error for ${fieldName}:`, error);
                errors.push('Validation failed');
            }
        }

        this._errors.set(fieldName, errors);
        this.updateFieldValidation(fieldName, errors);
        return errors.length === 0;
    }

    async validateForm() {
        const validations = Array.from(this._inputs.keys()).map(name =>
            this.validateField(name)
        );
        const results = await Promise.all(validations);
        return results.every(isValid => isValid);
    }

    // Form Data
    getFormData() {
        const formData = new FormData(this._form);
        const data = {};
        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }
        return data;
    }

    setFormData(data) {
        Object.entries(data).forEach(([name, value]) => {
            const input = this._inputs.get(name);
            if (input) {
                input.value = value;
            }
        });
    }

    // Event Handlers
    async handleSubmit(event) {
        event.preventDefault();
        if (await this.validateForm()) {
            await this.submitForm(this.getFormData());
        }
    }

    handleReset(event) {
        event.preventDefault();
        this.resetForm();
    }

    // UI Updates
    updateFieldValidation(fieldName, errors) {
        const input = this._inputs.get(fieldName);
        if (!input) return;

        // Remove existing validation classes
        input.classList.remove('is-valid', 'is-invalid');

        // Add appropriate class
        input.classList.add(errors.length === 0 ? 'is-valid' : 'is-invalid');

        // Update error display
        const errorContainer = this.getErrorContainer(fieldName);
        if (errorContainer) {
            errorContainer.innerHTML = errors.join('<br>');
        }
    }

    getErrorContainer(fieldName) {
        return this.$(`[data-error="${fieldName}"]`);
    }

    // Methods to be implemented by child classes
    async submitForm(data) {
        // Handle form submission
    }

    resetForm() {
        this._form.reset();
        this._errors.clear();
        this._inputs.forEach((input, name) => {
            input.classList.remove('is-valid', 'is-invalid');
            const errorContainer = this.getErrorContainer(name);
            if (errorContainer) {
                errorContainer.innerHTML = '';
            }
        });
    }

    // Override parent method
    async init() {
        await super.init();
        await this.setupForm();
    }
}

// Make globally available
window.FormComponent = FormComponent; 