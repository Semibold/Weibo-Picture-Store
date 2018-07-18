/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {Utils} from "../sharre/utils.js";
import {SharreM} from "../sharre/alphabet.js";

export class Dispatcher {

    constructor() {
        this.checkout = {
            page: 1,
            pages: 1,
            count: 50,
            prevdel: 0,
        };
        this.error = false;
        this.ended = false;
        this.locked = false;
        this.maxselected = 50;
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
    }

    /**
     * @public
     */
    init() {
        this.createStructure();
        this.registerObserver();
        this.registerListener();
        return this;
    }

    /**
     * @private
     */
    createStructure() {
        this.exception.dataset.bio = "throw-button";
        this.exception.append(Utils.parseHTML(`<button>载入数据错误，点击再次加载</button>`));
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
        if (!this.locked && this.needNextPage(entries)) {
            const promise = this.getPageList();
            this.locked = true;
            this.progressbar.dataset.hidden = false;
            promise.then(result => {
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
            }).then(result => {
                this.availableChecker();
            }).finally(() => {
                this.locked = false;
                this.observerCallback();
            });
        }
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
            return document.scrollingElement.clientHeight >= foot.top;
        }
    }

    /**
     * @private
     */
    getPageList() {
        // 修正删除数据后的分页信息
        const {page, count, prevdel} = this.checkout;
        const forward = Math.ceil(prevdel / count);
        const start = -prevdel % count; // 微相册返回的分页数据可能不等于 count 值，因此 start 应取 <=0 的值。
        this.checkout.page -= forward;

        return SharreM.WeiboStatic.requestPhotos(this.checkout.page, this.checkout.count)
            .then(json => {
                this.checkout.prevdel -= prevdel;
                if (this.checkout.prevdel < 0) {
                    this.checkout.prevdel = 0;
                }
                return json;
            })
            .then(json => {
                this.checkout.pages = Math.ceil(json.total / this.checkout.count);
                for (const item of json.photos.slice(start)) {
                    const fragment = this.constructor.importNode();
                    const section = fragment.querySelector("section");
                    const imgLinker = section.querySelector(".image-linker");
                    const imgUpdate = section.querySelector(".image-update");
                    const imgSource = imgLinker.querySelector("img");
                    imgSource.src = `${item.picHost}/thumb300/${item.picName}`;
                    imgSource.srcset = `${item.picHost}/bmiddle/${item.picName} 2x`;
                    imgLinker.href = `${item.picHost}/large/${item.picName}`;
                    imgUpdate.textContent = item.updated;
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
    registerListener() {
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
                            this.detachSelectedPhoto();
                        }
                    }
                }
            }
        });
    }

    /**
     * @public
     */
    detachSelectedPhoto() {
        const photoIds = [];
        const selected = new Set(this.selected);

        this.selected.clear();
        selected.forEach(n => {
            const d = this.sections.get(n);
            if (d) {
                photoIds.push(d.photoId);
                n.dataset.removing = true;
            }
            n.dataset.selected = false;
        });

        SharreM.WeiboStatic.detachPhoto(photoIds)
            .then(json => {
                this.checkout.prevdel += photoIds.length;
            })
            .finally(() => {
                selected.forEach(n => Reflect.deleteProperty(n.dataset, "removing"));
            })
            .then(json => {
                selected.forEach(section => {
                    section.remove();
                    if (this.sections.has(section)) {
                        this.sections.delete(section);
                    }
                });
                this.availableChecker();
            })
            .catch(reason => {
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
            this.main.append(Utils.parseHTML(`<div data-bio="throw-message">获取图片失败，欸嘿~</div>`));
        } else if (!this.ended) {
            this.main.append(this.exception);
        }
    }
    
    /**
     * @private
     */
    availableChecker() {
        if (this.ended && !this.sections.size) {
            this.main.append(Utils.parseHTML(`<div data-bio="throw-message">没有分页数据，欸嘿~</div>`));
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
