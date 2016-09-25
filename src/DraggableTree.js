"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var React = require("react");
var DraggableTree = (function (_super) {
    __extends(DraggableTree, _super);
    function DraggableTree() {
        _super.apply(this, arguments);
    }
    DraggableTree.prototype.renderItems = function (items, parentPath) {
        var _this = this;
        var _a = this.props, itemHeight = _a.itemHeight, childOffset = _a.childOffset, renderItem = _a.renderItem, changeCurrent = _a.changeCurrent;
        var elems = [];
        items.forEach(function (item, i) {
            var path = parentPath.concat([i]);
            var style = {
                paddingLeft: parentPath.length * childOffset + "px",
                height: itemHeight + "px",
            };
            var state = {
                selected: false,
                current: false,
            };
            var onClick = function () {
                changeCurrent(path);
            };
            elems.push(React.createElement("div", {className: "ReactDraggableTree_Row", style: style, key: item.key, onClick: onClick}, renderItem(item)));
            if (item.children) {
                elems.push.apply(elems, _this.renderItems(item.children, path));
            }
        });
        return elems;
    };
    DraggableTree.prototype.render = function () {
        var items = this.props.items;
        return (React.createElement("div", {className: "ReactDraggableTree"}, this.renderItems(items, [])));
    };
    return DraggableTree;
}(React.Component));
exports.DraggableTree = DraggableTree;
