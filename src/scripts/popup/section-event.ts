/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import type { SectionTable } from "./section-table.js";

interface IEventHandler {
    type: string;
    nodeList: NodeListOf<HTMLElement>;
    listener: () => void;
}

export class SectionEvent {
    section: HTMLElement;
    eventHandlers: Set<IEventHandler>;

    constructor(sectionTable: SectionTable) {
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
            listener: () => document.querySelector<HTMLInputElement>("#file-input").click(),
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
