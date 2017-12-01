import {
    startConfig,
    urlPrefix,
    rootZone,
    acceptType,
} from "../base/register.js";
import {Utils} from "../base/utils.js";
import {backWindow} from "./sharre.js";
import {BuildItem} from "./build-item.js";

export class Dispatcher {

    constructor() {
        this.batch = false;
        this.config = null;
        this.list = new Map();
        this.main = document.querySelector("#main");
        this.copier = document.querySelector("#transfer-to-clipboard");
        this.linker = document.querySelector("input.custom-clip-size");
        this.copyId = Utils.randomString(16);
        this.notifyId = Utils.randomString(16);
        this.external = startConfig.clipsize;
        this.urlPrefix = urlPrefix[Math.floor(Math.random() * urlPrefix.length)];
        this.checkout = {total: 0, settle: 0, clear: true};
        this.customConfigKey = "custom_config";
        this.customClipsizeKey = "custom_clipsize";
    }

    /** @public */
    decorator() {
        this.buildConfigProxy();
        this.startFromBlank();
        this.addGlobalListener();
        this.renderSection({});
        return this;
    }

    /** @private */
    buildConfigProxy() {
        const padding = {scheme: "1", clipsize: "1"};
        const customConfig = {
            scheme: localStorage.getItem(`${this.customConfigKey}.scheme`),
            clipsize: localStorage.getItem(`${this.customConfigKey}.clipsize`),
        };
        const customClipsize = localStorage.getItem(this.customClipsizeKey);

        if (typeof customClipsize === "string") {
            this.external[4] = customClipsize;
        }

        if (customConfig) {
            for (const name of Object.keys(padding)) {
                if (typeof startConfig[name][customConfig[name]] === "string") {
                    padding[name] = customConfig[name];
                }
            }
        }

        this.config = new Proxy(padding, {
            get: (target, key, receiver) => {
                return Reflect.get(target, key, receiver);
            },
            set: (target, key, value, receiver) => {
                const result = Reflect.set(target, key, value, receiver);
                if (result) {
                    switch (key) {
                        case "scheme":
                            this.renderScheme();
                            localStorage.setItem(`${this.customConfigKey}.scheme`, this.config.scheme);
                            break;
                        case "clipsize":
                            this.renderClipsize();
                            localStorage.setItem(`${this.customConfigKey}.clipsize`, this.config.clipsize);
                            break;
                    }
                }
                return result;
            },
        });
    }

    /** @private */
    startFromBlank() {
        this.linker.value = this.external[4];
        for (const [name, value] of Object.entries(this.config)) {
            document.querySelector(`[name="${name}"][value="${value}"]`).checked = true;
        }
        document.querySelector("a.head-copy-mode").dataset.batch = this.batch;
    }

    /** @private */
    addGlobalListener() {
        const link = document.querySelector(`[name="clipsize"][value="4"]`);
        const copy = document.querySelector("a.head-copy-mode");

        copy.addEventListener("click", e => {
            this.batch = copy.dataset.batch = !this.batch;
            this.renderCopyMode();
        });

        this.linker.addEventListener("input", e => {
            this.external[4] = e.target.value;
            this.renderClipsize();
            localStorage.setItem(this.customClipsizeKey, e.target.value);
        });

        this.linker.addEventListener("focus", e => {
            if (!link.checked) {
                link.checked = true;
            }
            if (this.config.clipsize !== link.value) {
                this.config.clipsize = link.value;
            }
        });

        for (const name of Object.keys(this.config)) {
            const nodeList = document.querySelectorAll(`[name="${name}"]`);
            for (const node of nodeList) {
                node.addEventListener("change", e => {
                    if (e.target.checked) {
                        this.config[name] = e.target.value;
                    }
                });
            }
        }

        document.addEventListener("click", e => {
            const buttonCopy = e.target.closest(".button-copy");

            if (buttonCopy) {
                const type = buttonCopy.dataset.type;
                const prev = document.activeElement;

                if (this.batch) {
                    const buffer = [];
                    for (const hybrid of this.list.values()) {
                        buffer.push(this.transformData(hybrid.data)[type]);
                    }
                    this.copier.value = buffer.join("\n");
                } else {
                    const section = buttonCopy.closest("section");
                    const input = this.list.get(section).item.domNodes[`input${type}`];
                    this.copier.value = input.value;
                }

                this.copier.focus();
                this.copier.select();

                if (document.execCommand("copy")) {
                    chrome.notifications.create(this.copyId, {
                        type: "basic",
                        iconUrl: chrome.i18n.getMessage("notification_icon"),
                        title: chrome.i18n.getMessage("info_title"),
                        message: chrome.i18n.getMessage("write_to_clipboard"),
                    });
                }

                this.copier.blur();
                prev.focus();
            }
        });
    }

    /** @private */
    renderSection(data, clear) {
        if (!data) {
            return false;
        }

        if (clear) {
            this.checkout.clear = false;
            this.destroyCurrentList();
        }

        const item = new BuildItem(this, this.transformData(data)).decorator();
        const hybrid = {item, data};

        this.fillCopyMode(item.domNodes.section);
        this.list.set(item.domNodes.section, hybrid);
        this.main.append(item.domNodes.section);
        return true;
    }

    /** @private */
    renderScheme() {
        for (const hybrid of this.list.values()) {
            hybrid.item.repaint(this.transformData(hybrid.data));
        }
    }

    /** @private */
    renderClipsize() {
        for (const hybrid of this.list.values()) {
            hybrid.item.repaint(this.transformData(hybrid.data));
        }
    }

    /** @private */
    renderCopyMode() {
        for (const hybrid of this.list.values()) {
            this.fillCopyMode(hybrid.item.domNodes.section);
        }
    }

    /** @private */
    fillCopyMode(section) {
        const nodeList = section.querySelectorAll(".button-copy");
        const textContent = this.batch ? "Copy All" : "Copy";
        for (const node of nodeList) {
            node.textContent = textContent;
        }
    }

    /** @private */
    transformData(data) {
        if (!data || !data.pid) {
            return data;
        }

        const scheme = startConfig.scheme;
        const clipsize = startConfig.clipsize;
        const typo = acceptType[data.mimeType].typo;
        const url = `${scheme[this.config.scheme] + this.urlPrefix + rootZone}/${clipsize[this.config.clipsize]}/${data.pid + typo}`;

        return Object.assign(data, {
            URL: url,
            HTML: `<img src="${url}" alt="image">`,
            UBB: `[IMG]${url}[/IMG]`,
            Markdown: `![image](${url})`,
        });
    }

    /** @private */
    destroyCurrentList() {
        if (this.list.size) {
            for (const hybrid of this.list.values()) {
                hybrid.item.destroy();
            }
            this.list.clear();
        }
    }

    /** @public */
    requestUpload(list) {
        if (Array.isArray(list) && list.length) {
            this.checkout.total += list.length;
            backWindow.Weibo.fileUpload(list, data => {
                this.renderSection(data, this.checkout.clear);
                if (++this.checkout.settle === this.checkout.total) {
                    this.checkout.clear = true;
                }
            });
        }
    }

}
