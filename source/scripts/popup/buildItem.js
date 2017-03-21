/**
 * Build Item
 */
class BuildItem {

    constructor(item) {
        this.item = item;
        this.duplex = null;
        this.objectURL = null;
        this.domNodes = {};
        this.decorator();

        return {
            section: this.domNodes.section,
            repaint: this.repaint.bind(this),
            destroy: this.destroy.bind(this),
            domNodes: this.domNodes,
        };
    }

    decorator() {
        this.createItem();
        this.buildEvent();
    }

    createItem() {
        let image = new Image();
        let template = document.querySelector("#template");
        let fragment = document.importNode(template.content, true);

        this.domNodes.section = fragment.querySelector("section");
        this.domNodes.imageHolder = this.domNodes.section.querySelector(".image-holder");
        this.domNodes.inputURL = this.domNodes.section.querySelector(".type-url input");
        this.domNodes.inputHTML = this.domNodes.section.querySelector(".type-html input");
        this.domNodes.inputUBB = this.domNodes.section.querySelector(".type-ubb input");
        this.domNodes.inputMarkdown = this.domNodes.section.querySelector(".type-markdown input");

        if (this.repaint(this.item)) {
            if (this.item.objectURL) {
                this.objectURL = this.item.objectURL;
                image.src = this.objectURL;
                this.domNodes.imageHolder.append(image);
            }
        }

        this.domNodes.section.dataset.guid = this.item.guid;
    }

    buildEvent() {
        this.duplex = new BuildEvent(this.domNodes.section);
    }

    repaint(item) {
        if (item && item.URL) {
            this.domNodes.inputURL.value = item.URL;
            this.domNodes.inputHTML.value = item.HTML;
            this.domNodes.inputUBB.value = item.UBB;
            this.domNodes.inputMarkdown.value = item.Markdown;
            return true;
        } else {
            return false;
        }
    }

    destroy() {
        this.duplex.destroy();
        this.domNodes.section.remove();
        this.objectURL && URL.revokeObjectURL(this.objectURL);
    }

}
