/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {Utils} from "../sharre/utils.js";
import {SharreM} from "../sharre/alphabet.js";
import {Config} from "../sharre/config.js";
import {gtracker} from "../plugin/g-tracker.js";

/**
 * @todo 超多元素回收和添加
 */
export class Dispatcher {

    constructor() {
        this.checkout = {
            page: 1,
            pages: 1,
            count: 50,
            albumId: 0,
            prevdel: 0,
            nextMarker: "",
        };
        this.error = false;
        this.ended = false;
        this.maxselected = 50;
        this.promise = Promise.resolve();
        this.notifyId = Utils.randomString(16);
        this.head = document.querySelector("#head");
        this.main = document.querySelector("#main");
        this.foot = document.querySelector("#foot");
        this.progressbar = document.querySelector("#progress-bar");
        this.loading = document.createElement("div");
        this.exception = document.createElement("div");
        this.fragment = document.createDocumentFragment();
        this.sections = new Map();
        this.selected = new Set();
        this.observer = new IntersectionObserver((entries, observer) => {
            this.observerCallback(entries, observer);
        }, {rootMargin: "0%", threshold: 0});
        this.cdata = SharreM.syncedSData.cdata;
    }

    /**
     * @public
     */
    init() {
        this.primaryStructure();
        this.registerObserver();
        this.addGlobalListener();
        return this;
    }

    /**
     * @private
     */
    primaryStructure() {
        const div = document.createElement("button");
        div.textContent = "载入数据错误，点击再次加载";
        this.exception.dataset.bio = "throw-button";
        this.exception.append(div);

        this.loading.dataset.bio = "loading";
        this.main.append(this.loading);
    }

    /**
     * @private
     */
    registerObserver() {
        this.observer.observe(this.foot);
    }

    /**
     * @private
     * @param {IntersectionObserverEntry[]} [entries]
     * @param {IntersectionObserver} [observer]
     */
    observerCallback(entries, observer) {
        this.promise.finally(() => {
            if (this.needNextPage(entries)) {
                const promise = this[this.cdata.ssp]();
                this.progressbar.dataset.hidden = false;
                this.promise = promise.then(result => {
                    this.checkout.page++;
                    return result;
                }).catch(reason => {
                    this.errorInjector();
                }).finally(() => {
                    const {page, pages} = this.checkout;
                    if (!pages || page > pages) {
                        this.ended = true;
                    }
                    if (this.ended) {
                        this.observer.unobserve(this.foot);
                    }
                    if (this.loading.parentElement) {
                        this.loading.remove();
                    }
                    this.progressbar.dataset.hidden = true;
                    this.observerCallback();
                }).then(result => {
                    this.availableChecker();
                });
            }
        });
    }



    /**
     * @private
     * @param {IntersectionObserverEntry[]} [entries]
     * @return {boolean}
     */
    needNextPage(entries) {
        if (this.ended || this.error) {
            return false;
        }
        if (entries) {
            return entries.some(entry => {
                return entry.target === this.foot && entry.isIntersecting;
            });
        } else {
            const foot = this.foot.getBoundingClientRect();
            const scrollingElementHeight = document.scrollingElement.clientHeight;
            return scrollingElementHeight >= foot.top;
        }
    }

    /**
     * @private
     */
    weibo_com() {
        const albumInfo = this.checkout.albumId ? {albumId: this.checkout.albumId} : null;

        // 修正删除数据后的分页信息
        const {page, count, prevdel} = this.checkout;
        const rest = prevdel % count;
        const mpage = Math.ceil(prevdel / count);
        const repeat = rest && page - mpage > 0;
        if (repeat) {
            this.checkout.page -= mpage;
        } else if (rest) {
            gtracker.exception({
                exDescription: `History: page=${page}&count=${count}&prevdel=${prevdel}`,
                exFatal: true,
            });
        }

        return SharreM.ActionHistory.fetcher(this.cdata.ssp, {
            weibo_com: repeat ? {
                page: this.checkout.page++,
                count: this.checkout.count,
                albumInfo: albumInfo,
                repeat: repeat,
            }: {
                page: this.checkout.page,
                count: this.checkout.count,
                albumInfo: albumInfo,
                repeat: repeat,
            },
        }).then(json => {
            const list = repeat ? json.list.slice(-rest - count) : json.list;
            this.checkout.pages = Math.ceil(json.total / this.checkout.count);
            this.checkout.albumId = json.albumId;
            this.checkout.prevdel = 0;
            for (const item of list) {
                const fragment = this.constructor.importNode();
                const section = fragment.querySelector("section");
                const linker = section.querySelector(".image-linker");
                const create = section.querySelector(".image-update");
                const source = linker.querySelector("img");
                source.src = `${item.picHost}/thumb300/${item.picName}`;
                source.srcset = `${item.picHost}/bmiddle/${item.picName} 2x`;
                linker.href = `${item.picHost}/large/${item.picName}`;
                create.textContent = item.updated;
                this.fragment.append(section);
                this.sections.set(section, item);
            }
            this.main.append(this.fragment);
            return json;
        }).catch(reason => {
            this.checkout.albumId = 0;
            return Promise.reject(reason);
        });
    }

    /**
     * @private
     */
    qcloud_com() {
        const thumbnail = Config.thumbnail[this.cdata.ssp];
        return SharreM.ActionHistory.fetcher(this.cdata.ssp, {
            qcloud_com: {
                page: this.checkout.page,
                count: this.checkout.count,
                marker: this.checkout.nextMarker,
                cdata: this.cdata,
            },
        }).then(json => {
            if (json.isTruncated) {
                this.checkout.pages = this.checkout.page + 1;
            } else {
                this.checkout.pages = this.checkout.page;
            }
            this.checkout.nextMarker = json.nextMarker;
            for (const item of json.list) {
                const fragment = this.constructor.importNode();
                const section = fragment.querySelector("section");
                const linker = section.querySelector(".image-linker");
                const create = section.querySelector(".image-update");
                const source = linker.querySelector("img");
                source.src = `${item.picHost}/${item.picName + thumbnail[3]}`;
                source.srcset = `${item.picHost}/${item.picName + thumbnail[2]} 2x`;
                linker.href = `${item.picHost}/${item.picName + thumbnail[1]}`;
                create.textContent = item.updated;
                this.fragment.append(section);
                this.sections.set(section, item);
            }
            this.main.append(this.fragment);
            return json;
        });
    }

    /**
     * @private
     */
    qiniu_com() {}

    /**
     * @private
     */
    aliyun_com() {}

    /**
     * @private
     */
    upyun_com() {}

    /**
     * @private
     */
    addGlobalListener() {
        this.exception.addEventListener("click", e => {
            this.error = false;
            this.exception.remove();
            this.observerCallback();
        });
        document.addEventListener("click", e => {
            if (e.ctrlKey) {
                const section = e.target.closest("section");
                if (section) {
                    e.preventDefault();
                    if (this.selected.has(section)) {
                        this.selected.delete(section);
                        section.dataset.selected = false;
                    } else if (this.selected.size < this.maxselected) {
                        this.selected.add(section);
                        section.dataset.selected = true;
                    } else {
                        chrome.notifications.create(this.notifyId, {
                            type: "basic",
                            iconUrl: chrome.i18n.getMessage("notify_icon"),
                            title: chrome.i18n.getMessage("info_title"),
                            message: `选择失败：最多同时选中${this.maxselected}个元素`,
                        });
                    }
                }
            } else {
                if (this.selected.size) {
                    e.preventDefault();
                    this.selected.forEach(n => {
                        n.dataset.selected = false;
                    });
                    this.selected.clear();
                } else {
                    const rb = e.target.closest("a.image-remove");
                    if (rb) {
                        const section = e.target.closest("section");
                        if (section) {
                            this.selected.add(section);
                            this.deleteResources();
                        }
                    }
                }
            }
        });
    }

    /**
     * @public
     */
    deleteResources() {
        const pegmap = new WeakMap();
        const cache = {list: [], selected: new Set(this.selected), promise: null};
        this.selected.forEach(n => {
            const d = this.sections.get(n);
            if (d) {
                cache.list.push(d);
                n.dataset.removing = true;
                pegmap.set(d, n);
            }
            n.dataset.selected = false;
        });
        this.selected.clear();
        switch (this.cdata.ssp) {
            case "weibo_com": {
                const photoIds = cache.list.map(d => d.photoId);
                cache.promise = SharreM.ActionDelete.fetcher(this.cdata.ssp, {
                    weibo_com: {
                        albumId: this.checkout.albumId,
                        photoIds: photoIds,
                    },
                }).then(json => {
                    this.checkout.prevdel = photoIds.length;
                });
                break;
            }
            case "qcloud_com": {
                const kobj = {};
                const keys = cache.list.map(d => {
                    kobj[d.picName] = d;
                    return d.picName;
                });
                cache.promise = SharreM.ActionDelete.fetcher(this.cdata.ssp, {
                    qcloud_com: {
                        cdata: this.cdata,
                        keys: keys,
                    },
                }).then(json => {
                    json.errorKeys.forEach(k => {
                        const d = kobj[k];
                        const n = pegmap.get(d);
                        if (cache.selected.has(n)) {
                            cache.selected.delete(n);
                            Reflect.deleteProperty(n.dataset, "removing");
                        }
                    });
                });
                break;
            }
            case "qiniu_com": break;
            case "aliyun_com": break;
            case "upyun_com": break;
        }
        cache.promise.finally(() => {
            cache.selected.forEach(n => Reflect.deleteProperty(n.dataset, "removing"));
        }).then(json => {
            cache.selected.forEach(section => {
                section.remove();
                if (this.sections.has(section)) {
                    this.sections.delete(section);
                }
            });
            this.availableChecker();
        }).catch(reason => {
            chrome.notifications.create(this.notifyId, {
                type: "basic",
                iconUrl: chrome.i18n.getMessage("notify_icon"),
                title: chrome.i18n.getMessage("info_title"),
                message: "操作失败：移除文件没有成功哈~",
            });
        });
    }

    /**
     * @private
     */
    errorInjector() {
        this.error = true;
        if (this.checkout.page === 1) {
            const div = document.createElement("div");
            div.dataset.bio = "throw-message";
            div.textContent = "获取图片失败，欸嘿~";
            this.main.append(div);
        } else if (!this.ended) {
            this.main.append(this.exception);
        }
    }
    
    /**
     * @private
     */
    availableChecker() {
        if (this.ended && !this.sections.size) {
            const div = document.createElement("div");
            div.dataset.bio = "throw-message";
            div.textContent = "没有分页数据，欸嘿~";
            this.main.append(div);
        }
    }

    static importNode() {
        const html = `
            <section>
                <div class="image-body">
                    <a class="image-remove" title="移除当前文件"><i class="fa fa-trash-o"></i></a>
                    <a class="image-linker" title="点击查看原图" target="_blank">
                        <img src="${chrome.i18n.getMessage("image_placeholder")}" alt="preview">
                    </a>
                </div>
                <div class="image-label"><span class="image-update" title="最近的修改时间"></span></div>
            </section>`;
        return Utils.parseHTML(html);
    }

}
