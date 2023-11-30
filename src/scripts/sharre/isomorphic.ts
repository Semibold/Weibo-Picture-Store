/*
 * Copyright (c) 2023 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 *
 */

import { Log } from "../background/log.js";
import { GUID } from "../background/guid.js";
import { Utils } from "./utils.js";

/**
 * @static
 */
export class Isomorphic {
    static addBackgroundLog(data: WB.LogErrDetail, type: "debug" | "warn" | "error"): void {
        if (Utils.isBackground) {
            Log.add(data, type);
        } else {
            chrome.runtime.sendMessage<RSS.AddLog>({ cmd: "AddLog", type, data });
        }
    }

    static async getGlobalUniqueId(): Promise<number> {
        if (Utils.isBackground) {
            return GUID.generate();
        } else {
            return chrome.runtime.sendMessage<RSS.GetRuleId, number>({ cmd: "GetRuleId" });
        }
    }

    static async convertImage(blob: Blob, mimeType = "image/png", quality = 0.9): Promise<Blob> {
        if (self.document && self.document.body) {
            return Utils.convertImage(blob, mimeType, quality);
        } else {
            return Utils.convertBitmap(blob, mimeType, quality);
        }
    }
}
