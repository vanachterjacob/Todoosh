class ThemeToggle {
    constructor() {
        this.isDarkTheme = localStorage.getItem('theme') === 'dark';
        this.init();
    }

    init() {
        // Create the toggle button
        this.button = document.createElement('button');
        this.button.className = 'theme-toggle';
        this.button.setAttribute('aria-label', 'Toggle dark mode');
        this.button.innerHTML = `
      <svg class="theme-toggle-icon sun" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      </svg>
      <svg class="theme-toggle-icon moon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>
    `;

        // Add click event listener
        this.button.addEventListener('click', () => this.toggleTheme());

        // Add to DOM
        document.body.appendChild(this.button);

        // Set initial theme
        this.applyTheme();
    }

    toggleTheme() {
        this.isDarkTheme = !this.isDarkTheme;
        this.applyTheme();
    }

    applyTheme() {
        if (this.isDarkTheme) {
            document.documentElement.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark-theme');
            localStorage.setItem('theme', 'light');
        }
        this.button.classList.toggle('dark', this.isDarkTheme);
    }
} 