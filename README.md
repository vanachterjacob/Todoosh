# Todoosh

A portable, offline-first todo list manager with Firebase sync support.

## Features

- ✅ Multiple todo lists
- ✅ Works offline
- ✅ Firebase sync when online
- ✅ Portable (works with file:// protocol)
- ✅ No build step required
- ✅ Modern UI with responsive design

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/todoosh.git
   cd todoosh
   ```

2. Create a Firebase project:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Realtime Database
   - Set database rules (see below)

3. Create `firebase-config.js` with your Firebase configuration:
   ```javascript
   // Your web app's Firebase configuration
   const firebaseConfig = {
       apiKey: "your-api-key",
       authDomain: "your-project.firebaseapp.com",
       projectId: "your-project-id",
       storageBucket: "your-project.appspot.com",
       messagingSenderId: "your-messaging-sender-id",
       appId: "your-app-id",
       databaseURL: "https://your-project.europe-west1.firebasedatabase.app"
   };

   // Initialize Firebase
   firebase.initializeApp(firebaseConfig);
   const database = firebase.database();
   ```

4. Set Firebase Database Rules:
   ```json
   {
     "rules": {
       ".read": true,
       "lists": {
         ".write": true,
         ".validate": true,
         "$listId": {
           ".validate": true
         }
       }
     }
   }
   ```

5. Open `index.html` in your browser:
   - Can be opened directly from filesystem
   - No server required
   - Works offline

## Usage

- Create multiple todo lists
- Add, edit, and delete todos
- Mark todos as complete
- Filter todos by status
- Works offline, syncs when online
- Automatic sync across devices

## Technical Details

- Built with vanilla JavaScript (no frameworks)
- Uses Firebase 8.10.1 for file:// protocol support
- Offline-first architecture with localStorage
- CSS Grid and Flexbox for layout
- Modern CSS with variables and transitions

## Development

The project uses a class-based architecture with these main components:

- `app.js`: Main application logic
- `styles.css`: Modern CSS with variables
- `index.html`: Entry point and UI structure
- `database.rules.json`: Firebase security rules
- `manifest.json`: PWA support

## Security Notes

For production:
1. Restrict Firebase API key
2. Implement proper authentication
3. Tighten database rules
4. Enable HTTPS-only access

## License

MIT License - feel free to use for any purpose.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request 