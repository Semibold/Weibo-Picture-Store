/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {Config} from "../sharre/config.js";
import {gtracker} from "../plugin/g-tracker.js";
import {T_DATA_CHANGED, T_SYNC_CHANGED} from "../plugin/constant.js";

class SyncedSData extends EventTarget {

    /**
     * @private
     * @param {boolean} [sync]
     * @return {"sync"|"local"}
     */
    static storageType(sync) {
        if (sync) {
            return "sync";
        } else {
            return "local";
        }
    }

    /**
     * @private
     * @param {Object} items
     * @return {Object}
     */
    static decodeData(items) {
        const l = [];
        const z = Config.ssps.reduce((r, x) => {
            const pl = l.length;
            const a = Array.isArray(items[x]) ? items[x] : [];
            if (!a.length) {
                // 每种类型至少要有一个数据
                a.push(Config.sspsdata[x]);
            }
            r[x] = a;
            l.push(...a);

            // 配置锁定可能会让之前的 selectindex 数据无效
            if (r.selectindex >= pl && r.selectindex < l.length) {
                if (Config.inactived[x]) {
                    r.selectindex = Config.selectindex;
                }
            }

            a.forEach((item, i) => {
                const foreign = i === 0 ? Config.predefine[x] : Config.preothers;
                Object.assign(item, {foreign});
            });
            return r;
        }, {
            selectindex: items.selectindex || Config.selectindex,
            [Config.synckey]: Boolean(items[Config.synckey]),
        });

        // selectindex 超出数据长度重置为默认
        if (z.selectindex >= l.length) {
            z.selectindex = Config.selectindex;
        }

        return z;
    }

    /**
     * @private
     * @param {Object} sdata
     * @return {Object}
     */
    static encodeData(sdata) {
        const r = {selectindex: sdata.selectindex};
        Config.ssps.forEach(x => {
            const validkeys = Object.keys(Config.sspsdata[x]);

            // 如果某个类型被禁用则不存储其数据，已有数据也会被丢弃
            if (Config.inactived[x]) return;

            r[x] = sdata[x].map(item => validkeys.reduce((ac, k) => {
                ac[k] = item[k] || Config.sspsdata[x][k];
                return ac;
            }, {}));
        });
        return r;
    }

    /**
     * @private
     * @desc 存取 UserData 专用
     * @param {boolean} [sync] - 只有在 Storage.onChanged 事件中才有用
     * @return {Promise<Object>}
     */
    static getUserData(sync) {
        return new Promise((resolve, reject) => {
            if (typeof sync !== "boolean") {
                reject({specified: false});
                return;
            }
            const t = SyncedSData.storageType(sync);
            const keys = sync ? [...Config.sakeys, Config.synckey] : Config.sakeys;
            chrome.storage[t].get(keys, items => {
                if (chrome.runtime.lastError) {
                    gtracker.exception({
                        exDescription: chrome.runtime.lastError.message,
                        exFatal: true,
                    });
                    reject({specified: true});
                    return;
                }
                resolve(SyncedSData.decodeData(items));
            })
        }).catch(reason => {
            if (reason && reason.specified) {
                return Promise.reject(reason);
            }
            return new Promise((resolve, reject) => {
                chrome.storage.sync.get([...Config.sakeys, Config.synckey], items => {
                    if (chrome.runtime.lastError) {
                        gtracker.exception({
                            exDescription: chrome.runtime.lastError.message,
                            exFatal: true,
                        });
                        reject({specified: false});
                        return;
                    }
                    if (items[Config.synckey]) {
                        resolve(SyncedSData.decodeData(items));
                    } else {
                        reject({specified: false});
                    }
                });
            });
        }).catch(reason => {
            if (reason && reason.specified) {
                return Promise.reject(reason);
            }
            return new Promise((resolve, reject) => {
                chrome.storage.local.get(Config.sakeys, items => {
                    if (chrome.runtime.lastError) {
                        gtracker.exception({
                            exDescription: chrome.runtime.lastError.message,
                            exFatal: true,
                        });
                        reject({specified: false});
                        return;
                    }
                    resolve(SyncedSData.decodeData(items));
                });
            });
        });
    }

    /**
     * @private
     * @desc 存取 sdata 专用
     * @param {Object} sdata
     * @return {Promise<void>}
     */
    static setUserData(sdata) {
        if (!sdata) {
            throw new Error("Wrong data structure");
        }
        const t = SyncedSData.storageType(sdata[Config.synckey]);
        return new Promise((resolve, reject) => {
            chrome.storage[t].set(SyncedSData.encodeData(sdata), () => {
                if (chrome.runtime.lastError) {
                    gtracker.exception({
                        exDescription: chrome.runtime.lastError.message,
                        exFatal: true,
                    });
                    reject(chrome.runtime.lastError);
                } else {
                    resolve();
                }
            });
        });
    }

    constructor() {
        super();
        this._sdata = null;
        this._promise = this.constructor.getUserData().then(d => this._sdata = d);
        chrome.storage.onChanged.addListener((changes, areaName) => {
            if (areaName !== "sync" && areaName !== "local") return;
            if (areaName === "sync" && changes[Config.synckey] &&
                changes[Config.synckey].newValue !== this._sdata[Config.synckey]) {
                this._sdata[Config.synckey] = Boolean(changes[Config.synckey].newValue);
                this.dispatchEvent(new CustomEvent(T_SYNC_CHANGED, {detail: {sdata: this._sdata, syncOnly: true}}));
            }
            if (this._sdata[Config.synckey] !== (areaName === "sync")) return;
            if (Config.sakeys.some(k => !!changes[k])) {
                this.constructor.getUserData(areaName === "sync").then(d => {
                    this.dispatchEvent(new CustomEvent(T_DATA_CHANGED, {detail: {sdata: d}}));
                });
            }
        });
    }

    /**
     * @public
     * @return {Object}
     */
    get sdata() {
        return Object.assign({_copy_: true}, this._sdata);
    }

    /**
     * @public
     * @param {Object} sdata
     */
    set sdata(sdata) {
        this.constructor.setUserData(sdata).then(result => this._sdata = sdata);
    }

    /**
     * @public
     * @return {Object}
     */
    get cdata() {
        const {total} = this.genlist();
        return total[this._sdata.selectindex];
    }

    /**
     * @public
     * @return {Promise<Object>}
     */
    get promise() {
        return this._promise;
    }

    /**
     * @public
     * @return {Object}
     */
    genlist() {
        const valid = [];
        const total = [];
        Config.ssps.forEach(x => {
            this._sdata[x].forEach(item => {
                if (!Config.inactived[x]) {
                    valid.push(item);
                }
                total.push(item);
            });
        });
        return {valid, total};
    }

}

export const syncedSData = new SyncedSData();