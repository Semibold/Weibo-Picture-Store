/**
 * Options: Utils.local / Utils.session
 */
["local", "session"].reduce((accumulator, currentValue) => {
    accumulator[currentValue] = {
        get(key) {
            try {
                return JSON.parse(self[`${currentValue}Storage`].getItem(key));
            } catch (e) {
                console.warn(e);
                return null;
            }
        },
        set(key, value) {
            try {
                self[`${currentValue}Storage`].setItem(key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.warn(e);
                return false;
            }
        },
        remove(key) {
            try {
                self[`${currentValue}Storage`].removeItem(key);
                return true;
            } catch (e) {
                console.warn(e);
                return false;
            }
        },
    };

    return accumulator;
}, Utils);
