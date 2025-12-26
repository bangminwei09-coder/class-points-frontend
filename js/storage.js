class StorageManager {
    static saveItem(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    static getItem(key, defaultValue) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    }

    static deleteItem(key) {
        localStorage.removeItem(key);
    }

    static clearAll() {
        localStorage.clear();
    }
}
