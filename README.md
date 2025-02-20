# Todoosh

A portable, offline-first todo list manager with Firebase sync.

## Features

### Core Features
- 📝 Create, edit, and organize todo lists
- ✏️ Rename and delete lists with inline editing
- 🔄 Drag and drop reordering of lists and todos
- 💾 Works offline with local storage
- 🔄 Real-time sync with Firebase
- 🌐 Cross-browser data persistence
- 📱 Responsive design for all devices
- 🎨 Beautiful light and dark themes

### Technical Features
- 🔌 Works directly from filesystem (file:// protocol)
- 🏃‍♂️ No build step required
- 📦 Single external dependency (Firebase 8.10.1)
- 🔒 Offline-first architecture
- 🔄 Robust sync with conflict resolution
- 🎯 Modern code editor inspired design

### List Management Features
- ✏️ Inline list renaming with keyboard support
- 🗑️ List deletion with confirmation
- 🔢 Automatic todo count display
- 🎯 Active list highlighting
- 🔄 Drag and drop list reordering
- 💾 Automatic sync of list changes

### Sync Features
- 🔄 Real-time bidirectional sync
- 💾 Local-first data storage
- 🌐 Cross-browser persistence
- 🔌 Automatic reconnection
- 📊 Sync status indicator
- 🛡️ Fallback to local storage

### Design Features
- 🌓 Light/Dark theme toggle with smooth transitions
- 🎨 Code editor inspired color scheme
- 🖋 Custom monospace branding with animated cursor
- 💫 Smooth animations and transitions
- 🎯 High contrast accessibility

## Getting Started

1. Clone the repository
2. Configure Firebase:
   - Copy `firebase-config.example.js` to `firebase-config.js`
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

The project uses a simple but robust architecture:
- Plain HTML, CSS, and JavaScript
- CSS Custom Properties for theming
- Class-based JavaScript architecture
- Firebase Realtime Database for sync
- Promise-based initialization
- Event-driven data updates

### Data Flow
1. App initializes and waits for Firebase connection
2. Once connected, loads data from Firebase
3. Updates local storage as backup
4. Falls back to local storage if Firebase is unavailable
5. Automatically syncs when connection is restored

### Theme Customization

The app includes a comprehensive theming system:

#### Light Theme
```css
--color-primary: #3B82F6
--color-accent: #8B5CF6
/* See .cursorrules for full color palette */
```

#### Dark Theme (Code Editor Inspired)
```css
--color-dark-primary: #61AFEF
--color-dark-accent: #C678DD
/* See .cursorrules for full color palette */
```

## License

MIT 