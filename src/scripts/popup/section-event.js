/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

export class SectionEvent {
    /**
     * @param {SectionTable} sectionTable
     */
    constructor(sectionTable) {
        this.section = sectionTable.domNodes.section;
        this.eventHandlers = new Set();
    }

    /** @public */
    init() {
        this.clickImagePlaceholder();
        this.registerEventListener();
        return this;
    }

    /** @private */
    clickImagePlaceholder() {
        this.eventHandlers.add({
            type: "click",
            nodeList: this.section.querySelectorAll(".image-holder"),
            listener: e => document.querySelector("#file-input").click(),
        });
    }

    /** @private */
    registerEventListener() {
        for (const item of this.eventHandlers) {
            for (const target of item.nodeList) {
                target.addEventListener(item.type, item.listener);
            }
        }
    }

    /** @public */
    destroy() {
        for (const item of this.eventHandlers) {
            for (const target of item.nodeList) {
                target.removeEventListener(item.type, item.listener);
            }
        }
        this.eventHandlers.clear();
    }
}
