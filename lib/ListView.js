"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var React = require("react");
var TreeView_1 = require("./TreeView");
function toListRowInfo(treeRowInfo) {
    return {
        item: treeRowInfo.item.item,
        selected: treeRowInfo.selected,
        index: treeRowInfo.path[0],
        visible: treeRowInfo.visible,
        visibleOffset: treeRowInfo.visibleOffset
    };
}
var ListTreeDelegate = (function () {
    function ListTreeDelegate(delegate) {
        this.delegate = delegate;
    }
    ListTreeDelegate.prototype.renderRow = function (info) {
        return this.delegate.renderRow(toListRowInfo(info));
    };
    ListTreeDelegate.prototype.getChildren = function (item) {
        if (item.type == 'root') {
            return item.children;
        }
    };
    ListTreeDelegate.prototype.getKey = function (item) {
        if (item.type === 'child') {
            return this.delegate.getKey(item.item);
        }
        else {
            return '';
        }
    };
    ListTreeDelegate.prototype.getCollapsed = function (item) {
        return false;
    };
    ListTreeDelegate.prototype.onMove = function (src, dest, destIndexBefore, destIndexAfter) {
        this.delegate.onMove(src.map(toListRowInfo), destIndexBefore, destIndexAfter);
    };
    ListTreeDelegate.prototype.onCopy = function (src, dest, destIndexBefore) {
        this.delegate.onCopy(src.map(toListRowInfo), destIndexBefore);
    };
    ListTreeDelegate.prototype.onContextMenu = function (info, ev) {
        this.delegate.onContextMenu(info && toListRowInfo(info), ev);
    };
    ListTreeDelegate.prototype.onCollapsedChange = function (info, collapsed) {
    };
    ListTreeDelegate.prototype.onSelectedKeysChange = function (selectedKeys, selectedInfos) {
        this.delegate.onSelectedKeysChange(selectedKeys, selectedInfos.map(toListRowInfo));
    };
    return ListTreeDelegate;
}());
var ListView = (function (_super) {
    __extends(ListView, _super);
    function ListView() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ListView.prototype.render = function () {
        var delegate = new ListTreeDelegate(this.props.delegate);
        var children = this.props.items.map(function (item) { return ({
            type: 'child',
            item: item
        }); });
        var root = {
            type: 'root',
            children: children
        };
        var ListTreeView = TreeView_1.TreeView;
        return React.createElement(ListTreeView, { root: root, rowHeight: this.props.rowHeight, indent: this.props.indent, selectedKeys: this.props.selectedKeys, delegate: delegate });
    };
    return ListView;
}(React.Component));
exports.ListView = ListView;
