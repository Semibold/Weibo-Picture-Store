/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import "./background/start-popup.js";
import {fetchBlob} from "./background/fetch-blob.js";

import {gtracker} from "./plugin/g-tracker.js";

gtracker.pageview();

/**
 * @desc Core Share Module (APIs)
 */
self.coreAPIs = {
    fetchBlob,
};