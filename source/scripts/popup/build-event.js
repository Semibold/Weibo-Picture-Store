/*
 * Copyright (c) 2017 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {fileInput} from "./sharre.js";

export class BuildEvent {

    constructor(origin, item) {
        this.origin = origin;
        this.section = item.domNodes.section;
        this.listenerSet = new Set();
    }

    /** @public */
    decorator() {
        this.clickImagePlaceholderListener();
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
