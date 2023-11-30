/*
 * Copyright (c) 2023 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 *
 */

/**
 * @desc static
 * @desc background only
 */
export class GUID {
    /**
     * @private
     */
    static __POINTER = 0;

    static generate() {
        return ++GUID.__POINTER;
    }
}
