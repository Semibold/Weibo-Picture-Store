/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {Config} from "../sharre/config.js";
import {Utils} from "../sharre/utils.js";
import {BuildItem} from "./build-item.js";

export class Dispatcher {

  constructor() {
    this.batch = false;
    this.config = null;
    this.list = new Map();
    this.main = document.querySelector("#main");
    this.copier = document.querySelector("#transfer-to-clipboard");
    this.linker = document.querySelector("input.custom-clipsize");
    this.external = Config.weiboPopup.clipsize;
    this.checkout = {total: 0, settle: 0, clear: true};
    this.customConfigKey = "custom_config";
    this.customClipsizeKey = "custom_clipsize";
  }

  /** @public */
  init() {
    this.buildConfigProxy();
    this.startFromBlank();
    this.addGlobalEvent();
    this.renderSection({});
    return this;
  }

  /** @private */
  buildConfigProxy() {
    const padding = {scheme: "1", clipsize: "1"};
    const customConfig = {
      scheme: localStorage.getItem(`${this.customConfigKey}.scheme`),
      clipsize: localStorage.getItem(`${this.customConfigKey}.clipsize`),
    };
    const customClipsize = localStorage.getItem(this.customClipsizeKey);

    if (typeof customClipsize === "string") {
      this.external[4] = customClipsize;
    }

    if (customConfig) {
      for (const name of Object.keys(padding)) {
        if (typeof Config.weiboPopup[name][customConfig[name]] === "string") {
          padding[name] = customConfig[name];
        }
      }
    }

    this.config = new Proxy(padding, {
      get: (target, key, receiver) => {
        return Reflect.get(target, key, receiver);
      },
      set: (target, key, value, receiver) => {
        const result = Reflect.set(target, key, value, receiver);
        if (result) {
          switch (key) {
            case "scheme":
              this.renderScheme();
              localStorage.setItem(`${this.customConfigKey}.scheme`, this.config.scheme);
              break;
            case "clipsize":
              this.renderClipsize();
              localStorage.setItem(`${this.customConfigKey}.clipsize`, this.config.clipsize);
              break;
          }
        }
        return result;
      },
    });
  }

  /** @private */
  startFromBlank() {
    this.linker.value = this.external[4];
    for (const [name, value] of Object.entries(this.config)) {
      document.querySelector(`[name="${name}"][value="${value}"]`).checked = true;
    }
    document.querySelector("a.head-copy-mode").dataset.batch = this.batch;
  }

  /** @private */
  addGlobalEvent() {
    const link = document.querySelector(`[name="clipsize"][value="4"]`);
    const copy = document.querySelector("a.head-copy-mode");

    copy.addEventListener("click", e => {
      this.batch = copy.dataset.batch = !this.batch;
      this.renderCopyMode();
    });

    this.linker.addEventListener("input", e => {
      this.external[4] = e.target.value;
      this.renderClipsize();
      localStorage.setItem(this.customClipsizeKey, e.target.value);
    });

    this.linker.addEventListener("focus", e => {
      if (!link.checked) {
        link.checked = true;
      }
      if (this.config.clipsize !== link.value) {
        this.config.clipsize = link.value;
      }
    });

    for (const name of Object.keys(this.config)) {
      const nodeList = document.querySelectorAll(`[name="${name}"]`);
      for (const node of nodeList) {
        node.addEventListener("change", e => {
          if (e.target.checked) {
            this.config[name] = e.target.value;
          }
        });
      }
    }

    this.copyEventHandler();
    this.pasteEventHandler();
  }

  /** @private */
  copyEventHandler() {
    document.addEventListener("click", e => {
      const buttonCopy = e.target.closest(".button-copy");

      if (buttonCopy) {
        const type = buttonCopy.dataset.type;
        const prev = document.activeElement;

        if (this.batch) {
          const buffer = [];
          for (const hybrid of this.list.values()) {
            buffer.push(this.transformData(hybrid.data)[type]);
          }
          this.copier.value = buffer.join("\n");
        } else {
          const section = buttonCopy.closest("section");
          const input = this.list.get(section).item.domNodes[`input${type}`];
          this.copier.value = input.value;
        }

        this.copier.focus();
        this.copier.select();

        if (document.execCommand("copy")) {
          // @todo 复制成功提醒[M]
        }

        this.copier.blur();
        prev.focus();
      }
    });
  }

  /** @private */
  pasteEventHandler() {
    document.addEventListener("paste", e => {
      if (document.activeElement == null || document.activeElement === document.body) {
        const items = e.clipboardData.items;
        const queues = [];
        const buffer = [];

        for (const item of items) {
          if (item.kind === "file" && typeof item.getAsFile === "function") {
            const file = item.getAsFile();
            file && buffer.push(file);
          }
          if (item.kind === "string" && typeof item.getAsString === "function") {
            queues.push(new Promise((resolve, reject) => {
              item.getAsString(str => {
                const multiple = str.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
                const multipleBuffer = [];

                while (multiple.length) {
                  const url = multiple.shift();
                  if (Utils.isValidURL(url)) {
                    // @todo 获取[M]
                  }
                }

                Promise.all(multipleBuffer).then(resolve);
              });
            }).catch(Utils.noop));
          }
        }

        // @todo 上传[M]
      }
    });
  }

  /** @private */
  renderSection(data, clear) {
    if (!data) {
      return false;
    }

    if (clear) {
      this.checkout.clear = false;
      this.clearCurrentList();
    }

    const item = new BuildItem(this.transformData(data)).init();
    const hybrid = {item, data};

    this.fillCopyMode(item.domNodes.section);
    this.list.set(item.domNodes.section, hybrid);
    this.main.append(item.domNodes.section);
    return true;
  }

  /** @private */
  renderScheme() {
    for (const hybrid of this.list.values()) {
      hybrid.item.repaint(this.transformData(hybrid.data));
    }
  }

  /** @private */
  renderClipsize() {
    for (const hybrid of this.list.values()) {
      hybrid.item.repaint(this.transformData(hybrid.data));
    }
  }

  /** @private */
  renderCopyMode() {
    for (const hybrid of this.list.values()) {
      this.fillCopyMode(hybrid.item.domNodes.section);
    }
  }

  /** @private */
  fillCopyMode(section) {
    const nodeList = section.querySelectorAll(".button-copy");
    const textContent = this.batch ? "Copy All" : "Copy";
    for (const node of nodeList) {
      node.textContent = textContent;
    }
  }

  /** @private */
  transformData(data) {
    if (!data || !data.pid) {
      return data;
    }
    const {scheme, clipsize} = Config.weiboPopup;
    const chip = {
      scheme: scheme[this.config.scheme],
      host: data.host,
      pid: data.pid,
      url: null,
    };
    switch (data.ssp) {
      case "weibo_com":
        chip.url = `${chip.scheme + chip.host}/${clipsize[this.config.clipsize]}/${chip.pid}`;
        break;
      case "qcloud_com":
        // @todo thumbnail
        break;
      case "qiniu_com":
      case "aliyun_com":
      case "upyun_com":
      default: return data;
    }
    return Object.assign(data, {
      URL: chip.url,
      HTML: `<img src="${chip.url}" alt="image">`,
      UBB: `[IMG]${chip.url}[/IMG]`,
      Markdown: `![image](${chip.url})`,
    });
  }

  /** @private */
  clearCurrentList() {
    if (this.list.size) {
      for (const hybrid of this.list.values()) {
        hybrid.item.destroy();
      }
      this.list.clear();
    }
  }

  /** @public */
  requester(list) {
    // @todo 上传[M]
  }

}