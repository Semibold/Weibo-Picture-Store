import {Utils} from "../base/utils.js";
import {backWindow} from "./sharre.js";
import "./fragment.js";

export class Dispatcher {

    constructor() {
        this.page = 1;
        this.count = 30;
        this.notifyId = Utils.randomString(16);
        this.main = document.querySelector("#main");
        this.prev = document.querySelector(".foot-navigator > .prev");
        this.next = document.querySelector(".foot-navigator > .next");
        this.pagination = document.querySelector(".foot-navigator .pagination");
        this.fragment = document.createDocumentFragment();
        this.checkout = {albumId: null, pages: null};
        this.searchParams = new URLSearchParams(location.search);
        this.loading = document.createElement("div");
        this.albumIdStorageKey = "album_id";
        this.removedPhotoIdStorageKey = "removed_photo_id";
    }

    /** @public */
    decorator() {
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
        const albumId = sessionStorage.getItem(this.albumIdStorageKey);
        const albumInfo = albumId ? {albumId} : null;

        // 服务器可能返回不准确的分页数据，会导致空白分页
        backWindow.Weibo.getAllPhoto(albumInfo, this.page, this.count).then(json => {
            sessionStorage.setItem(this.albumIdStorageKey, json.albumId);
            this.checkout.pages = Math.ceil(json.total / this.count);
            this.checkout.albumId = json.albumId;
            this.loading.remove();
            this.renderPaging();
            this.buildMicroAlbumLink();
            if (!json.list.length) {
                this.errorInjector(chrome.i18n.getMessage("page_with_no_data_available"));
            } else {
                this.buildListFragment(json.list);
            }
        }).catch(reason => {
            sessionStorage.removeItem(this.albumIdStorageKey);
            this.loading.remove();
            this.renderPaging();
            this.errorInjector(chrome.i18n.getMessage("fetch_album_info_failed"));
        });
    }

    /** @private */
    addGlobalListener() {
        const prevHandler = () => {
            if (this.checkout.pages && this.page > 1) {
                this.page--;
                this.flipPage();
            }
        };
        const nextHandler = () => {
            if (this.checkout.pages && this.page < this.checkout.pages) {
                this.page++;
                this.flipPage();
            }
        };

        this.prev.addEventListener("click", prevHandler);
        this.next.addEventListener("click", nextHandler);

        document.addEventListener("keydown", e => {
            if (e.ctrlKey && e.key === "ArrowLeft") {
                e.preventDefault();
                prevHandler();
            }
            if (e.ctrlKey && e.key === "ArrowRight") {
                e.preventDefault();
                nextHandler();
            }
        });
    }

    /** @private */
    buildMicroAlbumLink() {
        const a = document.createElement("a");
        const footMenu = document.querySelector(".foot-menu");
        a.href = `http://photo.weibo.com/albums/detail/album_id/${this.checkout.albumId}/`;
        a.title = chrome.i18n.getMessage("goto_micro_album_hinter");
        a.target = "_blank";
        a.textContent = chrome.i18n.getMessage("micro_album_text_content");
        footMenu.prepend(a);
    }

    /** @private */
    buildListFragment(items) {
        const removedPhotoId = sessionStorage.getItem(this.removedPhotoIdStorageKey);

        for (const item of items) {
            if (item.photoId === removedPhotoId) continue;
            const fragment = this.constructor.importNode();
            const section = fragment.querySelector("section");
            const linker = section.querySelector(".image-linker");
            const create = section.querySelector(".image-create");
            const remove = section.querySelector(".image-remove");
            const source = linker.querySelector("img");
            const albumId = this.checkout.albumId;
            const photoId = item.photoId;

            source.src = `${item.picHost}/thumb300/${item.picName}`;
            source.srcset = `${item.picHost}/bmiddle/${item.picName} 2x`;
            linker.href = `${item.picHost}/large/${item.picName}`;
            create.textContent = item.created;

            remove.addEventListener("click", e => {
                section.dataset.removing = true;
                backWindow.Weibo.removePhoto(albumId, [photoId]).then(json => {
                    // 由于服务器缓存的原因，页面数据可能刷新不及时
                    // 可能会出现已删除的数据刷新后还存在的问题
                    // 暂时用 sessionStorage 处理，但是会导致分页数据显示少一个
                    sessionStorage.setItem(this.removedPhotoIdStorageKey, photoId);
                    Reflect.deleteProperty(section.dataset, "removing");
                    chrome.notifications.clear(this.notifyId, wasCleared => this.flipPage());
                }).catch(reason => {
                    Reflect.deleteProperty(section.dataset, "removing");
                    chrome.notifications.create(this.notifyId, {
                        type: "basic",
                        iconUrl: chrome.i18n.getMessage("64"),
                        title: chrome.i18n.getMessage("info_title"),
                        message: chrome.i18n.getMessage("remove_photo_failed"),
                    });
                });
            });

            this.fragment.append(section);
        }

        this.main.append(this.fragment);
    }

    /** @private */
    flipPage() {
        this.searchParams.set("page", this.page.toString());
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
                    <a class="image-remove" title="从当前相册中移除这张图片"><i class="fa fa-trash-o"></i></a>
                    <a class="image-linker" title="点击查看原图" target="_blank">
                        <img src="${chrome.i18n.getMessage("image_placeholder")}" alt="preview">
                    </a>
                </div>
                <div class="image-label"><span class="image-create" title="图片的创建时间"></span></div>
            </section>`;
        return Utils.parseHTML(html);
    }

}
