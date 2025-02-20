# Todoosh

A portable, offline-first todo list manager with Firebase sync.

## Features

### Core Features
- 📝 Create, edit, and organize todo lists
- 🔄 Drag and drop reordering of lists and todos
- 💾 Works offline with local storage
- 🔄 Syncs with Firebase when online
- 📱 Responsive design for all devices
- 🎨 Beautiful light and dark themes

### Technical Features
- 🔌 Works directly from filesystem (file:// protocol)
- 🏃‍♂️ No build step required
- 📦 Single external dependency (Firebase)
- 🔒 Offline-first architecture
- 🎯 Modern code editor inspired design

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
   - Add your Firebase configuration
3. Open `index.html` in your browser

## Development

The project uses a simple architecture:
- Plain HTML, CSS, and JavaScript
- CSS Custom Properties for theming
- Class-based JavaScript architecture
- Firebase Realtime Database for sync

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