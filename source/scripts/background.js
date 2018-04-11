/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import "./background/start-popup.js";
import "./background/menu-selector.js";
import {fetchBlob} from "./background/fetch-blob.js";
import {syncedSData} from "./background/synced-sdata.js";

import {gtracker} from "./plugin/g-tracker.js";

gtracker.pageview();

/**
 * @desc Core Share Module (APIs)
 */
self.coreAPIs = {
    fetchBlob,
    syncedSData,
};