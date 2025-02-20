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
                const parsedLists = this.parseFirebaseData(data);
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
            const data = snapshot.val();
            console.log('FirebaseService: Received data update from Firebase');
            console.log('FirebaseService: Updated data:', data);

            const parsedLists = this.parseFirebaseData(data);
            console.log('FirebaseService: Parsed updated lists:', parsedLists);

            if (this.onDataChange) {
                this.onDataChange(parsedLists);
            }
        }, (error) => {
            console.error('FirebaseService: Error receiving data:', error);
        });
    }

    parseFirebaseData(data) {
        // Handle null or undefined data
        if (!data) {
            console.warn('FirebaseService: Received null or undefined data');
            return [];
        }

        try {
            // Convert Firebase object to array and validate
            const lists = Object.values(data)
                .filter(listData => listData && !listData._connection_test) // Filter out test data and null values
                .map(listData => {
                    try {
                        // Ensure required properties exist
                        if (!listData.id || !listData.name) {
                            console.warn('FirebaseService: Invalid list data, missing required properties:', listData);
                            return null;
                        }

                        // Create new List instance with validated data
                        const list = List.fromJSON({
                            id: listData.id,
                            name: listData.name,
                            todos: Array.isArray(listData.todos) ? listData.todos : [],
                            createdAt: listData.createdAt || new Date().toISOString(),
                            order: typeof listData.order === 'number' ? listData.order : Date.now(),
                            favorite: !!listData.favorite
                        });

                        return list;
                    } catch (error) {
                        console.error('FirebaseService: Error parsing list data:', error);
                        return null;
                    }
                })
                .filter(list => list !== null); // Remove invalid lists

            return lists;
        } catch (error) {
            console.error('FirebaseService: Error processing Firebase data:', error);
            return [];
        }
    }

    uploadData(lists) {
        if (!this.connected) {
            console.log('FirebaseService: Cannot upload - not connected');
            return;
        }

        if (!Array.isArray(lists)) {
            console.error('FirebaseService: Cannot upload - lists is not an array');
            return;
        }

        console.log('FirebaseService: Uploading data:', lists);
        const listsRef = database.ref('lists');
        const data = lists.reduce((acc, list) => {
            if (list && list.toJSON) {
                acc[list.id] = list.toJSON();
            }
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