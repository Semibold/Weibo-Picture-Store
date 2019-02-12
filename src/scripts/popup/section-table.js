/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import { Utils } from "../sharre/utils.js";
import { SectionEvent } from "./section-event.js";

export class SectionTable {
    /**
     * @param {AssignedPackedItem} item
     */
    constructor(item) {
        this.item = item;
        this.domNodes = {};
        this.objectURL = null;
        this.sectionEvent = null;
    }

    /** @public */
    init() {
        this.generateTable();
        this.registerEvents();
        return this;
    }

    /** @private */
    generateTable() {
        const image = new Image();
        const fragment = this.constructor.importNode();

        this.domNodes.section = fragment.querySelector("section");
        this.domNodes.imageHolder = this.domNodes.section.querySelector(".image-holder");
        this.domNodes.inputURL = this.domNodes.section.querySelector(".type-1 input");
        this.domNodes.inputHTML = this.domNodes.section.querySelector(".type-2 input");
        this.domNodes.inputUBB = this.domNodes.section.querySelector(".type-3 input");
        this.domNodes.inputMarkdown = this.domNodes.section.querySelector(".type-4 input");

        if (this.repaint(this.item)) {
            if (this.item.blob) {
                this.objectURL = image.src = URL.createObjectURL(this.item.blob);
                this.domNodes.imageHolder.append(image);
            }
        }
    }

    /** @private */
    registerEvents() {
        this.sectionEvent = new SectionEvent(this).init();
    }

    /**
     * @public
     * @param {AssignedPackedItem} item
     * @return {boolean}
     */
    repaint(item) {
        if (item && item.URL) {
            this.domNodes.inputURL.value = item.URL;
            this.domNodes.inputHTML.value = item.HTML;
            this.domNodes.inputUBB.value = item.UBB;
            this.domNodes.inputMarkdown.value = item.Markdown;
            if (item.fullDirectoryPath) {
                this.domNodes.imageHolder.title = `图片目录：${item.fullDirectoryPath}`;
            } else if (item.blob.name) {
                this.domNodes.imageHolder.title = `图片文件：${item.blob.name}`;
            }
            return true;
        } else {
            return false;
        }
    }

    /** @public */
    destroy() {
        this.sectionEvent.destroy();
        this.domNodes.section.remove();
        this.objectURL && URL.revokeObjectURL(this.objectURL);
    }

    static importNode() {
        // language=HTML
        const html = `
            <section>
                <div class="holder-wrapper">
                    <div class="image-holder" title="点击上传图片到微博相册"></div>
                </div>
                <div class="table-wrapper">
                    <table width="100%">
                        <tbody>
                            <tr class="type-1">
                                <td><span class="title">URL</span></td>
                                <td><input type="text" disabled readonly spellcheck="false" placeholder="Uniform Resource Locator"></td>
                                <td><a class="button-copy" data-type="URL">Copy</a></td>
                            </tr>
                            <tr class="type-2">
                                <td><span class="title">HTML</span></td>
                                <td><input type="text" disabled readonly spellcheck="false" placeholder="HyperText Markup Language"></td>
                                <td><a class="button-copy" data-type="HTML">Copy</a></td>
                            </tr>
                            <tr class="type-3">
                                <td><span class="title">UBB</span></td>
                                <td><input type="text" disabled readonly spellcheck="false" placeholder="Ultimate Bulletin Board"></td>
                                <td><a class="button-copy" data-type="UBB">Copy</a></td>
                            </tr>
                            <tr class="type-4">
                                <td><span class="title">Markdown</span></td>
                                <td><input type="text" disabled readonly spellcheck="false" placeholder="Markdown"></td>
                                <td><a class="button-copy" data-type="Markdown">Copy</a></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>`;
        return Utils.parseHTML(html);
    }
}
