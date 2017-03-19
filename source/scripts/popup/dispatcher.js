/**
 * Dispatcher
 */
class Dispatcher {

    constructor() {
        this.batch = false;
        this.config = null;
        this.buffer = new Map();
        this.copier = document.querySelector("#copy-to-clipboard");
        this.linker = document.querySelector("input.custom-clip-size");
        this.content =  document.querySelector("#content");
        this.fragment = document.createDocumentFragment();
        this.copyId = Utils.randomString(16);
        this.notifyId = Utils.randomString(16);
        this.external = Weibo.startConfig.clipSize;
        this.urlPrefix = null;
        this.requestID = null;
        this.checkout = {total: 0, settle: 0, clear: true};
        this.decorator();

        return {
            actuator: this.actuator.bind(this),
        };
    }

    decorator() {
        this.startStore();
        this.startBlank();
        this.startEvent();
        this.addItems({});
    }

    startStore() {
        let padding = {scheme: "1", clipSize: "1"};

        try {
            let detail = JSON.parse(localStorage.getItem("WB.detail"));
            let config = JSON.parse(localStorage.getItem("WB.config"));
            if (typeof detail === "string") {
                this.external[4] = detail;
            }
            if (config) {
                for (let name of Object.keys(padding)) {
                    if (Weibo.startConfig[name][config[name]] != null) {
                        padding[name] = config[name];
                    }
                }
            }
        } catch (e) {}

        this.config = new Proxy(padding, {
            get: (target, key, receiver) => {
                return Reflect.get(target, key, receiver);
            },
            set: (target, key, value, receiver) => {
                let result = Reflect.set(target, key, value, receiver);
                if (result) {
                    switch (key) {
                        case "scheme":
                            this.reScheme();
                            break;
                        case "clipSize":
                            this.clipSize();
                            break;
                    }
                    this.setStorage("WB.config", this.config);
                }
                return result;
            },
        });
    }

    setStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {}
    }

    startBlank() {
        this.linker.value = this.external[4];
        for (let [name, value] of Object.entries(this.config)) {
            document.querySelector(`[name="${name}"][value="${value}"]`).checked = true;
        }
        document.querySelector("a.copy-mode").dataset.batch = this.batch;
    }

    startEvent () {
        let link = document.querySelector(`[name="clipSize"][value="4"]`);
        let copy = document.querySelector("a.copy-mode");

        copy.addEventListener("click", e => {
            this.batch = !this.batch;
            this.copyMode();
            copy.dataset.batch = this.batch;
        });

        this.linker.addEventListener("input", e => {
            this.external[4] = e.target.value;
            this.clipSize();
            this.setStorage("WB.detail", e.target.value);
        });
        this.linker.addEventListener("focus", e => {
            if (!link.checked) {
                link.checked = true;
            }
            if (this.config.clipSize !== link.value) {
                this.config.clipSize = link.value;
            }
        });

        for (let name of Object.keys(this.config)) {
            let nodes = document.querySelectorAll(`[name="${name}"]`);
            for (let node of nodes) {
                node.addEventListener("change", e => {
                    if (e.target.checked) {
                        this.config[name] = e.target.value;
                    }
                });
            }
        }

        document.addEventListener("click", e => {
            if (!e.target.classList.contains("button-copy")) return;
            let type = e.target.dataset.type;
            let prev = document.activeElement;

            if (this.batch) {
                let data = [];
                for (let hybrid of this.buffer.values()) {
                    data.push(this.transformRaw(hybrid.item)[type]);
                }
                this.copier.value = data.join("\n");
            } else {
                let section = e.target.closest("section.item");
                let guid = section.dataset.guid;
                let input = this.buffer.get(guid).boot.domNodes[`input${type}`];
                this.copier.value = input.value;
            }

            this.copier.focus();
            this.copier.select();

            if (document.execCommand("copy")) {
                chrome.notifications.create(this.copyId, {
                    type: "basic",
                    iconUrl: chrome.i18n.getMessage("64"),
                    title: chrome.i18n.getMessage("info_title"),
                    message: chrome.i18n.getMessage("copy_to_clipboard"),
                });
            }

            this.copier.blur();
            prev.focus();
        });
    }

    reScheme() {
        for (let hybrid of this.buffer.values()) {
            let data = this.transformRaw(hybrid.item);
            hybrid.boot.repaint(data);
        }
    }

    clipSize() {
        for (let hybrid of this.buffer.values()) {
            let data = this.transformRaw(hybrid.item);
            hybrid.boot.repaint(data);
        }
    }

    copyMode() {
        for (let hybrid of this.buffer.values()) {
            this.fillMode(hybrid.boot.section);
        }
    }

    fillMode(section) {
        let nodes = section.querySelectorAll("a.button-copy");
        for (let node of nodes) {
            node.textContent = this.batch ? "Copy All" : "Copy";
        }
    }

    addItems(items, clear) {
        if (!items) return;
        if (Array.isArray(items) && !items.length) return;

        let pretty = Array.isArray(items) ? items : [items];
        this.urlPrefix = Weibo.urlPrefix[Math.floor(Math.random() * Weibo.urlPrefix.length)];

        if (clear) {
            this.checkout.clear = false;
            this.clearAll();
        }

        for (let item of pretty) {
            let guid = item.guid = Utils.guid;
            let data = this.transformRaw(item);
            let boot = new BuildItem(data);

            this.fillMode(boot.section);
            this.fragment.append(boot.section);
            this.buffer.set(guid, {item, boot});
        }

        this.content.append(this.fragment);
    }

    transformRaw(raw) {
        if (!raw) return raw;
        if (!raw.pid) return raw;

        let scheme = Weibo.startConfig.scheme;
        let clipSize = Weibo.startConfig.clipSize;
        let rootZone = Weibo.rootZone;
        let typo = raw.fileType && Weibo.acceptType[raw.fileType].typo || ".jpg";
        let url = `${scheme[this.config.scheme] + this.urlPrefix + rootZone}/${clipSize[this.config.clipSize]}/${raw.pid + typo}`;

        return Object.assign({}, raw, {
            URL: url,
            HTML: `<img src="${url}" alt="image">`,
            UBB: `[IMG]${url}[/IMG]`,
            Markdown: `![image](${url})`,
        });
    }

    clearAll() {
        if (this.buffer.size) {
            for (let hybrid of this.buffer.values()) {
                hybrid.boot.destroy();
            }
            this.buffer.clear();
        }
    }

    actuator(result) {
        if (!Array.isArray(result) || !result.length) return;

        this.checkout.total += result.length;
        this.progress();

        for (let item of result) {
            backWindow.Weibo.fileUpload([item]).then(raw => {
                this.addItems(raw, this.checkout.clear);
                if (++this.checkout.settle === this.checkout.total) {
                    this.checkout.clear = true;
                }
            });
        }
    }

    progress() {
        let sec = 3 * this.checkout.total;
        let fps = 60;
        let pio = sec * fps;
        let max = 0.9;
        let gap = 100 / this.checkout.total;
        let step = gap * max / sec / fps;
        let time = 0;
        let loop = (timeStamp) => {
            let next = Math.floor(this.checkout.settle * gap + (this.checkout.total - this.checkout.settle) * time * step);

            if (next < 10) next = 10;
            if (next > 100) next = 100;
            time > pio ? time = pio : time++;

            chrome.notifications.create(this.notifyId, {
                type: "progress",
                iconUrl: chrome.i18n.getMessage("64"),
                title: chrome.i18n.getMessage("info_title"),
                message: chrome.i18n.getMessage("upload_progress_message"),
                contextMessage: chrome.i18n.getMessage("upload_progress_hinter"),
                progress: next,
                requireInteraction: true,
            }, notificationId => {
                if (this.checkout.settle === this.checkout.total) {
                    this.requestID && cancelAnimationFrame(this.requestID);
                    chrome.notifications.clear(notificationId, wasCleared => {
                        wasCleared && chrome.notifications.create(this.notifyId, {
                            type: "basic",
                            iconUrl: chrome.i18n.getMessage("64"),
                            title: chrome.i18n.getMessage("info_title"),
                            message: chrome.i18n.getMessage("file_upload_ended"),
                        });
                    });
                }
            });

            this.requestID = requestAnimationFrame(loop);
        };

        this.requestID && cancelAnimationFrame(this.requestID);
        this.requestID = requestAnimationFrame(loop);
    }

}
