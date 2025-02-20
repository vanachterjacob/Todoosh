class FirebaseService {
    constructor() {
        this.connected = false;
        this.onConnectionChange = null;
        this.onDataChange = null;
        console.log('FirebaseService: Initialized');
    }

    init() {
        console.log('FirebaseService: Starting initialization');
        return new Promise((resolve) => {
            // Wait for connection status
            database.ref('.info/connected').on('value', (snapshot) => {
                this.connected = snapshot.val() === true;
                console.log('FirebaseService: Connection status changed -', this.connected ? 'Connected' : 'Disconnected');
                if (this.onConnectionChange) {
                    this.onConnectionChange(this.connected);
                }
                if (this.connected) {
                    this.testConnection().then(() => resolve());
                }
            });
        });
    }

    async testConnection() {
        try {
            console.log('FirebaseService: Testing connection...');
            const testRef = database.ref('lists/_connection_test');
            await testRef.set({
                timestamp: firebase.database.ServerValue.TIMESTAMP
            });
            await testRef.remove();
            console.log('FirebaseService: Connection test successful');
            return true;
        } catch (error) {
            console.error('FirebaseService: Connection test failed -', error);
            return false;
        }
    }

    startSync(lists) {
        console.log('FirebaseService: Starting sync, connected:', this.connected);
        if (!this.connected) {
            console.log('FirebaseService: Cannot start sync - not connected');
            return;
        }

        const listsRef = database.ref('lists');

        // First, get initial data
        listsRef.once('value', (snapshot) => {
            console.log('FirebaseService: Loading initial data');
            const data = snapshot.val();
            console.log('FirebaseService: Initial data:', data);

            // If we have Firebase data, use it
            if (data) {
                const parsedLists = Object.values(data)
                    .filter(list => list && !list._connection_test)
                    .map(listData => List.fromJSON(listData))
                    .sort((a, b) => a.order - b.order);
                console.log('FirebaseService: Using Firebase data:', parsedLists);
                if (this.onDataChange) {
                    this.onDataChange(parsedLists);
                }
            }
            // If Firebase is empty but we have local lists, upload them
            else if (lists && lists.length > 0) {
                console.log('FirebaseService: Firebase empty, uploading local data');
                this.uploadData(lists);
            }
        });

        // Then listen for future changes
        listsRef.on('value', (snapshot) => {
            console.log('FirebaseService: Received data update from Firebase');
            const data = snapshot.val();
            console.log('FirebaseService: Updated data:', data);

            if (this.onDataChange) {
                const parsedLists = data ?
                    Object.values(data)
                        .filter(list => list && !list._connection_test)
                        .map(listData => List.fromJSON(listData))
                        .sort((a, b) => a.order - b.order)
                    : [];
                console.log('FirebaseService: Parsed updated lists:', parsedLists);
                this.onDataChange(parsedLists);
            }
        }, (error) => {
            console.error('FirebaseService: Error receiving data:', error);
        });
    }

    uploadData(lists) {
        if (!this.connected) {
            console.log('FirebaseService: Cannot upload - not connected');
            return;
        }

        console.log('FirebaseService: Uploading data:', lists);
        const listsRef = database.ref('lists');
        const data = lists.reduce((acc, list) => {
            acc[list.id] = list.toJSON();
            return acc;
        }, {});

        listsRef.set(data).catch(error => {
            console.error('FirebaseService: Error uploading data:', error);
        });
    }

    stopSync() {
        console.log('FirebaseService: Stopping sync');
        database.ref('lists').off();
    }
} 