/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

/**
 * @global ga - nomodule
 * @desc Google Analytics
 * @desc should specify content_security_policy in manifest.json
 * @see https://developers.google.com/analytics/devguides/collection/analyticsjs/
 * @see https://developer.chrome.com/extensions/tut_analytics
 */
(function(i,s,o,g,r,a,m){i["GoogleAnalyticsObject"]=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(self,document,"script","https://www.google-analytics.com/analytics.js","ga");

ga("create", "UA-114992790-3", "auto");
ga("set", "transport", "beacon");

// disable file protocol checking
ga("set", "checkProtocolTask", null);