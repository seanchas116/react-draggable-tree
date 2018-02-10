"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function clamp(x, min, max) {
    return Math.max(min, Math.min(x, max));
}
exports.clamp = clamp;
function comparePaths(a, b) {
    for (var i = 0; true; ++i) {
        if (a.length === i && b.length === i) {
            return 0;
        }
        if (a.length === i || a[i] < b[i]) {
            return -1;
        }
        if (b.length === i || b[i] < a[i]) {
            return 1;
        }
    }
}
exports.comparePaths = comparePaths;
function isPathEqual(a, b) {
    if (a.length !== b.length) {
        return false;
    }
    for (var i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) {
            return false;
        }
    }
    return true;
}
exports.isPathEqual = isPathEqual;
