/**
 * Build Event
 */
class BuildEvent {

    constructor(section) {
        this.duplex = new Set();
        this.section = section;
        this.decorator();
    }

    decorator() {
        this.addPaste();
        this.addClick();
        this.buildEvent();
    }

    addPaste() {
        this.duplex.add({
            type: "paste",
            nodeList: this.section.querySelectorAll("table"),
            listener: e => {
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
                                            let url = multiple.shift();

                                            Utils.checkURL(url) && multipleBuffer.push(backWindow.Weibo.fetchBlob(url)
                                                .then(blob => buffer.push(blob), Utils.noop));
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
            type: "click",
            nodeList: this.section.querySelectorAll(".image-holder"),
            listener: e => fileInput.click(),
        });
    }

    buildEvent() {
        for (let item of this.duplex) {
            for (let target of item.nodeList) {
                target.addEventListener(item.type, item.listener);
            }
        }
    }

    destroy() {
        for (let item of this.duplex) {
            for (let target of item.nodeList) {
                target.removeEventListener(item.type, item.listener);
            }
        }
        this.duplex.clear();
    }

}
