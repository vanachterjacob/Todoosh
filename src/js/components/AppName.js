// App name component with cursor animation
class AppName extends Component {
    constructor(element, options = {}) {
        super(element, options);
        this._cursorVisible = true;
        this._cursorInterval = null;
    }

    async setupState() {
        this._state = {
            cursorVisible: true,
            isDarkMode: document.documentElement.classList.contains('dark-mode')
        };
    }

    async setupEventListeners() {
        // Listen for theme changes
        document.addEventListener('theme:changed', (e) => {
            this.setState({ isDarkMode: e.detail.isDarkMode });
        });
    }

    async render() {
        const { cursorVisible, isDarkMode } = this.getState();
        const cursorClass = cursorVisible ? 'cursor-visible' : 'cursor-hidden';
        const themeClass = isDarkMode ? 'dark' : 'light';

        this.element.innerHTML = `
            <span class="app-name__text ${themeClass}">
                Todo<span class="app-name__highlight">osh</span>
                <span class="app-name__cursor ${cursorClass}">|</span>
            </span>
            <span class="app-name__subtitle">offline-first task manager</span>
        `;
    }

    postRender() {
        // Start cursor animation
        if (!this._cursorInterval) {
            this._cursorInterval = setInterval(() => {
                this.setState({ cursorVisible: !this._state.cursorVisible });
            }, 530); // Slightly faster than standard cursor blink
        }
    }

    async cleanup() {
        if (this._cursorInterval) {
            clearInterval(this._cursorInterval);
            this._cursorInterval = null;
        }
    }

    removeEventListeners() {
        document.removeEventListener('theme:changed', this.handleThemeChange);
    }
}

// Make globally available
window.AppName = AppName; 