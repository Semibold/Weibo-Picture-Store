/*
 * Copyright (c) 2019 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

/**
 * @desc APIs 的单例模式
 */
const SINGLETON_CACHE = new Map();

/**
 * @desc 多用户的 Cache
 */
const USER_INFO_CACHE = new Map();
const USER_INFO_EXPIRED = 24 * 60 * 60 * 1000; // 单位：ms，有效时间：24小时

/**
 * @param {Function} func - MUST be a parameterless function
 * @return {Promise<*>}
 * @reject {Promise<*>}
 */
export function singleton(func) {
    if (!SINGLETON_CACHE.has(func)) {
        SINGLETON_CACHE.set(
            func,
            func().finally(() => {
                SINGLETON_CACHE.delete(func);
            }),
        );
    }
    return SINGLETON_CACHE.get(func);
}

/**
 * @param {AlbumInfo} albumInfo
 * @return {AlbumInfo}
 */
export function setUserInfoCache(albumInfo) {
    if (albumInfo && albumInfo.albumId && albumInfo.uid) {
        USER_INFO_CACHE.set(albumInfo.uid, Object.assign({ timestamp: Date.now() }, albumInfo));
    }
    return albumInfo;
}

/**
 * @param {string} cacheId
 * @return {AlbumInfo|void}
 */
export function getUserInfoCache(cacheId) {
    if (cacheId && USER_INFO_CACHE.has(cacheId)) {
        const albumInfo = USER_INFO_CACHE.get(cacheId);
        if (
            albumInfo &&
            albumInfo.albumId &&
            albumInfo.uid === cacheId &&
            Date.now() - albumInfo.timestamp < USER_INFO_EXPIRED
        ) {
            return albumInfo;
        } else {
            USER_INFO_CACHE.delete(cacheId);
        }
    }
}

/**
 * @param {string} cacheId
 * @return {boolean}
 */
export function delUserInfoCache(cacheId) {
    if (USER_INFO_CACHE.has(cacheId)) {
        return USER_INFO_CACHE.delete(cacheId);
    }
    return false;
}
