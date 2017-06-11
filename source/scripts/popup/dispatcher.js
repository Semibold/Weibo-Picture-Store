/**
 * Dispatcher
 */
class Dispatcher {

    constructor() {
        this.batch = false;
        this.config = null;
        this.buffer = new Map();
        this.main = document.querySelector("#main");
        this.copier = document.querySelector("#transfer-to-clipboard");
        this.linker = document.querySelector("input.custom-clip-size");
        this.fragment = document.createDocumentFragment();
        this.copyId = Utils.randomString(16);
        this.notifyId = Utils.randomString(16);
        this.external = Weibo.startConfig.clipSize;
        this.urlPrefix = null;
        this.checkout = {total: 0, settle: 0, clear: true};
        this.detailKey = "WB.detail";
        this.configKey = "WB.config";
        this.decorator();
    }

    decorator() {
        this.startStore();
        this.startBlank();
        this.startEvent();
        this.addItems({});
    }

    startStore() {
        let padding = {scheme: "1", clipSize: "1"};
        let detail = Utils.local.getItem(this.detailKey);
        let config = Utils.local.getItem(this.configKey);

        if (typeof detail === "string") {
            this.external[4] = detail;
        }
        if (config) {
            for (let name of Object.keys(padding)) {
                if (typeof Weibo.startConfig[name][config[name]] === "string") {
                    padding[name] = config[name];
                }
            }
        }

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
                    Utils.local.setItem(this.configKey, this.config);
                }
                return result;
            },
        });
    }

    startBlank() {
        this.linker.value = this.external[4];
        for (let [name, value] of Object.entries(this.config)) {
            document.querySelector(`[name="${name}"][value="${value}"]`).checked = true;
        }
        document.querySelector("a.head-copy-mode").dataset.batch = this.batch;
    }

    startEvent() {
        let link = document.querySelector(`[name="clipSize"][value="4"]`);
        let copy = document.querySelector("a.head-copy-mode");

        copy.addEventListener("click", e => {
            this.batch = copy.dataset.batch = !this.batch;
            this.copyMode();
        });

        this.linker.addEventListener("input", e => {
            this.external[4] = e.target.value;
            this.clipSize();
            Utils.local.setItem(this.detailKey, e.target.value);
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
            let nodeList = document.querySelectorAll(`[name="${name}"]`);
            for (let node of nodeList) {
                node.addEventListener("change", e => {
                    if (e.target.checked) {
                        this.config[name] = e.target.value;
                    }
                });
            }
        }

        document.addEventListener("click", e => {
            let buttonCopy = e.target.closest(".button-copy");
            if (buttonCopy) {
                let type = buttonCopy.dataset.type;
                let prev = document.activeElement;

                if (this.batch) {
                    let data = [];
                    for (let hybrid of this.buffer.values()) {
                        data.push(this.transformRaw(hybrid.item)[type]);
                    }
                    this.copier.value = data.join("\n");
                } else {
                    let section = buttonCopy.closest("section");
                    let input = this.buffer.get(section).boot.domNodes[`input${type}`];
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
            }
        });
    }

    reScheme() {
        for (let hybrid of this.buffer.values()) {
            hybrid.boot.repaint(this.transformRaw(hybrid.item));
        }
    }

    clipSize() {
        for (let hybrid of this.buffer.values()) {
            hybrid.boot.repaint(this.transformRaw(hybrid.item));
        }
    }

    copyMode() {
        for (let hybrid of this.buffer.values()) {
            this.fillMode(hybrid.boot.section);
        }
    }

    fillMode(section) {
        let nodeList = section.querySelectorAll(".button-copy");
        for (let node of nodeList) {
            node.textContent = this.batch ? "Copy All" : "Copy";
        }
    }

    addItems(items, clear) {
        if (!items || Array.isArray(items) && !items.length) {
            return false;
        }

        let pretty = Array.isArray(items) ? items : [items];
        this.urlPrefix = Weibo.urlPrefix[Math.floor(Math.random() * Weibo.urlPrefix.length)];

        if (clear) {
            this.checkout.clear = false;
            this.clearAll();
        }

        for (let item of pretty) {
            let boot = new BuildItem(this.transformRaw(item));

            this.fillMode(boot.section);
            this.fragment.append(boot.section);
            this.buffer.set(boot.section, {item, boot});
        }

        this.main.append(this.fragment);
        return true;
    }

    transformRaw(raw) {
        if (!raw || !raw.pid) {
            return raw;
        }

        let scheme = Weibo.startConfig.scheme;
        let clipSize = Weibo.startConfig.clipSize;
        let rootZone = Weibo.rootZone;
        let typo = Weibo.acceptType[raw.file.type].typo;
        let url = `${scheme[this.config.scheme] + this.urlPrefix + rootZone}/${clipSize[this.config.clipSize]}/${raw.pid + typo}`;

        return Object.assign(raw, {
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
        if (Array.isArray(result) && result.length) {
            this.checkout.total += result.length;
            backWindow.Weibo.fileUpload(result, raw => {
                raw && this.addItems(raw, this.checkout.clear);
                if (++this.checkout.settle === this.checkout.total) {
                    this.checkout.clear = true;
                }
            });
        }
    }

}
