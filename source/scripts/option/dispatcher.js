/**
 * Dispatcher
 */
class Dispatcher {

    constructor() {
        this.page = 1;
        this.count = 30;
        this.notifyId = Utils.randomString(16);
        this.prev = document.querySelector(".post-nav > .prev");
        this.next = document.querySelector(".post-nav > .next");
        this.pagination = document.querySelector(".post-nav .pagination");
        this.content =  document.querySelector("#content");
        this.template = document.querySelector("#template");
        this.fragment = document.createDocumentFragment();
        this.checkout = {albumId: null, pages: null};
        this.searchParams = new URLSearchParams(location.search);
        this.loading = null;
        this.sessionKey = "removedPhotoId";
        this.albumInfoKey = "albumInfo";
        this.decorator();
        return {};
    }

    decorator() {
        this.loadStart();
        this.parsePage();
        this.actuator();
        this.addEvent();
    }

    loadStart() {
        this.loading = document.createElement("div");
        this.loading.classList.add("pio-loading");
        this.content.append(this.loading);
    }

    parsePage() {
        let page = Number(this.searchParams.get("page"));
        let count = Number(this.searchParams.get("count"));
        if (Number.isInteger(page) && page > 0) this.page = page;
        if (Number.isInteger(count) && count > 0) this.count = count;
    }

    createMicroAlbum() {
        let a = document.createElement("a");
        let menuNav = document.querySelector(".menu-nav");
        a.href = `http://photo.weibo.com/albums/detail/album_id/${this.checkout.albumId}/`;
        a.title = chrome.i18n.getMessage("micro_album_hinter");
        a.target = "_blank";
        a.textContent = chrome.i18n.getMessage("micro_album_text");
        menuNav.prepend(a);
    }

    actuator() {
        backWindow.Weibo.getAllPhoto(Utils.session.get(this.albumInfoKey), this.page, this.count)
            .then(result => {
                Utils.session.set(this.albumInfoKey, {albumId: result.albumId});
                // 服务器可能返回不准确的分页数据，会导致空白分页
                this.checkout.pages = Math.ceil(result.total / this.count);
                this.checkout.albumId = result.albumId;
                this.loading.remove();
                this.repaging();
                this.createMicroAlbum();

                if (!result.list.length) {
                    this.errorInjector(chrome.i18n.getMessage("page_no_data"));
                } else {
                    this.buildItems(result.list);
                }
            }, reason => {
                Utils.session.remove(this.albumInfoKey);
                this.loading.remove();
                this.repaging();
                this.errorInjector(chrome.i18n.getMessage("get_photo_fail_message"));
            });
    }

    errorInjector(text) {
        if (typeof text === "string") {
            let div = document.createElement("div");

            div.classList.add("pio-throw-message");
            div.textContent = text;
            this.content.append(div);
        }
    }

    addEvent() {
        let leftArrow = 37;
        let rightArrow = 39;
        let prevHandler = e => {
            if (this.checkout.pages && this.page > 1) {
                this.page--;
                this.flipPage();
            }
        };
        let nextHandler = e => {
            if (this.checkout.pages && this.page < this.checkout.pages) {
                this.page++;
                this.flipPage();
            }
        };
        this.prev.addEventListener("click", prevHandler);
        this.next.addEventListener("click", nextHandler);
        document.addEventListener("keydown", e => {
            if (e.ctrlKey && e.keyCode === leftArrow) {
                e.preventDefault();
                prevHandler(e);
            }
            if (e.ctrlKey && e.keyCode === rightArrow) {
                e.preventDefault();
                nextHandler(e);
            }
        });
        this.content.addEventListener("click", e => {
            let section = e.target.closest("section");
            if (section) {
                let button = section.querySelector(".remove-item");
                if (button && button.contains(e.target)) {
                    let albumId = section.dataset.albumId;
                    let photoId = section.dataset.photoId;
                    backWindow.Weibo.removePhoto(albumId, photoId)
                        .then(result => {
                            // 由于服务器缓存的原因，页面数据可能刷新不及时
                            // 可能会出现已删除的数据刷新后还存在的问题
                            // 暂时用 sessionStorage 处理，但是会导致分页数据显示少一个
                            Utils.session.set(this.sessionKey, photoId);
                            chrome.notifications.clear(this.notifyId, wasCleared => this.flipPage());
                        })
                        .catch(reason => {
                            chrome.notifications.create(this.notifyId, {
                                type: "basic",
                                iconUrl: chrome.i18n.getMessage("64"),
                                title: chrome.i18n.getMessage("info_title"),
                                message: chrome.i18n.getMessage("remove_failed_message"),
                            });
                        });
                }
            }
        });
    }

    flipPage() {
        this.searchParams.set("page", this.page.toString());
        location.search = this.searchParams.toString();
    }

    repaging() {
        if (!this.checkout.pages) {
            this.prev.dataset.disabled = true;
            this.next.dataset.disabled = true;
        } else {
            this.prev.dataset.disabled = this.page <= 1;
            this.next.dataset.disabled = this.page >= this.checkout.pages;
            this.pagination.textContent = `${this.page} / ${this.checkout.pages}`;
        }
    }

    buildItems(items) {
        let removedPhotoId = Utils.session.get(this.sessionKey);

        for (let item of items) {
            if (item.photoId === removedPhotoId) continue;
            let image = new Image();
            let fragment = document.importNode(this.template.content, true);
            let section = fragment.querySelector("section");
            let imageLinker = section.querySelector(".image-linker");
            let imageSource = imageLinker.querySelector("img");
            let createDate = section.querySelector(".create-date");
            let preview = `${item.picHost}/mw690/${item.picName}`;

            section.dataset.photoId = item.photoId;
            section.dataset.albumId = this.checkout.albumId;
            image.src = preview;
            image.onload = e => imageSource.src = preview;
            imageLinker.href = `${item.picHost}/large/${item.picName}`;
            createDate.textContent = item.created;

            this.fragment.append(section);
        }

        this.crappyFlex();
        this.content.append(this.fragment);
    }

    crappyFlex() {
        let item = 180;
        let container = 1440;
        let count = Math.ceil(container / item);

        for (let i = 0; i < count; i++) {
            let section = document.createElement("section");
            this.fragment.append(section);
        }
    }

}
