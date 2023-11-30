/*
 * Copyright (c) 2019 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import { Utils } from "../sharre/utils.js";

interface RevFileEntry {
    fromFile: boolean;
    fromDirectory: boolean;
    entry: FileSystemFileEntry;
}

interface RevFile extends RevFileEntry {
    file: File;
    fromFile: boolean;
    fromDirectory: boolean;
    entry: FileSystemFileEntry;
    fullDirectoryPath: string;
}

/**
 * @param {RevFile} revFile
 * @return {string}
 */
function resolveRelativeFullDirectory(revFile: RevFile): string {
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
 * @param {FileSystemDirectoryEntry} directoryEntry
 * @return {Promise<void>}
 * @no-reject
 */
function readDirectoryRecursive(
    revFileEntries: RevFileEntry[],
    directoryEntry: FileSystemDirectoryEntry,
): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const subDirectoryEntryCaches: FileSystemDirectoryEntry[] = [];

        /**
         * @param {FileSystemDirectoryEntry} entry
         * @param {FileSystemDirectoryReader} [continuousDirReader]
         */
        function readDirectoryEntry(entry: FileSystemDirectoryEntry, continuousDirReader?: FileSystemDirectoryReader) {
            const dirReader: FileSystemDirectoryReader = continuousDirReader || entry.createReader();
            dirReader.readEntries(
                (items) => {
                    if (items.length) {
                        for (let i = 0; i < items.length; i++) {
                            if (items[i].isFile) {
                                revFileEntries.push({
                                    fromFile: false,
                                    fromDirectory: true,
                                    entry: items[i] as FileSystemFileEntry,
                                });
                            } else if (items[i].isDirectory) {
                                subDirectoryEntryCaches.push(items[i] as FileSystemDirectoryEntry);
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
                (err) => {
                    Utils.log.w({
                        module: "readDirectoryRecursive",
                        error: err,
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
export function hasDirectoryUpload(): boolean {
    try {
        if (typeof self.DataTransferItem.prototype.webkitGetAsEntry === "function") {
            return true;
        }
    } catch (e) {
        Utils.log.w({
            module: "hasDirectoryUpload",
            error: e,
            remark: "当前浏览器不支持以文件夹的形式上传文件",
        });
    }
    return false;
}

/**
 * @desc Be Careful: Non-standard APIs. Only support directory upload with webkit prefix.
 * @todo Use Directory Upload(https://wicg.github.io/directory-upload/proposal.html)
 *       if that proposal has been implemented by browsers.(maybe)
 *
 * @export
 * @param {DataTransferItemList} items
 * @return {Promise<RevFile[]>}
 * @no-reject
 */
export async function fetchDirectory(items: DataTransferItemList): Promise<RevFile[]> {
    const preset: RevFile[] = [];

    if (!items) return preset;
    if (!items.length) return preset;
    if (!hasDirectoryUpload()) return preset;

    const revFileEntries: RevFileEntry[] = [];
    const recursiveDirectoryPromises = [];

    for (let i = 0; i < items.length; i++) {
        const entry = items[i].webkitGetAsEntry();
        if (entry.isFile) {
            revFileEntries.push({ fromFile: true, fromDirectory: false, entry: entry as FileSystemFileEntry });
        } else if (entry.isDirectory) {
            recursiveDirectoryPromises.push(readDirectoryRecursive(revFileEntries, entry as FileSystemDirectoryEntry));
        }
    }

    return Promise.all(recursiveDirectoryPromises)
        .then(() => {
            const createFilePromises: Promise<RevFile>[] = [];
            for (const revFileEntry of revFileEntries) {
                createFilePromises.push(
                    new Promise((resolve, reject) => {
                        const fileEntry = revFileEntry.entry;
                        fileEntry.file(
                            (file) => {
                                const revFile = {
                                    file: file,
                                    entry: fileEntry,
                                    fromFile: revFileEntry.fromFile,
                                    fromDirectory: revFileEntry.fromDirectory,
                                    fullDirectoryPath: "",
                                };
                                revFile.fullDirectoryPath = resolveRelativeFullDirectory(revFile);
                                resolve(revFile);
                            },
                            (err) => {
                                Utils.log.w({
                                    module: "fetchDirectory",
                                    error: err,
                                    remark: `读取文件 ${fileEntry.fullPath} 时发生错误`,
                                });
                                resolve(null);
                            },
                        );
                    }),
                );
            }
            return Promise.all(createFilePromises);
        })
        .then((revFiles) => revFiles.filter(Boolean));
}
