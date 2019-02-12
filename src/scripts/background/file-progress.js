/*
 * Copyright (c) 2017 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

/**
 * WARNING: `requestAnimationFrame` has no effect on chrome background page
 */
import { FP_TYPE_DOWNLOAD, FP_TYPE_UPLOAD, FPC_DISCARD, FPC_FAILURE, FPC_SUCCEED } from "../sharre/constant.js";

const fileProgressMap = new Map();

/**
 * @desc 用于支持多类型
 */
class TypeEntry {
    constructor(tid) {
        this.tid = tid;
        this.total = 0;
        this.settle = 0;
        this.preStatus = { succeed: 0, discard: 0, failure: 0 };
        this.curStatus = { succeed: 0, discard: 0, failure: 0 };
        fileProgressMap.set(tid, this);
    }

    reset() {
        if (this.settle === this.total) {
            this.preStatus = this.curStatus;
            this.curStatus = { succeed: 0, discard: 0, failure: 0 };
            this.total = 0;
            this.settle = 0;
            console.log(
                `Type: ${this.tid}`,
                `Succeed: ${this.preStatus.succeed}`,
                `Failure: ${this.preStatus.failure}`,
                `Discard: ${this.preStatus.discard}`,
            );
            return true;
        } else {
            return false;
        }
    }

    consume(n, type) {
        if (Number.isSafeInteger(n) && n > 0) {
            if (this.settle + n <= this.total) {
                this.settle += n;
                switch (type) {
                    case FPC_SUCCEED:
                        this.curStatus.succeed++;
                        break;
                    case FPC_DISCARD:
                        this.curStatus.discard++;
                        break;
                    case FPC_FAILURE:
                        this.curStatus.failure++;
                        break;
                }
            }
        }
        this.reset();
    }

    padding(n) {
        if (Number.isSafeInteger(n) && n > 0) {
            this.total += n;
        }
    }
}

new TypeEntry(FP_TYPE_UPLOAD);
new TypeEntry(FP_TYPE_DOWNLOAD);

/**
 * @export
 * @desc Progress 的内部实现是用单例模式（上传、下载各一种）
 * @desc 这个只能在 Background 中运行
 */
export class FileProgress {
    constructor(tid) {
        this.tid = tid;
        this.dtd = fileProgressMap.get(this.tid);
    }

    get previousStatus() {
        return Object.assign({}, this.dtd.preStatus);
    }

    succeed(n = 1) {
        return this.dtd.consume(n, FPC_SUCCEED);
    }

    discard(n = 1) {
        return this.dtd.consume(n, FPC_DISCARD);
    }

    failure(n = 1) {
        return this.dtd.consume(n, FPC_FAILURE);
    }

    padding(n = 1) {
        return this.dtd.padding(n);
    }
}
