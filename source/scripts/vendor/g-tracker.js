/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

/**
 * @see https://developers.google.com/analytics/devguides/collection/analyticsjs/
 * @desc depend on google analytics
 */
class GTracker {

  constructor() {
    this.ga = self.ga;
    this.disabled = true;
    this.detector();
  }

  /**
   * @private
   */
  detector() {
    if (!this.disabled && typeof self.ga !== "function") {
      throw new Error("Missing google analytics script");
    }
  }

  /**
   * @public
   * @param {Object} [obj]
   * @param {string} [obj.title]
   * @param {string} [obj.location] - location 和 page 二选一
   * @param {string} [obj.page] - location 和 page 二选一
   * @return {GTracker}
   */
  pageview(obj) {
    if (this.disabled) return this;
    this.ga("send", "pageview", Object.assign({
      page: location.pathname,
    }, obj));
    return this;
  }

  /**
   * @public
   * @param {Object} obj
   * @param {string} obj.eventCategory
   * @param {string} obj.eventAction
   * @param {string} [obj.eventLabel]
   * @param {number} [obj.eventValue]
   * @param {boolean} [obj.nonInteraction]
   * @return {GTracker}
   */
  event(obj) {
    if (this.disabled) return this;
    this.ga("send", "event", obj);
    return this;
  }

  /**
   * @public
   * @param {Object} [obj]
   * @param {string} [obj.exDescription]
   * @param {boolean} [obj.exFatal]
   * @return {GTracker}
   */
  exception(obj) {
    if (this.disabled) return this;
    this.ga("send", "exception", obj);
    return this;
  }

  /**
   * @public
   * @param {Object} obj
   * @param {string} obj.socialNetwork
   * @param {string} obj.socialAction
   * @param {string} obj.socialTarget
   * @return {GTracker}
   */
  social(obj) {
    if (this.disabled) return this;
    this.ga("send", "social", obj);
    return this;
  }

  /**
   * @public
   * @param {Object} obj
   * @param {string} obj.screenName
   * @param {string} obj.appName
   * @param {string} [obj.appId]
   * @param {string} [obj.appVersion]
   * @param {string} [obj.appInstallerId]
   * @return {GTracker}
   */
  screenview(obj) {
    if (this.disabled) return this;
    this.ga("send", "screenview", obj);
    return this;
  }

  /**
   * @public
   * @param {Object} obj
   * @param {string} obj.timingCategory
   * @param {string} obj.timingVar
   * @param {number} obj.timingValue
   * @param {string} [obj.timingLabel]
   * @return {GTracker}
   */
  timing(obj) {
    if (this.disabled) return this;
    this.ga("send", "timing", obj);
    return this;
  }

}

export const gtracker = new GTracker();