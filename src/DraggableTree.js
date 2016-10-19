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
        var _a = this.props, childOffset = _a.childOffset, renderNode = _a.renderNode, changeCurrent = _a.changeCurrent;
        var elems = [];
        nodes.forEach(function (node, i) {
            var path = parentPath.concat([i]);
            var style = {
                paddingLeft: parentPath.length * childOffset + "px",
            };
            var onClick = function () {
                changeCurrent(path);
            };
            var className = classNames("ReactDraggableTree_Row", {
                "ReactDraggableTree_Row-selected": node.selected,
                "ReactDraggableTree_Row-current": node.current,
            });
            elems.push(React.createElement("div", {className: className, style: style, key: node.key, onClick: onClick}, renderNode(node)));
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
