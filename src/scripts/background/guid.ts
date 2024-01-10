/*
 * Copyright (c) 2023 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 *
 */

import { chromeStorageLocal } from "../sharre/chrome-storage.js";
import { K_RULE_ID_POINTER, MINIMUM_RULE_ID } from "../sharre/constant.js";

/**
 * @desc static
 * @desc background only
 */
export class GUID {
    /**
     * @private
     */
    static __POINTER: number = null;

    static async generate() {
        if (GUID.__POINTER == null) {
            const data = await chromeStorageLocal.promise;
            GUID.__POINTER = data[K_RULE_ID_POINTER] || MINIMUM_RULE_ID;
        }
        const pointer = GUID.__POINTER + 1 > Number.MAX_SAFE_INTEGER ? MINIMUM_RULE_ID : GUID.__POINTER++;
        await chromeStorageLocal.set({ [K_RULE_ID_POINTER]: pointer });
        return pointer;
    }

    static __reset() {
        GUID.__POINTER = null;
    }
}

/**
 * Reset ruleId to avoid overflow.
 */
chrome.runtime.onInstalled.addListener(() => chromeStorageLocal.set({ [K_RULE_ID_POINTER]: MINIMUM_RULE_ID }));

/**
 * Reset GUID.__POINTER when sw trigger onSuspend event.
 */
chrome.runtime.onSuspend.addListener(() => GUID.__reset());
