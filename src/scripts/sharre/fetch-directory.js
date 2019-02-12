/*
 * Copyright (c) 2019 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import { Log } from "./log.js";

/**
 * @param {RevFile} revFile
 * @return {string}
 */
function resolveRelativeFullDirectory(revFile) {
    const name = revFile.entry.name;
    const fullPath = revFile.entry.fullPath;
    if (revFile.fromDirectory) {
        return fullPath.slice(0, -name.length);
    } else {
        // Return empty string if it's not from directory.
        return "";
    }
}

/**
 * @param {RevFileEntry[]} revFileEntries
 * @param {DirectoryEntry} directoryEntry
 * @return {Promise<void>}
 * @no-reject
 */
function readDirectoryRecursive(revFileEntries, directoryEntry) {
    return new Promise((resolve, reject) => {
        const subDirectoryEntryCaches = [];
        function readDirectoryEntry(entry, continuousDirReader) {
            const dirReader = continuousDirReader || entry.createReader();
            dirReader.readEntries(
                items => {
                    if (items.length) {
                        for (let i = 0; i < items.length; i++) {
                            if (items[i].isFile) {
                                revFileEntries.push({ fromDirectory: true, entry: items[i] });
                            } else if (items[i].isDirectory) {
                                subDirectoryEntryCaches.push(items[i]);
                            }
                        }
                        readDirectoryEntry(entry, dirReader);
                    } else {
                        if (subDirectoryEntryCaches.length) {
                            readDirectoryEntry(subDirectoryEntryCaches.shift());
                        } else {
                            resolve();
                        }
                    }
                },
                err => {
                    Log.w({
                        module: "readDirectoryRecursive",
                        message: err,
                        remark: `读取目录 ${entry.fullPath} 时发生错误`,
                    });
                    if (subDirectoryEntryCaches.length) {
                        readDirectoryEntry(subDirectoryEntryCaches.shift());
                    } else {
                        resolve();
                    }
                },
            );
        }
        readDirectoryEntry(directoryEntry);
    });
}

/**
 * @export
 * @return {boolean}
 */
export function hasDirectoryUpload() {
    if (typeof hasDirectoryUpload.value === "boolean") {
        return hasDirectoryUpload.value;
    }
    try {
        if (
            typeof self.webkitRequestFileSystem === "function" &&
            typeof self.DataTransferItem.prototype.webkitGetAsEntry === "function"
        ) {
            return (hasDirectoryUpload.value = true);
        }
    } catch (e) {
        Log.w({
            module: "hasDirectoryUpload",
            message: e,
            remark: "Not support webkit directory upload",
        });
    }
    return (hasDirectoryUpload.value = false);
}

/**
 * @desc Be Careful: Non-standard APIs. Only support directory upload with webkit prefix.
 * @todo Use Directory Upload(https://wicg.github.io/directory-upload/proposal.html)
 *       if that proposal has been implemented by browsers.(maybe)
 *
 * @typedef {Object} RevFileEntry
 * @property {FileEntry} entry
 * @property {boolean} [fromFile]
 * @property {boolean} [fromDirectory]
 *
 * @typedef {Object} RevFile
 * @property {File} file
 * @property {FileEntry} entry
 * @property {boolean} fromFile
 * @property {boolean} fromDirectory
 * @property {string} fullDirectoryPath
 *
 * @export
 * @param {DataTransferItemList} items
 * @return {Promise<RevFile[]>}
 * @no-reject
 */
export async function fetchDirectory(items) {
    const preset = [];

    if (!items) return preset;
    if (!items.length) return preset;
    if (!hasDirectoryUpload()) return preset;

    const revFileEntries = [];
    const recursiveDirectoryPromises = [];

    for (let i = 0; i < items.length; i++) {
        const entry = items[i].webkitGetAsEntry();
        if (entry.isFile) {
            revFileEntries.push({ fromFile: true, entry: entry });
        } else if (entry.isDirectory) {
            recursiveDirectoryPromises.push(readDirectoryRecursive(revFileEntries, entry));
        }
    }

    return Promise.all(recursiveDirectoryPromises)
        .then(() => {
            const createFilePromises = [];
            for (const revFileEntry of revFileEntries) {
                createFilePromises.push(
                    new Promise((resolve, reject) => {
                        const fileEntry = revFileEntry.entry;
                        fileEntry.file(
                            file => {
                                const revFile = {
                                    file: file,
                                    entry: fileEntry,
                                    fromFile: Boolean(revFileEntry.fromFile),
                                    fromDirectory: Boolean(revFileEntry.fromDirectory),
                                    fullDirectoryPath: "",
                                };
                                revFile.fullDirectoryPath = resolveRelativeFullDirectory(revFile);
                                resolve(revFile);
                            },
                            err => {
                                Log.w({
                                    module: "fetchDirectory",
                                    message: err,
                                    remark: `读取文件 ${fileEntry.fullPath} 时发生错误`,
                                });
                                resolve();
                            },
                        );
                    }),
                );
            }
            return Promise.all(createFilePromises);
        })
        .then(revFiles => revFiles.filter(Boolean));
}
