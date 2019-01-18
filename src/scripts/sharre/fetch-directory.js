/*
 * Copyright (c) 2019 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import { MAXIMUM_WEIBO_PICTURE_SIZE } from "./constant.js";
import { Log } from "./log.js";

const registrar = { hasDirectoryUpload: null };

/**
 * @export
 * @return {boolean}
 */
export function detectDirectoryUpload() {
    if (typeof registrar.hasDirectoryUpload === "boolean") {
        return registrar.hasDirectoryUpload;
    }
    try {
        if (
            typeof self.webkitRequestFileSystem === "function" &&
            typeof self.DataTransferItem.prototype.webkitGetAsEntry === "function"
        ) {
            return (registrar.hasDirectoryUpload = true);
        }
    } catch (e) {
        Log.w({
            module: "detectDirectoryUpload",
            message: e,
            remark: "Not support webkit directory upload",
        });
    }
    return (registrar.hasDirectoryUpload = false);
}

/**
 * @typedef {Object} VirtualFileEntry
 * @property {FileEntry} entry
 * @property {boolean} [fromFile]
 * @property {boolean} [fromDirectory]
 *
 * @param {VirtualFileEntry[]} virtualFileEntries
 * @param {DirectoryEntry} directoryEntry
 * @return {Promise<void>}
 */
function readDirectoryRecursive(virtualFileEntries, directoryEntry) {
    return new Promise((resolve, reject) => {
        const subDirectoryEntryCaches = [];
        function readDirectoryEntry(entry, continuousDirReader) {
            const dirReader = continuousDirReader || entry.createReader();
            dirReader.readEntries(
                items => {
                    if (items.length) {
                        for (let i = 0; i < items.length; i++) {
                            if (items[i].isFile) {
                                virtualFileEntries.push({ fromDirectory: true, entry: items[i] });
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
 * @typedef {VirtualFileEntry} VirtualFileEntryWithFile
 * @property {File} file
 *
 * @param virtualFile
 * @return {string}
 */
function resolveRelativeFullPath(virtualFile) {
    const name = virtualFile.entry.name;
    const fileFullPath = virtualFile.entry.fullPath;
    if (virtualFile.fromFile) {
        return fileFullPath;
    }
    if (virtualFile.fromDirectory) {
        return fileFullPath.slice(0, -name.length);
    }
    return fileFullPath;
}

/**
 * @desc Be Careful: Non-standard APIs. Only support directory upload with webkit prefix.
 * @todo Use Directory Upload(https://wicg.github.io/directory-upload/proposal.htm)
 *       if that proposal has been implemented by browsers.(maybe)
 *
 * @export
 * @param {DataTransferItemList} items
 * @return {Promise<Object<string, File[]>|void>}
 */
export async function fetchDirectory(items) {
    if (!items) return;
    if (!items.length) return;
    if (!detectDirectoryUpload()) return;
    const virtualFileEntries = [];
    const recursiveDirectoryPromises = [];
    for (let i = 0; i < items.length; i++) {
        const entry = items[i].webkitGetAsEntry();
        if (entry.isFile) {
            virtualFileEntries.push({ fromFile: true, entry: entry });
        } else if (entry.isDirectory) {
            recursiveDirectoryPromises.push(readDirectoryRecursive(virtualFileEntries, entry));
        }
    }
    const virtualFiles = [];
    return Promise.all(recursiveDirectoryPromises)
        .then(() => {
            const createFilePromises = [];
            for (const virtualFileEntry of virtualFileEntries) {
                createFilePromises.push(
                    new Promise((resolve, reject) => {
                        const fileEntry = virtualFileEntry.entry;
                        fileEntry.file(
                            file => {
                                virtualFiles.push({
                                    file: file,
                                    entry: fileEntry,
                                    fromFile: Boolean(virtualFileEntry.fromFile),
                                    fromDirectory: Boolean(virtualFileEntry.fromDirectory),
                                });
                                resolve();
                            },
                            err => {
                                Log.w({
                                    module: "fetchDirectory",
                                    message: `读取文件 ${fileEntry.fullPath} 时发生错误`,
                                    remark: err,
                                });
                                resolve();
                            },
                        );
                    }),
                );
            }
            return Promise.all(createFilePromises);
        })
        .then(() => {
            const result = {};
            for (const virtualFile of virtualFiles) {
                if (virtualFile.file.size > MAXIMUM_WEIBO_PICTURE_SIZE) continue; // Quietly discard there files
                const fullPath = resolveRelativeFullPath(virtualFile);
                if (!result[fullPath]) {
                    result[fullPath] = { files: [], fromDirectory: virtualFile.fromDirectory };
                }
                result[fullPath].files.push(virtualFile.file);
            }
            return result;
        });
}
