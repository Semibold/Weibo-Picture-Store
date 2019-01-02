/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import { K_AUTO_DISPLAY_CHANGELOG, PConfig } from "./sharre/constant.js";

const displayChangelog = document.querySelector(`input[value="auto_display_changelog"]`);

chrome.storage.sync.get(
    {
        [K_AUTO_DISPLAY_CHANGELOG]: PConfig.defaultOptions.autoDisplayChangelog,
    },
    items => {
        if (chrome.runtime.lastError) return;
        displayChangelog.checked = Boolean(items[K_AUTO_DISPLAY_CHANGELOG]);
    },
);

displayChangelog.addEventListener("click", e => {
    const checked = e.target.checked;
    chrome.storage.sync.set(
        {
            [K_AUTO_DISPLAY_CHANGELOG]: checked,
        },
        function() {
            if (chrome.runtime.lastError) {
                displayChangelog.checked = !checked;
            }
        },
    );
});
