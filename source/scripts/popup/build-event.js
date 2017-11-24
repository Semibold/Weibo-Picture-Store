import {Utils} from "../base/utils.js";
import {readFile} from "../sharre/read-file.js";
import {backWindow, fileInput} from "./sharre.js";

export class BuildEvent {

    constructor(origin, item) {
        this.origin = origin;
        this.section = item.domNodes.section;
        this.listenerSet = new Set();
    }

    /** @public */
    decorator() {
        this.clickImagePlaceholderListener();
        this.pasteToInputListener();
        this.registerEventListener();
        return this;
    }

    /** @private */
    clickImagePlaceholderListener() {
        this.listenerSet.add({
            type: "click",
            nodeList: this.section.querySelectorAll(".image-holder"),
            listener: e => fileInput.click(),
        });
    }

    /** @private */
    pasteToInputListener() {
        this.listenerSet.add({
            type: "paste",
            nodeList: this.section.querySelectorAll("table"),
            listener: e => {
                for (const input of this.section.querySelectorAll("table input")) {
                    if (input === document.activeElement) {
                        const items = e.clipboardData.items;
                        const queues = [];
                        const buffer = [];

                        for (const item of items) {
                            if (item.kind === "file" && typeof item.getAsFile === "function") {
                                const file = item.getAsFile();
                                file && buffer.push(file);
                            }
                            if (item.kind === "string" && typeof item.getAsString === "function") {
                                queues.push(new Promise((resolve, reject) => {
                                    item.getAsString(str => {
                                        const multiple = str.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
                                        const multipleBuffer = [];

                                        while (multiple.length) {
                                            const url = multiple.shift();
                                            if (Utils.isValidURL(url)) {
                                                multipleBuffer.push(backWindow.Weibo.fetchBlob(url).then(blob => buffer.push(blob)).catch(Utils.noop));
                                            }
                                        }

                                        Promise.all(multipleBuffer).then(resolve);
                                    });
                                }).catch(Utils.noop));
                            }
                        }

                        Promise.all(queues)
                            .then(result => readFile(buffer, "arrayBuffer", true))
                            .then(result => backWindow.Weibo.filePurity(result))
                            .then(result => this.origin.requestUpload(result));
                        break;
                    }
                }
            },
        });
    }

    /** @private */
    registerEventListener() {
        for (const item of this.listenerSet) {
            for (const target of item.nodeList) {
                target.addEventListener(item.type, item.listener);
            }
        }
    }

    /** @public */
    destroy() {
        for (const item of this.listenerSet) {
            for (const target of item.nodeList) {
                target.removeEventListener(item.type, item.listener);
            }
        }
        this.listenerSet.clear();
    }

}
