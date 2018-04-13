/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

interface WeiboItemExtra {
    photoId: string;
    picHost: string;
    picName: string;
    updated: string;
}

interface ItemData extends WeiboItemExtra {}

interface WeiboDataExtra {
    total: number;
    albumId: string;
}

interface HistoryData extends WeiboDataExtra {
    list: ItemData[];
}