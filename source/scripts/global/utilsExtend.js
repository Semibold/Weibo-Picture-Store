/**
 * Optional
 * Utils Extend
 */
["local", "session"].forEach(item => {
    let storage = self[`${item}Storage`];
    Utils[item] = {
        get(key) {
            try {
                return JSON.parse(storage.getItem(key));
            } catch (e) {
                return null;
            }
        },
        set(key, value) {
            try {
                storage.setItem(key, JSON.stringify(value));
                return true;
            } catch (e) {
                return false;
            }
        },
        remove(key) {
            try {
                storage.removeItem(key);
                return true;
            } catch (e) {
                return false;
            }
        },
    };
});
