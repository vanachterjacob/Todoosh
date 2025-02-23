# Todoosh

A portable, offline-first todo list manager with Firebase sync.

## Features

### Core Features
- 📝 Create, edit, and organize todo lists
- ⭐ Star important lists and todos (star appears on the left)
- ✏️ Rename and delete lists with inline editing
- 🔄 Drag and drop reordering of todos within lists
- 📑 Rich text subtasks with:
  - 🔢 Active task counter
  - 📊 Progress tracking
  - 🔽 Collapsible sections
- 💾 Works offline with local storage
- 🔄 Real-time sync with Firebase
- 🌐 Cross-browser data persistence
- 📱 Responsive design for all devices
- 🎨 Beautiful light and dark themes with smooth transitions
- 🎯 Modern favicons with SVG, PNG and Apple Touch Icon support

### Technical Features
- 🔌 Works directly from filesystem (file:// protocol)
- 🏃‍♂️ No build step required
- 📦 Single external dependency (Firebase 8.10.1)
- 🔒 Offline-first architecture
- 🔄 Robust sync with conflict resolution
- 🎯 Modern code editor inspired design
- 🖼️ Adaptive favicons for all platforms and modes
- 🎨 CSS custom properties for theming
- 🔧 Modular component architecture
- 🛡️ Comprehensive error handling
- 📊 Schema-based data validation

### Component Architecture
- 🏗️ Base Components:
  - `Component`: Core lifecycle and state management
  - `FormComponent`: Form handling and validation
- 📦 Specialized Components:
  - Todo: Container, Item, and Input components
  - List: Container, Item, and Input components
  - UI: Theme Toggle, Sync Status, and App Name
- 🔄 Event System:
  - Standardized event delegation
  - Centralized event handling
  - Component-level event management

### Styling System
- 🎨 Modular CSS Structure:
  - Base: Variables, Reset, Typography
  - Components: Individual component styles
  - Layout: Grid system and responsive design
- 🌓 Theme Support:
  - Light/Dark theme with smooth transitions
  - CSS custom properties for easy customization
  - Code editor inspired color schemes
- 💫 Animations:
  - Smooth component transitions
  - Interactive hover effects
  - Loading and state change animations

### Data Management
- 📊 Models:
  - List: Collection of todos with metadata
  - Todo: Task items with subtask support
- 💾 Storage:
  - Local-first with localStorage
  - Firebase Realtime Database sync
  - Offline persistence
- ✅ Validation:
  - Schema-based data validation
  - Type checking
  - Error boundaries

## Getting Started

1. Clone the repository
2. Configure Firebase:
   - Copy `config/firebase/firebase-config.template.js` to `config/firebase/firebase-config.js`
   - Add your Firebase configuration:
     ```javascript
     const firebaseConfig = {
       apiKey: "your-api-key",
       authDomain: "your-app.firebaseapp.com",
       databaseURL: "https://your-app.firebaseio.com",
       projectId: "your-project-id",
       storageBucket: "your-app.appspot.com",
       messagingSenderId: "your-sender-id",
       appId: "your-app-id"
     };
     ```
3. Open `index.html` in your browser

## Development

### Project Structure
```
src/
├── js/
│   ├── components/    # UI Components
│   ├── models/       # Data models
│   ├── services/     # Core services
│   ├── utils/        # Utilities
│   └── ui/          # UI renderers
├── styles/
│   ├── base/        # Base styles
│   ├── components/  # Component styles
│   └── layout/      # Layout styles
└── app.js           # Main application
```

### Architecture
- Component-based with inheritance
- Event-driven updates
- Promise-based initialization
- Service-oriented design
- Modular CSS with theming

### Data Flow
1. App initializes components and services
2. Components register with global scope
3. Services handle data and state
4. Events trigger UI updates
5. Changes sync to storage

### Theme System
The app uses CSS custom properties for theming:

```css
/* Light Theme */
:root {
  --color-primary: #3B82F6;
  --color-accent: #8B5CF6;
  /* See variables.css for full palette */
}

/* Dark Theme */
.dark-theme {
  --color-primary: #61AFEF;
  --color-accent: #C678DD;
  /* See variables.css for full palette */
}
```

## License

MIT