class BuildItem {

    constructor(data) {
        this.data = data;
        this.itemEvent = null;
        this.objectURL = null;
        this.domNodes = {};
    }

    /** @public */
    decorator() {
        this.createItem();
        this.addListener();
        return this;
    }

    /** @private */
    createItem() {
        const image = new Image();
        const fragment = this.constructor.importNode();

        this.domNodes.section = fragment.querySelector("section");
        this.domNodes.imageHolder = this.domNodes.section.querySelector(".image-holder");
        this.domNodes.inputURL = this.domNodes.section.querySelector(".type-1 input");
        this.domNodes.inputHTML = this.domNodes.section.querySelector(".type-2 input");
        this.domNodes.inputUBB = this.domNodes.section.querySelector(".type-3 input");
        this.domNodes.inputMarkdown = this.domNodes.section.querySelector(".type-4 input");

        if (this.repaint(this.data)) {
            if (this.data.blob) {
                this.objectURL = image.src = URL.createObjectURL(this.data.blob);
                this.domNodes.imageHolder.append(image);
            }
        }
    }

    /** @private */
    addListener() {
        this.itemEvent = new BuildEvent(this).decorator();
    }

    /** @public */
    repaint(data) {
        if (data && data.URL) {
            this.domNodes.inputURL.value = data.URL;
            this.domNodes.inputHTML.value = data.HTML;
            this.domNodes.inputUBB.value = data.UBB;
            this.domNodes.inputMarkdown.value = data.Markdown;
            return true;
        } else {
            return false;
        }
    }

    /** @public */
    destroy() {
        this.itemEvent.destroy();
        this.domNodes.section.remove();
        this.objectURL && URL.revokeObjectURL(this.objectURL);
    }

    static importNode() {
        const html = `
            <section>
                <div class="holder-wrapper">
                    <div class="image-holder" title="上传图片到微博相册"></div>
                </div>
                <div class="table-wrapper">
                    <table width="100%">
                        <tbody>
                            <tr class="type-1">
                                <td><span class="title">URL</span></td>
                                <td><input type="text" readonly spellcheck="false" placeholder="Uniform Resource Locator"></td>
                                <td><a class="button-copy" data-type="URL">Copy</a></td>
                            </tr>
                            <tr class="type-2">
                                <td><span class="title">HTML</span></td>
                                <td><input type="text" readonly spellcheck="false" placeholder="HyperText Markup Language"></td>
                                <td><a class="button-copy" data-type="HTML">Copy</a></td>
                            </tr>
                            <tr class="type-3">
                                <td><span class="title">UBB</span></td>
                                <td><input type="text" readonly spellcheck="false" placeholder="Ultimate Bulletin Board"></td>
                                <td><a class="button-copy" data-type="UBB">Copy</a></td>
                            </tr>
                            <tr class="type-4">
                                <td><span class="title">Markdown</span></td>
                                <td><input type="text" readonly spellcheck="false" placeholder="Markdown"></td>
                                <td><a class="button-copy" data-type="Markdown">Copy</a></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>`;
        return Utils.parseHTML(html);
    }

}
