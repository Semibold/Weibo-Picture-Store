/**
 * Build Event
 */
class BuildEvent {

    constructor(section) {
        this.duplex = new Set();
        this.section = section;
        this.notifyId = Utils.randomString(16);
        this.decorator();

        return {
            destroy: this.destroy.bind(this),
        };
    }

    decorator() {
        this.addPaste();
        this.addClick();
        this.buildEvent();
    }

    addPaste() {
        this.duplex.add({
            node: this.section.querySelectorAll("table"),
            type: "paste",
            call: e => {
                let inputs = this.section.querySelectorAll("table input");

                for (let input of inputs) {
                    if (input === document.activeElement) {
                        let items = e.clipboardData.items;
                        let queues = [];
                        let buffer = [];

                        for (let item of items) {
                            if (item.kind === "file" && typeof item.getAsFile === "function") {
                                let file = item.getAsFile();
                                file && buffer.push(file);
                            }
                            if (item.kind === "string" && typeof item.getAsString === "function") {
                                queues.push(new Promise((resolve, reject) => {
                                    item.getAsString(str => {
                                        let multiple = str.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
                                        let multipleBuffer = [];

                                        while (multiple.length) {
                                            let str = multiple.shift();

                                            if (Utils.checkImageURL(str)) {
                                                multipleBuffer.push(Utils.fetchImage(str)
                                                    .then(blob => buffer.push(blob), reason => {
                                                        chrome.notifications.create(notifyId, {
                                                            type: "basic",
                                                            iconUrl: chrome.i18n.getMessage("64"),
                                                            title: chrome.i18n.getMessage("warn_title"),
                                                            message: chrome.i18n.getMessage("get_image_url_fail"),
                                                        });
                                                    }));
                                            }
                                        }

                                        Promise.all(multipleBuffer).then(result => resolve());
                                    });
                                }).catch(Utils.noop));
                            }
                        }

                        Promise.all(queues).then(result => Resolve(buffer));
                        break;
                    }
                }
            },
        });
    }

    addClick() {
        this.duplex.add({
            node: this.section.querySelectorAll(".image-holder"),
            type: "click",
            call: e => fileInput.click(),
        });
    }

    buildEvent() {
        for (let item of this.duplex) {
            let node = item.node;
            let type = item.type;
            let call = item.call;
            for (let target of node) {
                target.addEventListener(type, call);
            }
        }
    }

    destroy() {
        for (let item of this.duplex) {
            let node = item.node;
            let type = item.type;
            let call = item.call;
            for (let target of node) {
                target.removeEventListener(type, call);
            }
        }
        this.duplex.clear();
    }

}
