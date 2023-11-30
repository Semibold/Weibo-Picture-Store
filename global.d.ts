/*
 * Copyright (c) 2023 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 *
 */

/**
 * Global Variable
 */
declare var __isDev: boolean;

/**
 * Union type of schema
 */
declare type ServiceWorkerMessage = RSS.GetRuleId | RSS.AddLog | RSS.WithoutCorsMode;
declare type ContentScriptMessage = RSS.AllowPointerEvents | RSS.WriteToClipboard | RSS.UploadVideoFrame;

/**
 * RuntimeSchemaSets Namespace
 */
declare namespace RSS {
    /**
     * Service Worker
     */
    interface GetRuleId {
        cmd: "GetRuleId";
    }
    interface AddLog {
        cmd: "AddLog";
        type: string;
        data: WB.LogErrDetail;
    }
    interface WithoutCorsMode {
        cmd: "WithoutCorsMode";
    }

    /**
     * Content Script
     */
    interface WriteToClipboard {
        cmd: "WriteToClipboard";
        content: string;
    }
    interface WriteToClipboardRes {
        valid: boolean;
        done?: boolean;
    }
    interface AllowPointerEvents {
        cmd: "AllowPointerEvents";
        command: string;
    }
    interface UploadVideoFrame {
        cmd: "UploadVideoFrame";
        srcUrl: string;
        info: unknown;
    }
    interface UploadFrameRes {
        dataURL: string;
    }
}

/**
 * Weibo Namespace
 */
declare namespace WB {
    interface LogStoreItem {
        module: string;
        error?: string;
        remark?: string;
        type: string;
        timestamp: number;
    }
    interface LogErrDetail {
        module: string;
        error?: string | Error | DOMException | object | any;
        remark?: string | object;
    }
    interface ClipSize {
        width: number;
        height: number;
    }
    interface AccountInfo {
        username: string;
        password: string;
        allowUserAccount: boolean;
    }
    interface UidInfo {
        uid: string;
    }
    interface LoginInfo {
        login: boolean;
    }
    interface CaptchaInfo {
        showpin: boolean;
    }
    interface AlbumInfo {
        uid: string;
        albumId: string;
        albumList?: any[];
        timestamp?: number;
    }
    interface AlbumPhoto {
        albumId: string;
        photoId: string;
        picHost: string;
        picName: string;
        updated: string;
    }
    interface AlbumContents {
        total: number;
        albumId: string;
        photos: AlbumPhoto[];
        albumList: any[];
    }
    interface Watermark {
        url: string;
        nick: string;
        logo: string | number;
        markpos: string | number;
    }
    interface PackedItem {
        blob?: Blob;
        result?: ArrayBuffer;
        mimeType?: string;
        pid?: string;
        size?: number;
        width?: number;
        height?: number;
    }
    interface AssignedPackedItem extends PackedItem {
        URL: string;
        HTML: string;
        UBB: string;
        Markdown: string;
        fullDirectoryPath?: string;
    }
}
