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
    DraggableTree.prototype.render = function () {
        var _a = this.props, items = _a.items, itemHeight = _a.itemHeight, treeClassName = _a.treeClassName, itemClassName = _a.itemClassName, childOffset = _a.childOffset, renderItem = _a.renderItem;
        var renderItems = function (items, depth) {
            return items.map(function (item) {
                var style = {
                    paddingLeft: depth * childOffset + "px",
                    height: itemHeight + "px",
                };
                var state = {
                    selected: false,
                    current: false,
                };
                var itemElem = (React.createElement("div", {className: itemClassName, style: style, key: item.key}, renderItem(item, state)));
                var childElems = item.children ? renderItems(item.children, depth + 1) : [];
                return [itemElem].concat(childElems);
            });
        };
        var treeStyle = {
            display: "flex",
            flexDirection: "column",
        };
        return (React.createElement("div", {className: treeClassName, style: treeStyle}, renderItems(items, 0)));
    };
    return DraggableTree;
}(React.Component));
exports.DraggableTree = DraggableTree;
