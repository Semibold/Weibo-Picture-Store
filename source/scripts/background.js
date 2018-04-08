/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import "./background/boot.js";
import "./background/start-popup.js";
import "./background/tab-selector.js";
import {gtracker} from "./vendor/g-tracker.js";

gtracker.pageview();
