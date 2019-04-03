/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import { Utils } from "../sharre/utils.js";
import { SharreM } from "../sharre/alphabet.js";
import { PConfig } from "../sharre/constant.js";
import { SectionTable } from "./section-table.js";

export class Dispatcher {
    constructor() {
        this.config = null;
        this.starter = {
            scheme: {
                1: "http://",
                2: "https://",
                3: "//",
            },
            clipsize: {
                1: "large",
                2: "mw690",
                3: "thumbnail",
                4: "",
            },
        };
        this.batch = false;
        this.list = new Map();
        this.main = document.querySelector("#main");
        this.copier = document.querySelector("#transfer-to-clipboard");
        this.linker = document.querySelector("input.custom-clipsize");
        this.external = this.starter.clipsize;
        this.checkout = { clear: true };
        this.customConfigKey = "custom_config";
        this.customClipsizeKey = "custom_clipsize";
        this.nid = Utils.randomString(16);
        this.directorySymbol = "\uD83D\uDCC1";
        this.classifyMap = new Map();
        this.prestoreMap = new Map();
        this.weiboUpload = new SharreM.WeiboUpload(true);
    }

    /** @public */
    init() {
        this.genConfigProxy();
        this.startFromBlank();
        this.registerEvents();
        this.renderSection({});
        return this;
    }

    /** @private */
    genConfigProxy() {
        const padding = { scheme: "2", clipsize: "1" };
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
                if (typeof this.starter[name][customConfig[name]] === "string") {
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
    registerEvents() {
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

        this.copyEventHandler();
        this.pasteEventHandler();
    }

    /** @private */
    copyEventHandler() {
        document.addEventListener("click", e => {
            const buttonCopy = e.target.closest(".button-copy");

            if (buttonCopy) {
                const buffer = [];
                const type = buttonCopy.dataset.type;
                const prev = document.activeElement;

                if (this.batch) {
                    for (const hybrid of this.list.values()) {
                        const tdata = this.transformer(hybrid.data);
                        if (Array.isArray(tdata)) {
                            tdata.forEach(td => buffer.push(td[type]));
                        } else {
                            buffer.push(tdata[type]);
                        }
                    }
                } else {
                    const section = buttonCopy.closest("section");
                    const tdata = this.transformer(this.list.get(section).data);
                    if (Array.isArray(tdata)) {
                        tdata.forEach(td => buffer.push(td[type]));
                    } else {
                        buffer.push(tdata[type]);
                    }
                }

                this.copier.value = buffer.join("\n");
                this.copier.focus();
                this.copier.select();

                if (document.execCommand("copy")) {
                    chrome.notifications.create(this.nid, {
                        type: "basic",
                        iconUrl: chrome.i18n.getMessage("notify_icon"),
                        title: chrome.i18n.getMessage("info_title"),
                        message: "复制成功：链接已经复制到剪切板了呦~",
                    });
                }

                this.copier.blur();
                prev.focus();
            }
        });
    }

    /** @private */
    pasteEventHandler() {
        document.addEventListener("paste", e => {
            if (document.activeElement == null || document.activeElement === document.body) {
                const items = e.clipboardData.items;
                const queues = [];
                const buffer = [];

                for (const item of items) {
                    if (item.kind === "file" && typeof item.getAsFile === "function") {
                        const file = item.getAsFile();
                        file && buffer.push(file);
                    }
                    if (item.kind === "string" && typeof item.getAsString === "function") {
                        queues.push(
                            new Promise((resolve, reject) => {
                                item.getAsString(str => {
                                    const multiple = str
                                        .replace(/\r\n/g, "\n")
                                        .replace(/\r/g, "\n")
                                        .split("\n");
                                    const multipleBuffer = [];

                                    while (multiple.length) {
                                        const url = multiple.shift();
                                        if (Utils.isValidURL(url)) {
                                            multipleBuffer.push(
                                                SharreM.fetchBlob(url)
                                                    .then(blob => buffer.push(blob))
                                                    .catch(Utils.noop),
                                            );
                                        }
                                    }

                                    Promise.all(multipleBuffer).then(resolve);
                                });
                            }).catch(Utils.noop),
                        );
                    }
                }

                Promise.all(queues).then(result => this.requester(buffer));
            }
        });
    }

    /**
     * @private
     * @param {PackedItem[]|PackedItem|Object|void} data - No internal validation.
     *        `data.length` MUST be greater than 0 if data is array.
     *
     * @param {boolean} [clear]
     */
    renderSection(data, clear) {
        if (!data) {
            return false;
        }

        if (clear) {
            this.checkout.clear = false;
            this.clearCurrentList();
        }

        const sectionTable = new SectionTable(this.getLastItemFromList(this.transformer(data))).init();
        const hybrid = { sectionTable, data };

        this.fillCopyMode(sectionTable.domNodes.section);
        this.list.set(sectionTable.domNodes.section, hybrid);
        this.main.append(sectionTable.domNodes.section);
        return true;
    }

    /** @private */
    renderScheme() {
        for (const hybrid of this.list.values()) {
            hybrid.sectionTable.repaint(this.getLastItemFromList(this.transformer(hybrid.data)));
        }
    }

    /** @private */
    renderClipsize() {
        for (const hybrid of this.list.values()) {
            hybrid.sectionTable.repaint(this.getLastItemFromList(this.transformer(hybrid.data)));
        }
    }

    /** @private */
    renderCopyMode() {
        for (const hybrid of this.list.values()) {
            this.fillCopyMode(hybrid.sectionTable.domNodes.section);
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

    /**
     * @typedef {PackedItem} AssignedPackedItem
     * @property {string} URL
     * @property {string} HTML
     * @property {string} UBB
     * @property {string} Markdown
     * @property {string} [fullDirectoryPath]
     *
     * @private
     * @param {PackedItem[]|PackedItem|Object} item
     * @return {*|AssignedPackedItem}
     */
    transformer(item) {
        if (Array.isArray(item)) {
            return item.map(d => this.transformer(d));
        }
        if (!item || !item.pid) {
            return item;
        }
        const scheme = this.starter.scheme[this.config.scheme];
        const clipsize = this.starter.clipsize[this.config.clipsize];
        const suffix = PConfig.weiboSupportedTypes[item.mimeType].typo;
        const url = `${scheme + PConfig.randomImageHost}/${clipsize}/${item.pid + suffix}`;
        const filename = Utils.getFilenameWithoutSuffix(item.blob && item.blob.name);
        const assignedPackedItem = Object.assign(item, {
            URL: url,
            HTML: `<img src="${url}" alt="${filename}">`,
            UBB: `[IMG]${url}[/IMG]`,
            Markdown: `![${filename}](${url})`,
        });
        if (item.width && item.height && clipsize === this.starter.clipsize[1]) {
            assignedPackedItem.HTML = `<img src="${url}" alt="${filename}" width="${item.width}" data-width="${
                item.width
            }" data-height="${item.height}">`;
        }
        return assignedPackedItem;
    }

    /**
     * @private
     * @param {*[]|AssignedPackedItem[]} items
     * @return {*|AssignedPackedItem}
     */
    getLastItemFromList(items) {
        if (Array.isArray(items)) {
            const d = items.slice(-1).pop();
            if (d && d.URL) {
                return Object.assign({}, d, {
                    URL: this.directorySymbol + d.URL,
                    HTML: this.directorySymbol + d.HTML,
                    UBB: this.directorySymbol + d.UBB,
                    Markdown: this.directorySymbol + d.Markdown,
                });
            } else {
                return d;
            }
        } else {
            return items;
        }
    }

    /** @private */
    clearCurrentList() {
        if (this.list.size) {
            for (const hybrid of this.list.values()) {
                hybrid.sectionTable.destroy();
            }
            this.list.clear();
        }
    }

    /**
     * @public
     * @param {ArrayLike<Blob|File>|(Blob|File)[]} blobs
     * @param {string} [fullDirectoryPath] - Non-empty string indicates that it is from a folder.
     */
    requester(blobs, fullDirectoryPath) {
        if (blobs && blobs.length) {
            this.weiboUpload.addQueues(Array.from(blobs));
            if (fullDirectoryPath) {
                for (const blob of Array.from(blobs)) {
                    this.classifyMap.set(blob, fullDirectoryPath);
                }
            }
            if (this.checkout.clear) {
                this.weiboUpload.triggerIteration(it => {
                    if (it.done) {
                        if (this.prestoreMap.size) {
                            for (const [fullDirectoryPath, prestore] of this.prestoreMap.entries()) {
                                this.renderSection(prestore, this.checkout.clear);
                            }
                        }
                        this.prestoreMap.clear();
                        this.classifyMap.clear();
                        this.checkout.clear = true;
                    } else {
                        if (this.classifyMap.has(it.value.blob)) {
                            const fullDirectoryPath = this.classifyMap.get(it.value.blob);
                            const prestore = this.prestoreMap.get(fullDirectoryPath) || [];
                            prestore.push(Object.assign({ fullDirectoryPath }, it.value));
                            this.prestoreMap.set(fullDirectoryPath, prestore);
                            this.classifyMap.delete(it.value.blob);
                            if (
                                Array.from(this.classifyMap.values()).every(path => path !== fullDirectoryPath) &&
                                prestore.length
                            ) {
                                this.renderSection(prestore, this.checkout.clear);
                                this.prestoreMap.delete(fullDirectoryPath);
                            }
                        } else {
                            this.renderSection(it.value, this.checkout.clear);
                        }
                    }
                });
            }
        }
    }
}
