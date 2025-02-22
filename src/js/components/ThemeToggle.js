// Theme toggle component
class ThemeToggle extends Component {
    constructor(element, options = {}) {
        super(element, options);
        this._storageKey = Constants.STORAGE.THEME;
        this._darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    }

    async setupState() {
        const savedTheme = localStorage.getItem(this._storageKey);
        const prefersDark = this._darkModeMediaQuery.matches;
        const isDarkMode = savedTheme === Constants.UI.THEMES.DARK ||
            (!savedTheme && prefersDark);

        this._state = {
            isDarkMode,
            isAnimating: false
        };

        // Apply initial theme
        this.applyTheme(isDarkMode);
    }

    async setupEventListeners() {
        // Toggle theme on click
        this.delegate('click', '.theme-toggle', () => {
            if (!this._state.isAnimating) {
                this.toggleTheme();
            }
        });

        // Listen for system theme changes
        this._darkModeMediaQuery.addEventListener('change', (e) => {
            if (!localStorage.getItem(this._storageKey)) {
                this.applyTheme(e.matches);
            }
        });
    }

    async render() {
        const { isDarkMode, isAnimating } = this.getState();
        const animatingClass = isAnimating ? ' animating' : '';
        const darkClass = isDarkMode ? ' dark' : '';

        this.element.innerHTML = `
            <button class="theme-toggle${animatingClass}${darkClass}" 
                    aria-label="Toggle theme" 
                    title="Toggle theme">
                <div class="theme-toggle-icon">
                    <svg class="theme-toggle-icon sun" viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2">
                        <circle cx="12" cy="12" r="5"/>
                        <line x1="12" y1="1" x2="12" y2="3"/>
                        <line x1="12" y1="21" x2="12" y2="23"/>
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                        <line x1="1" y1="12" x2="3" y2="12"/>
                        <line x1="21" y1="12" x2="23" y2="12"/>
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                    </svg>
                    <svg class="theme-toggle-icon moon" viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                    </svg>
                </div>
            </button>
        `;
    }

    toggleTheme() {
        const newIsDarkMode = !this._state.isDarkMode;
        this.setState({ isAnimating: true });

        // Start animation
        requestAnimationFrame(() => {
            this.applyTheme(newIsDarkMode);

            // Reset animation state after transition
            setTimeout(() => {
                this.setState({ isAnimating: false });
            }, 300); // Match CSS transition duration
        });
    }

    applyTheme(isDarkMode) {
        document.documentElement.classList.toggle('dark-theme', isDarkMode);
        localStorage.setItem(this._storageKey,
            isDarkMode ? Constants.UI.THEMES.DARK : Constants.UI.THEMES.LIGHT
        );
        this.setState({ isDarkMode });

        // Emit theme change event
        const event = new CustomEvent('theme:changed', {
            detail: { isDarkMode }
        });
        document.dispatchEvent(event);
    }

    removeEventListeners() {
        this._darkModeMediaQuery.removeEventListener('change', this.handleSystemThemeChange);
    }
}

// Make globally available
window.ThemeToggle = ThemeToggle; 