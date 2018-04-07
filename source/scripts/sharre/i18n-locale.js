/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

/**
 * @desc 自定义的 i18n
 * @desc selector = "[data-i18n]"
 */
export function i18nLocaleTexts(n = document) {
  const nodes = n.querySelectorAll("[data-i18n]");
  for (const node of nodes) {
    node.textContent = chrome.i18n.getMessage(node.dataset.i18n);
  }
}

/**
 * @desc 自定义的 i18n
 * @desc selector = "[data-i18n-attrs]"
 */
export function i18nLocaleAttrs(n = document) {
  const nodes = n.querySelectorAll("[data-i18n-attrs]");
  for (const node of nodes) {
    const attrs = node.dataset.i18nAttrs.split(/\s+/);
    for (let i = 0; i < attrs.length; i += 2) {
      node.setAttribute(attrs[i], chrome.i18n.getMessage(attrs[i + 1]));
    }
  }
}