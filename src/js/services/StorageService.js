class StorageService {
    constructor() {
        this.STORAGE_KEY = 'todoosh_data';
    }

    save(lists) {
        try {
            const data = JSON.stringify(lists);
            localStorage.setItem(this.STORAGE_KEY, data);
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    }

    load() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (!data) return [];

            const parsedData = JSON.parse(data);
            return parsedData.map(listData => List.fromJSON(listData));
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            return [];
        }
    }

    clear() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            return true;
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            return false;
        }
    }
} 