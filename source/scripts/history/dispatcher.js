/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {Utils} from "../sharre/utils.js";
import {SharreM} from "../sharre/alphabet.js";
import {SKEY_ALBUM_ID, SKEY_REMOVED_PHOTO_ID} from "../plugin/constant.js";

export class Dispatcher {

    constructor() {
        this.page = 1;
        this.count = 40;
        this.notifyId = Utils.randomString(16);
        this.main = document.querySelector("#main");
        this.prev = document.querySelector(".foot-navigator > .prev");
        this.next = document.querySelector(".foot-navigator > .next");
        this.pagination = document.querySelector(".foot-navigator .pagination");
        this.fragment = document.createDocumentFragment();
        this.checkout = {albumId: null, pages: null};
        this.searchParams = new URLSearchParams(location.search);
        this.loading = document.createElement("div");
        this.nodemap = new WeakMap();
        this.selected = new Set();
        this.cdata = SharreM.syncedSData.cdata;
    }

    /** @public */
    init() {
        this.buildLoadingHinter();
        this.resolveQueryString();
        this.fetchSpecialAlbum();
        this.addGlobalListener();
        return this;
    }

    /** @private */
    buildLoadingHinter() {
        this.loading.dataset.bio = "loading";
        this.main.append(this.loading);
    }

    /** @private */
    resolveQueryString() {
        const page = Number(this.searchParams.get("page"));
        const count = Number(this.searchParams.get("count"));
        if (Number.isInteger(page) && page > 0) this.page = page;
        if (Number.isInteger(count) && count > 0) this.count = count;
    }

    /** @private */
    fetchSpecialAlbum() {
        this[this.cdata.ssp]();
    }

    /** @private */
    weibo_com() {
        const albumId = sessionStorage.getItem(SKEY_ALBUM_ID);
        const albumInfo = albumId ? {albumId} : null;

        // 服务器可能返回不准确的分页数据，会导致空白分页
        SharreM.ActionHistory.fetcher(this.page, this.count, {weibo_com: albumInfo}).then(json => {
            sessionStorage.setItem(SKEY_ALBUM_ID, json.albumId);
            this.checkout.pages = Math.ceil(json.total / this.count);
            this.checkout.albumId = json.albumId;
            this.loading.remove();
            this.renderPaging();
            this.buildMicroAlbumLink();
            if (!json.list.length) {
                this.errorInjector("没有分页数据，欸嘿~");
            } else {
                const lastpid = sessionStorage.getItem(SKEY_REMOVED_PHOTO_ID);
                const removed = lastpid ? new Set(lastpid.split(",")) : new Set();
                for (const item of json.list) {
                    if (removed.has(item.photoId)) continue;
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
                    this.nodemap.set(section, item);
                }
                this.main.append(this.fragment);
            }
        }).catch(reason => {
            sessionStorage.removeItem(SKEY_ALBUM_ID);
            this.loading.remove();
            this.renderPaging();
            this.errorInjector("获取图片失败，欸嘿~");
        });
    }

    /** @private */
    qcloud_com() {}

    /** @private */
    qiniu_com() {}

    /** @private */
    aliyun_com() {}

    /** @private */
    upyun_com() {}

    /** @private */
    addGlobalListener() {
        this.prev.addEventListener("click", () => this.prevPageHandler());
        this.next.addEventListener("click", () => this.nextPageHandler());

        document.addEventListener("keydown", e => {
            if (e.ctrlKey && e.key === "ArrowLeft") {
                e.preventDefault();
                this.prevPageHandler();
            }
            if (e.ctrlKey && e.key === "ArrowRight") {
                e.preventDefault();
                this.nextPageHandler();
            }
        });

        document.addEventListener("click", e => {
            if (e.ctrlKey) {
                const section = e.target.closest("section");
                if (section) {
                    e.preventDefault();
                    if (this.selected.has(section)) {
                        this.selected.delete(section);
                        section.dataset.selected = false;
                    } else {
                        this.selected.add(section);
                        section.dataset.selected = true;
                    }
                }
            } else {
                if (this.selected.size) {
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
        const list = [];
        this.selected.forEach(n => {
            const d = this.nodemap.get(n);
            d && list.push(d);
        });
        switch (this.cdata.ssp) {
            case "weibo_com":
                SharreM.ActionDelete.fetcher("weibo_com", {
                    albumId: this.checkout.albumId,
                    photoIds: list.map(d => d.photoId),
                });
                break;
            case "qcloud_com": break;
            case "qiniu_com": break;
            case "aliyun_com": break;
            case "upyun_com": break;
        }
    }

    /** @private */
    prevPageHandler() {
        if (this.checkout.pages && this.page > 1) {
            this.page--;
            this.flipPage();
        }
    }

    /** @private */
    nextPageHandler() {
        if (this.checkout.pages && this.page < this.checkout.pages) {
            this.page++;
            this.flipPage();
        }
    }

    /** @private */
    buildMicroAlbumLink() {
        const a = document.createElement("a");
        const footMenu = document.querySelector(".foot-menu");
        a.href = `http://photo.weibo.com/albums/detail/album_id/${this.checkout.albumId}/`;
        a.title = "前往微相册管理相册中的图片";
        a.target = "_blank";
        a.textContent = "微相册";
        footMenu.prepend(a);
    }

    /** @private */
    flipPage() {
        this.searchParams.set("page", this.page.toString());
        this.searchParams.set("count", this.count.toString());
        location.search = this.searchParams.toString();
    }

    /** @private */
    renderPaging() {
        if (!this.checkout.pages) {
            this.prev.dataset.disabled = true;
            this.next.dataset.disabled = true;
        } else {
            this.prev.dataset.disabled = this.page <= 1;
            this.next.dataset.disabled = this.page >= this.checkout.pages;
            this.pagination.textContent = `${this.page} / ${this.checkout.pages}`;
        }
    }

    /** @private */
    errorInjector(text) {
        const div = document.createElement("div");
        div.dataset.bio = "throw-message";
        div.textContent = text;
        this.main.append(div);
    }

    static importNode() {
        const html = `
            <section>
                <div class="image-body">
                    <a class="image-remove" title="移除这张图片"><i class="fa fa-trash-o"></i></a>
                    <a class="image-linker" title="点击查看原图" target="_blank">
                        <img src="${chrome.i18n.getMessage("image_placeholder")}" alt="preview">
                    </a>
                </div>
                <div class="image-label"><span class="image-update" title="最近的修改时间"></span></div>
            </section>`;
        return Utils.parseHTML(html);
    }

}
