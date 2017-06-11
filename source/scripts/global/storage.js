/**
 * Options: Utils.local / Utils.session
 */
["localStorage", "sessionStorage"].reduce((accumulator, currentValue) => {
    accumulator[currentValue.slice(0, -7)] = {
        get length() {
            return self[currentValue].length;
        },
        key() {
            return self[currentValue].key(...arguments);
        },
        getItem() {
            try {
                return JSON.parse(self[currentValue].getItem(...arguments));
            } catch (e) {
                console.warn(e.message);
                return null;
            }
        },
        setItem() {
            if (arguments.length < 2) {
                self[currentValue].setItem(...arguments);
            } else {
                try {
                    self[currentValue].setItem(arguments[0], JSON.stringify(arguments[1]));
                } catch (e) {
                    console.warn(e.message);
                }
            }
        },
        removeItem() {
            self[currentValue].removeItem(...arguments);
        },
        clear() {
            self[currentValue].clear(...arguments);
        },
    };

    return accumulator;
}, Utils);
