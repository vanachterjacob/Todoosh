class FirebaseService {
    constructor() {
        this.connected = false;
        this.onConnectionChange = null;
        this.onDataChange = null;
    }

    init() {
        database.ref('.info/connected').on('value', (snapshot) => {
            this.connected = snapshot.val() === true;
            if (this.onConnectionChange) {
                this.onConnectionChange(this.connected);
            }
        });

        // Test write permissions
        this.testConnection();
    }

    async testConnection() {
        try {
            const testRef = database.ref('lists/_connection_test');
            await testRef.set({
                timestamp: firebase.database.ServerValue.TIMESTAMP
            });
            await testRef.remove();
            return true;
        } catch (error) {
            console.error('Firebase permission error:', error);
            return false;
        }
    }

    startSync(lists) {
        if (!this.connected) return;

        const listsRef = database.ref('lists');

        // Initial upload
        this.uploadData(lists);

        // Listen for changes
        listsRef.on('value', (snapshot) => {
            const data = snapshot.val();
            if (data && this.onDataChange) {
                const parsedLists = Object.values(data)
                    .filter(list => list && !list._connection_test)
                    .map(listData => List.fromJSON(listData));
                this.onDataChange(parsedLists);
            }
        });
    }

    uploadData(lists) {
        if (!this.connected) return;

        const listsRef = database.ref('lists');
        const data = lists.reduce((acc, list) => {
            acc[list.id] = list.toJSON();
            return acc;
        }, {});

        listsRef.set(data).catch(error => {
            console.error('Error uploading to Firebase:', error);
        });
    }

    stopSync() {
        database.ref('lists').off();
    }
} 