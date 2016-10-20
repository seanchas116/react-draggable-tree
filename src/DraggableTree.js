"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var React = require("react");
var classNames = require("classnames");
var Tree = (function (_super) {
    __extends(Tree, _super);
    function Tree() {
        _super.apply(this, arguments);
    }
    Tree.prototype.renderItems = function (nodes, parentPath) {
        var _this = this;
        var _a = this.props, childOffset = _a.childOffset, renderNode = _a.renderNode, onCurrentChange = _a.onCurrentChange, current = _a.current, selected = _a.selected;
        var elems = [];
        nodes.forEach(function (node, i) {
            var key = node.key;
            var path = parentPath.concat([i]);
            var style = {
                paddingLeft: parentPath.length * childOffset + "px",
            };
            var onClick = function () {
                onCurrentChange(key);
            };
            var isSelected = selected ? selected.has(key) : false;
            var isCurrent = key == current;
            var className = classNames("ReactDraggableTree_Row", {
                "ReactDraggableTree_Row-selected": isSelected,
                "ReactDraggableTree_Row-current": isCurrent,
            });
            elems.push(React.createElement("div", {className: className, style: style, key: node.key, onClick: onClick}, renderNode(node, { selected: isSelected, current: isCurrent })));
            if (node.children) {
                elems.push.apply(elems, _this.renderItems(node.children, path));
            }
        });
        return elems;
    };
    Tree.prototype.render = function () {
        var nodes = this.props.nodes;
        return (React.createElement("div", {className: "ReactDraggableTree"}, this.renderItems(nodes, [])));
    };
    return Tree;
}(React.Component));
exports.Tree = Tree;
